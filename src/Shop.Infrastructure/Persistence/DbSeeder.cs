using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Options;
using Shop.Application.Services;
using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.Infrastructure.Persistence;

public class DbSeeder
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly SeedOptions _opt;
    private readonly ILogger<DbSeeder> _log;

    public DbSeeder(AppDbContext db, IPasswordHasher hasher, IOptions<SeedOptions> opt, ILogger<DbSeeder> log)
    {
        _db = db; _hasher = hasher; _opt = opt.Value; _log = log;
    }

    public async Task InitializeAsync(CancellationToken ct = default)
    {
        if (string.Equals(
                _opt.AdminPassword,
                "Admin@12345",
                StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Seed admin password must be changed before deployment.");
        }
        for (var attempt = 1; ; attempt++)
        {
            try
            {
                if (_db.Database.GetMigrations().Any()) await _db.Database.MigrateAsync(ct);
                else await _db.Database.EnsureCreatedAsync(ct);
                break;
            }
            catch (Exception ex) when (attempt < 15 && !ct.IsCancellationRequested)
            {
                _log.LogWarning("Database not ready (attempt {Attempt}/15): {Message}", attempt, ex.Message);
                await Task.Delay(TimeSpan.FromSeconds(4), ct);
            }
        }
        await SeedAsync(ct);
    }

    private async Task SeedAsync(CancellationToken ct)
    {
        var existing = (await _db.SiteSettings.Select(s => s.Key).ToListAsync(ct)).ToHashSet();
        foreach (var d in SettingKeys.Defaults.Where(d => !existing.Contains(d.Key)))
            _db.SiteSettings.Add(new SiteSetting { Key = d.Key, Value = d.Value.Value, Description = d.Value.Description });

        var adminEmail = _opt.AdminEmail.Trim().ToLowerInvariant();
        if (!await _db.Users.AnyAsync(u => u.Role == UserRole.Admin, ct))
        {
            _db.Users.Add(new User
            {
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "System",
                Role = UserRole.Admin,
                PasswordHash = _hasher.Hash(_opt.AdminPassword)
            });
            _log.LogWarning("Default admin created: {Email}. Change the password immediately!", adminEmail);
        }

        if (!await _db.ShippingMethods.AnyAsync(ct))
        {
            _db.ShippingMethods.AddRange(
                new ShippingMethod { Name = "Express Mail", Description = "Delivery via postal service", Cost = 50000, FreeAboveAmount = 2000000, EstimatedDays = 4, SortOrder = 1 },
                new ShippingMethod { Name = "Motorcycle Courier", Description = "Fast intra-city delivery", Cost = 80000, EstimatedDays = 1, SortOrder = 2 });
        }

        if (_opt.SampleData && !await _db.Products.IgnoreQueryFilters().AnyAsync(ct) && !await _db.Categories.AnyAsync(ct))
        {
            var cat1 = new Category { Name = "Sample Category 1", Slug = SlugHelper.Slugify("Sample Category 1"), SortOrder = 1 };
            var cat2 = new Category { Name = "Sample Category 2", Slug = SlugHelper.Slugify("Sample Category 2"), SortOrder = 2 };
            var sub = new Category { Name = "Sample Subcategory", Slug = SlugHelper.Slugify("Sample Subcategory"), Parent = cat1, SortOrder = 1 };
            _db.Categories.AddRange(cat1, cat2, sub);

            Product P(string name, string sku, decimal price, decimal? old, int stock, Category c, bool featured, params (string, string)[] attrs)
            {
                var p = new Product
                {
                    Name = name,
                    Slug = SlugHelper.Slugify(name),
                    Sku = sku,
                    Price = price,
                    CompareAtPrice = old,
                    StockQuantity = stock,
                    Category = c,
                    IsFeatured = featured,
                    ShortDescription = "Sample short description for " + name,
                    Description = "This is a sample product. You can edit or delete it from the admin panel."
                };
                var order = 0;
                foreach (var (k, v) in attrs) p.Attributes.Add(new ProductAttribute { Name = k, Value = v, SortOrder = order++ });
                return p;
            }

            _db.Products.AddRange(
                P("Sample Product One", "SKU-001", 450000, 520000, 25, cat1, true, ("Color", "Black"), ("Warranty", "12 months")),
                P("Sample Product Two", "SKU-002", 1250000, null, 10, sub, true, ("Weight", "1.2 kg")),
                P("Sample Product Three", "SKU-003", 89000, 99000, 100, cat2, false),
                P("Sample Out-of-Stock Product", "SKU-004", 300000, null, 0, cat2, false));

            _db.Coupons.Add(new Coupon { Code = "WELCOME10", Description = "10% Welcome Discount", Type = DiscountType.Percent, Value = 10, MaxDiscountAmount = 200000 });
        }

        await _db.SaveChangesAsync(ct);
    }
}