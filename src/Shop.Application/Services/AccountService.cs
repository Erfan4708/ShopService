using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Application.Options;
using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.Application.Services;

public interface IAccountService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest r, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest r, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
    Task<UserDto> GetProfileAsync(Guid userId, CancellationToken ct = default);
    Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest r, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest r, CancellationToken ct = default);
    Task<List<AddressDto>> GetAddressesAsync(Guid userId, CancellationToken ct = default);
    Task<AddressDto> CreateAddressAsync(Guid userId, UpsertAddressRequest r, CancellationToken ct = default);
    Task<AddressDto> UpdateAddressAsync(Guid userId, Guid id, UpsertAddressRequest r, CancellationToken ct = default);
    Task DeleteAddressAsync(Guid userId, Guid id, CancellationToken ct = default);
}

public class AccountService : IAccountService
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenService _tokens;
    private readonly INotificationSender _notifier;
    private readonly JwtOptions _jwt;

    public AccountService(IAppDbContext db, IPasswordHasher hasher, ITokenService tokens,
        INotificationSender notifier, IOptions<JwtOptions> jwt)
    {
        _db = db; _hasher = hasher; _tokens = tokens; _notifier = notifier; _jwt = jwt.Value;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest r, CancellationToken ct = default)
    {
        var email = r.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            throw new ConflictException("This email is already registered.");

        var phone = PhoneHelper.Normalize(r.PhoneNumber);
        if (phone != null && await _db.Users.AnyAsync(u => u.PhoneNumber == phone, ct))
            throw new ConflictException("This phone number is already registered.");

        var user = new User
        {
            Email = email,
            PhoneNumber = phone,
            FirstName = r.FirstName.Trim(),
            LastName = r.LastName.Trim(),
            PasswordHash = _hasher.Hash(r.Password),
            Role = UserRole.Customer
        };
        _db.Users.Add(user);
        var response = await IssueTokensAsync(user, ct);

        await _notifier.SendAsync(new NotificationMessage(
            "user.registered",
            user.Email,
            user.PhoneNumber,
            "Welcome!",
            $"{user.FullName}, your registration was completed successfully."
        ), ct);

        return response;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest r, CancellationToken ct = default)
    {
        var id = r.Identifier.Trim();
        User? user;
        if (id.Contains('@'))
        {
            var email = id.ToLowerInvariant();
            user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        }
        else
        {
            var phone = PhoneHelper.Normalize(id);
            user = phone == null ? null : await _db.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phone, ct);
        }

        const string invalid = "Invalid email, phone number, or password.";
        if (user == null) throw new UnauthorizedAppException(invalid);

        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
            throw new UnauthorizedAppException("Your account is temporarily locked due to multiple failed login attempts. Please try again later.");

        if (!_hasher.Verify(user.PasswordHash, r.Password))
        {
            user.FailedLoginCount++;
            if (user.FailedLoginCount >= MaxFailedAttempts)
            {
                user.LockoutEnd = DateTime.UtcNow.Add(LockoutDuration);
                user.FailedLoginCount = 0;
            }
            await _db.SaveChangesAsync(ct);
            throw new UnauthorizedAppException(invalid);
        }

        if (!user.IsActive)
            throw new ForbiddenException("Your account has been deactivated.");

        user.FailedLoginCount = 0;
        user.LockoutEnd = null;
        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = _tokens.HashToken(refreshToken);
        var rt = await _db.RefreshTokens.Include(t => t.User).FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (rt == null)
            throw new UnauthorizedAppException("Invalid refresh token.");
        if (rt.RevokedAt != null)
        {
            var all = await _db.RefreshTokens.Where(t => t.UserId == rt.UserId && t.RevokedAt == null).ToListAsync(ct);
            foreach (var t in all) t.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            throw new UnauthorizedAppException("Invalid refresh token.");
        }
        if (rt.ExpiresAt <= DateTime.UtcNow)
            throw new UnauthorizedAppException("Your session has expired. Please log in again.");
        if (!rt.User.IsActive)
            throw new ForbiddenException("Your account has been deactivated.");
        rt.RevokedAt = DateTime.UtcNow;
        return await IssueTokensAsync(rt.User, ct);
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var hash = _tokens.HashToken(refreshToken);
        var rt = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (rt != null && rt.RevokedAt == null)
        {
            rt.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<UserDto> GetProfileAsync(Guid userId, CancellationToken ct = default) =>
        (await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw new NotFoundException()).ToDto();

    public async Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest r, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw new NotFoundException();
        var phone = PhoneHelper.Normalize(r.PhoneNumber);
        if (phone != null && await _db.Users.AnyAsync(u => u.PhoneNumber == phone && u.Id != userId, ct))
            throw new ConflictException("This phone number is already registered.");
        user.FirstName = r.FirstName.Trim();
        user.LastName = r.LastName.Trim();
        user.PhoneNumber = phone;
        await _db.SaveChangesAsync(ct);
        return user.ToDto();
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest r, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw new NotFoundException();
        if (!_hasher.Verify(user.PasswordHash, r.CurrentPassword))
            throw new BusinessRuleException("The current password is incorrect.");
        user.PasswordHash = _hasher.Hash(r.NewPassword);
        var tokens = await _db.RefreshTokens.Where(t => t.UserId == userId && t.RevokedAt == null).ToListAsync(ct);
        foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    // ----- Addresses -----
    public async Task<List<AddressDto>> GetAddressesAsync(Guid userId, CancellationToken ct = default) =>
        (await _db.Addresses.AsNoTracking().Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.CreatedAt).ToListAsync(ct))
        .Select(a => a.ToDto()).ToList();

    public async Task<AddressDto> CreateAddressAsync(Guid userId, UpsertAddressRequest r, CancellationToken ct = default)
    {
        var hasAny = await _db.Addresses.AnyAsync(a => a.UserId == userId, ct);
        var address = new Address { UserId = userId };
        Apply(address, r);
        if (!hasAny) address.IsDefault = true;
        if (address.IsDefault) await ClearDefaultAsync(userId, null, ct);
        _db.Addresses.Add(address);
        await _db.SaveChangesAsync(ct);
        return address.ToDto();
    }

    public async Task<AddressDto> UpdateAddressAsync(Guid userId, Guid id, UpsertAddressRequest r, CancellationToken ct = default)
    {
        var address = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct) ?? throw new NotFoundException();
        Apply(address, r);
        if (address.IsDefault) await ClearDefaultAsync(userId, id, ct);
        await _db.SaveChangesAsync(ct);
        return address.ToDto();
    }

    public async Task DeleteAddressAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var address = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct) ?? throw new NotFoundException();
        _db.Addresses.Remove(address);
        await _db.SaveChangesAsync(ct);
        if (address.IsDefault)
        {
            var next = await _db.Addresses.Where(a => a.UserId == userId).OrderByDescending(a => a.CreatedAt).FirstOrDefaultAsync(ct);
            if (next != null) { next.IsDefault = true; await _db.SaveChangesAsync(ct); }
        }
    }

    private async Task ClearDefaultAsync(Guid userId, Guid? exceptId, CancellationToken ct)
    {
        var others = await _db.Addresses.Where(a => a.UserId == userId && a.IsDefault && a.Id != exceptId).ToListAsync(ct);
        foreach (var o in others) o.IsDefault = false;
    }

    private static void Apply(Address a, UpsertAddressRequest r)
    {
        a.Title = r.Title.Trim(); a.ReceiverName = r.ReceiverName.Trim();
        a.ReceiverPhone = PhoneHelper.Normalize(r.ReceiverPhone) ?? r.ReceiverPhone.Trim();
        a.Province = r.Province.Trim(); a.City = r.City.Trim(); a.PostalCode = r.PostalCode.Trim();
        a.AddressLine = r.AddressLine.Trim(); a.IsDefault = r.IsDefault;
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken ct)
    {
        var access = _tokens.CreateAccessToken(user);
        var raw = _tokens.GenerateRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _tokens.HashToken(raw),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays)
        });
        await _db.SaveChangesAsync(ct);
        return new AuthResponse(access.Token, access.ExpiresAt, raw, user.ToDto());
    }
}
