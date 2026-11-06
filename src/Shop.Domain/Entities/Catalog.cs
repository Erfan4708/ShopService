using Shop.Domain.Common;

namespace Shop.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public Guid? ParentId { get; set; }
    public Category? Parent { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Category> Children { get; set; } = new List<Category>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Product : BaseEntity, ISoftDeletable
{
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Sku { get; set; } = "";
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public int StockQuantity { get; set; }
    public bool TrackInventory { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; }
    public decimal? Weight { get; set; }
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public decimal AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public int SalesCount { get; set; }
    public bool IsDeleted { get; set; }
    public uint RowVersion { get; set; }
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<ProductAttribute> Attributes { get; set; } = new List<ProductAttribute>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public class ProductImage : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Url { get; set; } = "";
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsMain { get; set; }
}

public class ProductAttribute : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Name { get; set; } = "";
    public string Value { get; set; } = "";
    public int SortOrder { get; set; }
}

public class Review : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsApproved { get; set; }
    public bool IsVerifiedPurchase { get; set; }
}
