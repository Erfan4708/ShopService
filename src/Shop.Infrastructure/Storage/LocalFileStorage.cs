using Microsoft.Extensions.Options;
using Shop.Application.Abstractions;
using Shop.Application.Options;

namespace Shop.Infrastructure.Storage;

public class LocalFileStorage : IFileStorage
{
    private readonly StorageOptions _opt;
    public LocalFileStorage(IOptions<StorageOptions> opt) => _opt = opt.Value;

    public async Task<string> SaveAsync(Stream content, string extension, string folder, CancellationToken ct = default)
    {
        var safeFolder = new string(folder.Where(char.IsLetterOrDigit).ToArray());
        var dir = Path.Combine(_opt.RootPath, safeFolder);
        Directory.CreateDirectory(dir);
        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        await using (var fs = new FileStream(Path.Combine(dir, fileName), FileMode.CreateNew, FileAccess.Write))
            await content.CopyToAsync(fs, ct);
        return $"{_opt.RequestPath.TrimEnd('/')}/{safeFolder}/{fileName}";
    }

    public Task DeleteAsync(string url, CancellationToken ct = default)
    {
        var prefix = _opt.RequestPath.TrimEnd('/') + "/";
        if (!url.StartsWith(prefix)) return Task.CompletedTask;
        var relative = url.Substring(prefix.Length).Replace('/', Path.DirectorySeparatorChar);
        var full = Path.GetFullPath(Path.Combine(_opt.RootPath, relative));
        if (full.StartsWith(Path.GetFullPath(_opt.RootPath)) && File.Exists(full)) File.Delete(full);
        return Task.CompletedTask;
    }
}
