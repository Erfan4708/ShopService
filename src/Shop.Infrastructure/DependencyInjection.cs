using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shop.Application.Abstractions;
using Shop.Application.Options;
using Shop.Infrastructure.Notifications;
using Shop.Infrastructure.Payments;
using Shop.Infrastructure.Persistence;
using Shop.Infrastructure.Security;
using Shop.Infrastructure.Storage;

namespace Shop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var cs = config.GetConnectionString("Default")
                 ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

        services.AddDbContext<AppDbContext>(o => o.UseNpgsql(cs, npgsql =>
        {
            npgsql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
            npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
        }));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<DbSeeder>();

        services.Configure<JwtOptions>(config.GetSection(JwtOptions.Section));
        services.Configure<PaymentOptions>(config.GetSection(PaymentOptions.Section));
        services.Configure<StorageOptions>(config.GetSection(StorageOptions.Section));
        services.Configure<SeedOptions>(config.GetSection(SeedOptions.Section));

        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<ITokenService, TokenService>();
        services.AddSingleton<IFileStorage, LocalFileStorage>();
        services.AddSingleton<INotificationSender, LoggingNotificationSender>();

        services.AddHttpClient<ZarinPalGateway>();
        services.AddTransient<IPaymentGateway>(sp => sp.GetRequiredService<ZarinPalGateway>());
        services.AddTransient<IPaymentGateway, FakeGateway>();
        services.AddScoped<IPaymentGatewayFactory, PaymentGatewayFactory>();

        return services;
    }
}
