using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Domain.Entities;

namespace Shop.Application.Services;

public interface ICartService
{
    Task<CartDto> GetAsync(CartOwner owner, CancellationToken ct = default);
    Task<CartDto> AddItemAsync(CartOwner owner, AddCartItemRequest r, CancellationToken ct = default);
    Task<CartDto> SetQuantityAsync(CartOwner owner, Guid productId, int quantity, CancellationToken ct = default);
    Task<CartDto> RemoveItemAsync(CartOwner owner, Guid productId, CancellationToken ct = default);
    Task<CartDto> ClearAsync(CartOwner owner, CancellationToken ct = default);
    Task<CartDto> ApplyCouponAsync(CartOwner owner, string code, CancellationToken ct = default);
    Task<CartDto> RemoveCouponAsync(CartOwner owner, CancellationToken ct = default);
    Task<CartDto> MergeAsync(Guid userId, string guestToken, CancellationToken ct = default);
}

public class CartService : ICartService
{
    private const int MaxQuantityPerLine = 100;
    private readonly IAppDbContext _db;
    private readonly ICouponService _coupons;

    public CartService(IAppDbContext db, ICouponService coupons)
    {
        _db = db; _coupons = coupons;
    }

    public async Task<CartDto> GetAsync(CartOwner owner, CancellationToken ct = default)
    {
        var cart = await FindCartAsync(owner, ct);
        if (cart == null) return new CartDto(null, new List<CartItemDto>(), 0, 0, 0, 0, null);
        return await BuildDtoAsync(cart, ct);
    }

    public async Task<CartDto> AddItemAsync(CartOwner owner, AddCartItemRequest r, CancellationToken ct = default)
    {
        var product = await _db.Products.Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == r.ProductId && p.IsActive && p.Category.IsActive, ct)
            ?? throw new NotFoundException("Product was not found or is unavailable.");

        var cart = await GetOrCreateAsync(owner, ct);
        var line = cart.Items.FirstOrDefault(i => i.ProductId == product.Id);
        var newQty = (line?.Quantity ?? 0) + r.Quantity;
        EnsureQuantity(product, newQty);

        if (line == null) cart.Items.Add(new CartItem { CartId = cart.Id, ProductId = product.Id, Product = product, Quantity = newQty });
        else line.Quantity = newQty;

        await _db.SaveChangesAsync(ct);
        return await GetAsync(new CartOwner(cart.UserId, cart.Token), ct);
    }

    public async Task<CartDto> SetQuantityAsync(CartOwner owner, Guid productId, int quantity, CancellationToken ct = default)
    {
        var cart = await FindCartAsync(owner, ct) ?? throw new NotFoundException("Shopping cart is empty.");
        var line = cart.Items.FirstOrDefault(i => i.ProductId == productId) ?? throw new NotFoundException("This product is not in your cart.");
        if (quantity <= 0) _db.CartItems.Remove(line);
        else
        {
            EnsureQuantity(line.Product, quantity);
            line.Quantity = quantity;
        }
        await _db.SaveChangesAsync(ct);
        return await GetAsync(new CartOwner(cart.UserId, cart.Token), ct);
    }

    public Task<CartDto> RemoveItemAsync(CartOwner owner, Guid productId, CancellationToken ct = default) =>
        SetQuantityAsync(owner, productId, 0, ct);

    public async Task<CartDto> ClearAsync(CartOwner owner, CancellationToken ct = default)
    {
        var cart = await FindCartAsync(owner, ct);
        if (cart != null)
        {
            _db.CartItems.RemoveRange(cart.Items.ToList());
            cart.CouponCode = null;
            await _db.SaveChangesAsync(ct);
        }
        return await GetAsync(owner, ct);
    }

    public async Task<CartDto> ApplyCouponAsync(CartOwner owner, string code, CancellationToken ct = default)
    {
        var cart = await FindCartAsync(owner, ct) ?? throw new BusinessRuleException("Your shopping cart is empty.");
        var subtotal = ActiveLines(cart).Sum(i => i.Product.Price * i.Quantity);
        if (subtotal <= 0) throw new BusinessRuleException("Your shopping cart is empty.");
        var calc = await _coupons.CalculateAsync(code, subtotal, ct); // ط¯ط± طµظˆط±طھ ظ†ط§ظ…ط¹طھط¨ط± ط¨ظˆط¯ظ† ط§ط³طھط«ظ†ط§ ظ…غŒâ€Œط¯ظ‡ط¯
        cart.CouponCode = calc.Coupon.Code;
        await _db.SaveChangesAsync(ct);
        return await GetAsync(new CartOwner(cart.UserId, cart.Token), ct);
    }

    public async Task<CartDto> RemoveCouponAsync(CartOwner owner, CancellationToken ct = default)
    {
        var cart = await FindCartAsync(owner, ct);
        if (cart != null && cart.CouponCode != null)
        {
            cart.CouponCode = null;
            await _db.SaveChangesAsync(ct);
        }
        return await GetAsync(owner, ct);
    }

    public async Task<CartDto> MergeAsync(Guid userId, string guestToken, CancellationToken ct = default)
    {
        var guest = await FindCartAsync(new CartOwner(null, guestToken), ct);
        if (guest != null && guest.Items.Count > 0)
        {
            var mine = await GetOrCreateAsync(new CartOwner(userId, null), ct);
            foreach (var gi in guest.Items.ToList())
            {
                var existing = mine.Items.FirstOrDefault(i => i.ProductId == gi.ProductId);
                var qty = Math.Min((existing?.Quantity ?? 0) + gi.Quantity, MaxQuantityPerLine);
                if (gi.Product.TrackInventory) qty = Math.Min(qty, Math.Max(gi.Product.StockQuantity, 0));
                if (qty <= 0) continue;
                if (existing == null) mine.Items.Add(new CartItem { CartId = mine.Id, ProductId = gi.ProductId, Product = gi.Product, Quantity = qty });
                else existing.Quantity = qty;
            }
            if (mine.CouponCode == null) mine.CouponCode = guest.CouponCode;
        }
        if (guest != null) _db.Carts.Remove(guest);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(new CartOwner(userId, null), ct);
    }

    // ---------------- helpers ----------------
    private static IEnumerable<CartItem> ActiveLines(Cart cart) =>
        cart.Items.Where(i => i.Product != null && i.Product.IsActive);

    private static void EnsureQuantity(Product product, int qty)
    {
        if (qty > MaxQuantityPerLine) throw new BusinessRuleException($"The maximum allowed quantity per product is {MaxQuantityPerLine}.");
        if (product.TrackInventory && qty > product.StockQuantity)
            throw new BusinessRuleException(product.StockQuantity <= 0
                ? "This product is out of stock."
                : $"Insufficient stock. A maximum of {product.StockQuantity} items can be ordered.");
    }

    private async Task<Cart?> FindCartAsync(CartOwner owner, CancellationToken ct)
    {
        IQueryable<Cart> q = _db.Carts.Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Images).AsSplitQuery();
        if (owner.UserId.HasValue) return await q.FirstOrDefaultAsync(c => c.UserId == owner.UserId, ct);
        if (!string.IsNullOrWhiteSpace(owner.Token)) return await q.FirstOrDefaultAsync(c => c.Token == owner.Token, ct);
        return null;
    }

    private async Task<Cart> GetOrCreateAsync(CartOwner owner, CancellationToken ct)
    {
        var cart = await FindCartAsync(owner, ct);
        if (cart != null) return cart;
        cart = new Cart
        {
            UserId = owner.UserId,
            Token = owner.UserId.HasValue ? null : Guid.NewGuid().ToString("N")
        };
        _db.Carts.Add(cart);
        return cart;
    }

    private async Task<CartDto> BuildDtoAsync(Cart cart, CancellationToken ct)
    {
        var items = ActiveLines(cart).OrderBy(i => i.CreatedAt).Select(i =>
        {
            var p = i.Product;
            var img = p.Images.OrderByDescending(x => x.IsMain).ThenBy(x => x.SortOrder).Select(x => x.Url).FirstOrDefault();
            var inStock = !p.TrackInventory || p.StockQuantity >= i.Quantity;
            return new CartItemDto(p.Id, p.Name, p.Slug, img, p.Price, i.Quantity, p.Price * i.Quantity, inStock,
                p.TrackInventory ? p.StockQuantity : null);
        }).ToList();

        var subtotal = items.Sum(i => i.LineTotal);
        decimal discount = 0;
        string? code = cart.CouponCode;
        if (!string.IsNullOrEmpty(code))
        {
            var calc = await _coupons.TryCalculateAsync(code, subtotal, ct);
            if (calc == null)
            {
                cart.CouponCode = null; code = null;
                await _db.SaveChangesAsync(ct);
            }
            else discount = calc.Discount;
        }
        return new CartDto(cart.Token, items, items.Sum(i => i.Quantity), subtotal, discount, subtotal - discount, code);
    }
}
