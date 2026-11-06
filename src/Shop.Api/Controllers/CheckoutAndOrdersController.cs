using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Application.Services;

namespace Shop.Api.Controllers;

[Route("api/v1/shipping-methods")]
public class ShippingMethodsController : ApiControllerBase
{
    private readonly IShippingService _shipping;
    public ShippingMethodsController(IShippingService shipping) => _shipping = shipping;

    [HttpGet]
    public async Task<ActionResult<List<ShippingMethodDto>>> List(CancellationToken ct) => Ok(await _shipping.GetActiveAsync(ct));
}

[Route("api/v1/checkout")]
[Authorize]
public class CheckoutController : ApiControllerBase
{
    private readonly ICheckoutService _checkout;
    public CheckoutController(ICheckoutService checkout) => _checkout = checkout;

    [HttpPost("preview")]
    public async Task<ActionResult<CheckoutSummaryDto>> Preview(CheckoutPreviewRequest request, CancellationToken ct) =>
        Ok(await _checkout.PreviewAsync(UserId, request.ShippingMethodId, ct));

    [HttpPost]
    [ProducesResponseType(typeof(OrderDetailDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> PlaceOrder(CheckoutRequest request, CancellationToken ct) =>
        Created(await _checkout.PlaceOrderAsync(UserId, request, ct));
}

[Route("api/v1/orders")]
public class OrdersController : ApiControllerBase
{
    private readonly IOrderService _orders;
    public OrdersController(IOrderService orders) => _orders = orders;

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PagedResult<OrderSummaryDto>>> List([FromQuery] PageQueryBase page, CancellationToken ct) =>
        Ok(await _orders.GetMyOrdersAsync(UserId, page, ct));

    [HttpGet("{orderNumber}")]
    [Authorize]
    public async Task<ActionResult<OrderDetailDto>> Get(string orderNumber, CancellationToken ct) =>
        Ok(await _orders.GetMyOrderAsync(UserId, orderNumber, ct));

    [HttpPost("{orderNumber}/cancel")]
    [Authorize]
    public async Task<ActionResult<OrderDetailDto>> Cancel(string orderNumber, CancellationToken ct) =>
        Ok(await _orders.CancelMyOrderAsync(UserId, orderNumber, ct));

    [HttpPost("track")]
    [AllowAnonymous]
    public async Task<ActionResult<TrackOrderDto>> Track(TrackOrderRequest request, CancellationToken ct) =>
        Ok(await _orders.TrackAsync(request, ct));
}
