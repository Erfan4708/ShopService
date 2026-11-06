using Microsoft.EntityFrameworkCore;
using Shop.Domain.Entities;

namespace Shop.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<ProductAttribute> ProductAttributes { get; }
    DbSet<Review> Reviews { get; }
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Address> Addresses { get; }
    DbSet<Cart> Carts { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<ShippingMethod> ShippingMethods { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<Payment> Payments { get; }
    DbSet<SiteSetting> SiteSettings { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string hash, string password);
}

public record TokenResult(string Token, DateTime ExpiresAt);

public interface ITokenService
{
    TokenResult CreateAccessToken(User user);
    string GenerateRefreshToken();
    string HashToken(string token);
}

public interface IFileStorage
{
    Task<string> SaveAsync(Stream content, string extension, string folder, CancellationToken ct = default);
    Task DeleteAsync(string url, CancellationToken ct = default);
}

public record NotificationMessage(string Event, string? Email, string? Phone, string Subject, string Body);

public interface INotificationSender
{
    Task SendAsync(NotificationMessage message, CancellationToken ct = default);
}

public record GatewayRequest(decimal Amount, string Currency, string Description, string CallbackUrl,
    string OrderNumber, string? Email, string? Mobile);

public record GatewayRequestResult(bool Success, string? Authority, string? PaymentUrl, string? Error);

public record GatewayVerifyRequest(string Authority, decimal Amount, string? CallbackStatus);

public record GatewayVerifyResult(bool Success, string? RefId, string? CardPan, string? Error);

public interface IPaymentGateway
{
    string Name { get; }
    bool IsEnabled { get; }
    Task<GatewayRequestResult> RequestAsync(GatewayRequest request, CancellationToken ct = default);
    Task<GatewayVerifyResult> VerifyAsync(GatewayVerifyRequest request, CancellationToken ct = default);
}

public interface IPaymentGatewayFactory
{
    IReadOnlyList<string> AvailableGateways { get; }
    IPaymentGateway Get(string name);
}
