using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Domain.Common;
using Shop.Domain.Entities;

namespace Shop.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductAttribute> ProductAttributes => Set<ProductAttribute>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<ShippingMethod> ShippingMethods => Set<ShippingMethod>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        foreach (var entity in b.Model.GetEntityTypes().Where(t => typeof(BaseEntity).IsAssignableFrom(t.ClrType)))
            b.Entity(entity.ClrType).Property(nameof(BaseEntity.Id)).ValueGeneratedNever();

        b.Entity<Category>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(200).IsRequired();
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasOne(x => x.Parent).WithMany(x => x.Children).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Product>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(300).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(300).IsRequired();
            e.Property(x => x.Sku).HasMaxLength(100).IsRequired();
            e.Property(x => x.ShortDescription).HasMaxLength(500);
            e.Property(x => x.Brand).HasMaxLength(150);
            e.Property(x => x.Price).HasPrecision(18, 2);
            e.Property(x => x.CompareAtPrice).HasPrecision(18, 2);
            e.Property(x => x.Weight).HasPrecision(18, 3);
            e.Property(x => x.AverageRating).HasPrecision(3, 2);
            e.Property(x => x.RowVersion).IsRowVersion();
            e.HasIndex(x => x.Slug).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            e.HasIndex(x => x.Sku).IsUnique().HasFilter("\"IsDeleted\" = FALSE");
            e.HasIndex(x => new { x.IsActive, x.CategoryId });
            e.HasIndex(x => x.Price);
            e.HasOne(x => x.Category).WithMany(x => x.Products).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => !x.IsDeleted);
        });

        b.Entity<ProductImage>(e =>
        {
            e.Property(x => x.Url).HasMaxLength(500).IsRequired();
            e.Property(x => x.AltText).HasMaxLength(300);
            e.HasOne(x => x.Product).WithMany(x => x.Images).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ProductAttribute>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Value).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.Product).WithMany(x => x.Attributes).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Review>(e =>
        {
            e.Property(x => x.Comment).HasMaxLength(2000);
            e.HasIndex(x => new { x.ProductId, x.UserId }).IsUnique();
            e.HasOne(x => x.Product).WithMany(x => x.Reviews).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasQueryFilter(x => !x.Product.IsDeleted);
        });

        b.Entity<User>(e =>
        {
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.Property(x => x.PhoneNumber).HasMaxLength(20);
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Role).HasConversion<int>();
            e.Ignore(x => x.FullName);
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.PhoneNumber).IsUnique().HasFilter("\"PhoneNumber\" IS NOT NULL");
        });

        b.Entity<RefreshToken>(e =>
        {
            e.Property(x => x.TokenHash).HasMaxLength(200).IsRequired();
            e.Ignore(x => x.IsActive);
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasOne(x => x.User).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Address>(e =>
        {
            e.Property(x => x.Title).HasMaxLength(100).IsRequired();
            e.Property(x => x.ReceiverName).HasMaxLength(150).IsRequired();
            e.Property(x => x.ReceiverPhone).HasMaxLength(20).IsRequired();
            e.Property(x => x.Province).HasMaxLength(100).IsRequired();
            e.Property(x => x.City).HasMaxLength(100).IsRequired();
            e.Property(x => x.PostalCode).HasMaxLength(20).IsRequired();
            e.Property(x => x.AddressLine).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.User).WithMany(x => x.Addresses).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Cart>(e =>
        {
            e.Property(x => x.Token).HasMaxLength(64);
            e.Property(x => x.CouponCode).HasMaxLength(50);
            e.HasIndex(x => x.UserId).IsUnique().HasFilter("\"UserId\" IS NOT NULL");
            e.HasIndex(x => x.Token).IsUnique().HasFilter("\"Token\" IS NOT NULL");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CartItem>(e =>
        {
            e.HasIndex(x => new { x.CartId, x.ProductId }).IsUnique();
            e.HasOne(x => x.Cart).WithMany(x => x.Items).HasForeignKey(x => x.CartId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(x => !x.Product.IsDeleted);
        });

        b.Entity<Coupon>(e =>
        {
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.Value).HasPrecision(18, 2);
            e.Property(x => x.MaxDiscountAmount).HasPrecision(18, 2);
            e.Property(x => x.MinOrderAmount).HasPrecision(18, 2);
            e.Property(x => x.Type).HasConversion<int>();
            e.HasIndex(x => x.Code).IsUnique();
        });

        b.Entity<ShippingMethod>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.Cost).HasPrecision(18, 2);
            e.Property(x => x.FreeAboveAmount).HasPrecision(18, 2);
        });

        b.Entity<Order>(e =>
        {
            e.Property(x => x.OrderNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasConversion<int>();
            e.Property(x => x.Subtotal).HasPrecision(18, 2);
            e.Property(x => x.DiscountTotal).HasPrecision(18, 2);
            e.Property(x => x.ShippingCost).HasPrecision(18, 2);
            e.Property(x => x.TaxTotal).HasPrecision(18, 2);
            e.Property(x => x.GrandTotal).HasPrecision(18, 2);
            e.Property(x => x.CouponCode).HasMaxLength(50);
            e.Property(x => x.ShippingMethodName).HasMaxLength(150);
            e.Property(x => x.ReceiverName).HasMaxLength(150);
            e.Property(x => x.ReceiverPhone).HasMaxLength(20);
            e.Property(x => x.Province).HasMaxLength(100);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.PostalCode).HasMaxLength(20);
            e.Property(x => x.AddressLine).HasMaxLength(500);
            e.Property(x => x.Note).HasMaxLength(1000);
            e.Property(x => x.TrackingCode).HasMaxLength(100);
            e.HasIndex(x => x.OrderNumber).IsUnique();
            e.HasIndex(x => new { x.UserId, x.CreatedAt });
            e.HasIndex(x => new { x.Status, x.CreatedAt });
            e.HasOne(x => x.User).WithMany(x => x.Orders).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<OrderItem>(e =>
        {
            e.Property(x => x.ProductName).HasMaxLength(300).IsRequired();
            e.Property(x => x.Sku).HasMaxLength(100);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.UnitPrice).HasPrecision(18, 2);
            e.Property(x => x.LineTotal).HasPrecision(18, 2);
            e.HasOne(x => x.Order).WithMany(x => x.Items).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<OrderStatusHistory>(e =>
        {
            e.ToTable("OrderStatusHistory");
            e.Property(x => x.Status).HasConversion<int>();
            e.Property(x => x.Note).HasMaxLength(500);
            e.Property(x => x.ChangedBy).HasMaxLength(256);
            e.HasOne(x => x.Order).WithMany(x => x.StatusHistory).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Payment>(e =>
        {
            e.Property(x => x.Gateway).HasMaxLength(50).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.Status).HasConversion<int>();
            e.Property(x => x.Authority).HasMaxLength(100);
            e.Property(x => x.RefId).HasMaxLength(100);
            e.Property(x => x.CardPan).HasMaxLength(30);
            e.Property(x => x.FailureReason).HasMaxLength(500);
            e.Property(x => x.RowVersion).IsRowVersion();
            e.HasIndex(x => x.Authority);
            e.HasOne(x => x.Order).WithMany(x => x.Payments).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<SiteSetting>(e =>
        {
            e.Property(x => x.Key).HasMaxLength(100).IsRequired();
            e.Property(x => x.Value).HasMaxLength(2000).IsRequired();
            e.Property(x => x.Description).HasMaxLength(300);
            e.HasIndex(x => x.Key).IsUnique();
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            else if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
