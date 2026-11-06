using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Shop.Api.BackgroundJobs;
using Shop.Api.Middleware;
using Shop.Api.Services;
using Shop.Application;
using Shop.Application.Abstractions;
using Shop.Application.Options;
using Shop.Infrastructure;
using Shop.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// ---------- Application & Infrastructure ----------
builder.Services.AddApplication();
builder.Services.AddInfrastructure(config);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

var webRoot = builder.Environment.WebRootPath ?? Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRoot, "uploads"));
builder.Services.PostConfigure<StorageOptions>(o => o.RootPath = Path.Combine(webRoot, "uploads"));

builder.Services.AddHostedService<OrderExpirationService>();

// ---------- Auth (JWT) ----------
var jwt = config.GetSection(JwtOptions.Section).Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.Secret) || jwt.Secret.Length < 32)
    throw new InvalidOperationException("Jwt:Secret must be at least 32 characters. Set it via environment variable Jwt__Secret.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidIssuer = jwt.Issuer,
            ValidateAudience = true, ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("Staff", p => p.RequireRole("Admin", "Manager"));
    o.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
});

// ---------- MVC / JSON ----------
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
});
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(o =>
{
    o.InvalidModelStateResponseFactory = ctx =>
    {
        var errors = ctx.ModelState.Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(e => e.Key, e => e.Value!.Errors.Select(x => x.ErrorMessage).ToArray());
        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new
        {
            status = 400, code = "validation_failed", title = "ط¯ط§ط¯ظ‡â€Œظ‡ط§غŒ ط§ط±ط³ط§ظ„غŒ ظ†ط§ظ…ط¹طھط¨ط± ط§ط³طھ.", errors,
            traceId = ctx.HttpContext.TraceIdentifier
        });
    };
});

// ---------- CORS ----------
var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(o => o.AddPolicy("Default", p =>
{
    if (origins.Length > 0)
        p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
}));

// ---------- Rate limiting ----------
var globalLimit = config.GetValue("RateLimit:GlobalPerMinute", 300);
var authLimit = config.GetValue("RateLimit:AuthPerMinute", 10);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = globalLimit, Window = TimeSpan.FromMinutes(1) }));
    o.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = authLimit, Window = TimeSpan.FromMinutes(1) }));
});

// ---------- Health ----------
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("database");

// ---------- Swagger ----------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Shop API",
        Version = "v1",
        Description = "API ظپط±ظˆط´ع¯ط§ظ‡ ط§غŒظ†طھط±ظ†طھغŒ (ظ…ط´طھط±غŒ + ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھ). ط¨ط±ط§غŒ endpointظ‡ط§غŒ ظ…ط­ط§ظپط¸طھâ€Œط´ط¯ظ‡ ط§ط¨طھط¯ط§ /auth/login ط±ط§ طµط¯ط§ ط¨ط²ظ†غŒط¯ ظˆ طھظˆع©ظ† ط±ط§ ط¯ط± ط¯ع©ظ…ظ‡ Authorize ظˆط§ط±ط¯ ع©ظ†غŒط¯."
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT",
        In = ParameterLocation.Header, Description = "ظپظ‚ط· ط®ظˆط¯ طھظˆع©ظ† JWT ط±ط§ ظˆط§ط±ط¯ ع©ظ†غŒط¯."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
    c.AddSecurityDefinition("CartToken", new OpenApiSecurityScheme
    {
        Name = "X-Cart-Token", Type = SecuritySchemeType.ApiKey, In = ParameterLocation.Header,
        Description = "طھظˆع©ظ† ط³ط¨ط¯ ط®ط±غŒط¯ ظ…ظ‡ظ…ط§ظ† (ط§ط² ظ¾ط§ط³ط® GET /cart)."
    });
    var xml = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    if (File.Exists(xml)) c.IncludeXmlComments(xml);
});

builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});

var app = builder.Build();

// ---------- DB init ----------
using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<DbSeeder>().InitializeAsync();
}

// ---------- Pipeline ----------
app.UseForwardedHeaders();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (config.GetValue("Swagger:Enabled", true))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Shop API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseStaticFiles();
app.UseCors("Default");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Ok(new
{
    service = "Shop.Api",
    status = "running"
})).ExcludeFromDescription();
app.MapHealthChecks("/health");
app.MapControllers();

app.Run();
