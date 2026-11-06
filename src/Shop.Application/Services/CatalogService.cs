using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.Application.Services;

public interface ICatalogService
{
    Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductQuery q, CancellationToken ct = default);
    Task<ProductDetailDto> GetProductBySlugAsync(string slug, CancellationToken ct = default);
    Task<List<CategoryDto>> GetCategoryTreeAsync(CancellationToken ct = default);
    Task<PagedResult<ReviewDto>> GetReviewsAsync(Guid productId, PageQueryBase page, CancellationToken ct = default);
    Task<ReviewDto?> AddReviewAsync(Guid userId, Guid productId, CreateReviewRequest r, CancellationToken ct = default);
}

public class CatalogService : ICatalogService
{
    private readonly IAppDbContext _db;
    private readonly ISettingsService _settings;

    public CatalogService(IAppDbContext db, ISettingsService settings)
    {
        _db = db; _settings = settings;
    }

    public async Task<PagedResult<ProductListItemDto>> GetProductsAsync(ProductQuery q, CancellationToken ct = default)
    {
        var query = _db.Products.AsNoTracking().Where(p => p.IsActive && p.Category.IsActive);
        query = await ApplyFiltersAsync(query, q, _db, ct);
        return await ToPagedAsync(query, q, ct);
    }

    internal static async Task<IQueryable<Product>> ApplyFiltersAsync(IQueryable<Product> query, ProductQuery q,
        IAppDbContext db, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(p => p.Name.Contains(s) || p.Sku == s ||
                                     (p.Brand != null && p.Brand.Contains(s)) ||
                                     (p.ShortDescription != null && p.ShortDescription.Contains(s)));
        }
        if (q.CategoryId.HasValue || !string.IsNullOrWhiteSpace(q.CategorySlug))
        {
            var ids = await ResolveCategoryIdsAsync(db, q.CategoryId, q.CategorySlug, ct);
            query = query.Where(p => ids.Contains(p.CategoryId));
        }
        if (q.MinPrice.HasValue) query = query.Where(p => p.Price >= q.MinPrice.Value);
        if (q.MaxPrice.HasValue) query = query.Where(p => p.Price <= q.MaxPrice.Value);
        if (q.InStockOnly) query = query.Where(p => !p.TrackInventory || p.StockQuantity > 0);
        if (q.FeaturedOnly) query = query.Where(p => p.IsFeatured);
        return query;
    }

    internal static async Task<PagedResult<ProductListItemDto>> ToPagedAsync(IQueryable<Product> query, ProductQuery q, CancellationToken ct)
    {
        var total = await query.CountAsync(ct);
        query = q.Sort switch
        {
            ProductSort.PriceAsc => query.OrderBy(p => p.Price),
            ProductSort.PriceDesc => query.OrderByDescending(p => p.Price),
            ProductSort.Name => query.OrderBy(p => p.Name),
            ProductSort.Rating => query.OrderByDescending(p => p.AverageRating).ThenByDescending(p => p.ReviewCount),
            ProductSort.BestSelling => query.OrderByDescending(p => p.SalesCount),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };
        var page = q.SafePage; var size = q.SafePageSize;
        var items = await query.Skip((page - 1) * size).Take(size).Select(Mappers.ProductListProjection).ToListAsync(ct);
        return new PagedResult<ProductListItemDto>(items, page, size, total);
    }

    internal static async Task<List<Guid>> ResolveCategoryIdsAsync(IAppDbContext db, Guid? id, string? slug, CancellationToken ct)
    {
        var cats = await db.Categories.AsNoTracking().Select(c => new { c.Id, c.ParentId, c.Slug }).ToListAsync(ct);
        Guid? root = id ?? cats.FirstOrDefault(c => c.Slug == slug)?.Id;
        var result = new List<Guid>();
        if (root == null) return result;
        result.Add(root.Value);
        var queue = new Queue<Guid>();
        queue.Enqueue(root.Value);
        while (queue.Count > 0)
        {
            var cur = queue.Dequeue();
            foreach (var child in cats.Where(c => c.ParentId == cur))
            {
                result.Add(child.Id);
                queue.Enqueue(child.Id);
            }
        }
        return result;
    }

    public async Task<ProductDetailDto> GetProductBySlugAsync(string slug, CancellationToken ct = default)
    {
        var p = await _db.Products.AsNoTracking()
            .Include(x => x.Category).Include(x => x.Images).Include(x => x.Attributes)
            .FirstOrDefaultAsync(x => x.Slug == slug && x.IsActive && x.Category.IsActive, ct)
            ?? throw new NotFoundException("Product was not found.");
        var expose = await _settings.GetBoolAsync(SettingKeys.ExposeStockQuantity, ct);
        return p.ToDetailDto(expose);
    }

    public async Task<List<CategoryDto>> GetCategoryTreeAsync(CancellationToken ct = default)
    {
        var cats = await _db.Categories.AsNoTracking().Where(c => c.IsActive).OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync(ct);
        var dict = cats.ToDictionary(c => c.Id, c => new CategoryDto(c.Id, c.Name, c.Slug, c.Description, c.ImageUrl, c.ParentId, new List<CategoryDto>()));
        var roots = new List<CategoryDto>();
        foreach (var c in cats)
        {
            var dto = dict[c.Id];
            if (c.ParentId.HasValue && dict.TryGetValue(c.ParentId.Value, out var parent)) parent.Children.Add(dto);
            else if (!c.ParentId.HasValue) roots.Add(dto);
        }
        return roots;
    }

    public async Task<PagedResult<ReviewDto>> GetReviewsAsync(Guid productId, PageQueryBase page, CancellationToken ct = default)
    {
        var q = _db.Reviews.AsNoTracking().Where(r => r.ProductId == productId && r.IsApproved);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(r => r.CreatedAt).Skip((page.SafePage - 1) * page.SafePageSize).Take(page.SafePageSize)
            .Select(r => new ReviewDto(r.Id, r.ProductId, r.User.FirstName, r.Rating, r.Comment, r.IsVerifiedPurchase, r.CreatedAt))
            .ToListAsync(ct);
        return new PagedResult<ReviewDto>(items, page.SafePage, page.SafePageSize, total);
    }

    public async Task<ReviewDto?> AddReviewAsync(Guid userId, Guid productId, CreateReviewRequest r, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId && p.IsActive, ct)
            ?? throw new NotFoundException("Product was not found.");
        if (await _db.Reviews.AnyAsync(x => x.ProductId == productId && x.UserId == userId, ct))
            throw new ConflictException("You have already submitted a review for this product.");

        var verified = await _db.OrderItems.AnyAsync(i => i.ProductId == productId && i.Order.UserId == userId &&
            (i.Order.Status == OrderStatus.Paid || i.Order.Status == OrderStatus.Processing ||
             i.Order.Status == OrderStatus.Shipped || i.Order.Status == OrderStatus.Delivered), ct);

        var requireApproval = await _settings.GetBoolAsync(SettingKeys.ReviewsRequireApproval, ct);
        var review = new Review
        {
            ProductId = productId,
            UserId = userId,
            Rating = r.Rating,
            Comment = r.Comment?.Trim(),
            IsVerifiedPurchase = verified,
            IsApproved = !requireApproval
        };
        _db.Reviews.Add(review);
        await _db.SaveChangesAsync(ct);

        if (review.IsApproved)
        {
            await ReviewStats.RecalculateAsync(_db, product, ct);
            var user = await _db.Users.AsNoTracking().FirstAsync(u => u.Id == userId, ct);
            return new ReviewDto(review.Id, productId, user.FirstName, review.Rating, review.Comment, verified, review.CreatedAt);
        }
        return null; // Pending approval
    }
}

internal static class ReviewStats
{
    public static async Task RecalculateAsync(IAppDbContext db, Product product, CancellationToken ct)
    {
        var stats = await db.Reviews.Where(r => r.ProductId == product.Id && r.IsApproved)
            .GroupBy(r => 1).Select(g => new { Count = g.Count(), Avg = g.Average(x => (double)x.Rating) })
            .FirstOrDefaultAsync(ct);
        product.ReviewCount = stats?.Count ?? 0;
        product.AverageRating = stats == null ? 0 : Math.Round((decimal)stats.Avg, 2);
        await db.SaveChangesAsync(ct);
    }
}
