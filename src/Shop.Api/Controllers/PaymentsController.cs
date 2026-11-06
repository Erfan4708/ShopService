using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Shop.Application.Dtos;
using Shop.Application.Options;
using Shop.Application.Services;

namespace Shop.Api.Controllers;

[Route("api/v1/payments")]
public class PaymentsController : ApiControllerBase
{
    private readonly IPaymentService _payments;
    private readonly PaymentOptions _opt;

    public PaymentsController(IPaymentService payments, IOptions<PaymentOptions> opt)
    {
        _payments = payments; _opt = opt.Value;
    }

    [HttpGet("gateways")]
    public ActionResult<object> Gateways() => Ok(new { gateways = _payments.GetAvailableGateways(), defaultGateway = _opt.DefaultGateway });

    [HttpPost("start")]
    [Authorize]
    public async Task<ActionResult<StartPaymentResponse>> Start(StartPaymentRequest request, CancellationToken ct) =>
        Ok(await _payments.StartAsync(UserId, request, ct));

    /// <summary>
    /// </summary>
    [HttpGet("callback/{paymentId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback(Guid paymentId, [FromQuery] string? authority, [FromQuery] string? status,
        [FromQuery] string? format, CancellationToken ct)
    {
        authority ??= Request.Query["Authority"].FirstOrDefault();
        status ??= Request.Query["Status"].FirstOrDefault();

        var result = await _payments.HandleCallbackAsync(paymentId, authority, status, ct);
        if (string.Equals(format, "json", StringComparison.OrdinalIgnoreCase)) return Ok(result);

        var url = QueryHelpers.AddQueryString(_opt.FrontendResultUrl, new Dictionary<string, string?>
        {
            ["success"] = result.Success ? "true" : "false",
            ["orderNumber"] = result.OrderNumber,
            ["refId"] = result.RefId,
            ["message"] = result.Message
        });
        return Redirect(url);
    }
}

[Route("api/v1/payments/fake")]
[ApiExplorerSettings(IgnoreApi = true)]
public class FakeGatewayController : ApiControllerBase
{
    private readonly PaymentOptions _opt;
    public FakeGatewayController(IOptions<PaymentOptions> opt) => _opt = opt.Value;

    [HttpGet("{authority}")]
    public IActionResult Page(string authority, [FromQuery] string callback, [FromQuery] decimal amount)
    {
        if (!_opt.EnableFakeGateway) return NotFound();
        if (!callback.StartsWith(_opt.CallbackBaseUrl.TrimEnd('/') + "/api/v1/payments/callback/", StringComparison.Ordinal))
            return BadRequest("callback ظ†ط§ظ…ط¹طھط¨ط± ط§ط³طھ.");

        string Link(string status) => WebUtility.HtmlEncode($"{callback}?Authority={Uri.EscapeDataString(authority)}&Status={status}");
        var html = $@"<!doctype html><html lang=""fa"" dir=""rtl""><head><meta charset=""utf-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1"">
<title>ط¯ط±ع¯ط§ظ‡ ط´ط¨غŒظ‡â€Œط³ط§ط²</title><style>body{{font-family:tahoma,sans-serif;max-width:420px;margin:60px auto;text-align:center}}
a{{display:block;margin:12px;padding:14px;border-radius:8px;color:#fff;text-decoration:none}}.ok{{background:#16a34a}}.no{{background:#dc2626}}</style></head>
<body><h2>ط¯ط±ع¯ط§ظ‡ ظ¾ط±ط¯ط§ط®طھ ط´ط¨غŒظ‡â€Œط³ط§ط²</h2><p>ظ…ط¨ظ„ط؛: {amount:N0}</p><p style=""color:#888"">ظپظ‚ط· ط¨ط±ط§غŒ طھط³طھط› ظ¾ط±ط¯ط§ط®طھ ظˆط§ظ‚ط¹غŒ ط§ظ†ط¬ط§ظ… ظ†ظ…غŒâ€Œط´ظˆط¯.</p>
<a class=""ok"" href=""{Link("OK")}"">ظ¾ط±ط¯ط§ط®طھ ظ…ظˆظپظ‚</a><a class=""no"" href=""{Link("NOK")}"">ط§ظ†طµط±ط§ظپ / ظ¾ط±ط¯ط§ط®طھ ظ†ط§ظ…ظˆظپظ‚</a></body></html>";
        return Content(html, "text/html; charset=utf-8");
    }
}
