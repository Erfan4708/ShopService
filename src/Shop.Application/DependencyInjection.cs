using Microsoft.Extensions.DependencyInjection;
using Shop.Application.Services;

namespace Shop.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<ICouponService, CouponService>();
        services.AddScoped<IShippingService, ShippingService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IAdminCatalogService, AdminCatalogService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<ICheckoutService, CheckoutService>();
        services.AddScoped<IOrderLifecycle, OrderLifecycle>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IAdminOrderService, AdminOrderService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IDashboardService, DashboardService>();
        return services;
    }
}
