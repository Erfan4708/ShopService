using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Shop.Application.Dtos;
using Shop.Application.Services;

namespace Shop.Api.Controllers;

[Route("api/v1/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAccountService _account;
    public AuthController(IAccountService account) => _account = account;

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct) =>
        Created(await _account.RegisterAsync(request, ct));

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct) =>
        Ok(await _account.LoginAsync(request, ct));

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Refresh(RefreshRequest request, CancellationToken ct) =>
        Ok(await _account.RefreshAsync(request.RefreshToken, ct));

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(RefreshRequest request, CancellationToken ct)
    {
        await _account.LogoutAsync(request.RefreshToken, ct);
        return NoContent();
    }
}

[Route("api/v1/account")]
[Authorize]
public class AccountController : ApiControllerBase
{
    private readonly IAccountService _account;
    public AccountController(IAccountService account) => _account = account;

    [HttpGet("profile")]
    public async Task<ActionResult<UserDto>> GetProfile(CancellationToken ct) => Ok(await _account.GetProfileAsync(UserId, ct));

    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile(UpdateProfileRequest request, CancellationToken ct) =>
        Ok(await _account.UpdateProfileAsync(UserId, request, ct));

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        await _account.ChangePasswordAsync(UserId, request, ct);
        return NoContent();
    }

    [HttpGet("addresses")]
    public async Task<ActionResult<List<AddressDto>>> GetAddresses(CancellationToken ct) => Ok(await _account.GetAddressesAsync(UserId, ct));

    [HttpPost("addresses")]
    public async Task<IActionResult> CreateAddress(UpsertAddressRequest request, CancellationToken ct) =>
        Created(await _account.CreateAddressAsync(UserId, request, ct));

    [HttpPut("addresses/{id:guid}")]
    public async Task<ActionResult<AddressDto>> UpdateAddress(Guid id, UpsertAddressRequest request, CancellationToken ct) =>
        Ok(await _account.UpdateAddressAsync(UserId, id, request, ct));

    [HttpDelete("addresses/{id:guid}")]
    public async Task<IActionResult> DeleteAddress(Guid id, CancellationToken ct)
    {
        await _account.DeleteAddressAsync(UserId, id, ct);
        return NoContent();
    }
}
