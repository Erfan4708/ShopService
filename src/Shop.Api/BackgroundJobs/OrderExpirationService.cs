using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Services;
using Shop.Domain.Enums;

namespace Shop.Api.BackgroundJobs;

public class OrderExpirationService : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<OrderExpirationService> _log;

    public OrderExpirationService(IServiceScopeFactory scopes, ILogger<OrderExpirationService> log)
    {
        _scopes = scopes; _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try { await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); } catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try { await RunOnceAsync(stoppingToken); }
            catch (OperationCanceledException) { break; }
            catch (Exception ex) { _log.LogError(ex, "Order expiration job failed"); }

            try { await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); } catch (OperationCanceledException) { break; }
        }
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var settings = scope.ServiceProvider.GetRequiredService<ISettingsService>();
        var lifecycle = scope.ServiceProvider.GetRequiredService<IOrderLifecycle>();

        var minutes = await settings.GetIntAsync(SettingKeys.PendingOrderExpirationMinutes, ct);
        if (minutes <= 0) return;
        var cutoff = DateTime.UtcNow.AddMinutes(-minutes);

        var expired = await db.Orders.Include(o => o.Items).Include(o => o.StatusHistory)
            .Where(o => o.Status == OrderStatus.PendingPayment && o.CreatedAt < cutoff)
            .OrderBy(o => o.CreatedAt).Take(50).ToListAsync(ct);

        foreach (var order in expired)
        {
            try
            {
                await lifecycle.CancelAsync(order, "ط§ظ†ظ‚ط¶ط§غŒ ظ…ظ‡ظ„طھ ظ¾ط±ط¯ط§ط®طھ", "system", ct);
                _log.LogInformation("Order {OrderNumber} expired and cancelled", order.OrderNumber);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _log.LogWarning(ex, "Could not expire order {OrderNumber}", order.OrderNumber);
            }
        }
    }
}
