using System.Text.Json;
using Shop.Application.Common;

namespace Shop.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _log;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> log)
    {
        _next = next; _log = log;
    }

    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await _next(ctx); }
        catch (OperationCanceledException) when (ctx.RequestAborted.IsCancellationRequested)
        {
            ctx.Response.StatusCode = 499; // client closed request
        }
        catch (AppException ex)
        {
            await Write(ctx, ex.StatusCode, ex.Code, ex.Message);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Unhandled exception. TraceId={TraceId}", ctx.TraceIdentifier);
            await Write(ctx, 500, "server_error", "ط®ط·ط§غŒ ط¯ط§ط®ظ„غŒ ط³ط±ظˆط±. ظ„ط·ظپط§ظ‹ ط¨ط¹ط¯ط§ظ‹ طھظ„ط§ط´ ع©ظ†غŒط¯.");
        }
    }

    private static async Task Write(HttpContext ctx, int status, string code, string message)
    {
        if (ctx.Response.HasStarted) return;
        ctx.Response.Clear();
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json; charset=utf-8";
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { status, code, title = message, traceId = ctx.TraceIdentifier }, Json));
    }
}
