using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Application.Options;
using Shop.Domain.Entities;
using Shop.Domain.Enums;

namespace Shop.Application.Services;

public interface IPaymentService
{
    IReadOnlyList<string> GetAvailableGateways();
    Task<StartPaymentResponse> StartAsync(Guid userId, StartPaymentRequest r, CancellationToken ct = default);
    Task<PaymentCallbackResult> HandleCallbackAsync(Guid paymentId, string? authority, string? status, CancellationToken ct = default);
}

public class PaymentService : IPaymentService
{
    private readonly IAppDbContext _db;
    private readonly IPaymentGatewayFactory _factory;
    private readonly ISettingsService _settings;
    private readonly INotificationSender _notifier;
    private readonly PaymentOptions _opt;

    public PaymentService(IAppDbContext db, IPaymentGatewayFactory factory, ISettingsService settings,
        INotificationSender notifier, IOptions<PaymentOptions> opt)
    {
        _db = db; _factory = factory; _settings = settings; _notifier = notifier; _opt = opt.Value;
    }

    public IReadOnlyList<string> GetAvailableGateways() => _factory.AvailableGateways;

    public async Task<StartPaymentResponse> StartAsync(Guid userId, StartPaymentRequest r, CancellationToken ct = default)
    {
        var order = await _db.Orders.Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == r.OrderId && o.UserId == userId, ct)
            ?? throw new NotFoundException("Order was not found.");
        if (order.Status != OrderStatus.PendingPayment)
            throw new BusinessRuleException("This order is not in a payable status.");

        var gatewayName = string.IsNullOrWhiteSpace(r.Gateway) ? _opt.DefaultGateway : r.Gateway!;
        var gateway = _factory.Get(gatewayName);

        var payment = new Payment { OrderId = order.Id, Gateway = gateway.Name, Amount = order.GrandTotal, Status = PaymentStatus.Pending };
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync(ct);

        var callbackUrl = $"{_opt.CallbackBaseUrl.TrimEnd('/')}/api/v1/payments/callback/{payment.Id}";
        var currency = await _settings.GetAsync(SettingKeys.StoreCurrency, ct);
        var result = await gateway.RequestAsync(new GatewayRequest(order.GrandTotal, currency,
            $"Payment for order {order.OrderNumber}", callbackUrl, order.OrderNumber, order.User.Email, order.ReceiverPhone), ct);

        if (!result.Success || string.IsNullOrEmpty(result.PaymentUrl) || string.IsNullOrEmpty(result.Authority))
        {
            payment.Status = PaymentStatus.Failed;
            payment.FailureReason = result.Error ?? "An error occurred while connecting to the payment gateway.";
            await _db.SaveChangesAsync(ct);
            throw new AppException("Failed to create a payment transaction. Please try again.", 502, "gateway_error");
        }

        payment.Authority = result.Authority;
        await _db.SaveChangesAsync(ct);
        return new StartPaymentResponse(payment.Id, gateway.Name, result.PaymentUrl, result.Authority);
    }

    public async Task<PaymentCallbackResult> HandleCallbackAsync(Guid paymentId, string? authority, string? status, CancellationToken ct = default)
    {
        var payment = await _db.Payments
            .Include(p => p.Order).ThenInclude(o => o.Items)
            .Include(p => p.Order).ThenInclude(o => o.StatusHistory)
            .Include(p => p.Order).ThenInclude(o => o.User)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct)
            ?? throw new NotFoundException("Payment transaction was not found.");
        var order = payment.Order;

        if (payment.Status == PaymentStatus.Succeeded)
            return new PaymentCallbackResult(true, order.OrderNumber, payment.RefId, "Payment was already completed successfully.");
        if (payment.Status == PaymentStatus.Failed)
            return new PaymentCallbackResult(false, order.OrderNumber, null, payment.FailureReason ?? "Payment failed.");

        if (string.IsNullOrEmpty(authority) || !string.Equals(authority, payment.Authority, StringComparison.Ordinal))
            return await FailAsync(payment, "Invalid transaction authority.", ct);

        if (!string.Equals(status, "OK", StringComparison.OrdinalIgnoreCase))
            return await FailAsync(payment, "Payment was cancelled by the user or failed.", ct);

        if (order.Status != OrderStatus.PendingPayment)
            return await FailAsync(payment, "This order is no longer eligible for payment because the payment deadline has expired. If you were charged, the gateway will refund the amount.", ct);

        var gateway = _factory.Get(payment.Gateway);
        GatewayVerifyResult verify;
        try
        {
            verify = await gateway.VerifyAsync(new GatewayVerifyRequest(authority, payment.Amount, status), ct);
        }
        catch (Exception) when (!ct.IsCancellationRequested)
        {
            return new PaymentCallbackResult(false, order.OrderNumber, null, "Payment verification is temporarily unavailable. If your account was charged, please check your order status again in a few minutes.");
        }

        if (!verify.Success) return await FailAsync(payment, verify.Error ?? "Payment verification failed.", ct);

        payment.Status = PaymentStatus.Succeeded;
        payment.RefId = verify.RefId;
        payment.CardPan = verify.CardPan;
        payment.PaidAt = DateTime.UtcNow;
        order.PaidAt = payment.PaidAt;
        order.SetStatus(OrderStatus.Paid, $"Payment successful - Bank tracking code: {verify.RefId}", "payment");

        var ids = order.Items.Select(i => i.ProductId).ToList();
        var products = await _db.Products.IgnoreQueryFilters().Where(p => ids.Contains(p.Id)).ToListAsync(ct);
        foreach (var item in order.Items)
        {
            var p = products.FirstOrDefault(x => x.Id == item.ProductId);
            if (p != null) p.SalesCount += item.Quantity;
        }

        try { await _db.SaveChangesAsync(ct); }
        catch (DbUpdateConcurrencyException)
        {
            var fresh = await _db.Payments.AsNoTracking().FirstAsync(p => p.Id == paymentId, ct);
            return new PaymentCallbackResult(fresh.Status == PaymentStatus.Succeeded, order.OrderNumber, fresh.RefId,
                fresh.Status == PaymentStatus.Succeeded ? "Payment was completed successfully." : "Payment failed.");
        }

        await _notifier.SendAsync(new NotificationMessage("order.paid", order.User.Email, order.ReceiverPhone,
            $"Payment for order {order.OrderNumber}",
            $"Payment for order {order.OrderNumber} was completed successfully. Tracking code: {verify.RefId}"), ct);

        return new PaymentCallbackResult(true, order.OrderNumber, verify.RefId, "Payment completed successfully.");
    }

    private async Task<PaymentCallbackResult> FailAsync(Payment payment, string reason, CancellationToken ct)
    {
        payment.Status = PaymentStatus.Failed;
        payment.FailureReason = reason;
        try { await _db.SaveChangesAsync(ct); } catch (DbUpdateConcurrencyException) { /* Concurrent update */ }
        return new PaymentCallbackResult(false, payment.Order.OrderNumber, null, reason);
    }
}
