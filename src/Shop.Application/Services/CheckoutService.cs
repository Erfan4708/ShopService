using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.Application.Services;

public interface ICheckoutService
{
    Task<CheckoutSummaryDto> PreviewAsync(Guid userId, Guid? shippingMethodId, CancellationToken ct = default);
    Task<OrderDetailDto> PlaceOrderAsync(Guid userId, CheckoutRequest r, CancellationToken ct = default);
}

public class CheckoutService : ICheckoutService
{
    private readonly IAppDbContext _db;
    private readonly ICouponService _coupons;
    private readonly ISettingsService _settings;
    private readonly INotificationSender _notifier;

    public CheckoutService(IAppDbContext db, ICouponService coupons, ISettingsService settings, INotificationSender notifier)
    {
        _db = db; _coupons = coupons; _settings = settings; _notifier = notifier;
    }

    public async Task<CheckoutSummaryDto> PreviewAsync(Guid userId, Guid? shippingMethodId, CancellationToken ct = default)
    {
        var cart = await LoadCartAsync(userId, ct);
        var lines = cart.Items.Where(i => i.Product.IsActive).ToList();
        if (lines.Count == 0) throw new BusinessRuleException("Your shopping cart is empty.");

        ShippingMethod? method = null;
        if (shippingMethodId.HasValue)
            method = await _db.ShippingMethods.AsNoTracking().FirstOrDefaultAsync(s => s.Id == shippingMethodId && s.IsActive, ct)
                     ?? throw new BusinessRuleException("The selected shipping method is invalid.");

        var subtotal = lines.Sum(l => l.Product.Price * l.Quantity);
        var (_, discount) = await ResolveCouponAsync(cart.CouponCode, subtotal, ct);
        return await ComputeAsync(subtotal, discount, method, cart.CouponCode, ct);
    }

    public async Task<OrderDetailDto> PlaceOrderAsync(Guid userId, CheckoutRequest r, CancellationToken ct = default)
    {
        var cart = await LoadCartAsync(userId, ct);
        var lines = cart.Items.Where(i => i.Product.IsActive).ToList();
        if (lines.Count == 0) throw new BusinessRuleException("Your shopping cart is empty.");

        var address = await _db.Addresses.AsNoTracking().FirstOrDefaultAsync(a => a.Id == r.AddressId && a.UserId == userId, ct)
                      ?? throw new BusinessRuleException("The selected address is invalid.");
        var method = await _db.ShippingMethods.AsNoTracking().FirstOrDefaultAsync(s => s.Id == r.ShippingMethodId && s.IsActive, ct)
                     ?? throw new BusinessRuleException("The selected shipping method is invalid.");

        foreach (var l in lines)
        {
            if (l.Product.TrackInventory && l.Quantity > l.Product.StockQuantity)
                throw new BusinessRuleException($"Insufficient stock for '{l.Product.Name}' (available: {Math.Max(l.Product.StockQuantity, 0)}).");
        }

        var subtotal = lines.Sum(l => l.Product.Price * l.Quantity);
        var (coupon, discount) = await ResolveCouponAsync(cart.CouponCode, subtotal, ct);
        var totals = await ComputeAsync(subtotal, discount, method, coupon?.Code, ct);

        var order = new Order
        {
            OrderNumber = await GenerateOrderNumberAsync(ct),
            UserId = userId,
            Status = OrderStatus.PendingPayment,
            Subtotal = totals.Subtotal,
            DiscountTotal = totals.Discount,
            ShippingCost = totals.ShippingCost,
            TaxTotal = totals.Tax,
            GrandTotal = totals.GrandTotal,
            CouponCode = coupon?.Code,
            ShippingMethodName = method.Name,
            ReceiverName = address.ReceiverName,
            ReceiverPhone = address.ReceiverPhone,
            Province = address.Province,
            City = address.City,
            PostalCode = address.PostalCode,
            AddressLine = address.AddressLine,
            Note = r.Note?.Trim()
        };

        foreach (var l in lines)
        {
            var p = l.Product;
            order.Items.Add(new OrderItem
            {
                OrderId = order.Id,
                ProductId = p.Id,
                ProductName = p.Name,
                Sku = p.Sku,
                ImageUrl = p.Images.OrderByDescending(i => i.IsMain).ThenBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                UnitPrice = p.Price,
                Quantity = l.Quantity,
                LineTotal = p.Price * l.Quantity
            });
            if (p.TrackInventory) p.StockQuantity -= l.Quantity;
        }

        if (coupon != null)
        {
            var tracked = await _db.Coupons.FirstAsync(c => c.Id == coupon.Id, ct);
            if (tracked.UsageLimit.HasValue && tracked.UsedCount >= tracked.UsageLimit)
                throw new BusinessRuleException("The usage limit for this coupon has been reached.");
            tracked.UsedCount++;
        }

        order.SetStatus(OrderStatus.PendingPayment, "Order placed and awaiting payment.", "system");
        _db.Orders.Add(order);
        _db.Carts.Remove(cart); // Cart items are deleted through cascade delete.

        try { await _db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException("Some product stock quantities changed simultaneously. Please review your cart and try again.");
        }

        var user = await _db.Users.AsNoTracking().FirstAsync(u => u.Id == userId, ct);
        await _notifier.SendAsync(new NotificationMessage("order.created", user.Email, order.ReceiverPhone,
            $"Order {order.OrderNumber} placed",
            $"Your order #{order.OrderNumber} has been placed. Please complete the payment."), ct);

        return order.ToDetailDto();
    }

    // ---------------- helpers ----------------
    private async Task<Cart> LoadCartAsync(Guid userId, CancellationToken ct) =>
        await _db.Carts.Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images)
            .AsSplitQuery().FirstOrDefaultAsync(c => c.UserId == userId, ct)
        ?? throw new BusinessRuleException("Your shopping cart is empty.");

    private async Task<(Coupon? Coupon, decimal Discount)> ResolveCouponAsync(string? code, decimal subtotal, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code)) return (null, 0);
        var calc = await _coupons.CalculateAsync(code, subtotal, ct); // Returns a clear error message to the user if the coupon is invalid.
        return (calc.Coupon, calc.Discount);
    }

    private async Task<CheckoutSummaryDto> ComputeAsync(decimal subtotal, decimal discount, ShippingMethod? method,
        string? couponCode, CancellationToken ct)
    {
        var afterDiscount = subtotal - discount;
        var shipping = method?.CostFor(afterDiscount) ?? 0;
        var taxPercent = await _settings.GetDecimalAsync(SettingKeys.TaxPercent, ct);
        var tax = taxPercent > 0 ? Math.Round(afterDiscount * taxPercent / 100m, 2) : 0;
        return new CheckoutSummaryDto(subtotal, discount, shipping, tax, afterDiscount + shipping + tax, couponCode);
    }

    private async Task<string> GenerateOrderNumberAsync(CancellationToken ct)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var number = $"{DateTime.UtcNow:yyMMdd}{RandomNumberGenerator.GetInt32(100000, 999999)}";
            if (!await _db.Orders.AnyAsync(o => o.OrderNumber == number, ct)) return number;
        }
        return $"{DateTime.UtcNow:yyMMddHHmmss}{RandomNumberGenerator.GetInt32(100, 999)}";
    }
}
