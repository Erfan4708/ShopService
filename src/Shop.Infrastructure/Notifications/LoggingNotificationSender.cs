using Microsoft.Extensions.Logging;
using Shop.Application.Abstractions;

namespace Shop.Infrastructure.Notifications;

public class LoggingNotificationSender : INotificationSender
{
    private readonly ILogger<LoggingNotificationSender> _log;
    public LoggingNotificationSender(ILogger<LoggingNotificationSender> log) => _log = log;

    public Task SendAsync(NotificationMessage m, CancellationToken ct = default)
    {
        _log.LogInformation("[Notification:{Event}] email={Email} phone={Phone} subject={Subject}", m.Event, m.Email, m.Phone, m.Subject);
        return Task.CompletedTask;
    }
}
