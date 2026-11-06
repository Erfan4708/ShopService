using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Dtos;
using Shop.Application.Services;

namespace Shop.Api.Controllers;

/// <summary>
/// </summary>
[Route("api/v1/cart")]
public class CartController : ApiControllerBase
{
    private readonly ICartService _cart;
    public CartController(ICartService cart) => _cart = cart;

    [HttpGet]
    public async Task<ActionResult<CartDto>> Get(CancellationToken ct) => Ok(await _cart.GetAsync(CurrentCartOwner, ct));

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem(AddCartItemRequest request, CancellationToken ct) =>
        Ok(await _cart.AddItemAsync(CurrentCartOwner, request, ct));

    [HttpPut("items/{productId:guid}")]
    public async Task<ActionResult<CartDto>> SetQuantity(Guid productId, UpdateCartItemRequest request, CancellationToken ct) =>
        Ok(await _cart.SetQuantityAsync(CurrentCartOwner, productId, request.Quantity, ct));

    [HttpDelete("items/{productId:guid}")]
    public async Task<ActionResult<CartDto>> RemoveItem(Guid productId, CancellationToken ct) =>
        Ok(await _cart.RemoveItemAsync(CurrentCartOwner, productId, ct));

    [HttpDelete]
    public async Task<ActionResult<CartDto>> Clear(CancellationToken ct) => Ok(await _cart.ClearAsync(CurrentCartOwner, ct));

    [HttpPost("coupon")]
    public async Task<ActionResult<CartDto>> ApplyCoupon(ApplyCouponRequest request, CancellationToken ct) =>
        Ok(await _cart.ApplyCouponAsync(CurrentCartOwner, request.Code, ct));

    [HttpDelete("coupon")]
    public async Task<ActionResult<CartDto>> RemoveCoupon(CancellationToken ct) => Ok(await _cart.RemoveCouponAsync(CurrentCartOwner, ct));

    [HttpPost("merge")]
    [Authorize]
    public async Task<ActionResult<CartDto>> Merge(CancellationToken ct)
    {
        var token = Request.Headers["X-Cart-Token"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(token)) return Ok(await _cart.GetAsync(new CartOwner(UserId, null), ct));
        return Ok(await _cart.MergeAsync(UserId, token, ct));
    }
}
