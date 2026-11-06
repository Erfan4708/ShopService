using System.ComponentModel.DataAnnotations;
using Shop.Domain.Enums;

namespace Shop.Application.Dtos;

public class RegisterRequest
{
    [Required, EmailAddress, StringLength(256)] public string Email { get; set; } = "";
    [Required, StringLength(100, MinimumLength = 8)] public string Password { get; set; } = "";
    [Required, StringLength(100)] public string FirstName { get; set; } = "";
    [Required, StringLength(100)] public string LastName { get; set; } = "";
    [StringLength(20)] public string? PhoneNumber { get; set; }
}

public class LoginRequest
{
    [Required, StringLength(256)] public string Identifier { get; set; } = "";
    [Required, StringLength(100)] public string Password { get; set; } = "";
}

public class RefreshRequest
{
    [Required] public string RefreshToken { get; set; } = "";
}

public record UserDto(Guid Id, string Email, string? PhoneNumber, string FirstName, string LastName, UserRole Role);

public record AuthResponse(string AccessToken, DateTime AccessTokenExpiresAt, string RefreshToken, UserDto User);

public class UpdateProfileRequest
{
    [Required, StringLength(100)] public string FirstName { get; set; } = "";
    [Required, StringLength(100)] public string LastName { get; set; } = "";
    [StringLength(20)] public string? PhoneNumber { get; set; }
}

public class ChangePasswordRequest
{
    [Required] public string CurrentPassword { get; set; } = "";
    [Required, StringLength(100, MinimumLength = 8)] public string NewPassword { get; set; } = "";
}

public record AddressDto(Guid Id, string Title, string ReceiverName, string ReceiverPhone, string Province,
    string City, string PostalCode, string AddressLine, bool IsDefault);

public class UpsertAddressRequest
{
    [Required, StringLength(100)] public string Title { get; set; } = "";
    [Required, StringLength(150)] public string ReceiverName { get; set; } = "";
    [Required, StringLength(20)] public string ReceiverPhone { get; set; } = "";
    [Required, StringLength(100)] public string Province { get; set; } = "";
    [Required, StringLength(100)] public string City { get; set; } = "";
    [Required, StringLength(20)] public string PostalCode { get; set; } = "";
    [Required, StringLength(500)] public string AddressLine { get; set; } = "";
    public bool IsDefault { get; set; }
}

public record AdminUserDto(Guid Id, string Email, string? PhoneNumber, string FullName, UserRole Role,
    bool IsActive, DateTime CreatedAt, int OrdersCount);

public class UpdateUserRequest
{
    public UserRole? Role { get; set; }
    public bool? IsActive { get; set; }
}

public class AdminUserQuery : PageQueryBase
{
    public string? Search { get; set; }
    public UserRole? Role { get; set; }
}
