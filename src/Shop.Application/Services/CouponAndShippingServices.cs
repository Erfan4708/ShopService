using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.Application.Services;

public record CouponCalculation(Coupon Coupon, decimal Discount);

public interface ICouponService
{
    Task<CouponCalculation> CalculateAsync(string code, decimal subtotal, CancellationToken ct = default);
    Task<CouponCalculation?> TryCalculateAsync(string code, decimal subtotal, CancellationToken ct = default);
    // Admin
    Task<List<CouponDto>> GetAllAsync(CancellationToken ct = default);
    Task<CouponDto> CreateAsync(UpsertCouponRequest r, CancellationToken ct = default);
    Task<CouponDto> UpdateAsync(Guid id, UpsertCouponRequest r, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public class CouponService : ICouponService
{
    private readonly IAppDbContext _db;
    public CouponService(IAppDbContext db) => _db = db;

    public async Task<CouponCalculation> CalculateAsync(string code, decimal subtotal, CancellationToken ct = default)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var c = await _db.Coupons.AsNoTracking().FirstOrDefaultAsync(x => x.Code == normalized, ct);
        var now = DateTime.UtcNow;
        if (c == null || !c.IsActive) throw new BusinessRuleException("Invalid coupon code.");
        if (c.StartsAt.HasValue && c.StartsAt > now) throw new BusinessRuleException("This coupon is not active yet.");
        if (c.ExpiresAt.HasValue && c.ExpiresAt < now) throw new BusinessRuleException("This coupon has expired.");
        if (c.UsageLimit.HasValue && c.UsedCount >= c.UsageLimit) throw new BusinessRuleException("The usage limit for this coupon has been reached.");
        if (c.MinOrderAmount.HasValue && subtotal < c.MinOrderAmount)
            throw new BusinessRuleException($"The minimum order amount for this coupon is {c.MinOrderAmount:N0}.");

        var discount = c.Type == DiscountType.Percent ? Math.Round(subtotal * c.Value / 100m, 2) : c.Value;
        if (c.MaxDiscountAmount.HasValue && discount > c.MaxDiscountAmount) discount = c.MaxDiscountAmount.Value;
        if (discount > subtotal) discount = subtotal;
        return new CouponCalculation(c, discount);
    }

    public async Task<CouponCalculation?> TryCalculateAsync(string code, decimal subtotal, CancellationToken ct = default)
    {
        try { return await CalculateAsync(code, subtotal, ct); }
        catch (BusinessRuleException) { return null; }
    }

    public async Task<List<CouponDto>> GetAllAsync(CancellationToken ct = default) =>
        (await _db.Coupons.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync(ct)).Select(c => c.ToDto()).ToList();

    public async Task<CouponDto> CreateAsync(UpsertCouponRequest r, CancellationToken ct = default)
    {
        var code = r.Code.Trim().ToUpperInvariant();
        if (await _db.Coupons.AnyAsync(c => c.Code == code, ct)) throw new ConflictException("This coupon code has already been registered.");
        Validate(r);
        var c = new Coupon { Code = code };
        Apply(c, r);
        _db.Coupons.Add(c);
        await _db.SaveChangesAsync(ct);
        return c.ToDto();
    }

    public async Task<CouponDto> UpdateAsync(Guid id, UpsertCouponRequest r, CancellationToken ct = default)
    {
        var c = await _db.Coupons.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException();
        var code = r.Code.Trim().ToUpperInvariant();
        if (await _db.Coupons.AnyAsync(x => x.Code == code && x.Id != id, ct)) throw new ConflictException("This coupon code has already been registered.");
        Validate(r);
        c.Code = code;
        Apply(c, r);
        await _db.SaveChangesAsync(ct);
        return c.ToDto();
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _db.Coupons.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException();
        _db.Coupons.Remove(c);
        await _db.SaveChangesAsync(ct);
    }

    private static void Validate(UpsertCouponRequest r)
    {
        if (r.Type == DiscountType.Percent && r.Value > 100) throw new BusinessRuleException("The discount percentage cannot exceed 100.");
        if (r.StartsAt.HasValue && r.ExpiresAt.HasValue && r.ExpiresAt < r.StartsAt)
            throw new BusinessRuleException("The expiration date must be later than the start date.");
    }

    private static void Apply(Coupon c, UpsertCouponRequest r)
    {
        c.Description = r.Description; c.Type = r.Type; c.Value = r.Value; c.MaxDiscountAmount = r.MaxDiscountAmount;
        c.MinOrderAmount = r.MinOrderAmount; c.UsageLimit = r.UsageLimit; c.StartsAt = r.StartsAt;
        c.ExpiresAt = r.ExpiresAt; c.IsActive = r.IsActive;
    }
}

public interface IShippingService
{
    Task<List<ShippingMethodDto>> GetActiveAsync(CancellationToken ct = default);
    Task<List<AdminShippingMethodDto>> GetAllAsync(CancellationToken ct = default);
    Task<AdminShippingMethodDto> CreateAsync(UpsertShippingMethodRequest r, CancellationToken ct = default);
    Task<AdminShippingMethodDto> UpdateAsync(Guid id, UpsertShippingMethodRequest r, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public class ShippingService : IShippingService
{
    private readonly IAppDbContext _db;
    public ShippingService(IAppDbContext db) => _db = db;

    public async Task<List<ShippingMethodDto>> GetActiveAsync(CancellationToken ct = default) =>
        (await _db.ShippingMethods.AsNoTracking().Where(s => s.IsActive).OrderBy(s => s.SortOrder).ToListAsync(ct))
        .Select(s => s.ToDto()).ToList();

    public async Task<List<AdminShippingMethodDto>> GetAllAsync(CancellationToken ct = default) =>
        (await _db.ShippingMethods.AsNoTracking().OrderBy(s => s.SortOrder).ToListAsync(ct)).Select(s => s.ToAdminDto()).ToList();

    public async Task<AdminShippingMethodDto> CreateAsync(UpsertShippingMethodRequest r, CancellationToken ct = default)
    {
        var s = new ShippingMethod();
        Apply(s, r);
        _db.ShippingMethods.Add(s);
        await _db.SaveChangesAsync(ct);
        return s.ToAdminDto();
    }

    public async Task<AdminShippingMethodDto> UpdateAsync(Guid id, UpsertShippingMethodRequest r, CancellationToken ct = default)
    {
        var s = await _db.ShippingMethods.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException();
        Apply(s, r);
        await _db.SaveChangesAsync(ct);
        return s.ToAdminDto();
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var s = await _db.ShippingMethods.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException();
        _db.ShippingMethods.Remove(s); 
        await _db.SaveChangesAsync(ct);
    }

    private static void Apply(ShippingMethod s, UpsertShippingMethodRequest r)
    {
        s.Name = r.Name; s.Description = r.Description; s.Cost = r.Cost; s.FreeAboveAmount = r.FreeAboveAmount;
        s.EstimatedDays = r.EstimatedDays; s.SortOrder = r.SortOrder; s.IsActive = r.IsActive;
    }
}
