using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Domain.Entities;

namespace Shop.Application.Services;

public static class SettingKeys
{
    public const string StoreName = "Store.Name";
    public const string StoreCurrency = "Store.Currency";
    public const string StorePhone = "Store.ContactPhone";
    public const string StoreEmail = "Store.ContactEmail";
    public const string TaxPercent = "Tax.Percent";
    public const string PendingOrderExpirationMinutes = "Order.PendingExpirationMinutes";
    public const string LowStockThreshold = "Inventory.LowStockThreshold";
    public const string ReviewsRequireApproval = "Reviews.RequireApproval";
    public const string ExposeStockQuantity = "Catalog.ExposeStockQuantity";

    public static readonly IReadOnlyDictionary<string, (string Value, string Description)> Defaults =
            new Dictionary<string, (string, string)>
            {
                [StoreName] = ("My Store", "Store name"),
                [StoreCurrency] = ("IRT", "Currency unit (IRT = Toman / IRR = Rial)"),
                [StorePhone] = ("", "Customer support phone number"),
                [StoreEmail] = ("", "Customer support email address"),
                [TaxPercent] = ("0", "Value-added tax percentage (0 = disabled)"),
                [PendingOrderExpirationMinutes] = ("30", "Payment deadline in minutes before automatic order cancellation"),
                [LowStockThreshold] = ("5", "Low stock alert threshold"),
                [ReviewsRequireApproval] = ("true", "Reviews require approval before being displayed"),
                [ExposeStockQuantity] = ("false", "Display exact stock quantity to customers")
            };
}

public interface ISettingsService
{
    Task<string> GetAsync(string key, CancellationToken ct = default);
    Task<decimal> GetDecimalAsync(string key, CancellationToken ct = default);
    Task<int> GetIntAsync(string key, CancellationToken ct = default);
    Task<bool> GetBoolAsync(string key, CancellationToken ct = default);
    Task<List<SettingDto>> GetPublicAsync(CancellationToken ct = default);
    Task<List<SettingDto>> GetAllAsync(CancellationToken ct = default);
    Task UpdateAsync(Dictionary<string, string> values, CancellationToken ct = default);
}

public class SettingsService : ISettingsService
{
    private readonly IAppDbContext _db;
    public SettingsService(IAppDbContext db) => _db = db;

    public async Task<string> GetAsync(string key, CancellationToken ct = default)
    {
        var value = await _db.SiteSettings.AsNoTracking().Where(s => s.Key == key).Select(s => s.Value).FirstOrDefaultAsync(ct);
        if (value != null) return value;
        return SettingKeys.Defaults.TryGetValue(key, out var d) ? d.Value : "";
    }

    public async Task<decimal> GetDecimalAsync(string key, CancellationToken ct = default) =>
        decimal.TryParse(await GetAsync(key, ct), NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : 0m;

    public async Task<int> GetIntAsync(string key, CancellationToken ct = default) =>
        int.TryParse(await GetAsync(key, ct), NumberStyles.Integer, CultureInfo.InvariantCulture, out var v) ? v : 0;

    public async Task<bool> GetBoolAsync(string key, CancellationToken ct = default) =>
        string.Equals((await GetAsync(key, ct)).Trim(), "true", StringComparison.OrdinalIgnoreCase);

    public async Task<List<SettingDto>> GetPublicAsync(CancellationToken ct = default) =>
        (await GetAllAsync(ct)).Where(s => s.Key.StartsWith("Store.") || s.Key == SettingKeys.TaxPercent).ToList();

    public async Task<List<SettingDto>> GetAllAsync(CancellationToken ct = default)
    {
        var stored = await _db.SiteSettings.AsNoTracking().ToListAsync(ct);
        var result = SettingKeys.Defaults.ToDictionary(k => k.Key, k => new SettingDto(k.Key, k.Value.Value, k.Value.Description));
        foreach (var s in stored) result[s.Key] = new SettingDto(s.Key, s.Value, s.Description ?? (result.TryGetValue(s.Key, out var e) ? e.Description : null));
        return result.Values.OrderBy(s => s.Key).ToList();
    }

    public async Task UpdateAsync(Dictionary<string, string> values, CancellationToken ct = default)
    {
        var keys = values.Keys.ToList();
        var existing = await _db.SiteSettings.Where(s => keys.Contains(s.Key)).ToListAsync(ct);
        foreach (var kv in values)
        {
            if (kv.Key.Length > 100) throw new BusinessRuleException("Invalid setting key.");
            var row = existing.FirstOrDefault(s => s.Key == kv.Key);
            if (row == null)
            {
                SettingKeys.Defaults.TryGetValue(kv.Key, out var d);
                _db.SiteSettings.Add(new SiteSetting { Key = kv.Key, Value = kv.Value ?? "", Description = d.Description });
            }
            else row.Value = kv.Value ?? "";
        }
        await _db.SaveChangesAsync(ct);
    }
}
