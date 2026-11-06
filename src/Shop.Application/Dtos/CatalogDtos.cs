using System.ComponentModel.DataAnnotations;

namespace Shop.Application.Dtos;

public enum ProductSort { Newest, PriceAsc, PriceDesc, Name, Rating, BestSelling }

public class ProductQuery : PageQueryBase
{
    public string? Search { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategorySlug { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool InStockOnly { get; set; }
    public bool FeaturedOnly { get; set; }
    public ProductSort Sort { get; set; } = ProductSort.Newest;
}

public record CategoryDto(Guid Id, string Name, string Slug, string? Description, string? ImageUrl, Guid? ParentId,
    List<CategoryDto> Children);

public record AdminCategoryDto(Guid Id, string Name, string Slug, string? Description, string? ImageUrl,
    Guid? ParentId, int SortOrder, bool IsActive);

public record ProductListItemDto(Guid Id, string Name, string Slug, string Sku, decimal Price,
    decimal? CompareAtPrice, string? MainImageUrl, bool InStock, Guid CategoryId, string CategoryName,
    decimal AverageRating, int ReviewCount, bool IsFeatured);

public record ProductImageDto(Guid Id, string Url, string? AltText, bool IsMain, int SortOrder);

public record ProductAttributeDto(string Name, string Value);

public record ProductDetailDto(Guid Id, string Name, string Slug, string Sku, string? ShortDescription,
    string? Description, string? Brand, decimal Price, decimal? CompareAtPrice, bool InStock, int? StockQuantity,
    Guid CategoryId, string CategoryName, string CategorySlug, decimal AverageRating, int ReviewCount, bool IsFeatured,
    List<ProductImageDto> Images, List<ProductAttributeDto> Attributes);

public record AdminProductDto(Guid Id, string Name, string Slug, string Sku, string? ShortDescription,
    string? Description, string? Brand, decimal Price, decimal? CompareAtPrice, int StockQuantity, bool TrackInventory,
    bool IsActive, bool IsFeatured, decimal? Weight, Guid CategoryId, string CategoryName, int SalesCount,
    DateTime CreatedAt, List<ProductImageDto> Images, List<ProductAttributeDto> Attributes);

public class AdminProductQuery : ProductQuery
{
    public bool? IsActive { get; set; }
    public bool LowStockOnly { get; set; }
}

public class ProductAttributeInput
{
    [Required, StringLength(100)] public string Name { get; set; } = "";
    [Required, StringLength(500)] public string Value { get; set; } = "";
}

public class UpsertProductRequest
{
    [Required, StringLength(300)] public string Name { get; set; } = "";
    [StringLength(300)] public string? Slug { get; set; }
    [Required, StringLength(100)] public string Sku { get; set; } = "";
    [StringLength(500)] public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    [StringLength(150)] public string? Brand { get; set; }
    [Range(0, 1_000_000_000_000)] public decimal Price { get; set; }
    [Range(0, 1_000_000_000_000)] public decimal? CompareAtPrice { get; set; }
    [Range(0, int.MaxValue)] public int StockQuantity { get; set; }
    public bool TrackInventory { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; }
    [Range(0, 1_000_000)] public decimal? Weight { get; set; }
    [Required] public Guid CategoryId { get; set; }
    public List<ProductAttributeInput> Attributes { get; set; } = new();
}

public class UpsertCategoryRequest
{
    [Required, StringLength(200)] public string Name { get; set; } = "";
    [StringLength(200)] public string? Slug { get; set; }
    [StringLength(1000)] public string? Description { get; set; }
    [StringLength(500)] public string? ImageUrl { get; set; }
    public Guid? ParentId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AdjustStockRequest
{
    [Range(0, int.MaxValue)] public int NewQuantity { get; set; }
    [StringLength(300)] public string? Reason { get; set; }
}

public record ReviewDto(Guid Id, Guid ProductId, string UserName, int Rating, string? Comment,
    bool IsVerifiedPurchase, DateTime CreatedAt);

public record AdminReviewDto(Guid Id, Guid ProductId, string ProductName, string UserName, int Rating,
    string? Comment, bool IsApproved, DateTime CreatedAt);

public class CreateReviewRequest
{
    [Range(1, 5)] public int Rating { get; set; }
    [StringLength(2000)] public string? Comment { get; set; }
}

public class AdminReviewQuery : PageQueryBase
{
    public bool? IsApproved { get; set; }
}
