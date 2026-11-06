using System.ComponentModel.DataAnnotations;

namespace Shop.Application.Dtos;

public class PageQueryBase
{
    [Range(1, int.MaxValue)] public int Page { get; set; } = 1;
    [Range(1, 100)] public int PageSize { get; set; } = 20;
    public int SafePage => Page < 1 ? 1 : Page;
    public int SafePageSize => PageSize < 1 ? 20 : (PageSize > 100 ? 100 : PageSize);
}

public record SettingDto(string Key, string Value, string? Description);

public class UpdateSettingsRequest
{
    [Required] public Dictionary<string, string> Settings { get; set; } = new();
}
