using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Application.Services;

namespace Shop.Api.Controllers.Admin;

[Route("api/v1/admin/orders")]
[Authorize(Policy = "Staff")]
public class AdminOrdersController : ApiControllerBase
{
    private readonly IAdminOrderService _orders;
    public AdminOrdersController(IAdminOrderService orders) => _orders = orders;

    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderSummaryDto>>> List([FromQuery] AdminOrderQuery query, CancellationToken ct) =>
        Ok(await _orders.GetOrdersAsync(query, ct));

    [HttpGet("{orderNumber}")]
    public async Task<ActionResult<OrderDetailDto>> Get(string orderNumber, CancellationToken ct) =>
        Ok(await _orders.GetOrderAsync(orderNumber, ct));

    [HttpPut("{orderNumber}/status")]
    public async Task<ActionResult<OrderDetailDto>> UpdateStatus(string orderNumber, UpdateOrderStatusRequest request, CancellationToken ct) =>
        Ok(await _orders.UpdateStatusAsync(orderNumber, request, UserEmail, ct));
}

[Route("api/v1/admin/coupons")]
[Authorize(Policy = "Staff")]
public class AdminCouponsController : ApiControllerBase
{
    private readonly ICouponService _coupons;
    public AdminCouponsController(ICouponService coupons) => _coupons = coupons;

    [HttpGet]
    public async Task<ActionResult<List<CouponDto>>> List(CancellationToken ct) => Ok(await _coupons.GetAllAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Create(UpsertCouponRequest request, CancellationToken ct) => Created(await _coupons.CreateAsync(request, ct));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CouponDto>> Update(Guid id, UpsertCouponRequest request, CancellationToken ct) =>
        Ok(await _coupons.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _coupons.DeleteAsync(id, ct);
        return NoContent();
    }
}

[Route("api/v1/admin/shipping-methods")]
[Authorize(Policy = "Staff")]
public class AdminShippingController : ApiControllerBase
{
    private readonly IShippingService _shipping;
    public AdminShippingController(IShippingService shipping) => _shipping = shipping;

    [HttpGet]
    public async Task<ActionResult<List<AdminShippingMethodDto>>> List(CancellationToken ct) => Ok(await _shipping.GetAllAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Create(UpsertShippingMethodRequest request, CancellationToken ct) => Created(await _shipping.CreateAsync(request, ct));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminShippingMethodDto>> Update(Guid id, UpsertShippingMethodRequest request, CancellationToken ct) =>
        Ok(await _shipping.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _shipping.DeleteAsync(id, ct);
        return NoContent();
    }
}

[Route("api/v1/admin/dashboard")]
[Authorize(Policy = "Staff")]
public class AdminDashboardController : ApiControllerBase
{
    private readonly IDashboardService _dashboard;
    public AdminDashboardController(IDashboardService dashboard) => _dashboard = dashboard;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get(CancellationToken ct) => Ok(await _dashboard.GetAsync(ct));
}

[Route("api/v1/admin/users")]
[Authorize(Policy = "AdminOnly")]
public class AdminUsersController : ApiControllerBase
{
    private readonly IAdminUserService _users;
    public AdminUsersController(IAdminUserService users) => _users = users;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> List([FromQuery] AdminUserQuery query, CancellationToken ct) =>
        Ok(await _users.GetUsersAsync(query, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminUserDto>> Get(Guid id, CancellationToken ct) => Ok(await _users.GetUserAsync(id, ct));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminUserDto>> Update(Guid id, UpdateUserRequest request, CancellationToken ct) =>
        Ok(await _users.UpdateUserAsync(id, UserId, request, ct));
}

[Route("api/v1/admin/settings")]
[Authorize(Policy = "AdminOnly")]
public class AdminSettingsController : ApiControllerBase
{
    private readonly ISettingsService _settings;
    public AdminSettingsController(ISettingsService settings) => _settings = settings;

    [HttpGet]
    public async Task<ActionResult<List<SettingDto>>> GetAll(CancellationToken ct) => Ok(await _settings.GetAllAsync(ct));

    [HttpPut]
    public async Task<ActionResult<List<SettingDto>>> Update(UpdateSettingsRequest request, CancellationToken ct)
    {
        await _settings.UpdateAsync(request.Settings, ct);
        return Ok(await _settings.GetAllAsync(ct));
    }
}
