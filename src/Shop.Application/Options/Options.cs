namespace Shop.Application.Options;

public class JwtOptions
{
    public const string Section = "Jwt";
    public string Issuer { get; set; } = "Shop.Api";
    public string Audience { get; set; } = "Shop.Clients";
    public string Secret { get; set; } = "";
    public int AccessTokenMinutes { get; set; } = 30;
    public int RefreshTokenDays { get; set; } = 7;
}

public class PaymentOptions
{
    public const string Section = "Payment";
    public string DefaultGateway { get; set; } = "ZarinPal";
    public string CallbackBaseUrl { get; set; } = "http://localhost:8080";
    public string FrontendResultUrl { get; set; } = "http://localhost:3000/payment/result";
    public bool EnableFakeGateway { get; set; }
    public ZarinPalOptions ZarinPal { get; set; } = new();
}

public class ZarinPalOptions
{
    public bool Enabled { get; set; } = true;
    public string MerchantId { get; set; } = "";
    public bool Sandbox { get; set; } = true;
    public string? BaseUrl { get; set; }
}

public class StorageOptions
{
    public const string Section = "Storage";
    public string RootPath { get; set; } = "wwwroot/uploads";
    public string RequestPath { get; set; } = "/uploads";
}

public class SeedOptions
{
    public const string Section = "Seed";
    public string AdminEmail { get; set; } = "admin@shop.local";
    public string AdminPassword { get; set; } = "Admin@12345";
    public bool SampleData { get; set; } = true;
}
