using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Domain.Entities;

namespace Shop.Application.Services;

public interface IAdminCatalogService
{
    Task<PagedResult<ProductListItemDto>> GetProductsAsync(AdminProductQuery q, CancellationToken ct = default);
    Task<AdminProductDto> GetProductAsync(Guid id, CancellationToken ct = default);
    Task<AdminProductDto> CreateProductAsync(UpsertProductRequest r, CancellationToken ct = default);
    Task<AdminProductDto> UpdateProductAsync(Guid id, UpsertProductRequest r, CancellationToken ct = default);
    Task DeleteProductAsync(Guid id, CancellationToken ct = default);
    Task<AdminProductDto> AdjustStockAsync(Guid id, AdjustStockRequest r, CancellationToken ct = default);
    Task<ProductImageDto> AddImageAsync(Guid productId, string url, string? altText, bool isMain, CancellationToken ct = default);
    Task<string> RemoveImageAsync(Guid productId, Guid imageId, CancellationToken ct = default);
    Task SetMainImageAsync(Guid productId, Guid imageId, CancellationToken ct = default);

    Task<List<AdminCategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
    Task<AdminCategoryDto> CreateCategoryAsync(UpsertCategoryRequest r, CancellationToken ct = default);
    Task<AdminCategoryDto> UpdateCategoryAsync(Guid id, UpsertCategoryRequest r, CancellationToken ct = default);
    Task DeleteCategoryAsync(Guid id, CancellationToken ct = default);

    Task<PagedResult<AdminReviewDto>> GetReviewsAsync(AdminReviewQuery q, CancellationToken ct = default);
    Task SetReviewApprovalAsync(Guid reviewId, bool approved, CancellationToken ct = default);
    Task DeleteReviewAsync(Guid reviewId, CancellationToken ct = default);
}

public class AdminCatalogService : IAdminCatalogService
{
    private readonly IAppDbContext _db;
    private readonly ISettingsService _settings;

    public AdminCatalogService(IAppDbContext db, ISettingsService settings)
    {
        _db = db; _settings = settings;
    }

    // ---------------- Products ----------------
    public async Task<PagedResult<ProductListItemDto>> GetProductsAsync(AdminProductQuery q, CancellationToken ct = default)
    {
        IQueryable<Product> query = _db.Products.AsNoTracking();
        if (q.IsActive.HasValue) query = query.Where(p => p.IsActive == q.IsActive.Value);
        if (q.LowStockOnly)
        {
            var threshold = await _settings.GetIntAsync(SettingKeys.LowStockThreshold, ct);
            query = query.Where(p => p.TrackInventory && p.StockQuantity <= threshold);
        }
        query = await CatalogService.ApplyFiltersAsync(query, q, _db, ct);
        return await CatalogService.ToPagedAsync(query, q, ct);
    }

    public async Task<AdminProductDto> GetProductAsync(Guid id, CancellationToken ct = default)
    {
        var p = await LoadProductAsync(id, false, ct);
        return p.ToAdminDto();
    }

    public async Task<AdminProductDto> CreateProductAsync(UpsertProductRequest r, CancellationToken ct = default)
    {
        await EnsureCategoryAsync(r.CategoryId, ct);
        var sku = r.Sku.Trim();
        if (await _db.Products.AnyAsync(p => p.Sku == sku, ct))
            throw new ConflictException("This product SKU already exists.");
        var product = new Product();
        Apply(product, r);
        product.Sku = sku;
        product.Slug = await UniqueProductSlugAsync(string.IsNullOrWhiteSpace(r.Slug) ? r.Name : r.Slug!, null, ct);
        SetAttributes(product, r.Attributes);
        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);
        return (await LoadProductAsync(product.Id, false, ct)).ToAdminDto();
    }

    public async Task<AdminProductDto> UpdateProductAsync(Guid id, UpsertProductRequest r, CancellationToken ct = default)
    {
        var product = await LoadProductAsync(id, true, ct);
        await EnsureCategoryAsync(r.CategoryId, ct);
        var sku = r.Sku.Trim();
        if (await _db.Products.AnyAsync(p => p.Sku == sku && p.Id != id, ct))
            throw new ConflictException("This product SKU already exists.");
        Apply(product, r);
        product.Sku = sku;
        var desiredSlug = string.IsNullOrWhiteSpace(r.Slug) ? product.Slug : r.Slug!;
        product.Slug = await UniqueProductSlugAsync(desiredSlug, id, ct);

        _db.ProductAttributes.RemoveRange(product.Attributes.ToList());
        product.Attributes.Clear();
        SetAttributes(product, r.Attributes);
        try { await _db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) {
            throw new ConflictException("This product was modified by another user. Please try again.");
        }
        return (await LoadProductAsync(id, false, ct)).ToAdminDto();
    }

    public async Task DeleteProductAsync(Guid id, CancellationToken ct = default)
    {
        var product = await LoadProductAsync(id, true, ct);
        product.IsDeleted = true;
        product.IsActive = false;
        var cartItems = await _db.CartItems.Where(c => c.ProductId == id).ToListAsync(ct);
        _db.CartItems.RemoveRange(cartItems);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<AdminProductDto> AdjustStockAsync(Guid id, AdjustStockRequest r, CancellationToken ct = default)
    {
        var product = await LoadProductAsync(id, true, ct);
        product.StockQuantity = r.NewQuantity;
        try { await _db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException) 
        {
            throw new ConflictException("The stock quantity was modified by another user. Please try again.");
        }
        return product.ToAdminDto();
    }

    public async Task<ProductImageDto> AddImageAsync(Guid productId, string url, string? altText, bool isMain, CancellationToken ct = default)
    {
        var product = await LoadProductAsync(productId, true, ct);
        var hasImages = product.Images.Any();
        var image = new ProductImage
        {
            ProductId = productId, Url = url, AltText = altText,
            SortOrder = hasImages ? product.Images.Max(i => i.SortOrder) + 1 : 0,
            IsMain = isMain || !hasImages
        };
        if (image.IsMain) foreach (var i in product.Images) i.IsMain = false;
        _db.ProductImages.Add(image);
        await _db.SaveChangesAsync(ct);
        return image.ToDto();
    }

    public async Task<string> RemoveImageAsync(Guid productId, Guid imageId, CancellationToken ct = default)
    {
        var images = await _db.ProductImages.Where(i => i.ProductId == productId).ToListAsync(ct);
        var image = images.FirstOrDefault(i => i.Id == imageId) ?? throw new NotFoundException("Image not found.");
        _db.ProductImages.Remove(image);
        if (image.IsMain)
        {
            var next = images.Where(i => i.Id != imageId).OrderBy(i => i.SortOrder).FirstOrDefault();
            if (next != null) next.IsMain = true;
        }
        await _db.SaveChangesAsync(ct);
        return image.Url;
    }

    public async Task SetMainImageAsync(Guid productId, Guid imageId, CancellationToken ct = default)
    {
        var images = await _db.ProductImages.Where(i => i.ProductId == productId).ToListAsync(ct);
        if (images.All(i => i.Id != imageId)) throw new NotFoundException("Image not found.");
        foreach (var i in images) i.IsMain = i.Id == imageId;
        await _db.SaveChangesAsync(ct);
    }

    // ---------------- Categories ----------------
    public async Task<List<AdminCategoryDto>> GetCategoriesAsync(CancellationToken ct = default) =>
        (await _db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ThenBy(c => c.Name).ToListAsync(ct))
        .Select(c => c.ToAdminDto()).ToList();

    public async Task<AdminCategoryDto> CreateCategoryAsync(UpsertCategoryRequest r, CancellationToken ct = default)
    {
        if (r.ParentId.HasValue && !await _db.Categories.AnyAsync(c => c.Id == r.ParentId, ct))
            throw new BusinessRuleException("The selected parent category does not exist.");
        var c = new Category();
        ApplyCategory(c, r);
        c.Slug = await UniqueCategorySlugAsync(string.IsNullOrWhiteSpace(r.Slug) ? r.Name : r.Slug!, null, ct);
        _db.Categories.Add(c);
        await _db.SaveChangesAsync(ct);
        return c.ToAdminDto();
    }

    public async Task<AdminCategoryDto> UpdateCategoryAsync(Guid id, UpsertCategoryRequest r, CancellationToken ct = default)
    {
        var c = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Category not found.");
        if (r.ParentId.HasValue)
        {
            if (r.ParentId == id) throw new BusinessRuleException("A category cannot be its own parent.");
            var all = await _db.Categories.AsNoTracking().Select(x => new { x.Id, x.ParentId }).ToListAsync(ct);
            if (!all.Any(x => x.Id == r.ParentId)) throw new BusinessRuleException("The selected parent category does not exist.");
            var cursor = r.ParentId;
            while (cursor.HasValue)
            {
                if (cursor == id) throw new BusinessRuleException("Selecting this parent would create a circular category hierarchy.");
                cursor = all.FirstOrDefault(x => x.Id == cursor)?.ParentId;
            }
        }
        ApplyCategory(c, r);
        var desired = string.IsNullOrWhiteSpace(r.Slug) ? c.Slug : r.Slug!;
        c.Slug = await UniqueCategorySlugAsync(desired, id, ct);
        await _db.SaveChangesAsync(ct);
        return c.ToAdminDto();
    }

    public async Task DeleteCategoryAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _db.Categories.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Category not found.");

        if (await _db.Categories.AnyAsync(x => x.ParentId == id, ct))
            throw new BusinessRuleException("Please delete or reassign this category's subcategories first.");

        if (await _db.Products.IgnoreQueryFilters().AnyAsync(p => p.CategoryId == id, ct))
            throw new BusinessRuleException("This category contains products and cannot be deleted. You can deactivate it instead.");

        _db.Categories.Remove(c);
        await _db.SaveChangesAsync(ct);
    }

    // ---------------- Reviews ----------------
    public async Task<PagedResult<AdminReviewDto>> GetReviewsAsync(AdminReviewQuery q, CancellationToken ct = default)
    {
        var query = _db.Reviews.AsNoTracking().AsQueryable();
        if (q.IsApproved.HasValue) query = query.Where(r => r.IsApproved == q.IsApproved.Value);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(r => r.CreatedAt).Skip((q.SafePage - 1) * q.SafePageSize).Take(q.SafePageSize)
            .Select(r => new AdminReviewDto(r.Id, r.ProductId, r.Product.Name, r.User.FirstName + " " + r.User.LastName,
                r.Rating, r.Comment, r.IsApproved, r.CreatedAt)).ToListAsync(ct);
        return new PagedResult<AdminReviewDto>(items, q.SafePage, q.SafePageSize, total);
    }

    public async Task SetReviewApprovalAsync(Guid reviewId, bool approved, CancellationToken ct = default)
    {
        var review = await _db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId, ct) ?? throw new NotFoundException();
        review.IsApproved = approved;
        await _db.SaveChangesAsync(ct);
        var product = await _db.Products.FirstAsync(p => p.Id == review.ProductId, ct);
        await ReviewStats.RecalculateAsync(_db, product, ct);
    }

    public async Task DeleteReviewAsync(Guid reviewId, CancellationToken ct = default)
    {
        var review = await _db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId, ct) ?? throw new NotFoundException();
        var productId = review.ProductId;
        _db.Reviews.Remove(review);
        await _db.SaveChangesAsync(ct);
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
        if (product != null) await ReviewStats.RecalculateAsync(_db, product, ct);
    }

    // ---------------- helpers ----------------
    private async Task<Product> LoadProductAsync(Guid id, bool tracking, CancellationToken ct)
    {
        IQueryable<Product> q = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Attributes);

        if (!tracking) q = q.AsNoTracking();

        return await q.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("Product not found.");
    }

    private async Task EnsureCategoryAsync(Guid categoryId, CancellationToken ct)
    {
        if (!await _db.Categories.AnyAsync(c => c.Id == categoryId, ct))
            throw new BusinessRuleException("The selected category does not exist.");
    }

    private static void Apply(Product p, UpsertProductRequest r)
    {
        p.Name = r.Name.Trim(); p.ShortDescription = r.ShortDescription; p.Description = r.Description;
        p.Brand = r.Brand; p.Price = r.Price; p.CompareAtPrice = r.CompareAtPrice; p.StockQuantity = r.StockQuantity;
        p.TrackInventory = r.TrackInventory; p.IsActive = r.IsActive; p.IsFeatured = r.IsFeatured;
        p.Weight = r.Weight; p.CategoryId = r.CategoryId;
    }

    private static void SetAttributes(Product product, List<ProductAttributeInput> attrs)
    {
        var order = 0;
        foreach (var a in attrs)
            product.Attributes.Add(new ProductAttribute { ProductId = product.Id, Name = a.Name.Trim(), Value = a.Value.Trim(), SortOrder = order++ });
    }

    private async Task<string> UniqueProductSlugAsync(string source, Guid? excludeId, CancellationToken ct)
    {
        var baseSlug = SlugHelper.Slugify(source);
        var slug = baseSlug; var i = 2;
        while (await _db.Products.IgnoreQueryFilters().AnyAsync(p => p.Slug == slug && p.Id != excludeId, ct)) slug = $"{baseSlug}-{i++}";
        return slug;
    }

    private async Task<string> UniqueCategorySlugAsync(string source, Guid? excludeId, CancellationToken ct)
    {
        var baseSlug = SlugHelper.Slugify(source);
        var slug = baseSlug; var i = 2;
        while (await _db.Categories.AnyAsync(c => c.Slug == slug && c.Id != excludeId, ct)) slug = $"{baseSlug}-{i++}";
        return slug;
    }

    private static void ApplyCategory(Category c, UpsertCategoryRequest r)
    {
        c.Name = r.Name.Trim(); c.Description = r.Description; c.ImageUrl = r.ImageUrl;
        c.ParentId = r.ParentId; c.SortOrder = r.SortOrder; c.IsActive = r.IsActive;
    }
}
