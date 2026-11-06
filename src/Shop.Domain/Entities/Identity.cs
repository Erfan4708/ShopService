using Shop.Domain.Common;
using Shop.Domain.Enums;

namespace Shop.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = "";
    public string? PhoneNumber { get; set; }
    public string PasswordHash { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsActive { get; set; } = true;
    public int FailedLoginCount { get; set; }
    public DateTime? LockoutEnd { get; set; }
    public ICollection<Address> Addresses { get; set; } = new List<Address>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();

    public string FullName => $"{FirstName} {LastName}".Trim();
}

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string TokenHash { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public bool IsActive => RevokedAt == null && ExpiresAt > DateTime.UtcNow;
}

public class Address : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Title { get; set; } = "";
    public string ReceiverName { get; set; } = "";
    public string ReceiverPhone { get; set; } = "";
    public string Province { get; set; } = "";
    public string City { get; set; } = "";
    public string PostalCode { get; set; } = "";
    public string AddressLine { get; set; } = "";
    public bool IsDefault { get; set; }
}
