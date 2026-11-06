using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Options;

namespace Shop.Infrastructure.Payments;

/// <summary>
/// </summary>
public class ZarinPalGateway : IPaymentGateway
{
    private readonly HttpClient _http;
    private readonly PaymentOptions _opt;
    private readonly ILogger<ZarinPalGateway> _log;

    public ZarinPalGateway(HttpClient http, IOptions<PaymentOptions> opt, ILogger<ZarinPalGateway> log)
    {
        _http = http; _opt = opt.Value; _log = log;
        _http.Timeout = TimeSpan.FromSeconds(30);
    }

    public string Name => "ZarinPal";
    public bool IsEnabled => _opt.ZarinPal.Enabled && !string.IsNullOrWhiteSpace(_opt.ZarinPal.MerchantId);

    private string BaseUrl =>
        (_opt.ZarinPal.BaseUrl ?? (_opt.ZarinPal.Sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com")).TrimEnd('/');

    public async Task<GatewayRequestResult> RequestAsync(GatewayRequest request, CancellationToken ct = default)
    {
        var body = new
        {
            merchant_id = _opt.ZarinPal.MerchantId,
            amount = (long)Math.Round(request.Amount, 0),
            currency = request.Currency == "IRR" ? "IRR" : "IRT",
            description = request.Description,
            callback_url = request.CallbackUrl,
            metadata = new { mobile = request.Mobile, email = request.Email, order_id = request.OrderNumber }
        };
        try
        {
            using var resp = await _http.PostAsJsonAsync($"{BaseUrl}/pg/v4/payment/request.json", body, ct);
            var json = await resp.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object
                && data.TryGetProperty("code", out var code) && code.GetInt32() == 100
                && data.TryGetProperty("authority", out var auth))
            {
                var authority = auth.GetString()!;
                return new GatewayRequestResult(true, authority, $"{BaseUrl}/pg/StartPay/{authority}", null);
            }
            _log.LogWarning("ZarinPal request failed: {Response}", json);
            return new GatewayRequestResult(false, null, null, ExtractError(doc.RootElement));
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException or InvalidOperationException)
        {
            _log.LogError(ex, "ZarinPal request exception");
            return new GatewayRequestResult(false, null, null, "ط®ط·ط§غŒ ط§ط±طھط¨ط§ط· ط¨ط§ ط¯ط±ع¯ط§ظ‡");
        }
    }

    public async Task<GatewayVerifyResult> VerifyAsync(GatewayVerifyRequest request, CancellationToken ct = default)
    {
        var body = new
        {
            merchant_id = _opt.ZarinPal.MerchantId,
            amount = (long)Math.Round(request.Amount, 0),
            authority = request.Authority
        };
        using var resp = await _http.PostAsJsonAsync($"{BaseUrl}/pg/v4/payment/verify.json", body, ct);
        var json = await resp.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (doc.RootElement.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object
            && data.TryGetProperty("code", out var code))
        {
            var c = code.GetInt32();
            if (c == 100 || c == 101)
            {
                var refId = data.TryGetProperty("ref_id", out var r) ? r.ToString() : null;
                var pan = data.TryGetProperty("card_pan", out var p) ? p.GetString() : null;
                return new GatewayVerifyResult(true, refId, pan, null);
            }
        }
        _log.LogWarning("ZarinPal verify failed: {Response}", json);
        return new GatewayVerifyResult(false, null, null, ExtractError(doc.RootElement));
    }

    private static string ExtractError(JsonElement root)
    {
        if (root.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Object &&
            errors.TryGetProperty("message", out var m) && m.ValueKind == JsonValueKind.String)
            return m.GetString() ?? "Payment gateway error.";
        return "The transaction was not approved by the payment gateway.";
    }
}

public class FakeGateway : IPaymentGateway
{
    private readonly PaymentOptions _opt;
    public FakeGateway(IOptions<PaymentOptions> opt) => _opt = opt.Value;

    public string Name => "Fake";
    public bool IsEnabled => _opt.EnableFakeGateway;

    public Task<GatewayRequestResult> RequestAsync(GatewayRequest request, CancellationToken ct = default)
    {
        var authority = "FAKE" + Guid.NewGuid().ToString("N");
        var url = $"{_opt.CallbackBaseUrl.TrimEnd('/')}/api/v1/payments/fake/{authority}?callback={Uri.EscapeDataString(request.CallbackUrl)}&amount={request.Amount:0}";
        return Task.FromResult(new GatewayRequestResult(true, authority, url, null));
    }

    public Task<GatewayVerifyResult> VerifyAsync(GatewayVerifyRequest request, CancellationToken ct = default)
    {
        var ok = request.Authority.StartsWith("FAKE") && string.Equals(request.CallbackStatus, "OK", StringComparison.OrdinalIgnoreCase);
        return Task.FromResult(ok
            ? new GatewayVerifyResult(true, RandomNumberGenerator.GetInt32(100000000, 999999999).ToString(), "6037-****-****-1234", null)
            : new GatewayVerifyResult(false, null, null, "The simulated payment could not be verified."));
    }
}

public class PaymentGatewayFactory : IPaymentGatewayFactory
{
    private readonly IReadOnlyList<IPaymentGateway> _gateways;

    public PaymentGatewayFactory(IEnumerable<IPaymentGateway> gateways) =>
        _gateways = gateways.Where(g => g.IsEnabled).ToList();

    public IReadOnlyList<string> AvailableGateways => _gateways.Select(g => g.Name).ToList();

    public IPaymentGateway Get(string name) =>
        _gateways.FirstOrDefault(g => string.Equals(g.Name, name, StringComparison.OrdinalIgnoreCase))
        ?? throw new BusinessRuleException($"Payment gateway \"{name}\" is not available.");
}
