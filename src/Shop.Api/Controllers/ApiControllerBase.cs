using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Dtos;

namespace Shop.Api.Controllers;

[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    protected Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                                        ?? throw new UnauthorizedAccessException());

    protected string? UserEmail => User.FindFirstValue(ClaimTypes.Email);

    protected CartOwner CurrentCartOwner =>
        User.Identity?.IsAuthenticated == true
            ? new CartOwner(UserId, null)
            : new CartOwner(null, Request.Headers["X-Cart-Token"].FirstOrDefault());

    protected IActionResult Created<T>(T value) => StatusCode(StatusCodes.Status201Created, value);
}
