using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Domain.Enums;

namespace Shop.Application.Services;

public interface IAdminUserService
{
    Task<PagedResult<AdminUserDto>> GetUsersAsync(AdminUserQuery q, CancellationToken ct = default);
    Task<AdminUserDto> GetUserAsync(Guid id, CancellationToken ct = default);
    Task<AdminUserDto> UpdateUserAsync(Guid id, Guid actorId, UpdateUserRequest r, CancellationToken ct = default);
}

public class AdminUserService : IAdminUserService
{
    private readonly IAppDbContext _db;
    public AdminUserService(IAppDbContext db) => _db = db;

    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(AdminUserQuery q, CancellationToken ct = default)
    {
        var query = _db.Users.AsNoTracking().AsQueryable();
        if (q.Role.HasValue) query = query.Where(u => u.Role == q.Role.Value);
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            var phone = PhoneHelper.Normalize(s) ?? s;
            query = query.Where(u => u.Email.Contains(s) || u.FirstName.Contains(s) || u.LastName.Contains(s) || u.PhoneNumber == phone);
        }
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(u => u.CreatedAt).Skip((q.SafePage - 1) * q.SafePageSize).Take(q.SafePageSize)
            .Select(u => new AdminUserDto(u.Id, u.Email, u.PhoneNumber, u.FirstName + " " + u.LastName, u.Role, u.IsActive,
                u.CreatedAt, u.Orders.Count)).ToListAsync(ct);
        return new PagedResult<AdminUserDto>(items, q.SafePage, q.SafePageSize, total);
    }

    public async Task<AdminUserDto> GetUserAsync(Guid id, CancellationToken ct = default) =>
        await _db.Users.AsNoTracking().Where(u => u.Id == id)
            .Select(u => new AdminUserDto(u.Id, u.Email, u.PhoneNumber, u.FirstName + " " + u.LastName, u.Role, u.IsActive,
                u.CreatedAt, u.Orders.Count)).FirstOrDefaultAsync(ct)
        ?? throw new NotFoundException("User was not found.");

    public async Task<AdminUserDto> UpdateUserAsync(Guid id, Guid actorId, UpdateUserRequest r, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct) ?? throw new NotFoundException("User was not found.");

        if (id == actorId && (r.Role.HasValue && r.Role != user.Role || r.IsActive == false))
            throw new BusinessRuleException("You cannot change your own role or deactivate your own account.");

        if (r.Role.HasValue) user.Role = r.Role.Value;
        if (r.IsActive.HasValue)
        {
            user.IsActive = r.IsActive.Value;
            if (!user.IsActive)
            {
                var tokens = await _db.RefreshTokens.Where(t => t.UserId == id && t.RevokedAt == null).ToListAsync(ct);
                foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;
            }
        }
        await _db.SaveChangesAsync(ct);
        return await GetUserAsync(id, ct);
    }
}

public interface IDashboardService
{
    Task<DashboardDto> GetAsync(CancellationToken ct = default);
}

public class DashboardService : IDashboardService
{
    private static readonly OrderStatus[] RevenueStatuses =
        { OrderStatus.Paid, OrderStatus.Processing, OrderStatus.Shipped, OrderStatus.Delivered };

    private readonly IAppDbContext _db;
    private readonly ISettingsService _settings;

    public DashboardService(IAppDbContext db, ISettingsService settings)
    {
        _db = db; _settings = settings;
    }

    public async Task<DashboardDto> GetAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var from = today.AddDays(-29);
        var revenueOrders = _db.Orders.AsNoTracking().Where(o => RevenueStatuses.Contains(o.Status));

        var totalOrders = await _db.Orders.CountAsync(ct);
        var todayOrders = await _db.Orders.CountAsync(o => o.CreatedAt >= today, ct);
        var totalRevenue = await revenueOrders.SumAsync(o => (decimal?)o.GrandTotal, ct) ?? 0;
        var todayRevenue = await revenueOrders.Where(o => o.PaidAt >= today).SumAsync(o => (decimal?)o.GrandTotal, ct) ?? 0;
        var customers = await _db.Users.CountAsync(u => u.Role == UserRole.Customer, ct);
        var activeProducts = await _db.Products.CountAsync(p => p.IsActive, ct);

        var byStatusRaw = await _db.Orders.AsNoTracking().GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() }).ToListAsync(ct);
        var byStatus = Enum.GetValues<OrderStatus>().ToDictionary(s => s.ToString(),
            s => byStatusRaw.FirstOrDefault(x => x.Status == s)?.Count ?? 0);

        var dailyRaw = await revenueOrders.Where(o => o.PaidAt >= from)
            .GroupBy(o => o.PaidAt!.Value.Date)
            .Select(g => new { Date = g.Key, Count = g.Count(), Revenue = g.Sum(x => x.GrandTotal) }).ToListAsync(ct);
        var daily = Enumerable.Range(0, 30).Select(i => from.AddDays(i)).Select(d =>
        {
            var row = dailyRaw.FirstOrDefault(x => x.Date == d);
            return new DailySalesDto(d, row?.Count ?? 0, row?.Revenue ?? 0);
        }).ToList();


        var top = await _db.OrderItems
            .AsNoTracking()
            .Where(i => RevenueStatuses.Contains(i.Order.Status))
            .GroupBy(i => new { i.ProductId, i.ProductName })
            .Select(g => new
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                QuantitySold = g.Sum(x => x.Quantity),
                Revenue = g.Sum(x => x.LineTotal)
            })
            .OrderByDescending(x => x.QuantitySold)
            .Take(10)
            .Select(x => new TopProductDto(
                x.ProductId,
                x.ProductName,
                x.QuantitySold,
                x.Revenue))
            .ToListAsync(ct);

        var threshold = await _settings.GetIntAsync(SettingKeys.LowStockThreshold, ct);
        var low = await _db.Products.AsNoTracking().Where(p => p.IsActive && p.TrackInventory && p.StockQuantity <= threshold)
            .OrderBy(p => p.StockQuantity).Take(10)
            .Select(p => new LowStockProductDto(p.Id, p.Name, p.Sku, p.StockQuantity)).ToListAsync(ct);

        return new DashboardDto(totalOrders, todayOrders, totalRevenue, todayRevenue, customers, activeProducts,
            byStatus, daily, top, low);
    }
}
