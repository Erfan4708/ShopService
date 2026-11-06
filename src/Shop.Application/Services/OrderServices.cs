using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.Application.Services;

public interface IOrderLifecycle
{
    Task CancelAsync(Order order, string reason, string? changedBy, CancellationToken ct = default);
}

public class OrderLifecycle : IOrderLifecycle
{
    private readonly IAppDbContext _db;
    private readonly INotificationSender _notifier;

    public OrderLifecycle(IAppDbContext db, INotificationSender notifier)
    {
        _db = db; _notifier = notifier;
    }

    public async Task CancelAsync(Order order, string reason, string? changedBy, CancellationToken ct = default)
    {
        if (!order.CanTransitionTo(OrderStatus.Cancelled))
            throw new BusinessRuleException("This order cannot be cancelled in its current status.");

        var ids = order.Items.Select(i => i.ProductId).ToList();
        var products = await _db.Products.IgnoreQueryFilters().Where(p => ids.Contains(p.Id)).ToListAsync(ct);
        foreach (var item in order.Items)
        {
            var p = products.FirstOrDefault(x => x.Id == item.ProductId);
            if (p != null && p.TrackInventory) p.StockQuantity += item.Quantity;
        }

        if (!string.IsNullOrEmpty(order.CouponCode))
        {
            var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Code == order.CouponCode, ct);
            if (coupon != null && coupon.UsedCount > 0) coupon.UsedCount--;
        }

        order.SetStatus(OrderStatus.Cancelled, reason, changedBy);
        try { await _db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) { throw new ConflictException("The order or product stock was modified simultaneously. Please try again."); }

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == order.UserId, ct);
        await _notifier.SendAsync(new NotificationMessage("order.cancelled", user?.Email, order.ReceiverPhone,
            $"Order {order.OrderNumber} cancelled", $"Order {order.OrderNumber} has been cancelled. Reason: {reason}"), ct);
    }
}

public interface IOrderService
{
    Task<PagedResult<OrderSummaryDto>> GetMyOrdersAsync(Guid userId, PageQueryBase page, CancellationToken ct = default);
    Task<OrderDetailDto> GetMyOrderAsync(Guid userId, string orderNumber, CancellationToken ct = default);
    Task<OrderDetailDto> CancelMyOrderAsync(Guid userId, string orderNumber, CancellationToken ct = default);
    Task<TrackOrderDto> TrackAsync(TrackOrderRequest r, CancellationToken ct = default);
}

public class OrderService : IOrderService
{
    private readonly IAppDbContext _db;
    private readonly IOrderLifecycle _lifecycle;

    public OrderService(IAppDbContext db, IOrderLifecycle lifecycle)
    {
        _db = db; _lifecycle = lifecycle;
    }

    public async Task<PagedResult<OrderSummaryDto>> GetMyOrdersAsync(Guid userId, PageQueryBase page, CancellationToken ct = default)
    {
        var q = _db.Orders.AsNoTracking().Where(o => o.UserId == userId);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(o => o.CreatedAt).Skip((page.SafePage - 1) * page.SafePageSize).Take(page.SafePageSize)
            .Select(o => new OrderSummaryDto(o.Id, o.OrderNumber, o.Status, o.GrandTotal, o.Items.Count, o.CreatedAt,
                o.User.FirstName + " " + o.User.LastName, o.ReceiverPhone)).ToListAsync(ct);
        return new PagedResult<OrderSummaryDto>(items, page.SafePage, page.SafePageSize, total);
    }

    public async Task<OrderDetailDto> GetMyOrderAsync(Guid userId, string orderNumber, CancellationToken ct = default)
    {
        var o = await _db.Orders.AsNoTracking().Include(x => x.Items).Include(x => x.StatusHistory).Include(x => x.Payments)
            .AsSplitQuery().FirstOrDefaultAsync(x => x.OrderNumber == orderNumber && x.UserId == userId, ct)
            ?? throw new NotFoundException("Order was not found.");
        return o.ToDetailDto();
    }

    public async Task<OrderDetailDto> CancelMyOrderAsync(Guid userId, string orderNumber, CancellationToken ct = default)
    {
        var o = await _db.Orders.Include(x => x.Items).Include(x => x.StatusHistory).Include(x => x.Payments)
            .AsSplitQuery().FirstOrDefaultAsync(x => x.OrderNumber == orderNumber && x.UserId == userId, ct)
            ?? throw new NotFoundException("Order was not found.");
        if (o.Status != OrderStatus.PendingPayment)
            throw new BusinessRuleException("Only unpaid orders can be cancelled by customers. For other cases, please contact support.");
        await _lifecycle.CancelAsync(o, "Cancelled by customer", "customer", ct);
        return o.ToDetailDto();
    }

    public async Task<TrackOrderDto> TrackAsync(TrackOrderRequest r, CancellationToken ct = default)
    {
        const string notFound = "No order was found with the provided information.";
        var phone = PhoneHelper.Normalize(r.Phone) ?? throw new NotFoundException(notFound);
        var number = r.OrderNumber.Trim();
        var o = await _db.Orders.AsNoTracking().Include(x => x.Items).Include(x => x.StatusHistory).Include(x => x.User)
            .AsSplitQuery().FirstOrDefaultAsync(x => x.OrderNumber == number, ct) ?? throw new NotFoundException(notFound);
        if (o.ReceiverPhone != phone && o.User.PhoneNumber != phone) throw new NotFoundException(notFound);

        return new TrackOrderDto(o.OrderNumber, o.Status, o.TrackingCode, o.CreatedAt,
            o.StatusHistory.OrderBy(h => h.CreatedAt).Select(h => new OrderStatusHistoryDto(h.Status, h.Note, h.CreatedAt)).ToList(),
            o.Items.Select(i => new TrackItemDto(i.ProductName, i.Quantity)).ToList());
    }
}

public interface IAdminOrderService
{
    Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(AdminOrderQuery q, CancellationToken ct = default);
    Task<OrderDetailDto> GetOrderAsync(string orderNumber, CancellationToken ct = default);
    Task<OrderDetailDto> UpdateStatusAsync(string orderNumber, UpdateOrderStatusRequest r, string? changedBy, CancellationToken ct = default);
}

public class AdminOrderService : IAdminOrderService
{
    private readonly IAppDbContext _db;
    private readonly IOrderLifecycle _lifecycle;
    private readonly INotificationSender _notifier;

    public AdminOrderService(IAppDbContext db, IOrderLifecycle lifecycle, INotificationSender notifier)
    {
        _db = db; _lifecycle = lifecycle; _notifier = notifier;
    }

    public async Task<PagedResult<OrderSummaryDto>> GetOrdersAsync(AdminOrderQuery q, CancellationToken ct = default)
    {
        var query = _db.Orders.AsNoTracking().AsQueryable();
        if (q.Status.HasValue) query = query.Where(o => o.Status == q.Status.Value);
        if (q.From.HasValue) query = query.Where(o => o.CreatedAt >= q.From.Value);
        if (q.To.HasValue) query = query.Where(o => o.CreatedAt <= q.To.Value);
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            var phone = PhoneHelper.Normalize(s) ?? s;
            query = query.Where(o => o.OrderNumber == s || o.ReceiverPhone == phone || o.ReceiverName.Contains(s) ||
                                     o.User.Email.Contains(s) || (o.TrackingCode != null && o.TrackingCode == s));
        }
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(o => o.CreatedAt).Skip((q.SafePage - 1) * q.SafePageSize).Take(q.SafePageSize)
            .Select(o => new OrderSummaryDto(o.Id, o.OrderNumber, o.Status, o.GrandTotal, o.Items.Count, o.CreatedAt,
                o.User.FirstName + " " + o.User.LastName, o.ReceiverPhone)).ToListAsync(ct);
        return new PagedResult<OrderSummaryDto>(items, q.SafePage, q.SafePageSize, total);
    }

    public async Task<OrderDetailDto> GetOrderAsync(string orderNumber, CancellationToken ct = default)
    {
        var o = await _db.Orders.AsNoTracking().Include(x => x.Items).Include(x => x.StatusHistory).Include(x => x.Payments)
            .AsSplitQuery().FirstOrDefaultAsync(x => x.OrderNumber == orderNumber, ct)
            ?? throw new NotFoundException("Order was not found.");
        return o.ToDetailDto();
    }

    public async Task<OrderDetailDto> UpdateStatusAsync(string orderNumber, UpdateOrderStatusRequest r, string? changedBy, CancellationToken ct = default)
    {
        var o = await _db.Orders.Include(x => x.Items).Include(x => x.StatusHistory).Include(x => x.Payments)
            .AsSplitQuery().FirstOrDefaultAsync(x => x.OrderNumber == orderNumber, ct)
            ?? throw new NotFoundException("Order was not found.");

        if (r.Status == o.Status) throw new BusinessRuleException("The order is already in this status.");
        if (!o.CanTransitionTo(r.Status))
            throw new BusinessRuleException($"Transitioning the order from '{o.Status}' to '{r.Status}' is not allowed.");

        if (!string.IsNullOrWhiteSpace(r.TrackingCode)) o.TrackingCode = r.TrackingCode.Trim();

        if (r.Status == OrderStatus.Cancelled)
        {
            await _lifecycle.CancelAsync(o, r.Note ?? "Cancelled by administrator", changedBy, ct);
            return o.ToDetailDto();
        }

        o.SetStatus(r.Status, r.Note, changedBy);
        await _db.SaveChangesAsync(ct);

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == o.UserId, ct);
        await _notifier.SendAsync(new NotificationMessage("order.status_changed", user?.Email, o.ReceiverPhone,
            $"Order {o.OrderNumber} status updated",
            $"The status of order {o.OrderNumber} has been changed to '{r.Status}'." +
            (r.Status == OrderStatus.Shipped && o.TrackingCode != null ? $" Tracking code: {o.TrackingCode}" : "")), ct);
        return o.ToDetailDto();
    }
}
