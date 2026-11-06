using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Abstractions;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Application.Services;

namespace Shop.Api.Controllers.Admin;

public class UploadImageForm
{
    [Required] public IFormFile File { get; set; } = null!;
    public string? AltText { get; set; }
    public bool IsMain { get; set; }
}

[Route("api/v1/admin/products")]
[Authorize(Policy = "Staff")]
public class AdminProductsController : ApiControllerBase
{
    private const long MaxImageBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedExt = { ".jpg", ".jpeg", ".png", ".webp" };

    private readonly IAdminCatalogService _catalog;
    private readonly IFileStorage _storage;

    public AdminProductsController(IAdminCatalogService catalog, IFileStorage storage)
    {
        _catalog = catalog; _storage = storage;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductListItemDto>>> List([FromQuery] AdminProductQuery query, CancellationToken ct) =>
        Ok(await _catalog.GetProductsAsync(query, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminProductDto>> Get(Guid id, CancellationToken ct) => Ok(await _catalog.GetProductAsync(id, ct));

    [HttpPost]
    public async Task<IActionResult> Create(UpsertProductRequest request, CancellationToken ct) =>
        Created(await _catalog.CreateProductAsync(request, ct));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminProductDto>> Update(Guid id, UpsertProductRequest request, CancellationToken ct) =>
        Ok(await _catalog.UpdateProductAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _catalog.DeleteProductAsync(id, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/stock")]
    public async Task<ActionResult<AdminProductDto>> AdjustStock(Guid id, AdjustStockRequest request, CancellationToken ct) =>
        Ok(await _catalog.AdjustStockAsync(id, request, ct));

    [HttpPost("{id:guid}/images")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(Guid id, [FromForm] UploadImageForm form, CancellationToken ct)
    {
        await _catalog.GetProductAsync(id, ct); // ظˆط¬ظˆط¯ ظ…ط­طµظˆظ„
        var file = form.File;
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (file.Length == 0 || file.Length > MaxImageBytes) throw new BusinessRuleException("ط­ط¬ظ… طھطµظˆغŒط± ط¨ط§غŒط¯ ط¨غŒظ† غ± ط¨ط§غŒطھ ظˆ غµ ظ…ع¯ط§ط¨ط§غŒطھ ط¨ط§ط´ط¯.");
        if (!AllowedExt.Contains(ext)) throw new BusinessRuleException("ظپظ‚ط· ظپط±ظ…طھâ€Œظ‡ط§غŒ jpg, png ظˆ webp ظ…ط¬ط§ط² ط§ط³طھ.");

        await using var stream = file.OpenReadStream();
        var header = new byte[12];
        var read = await stream.ReadAsync(header.AsMemory(0, 12), ct);
        if (read < 12 || !LooksLikeImage(header)) throw new BusinessRuleException("ظ…ط­طھظˆط§غŒ ظپط§غŒظ„ غŒع© طھطµظˆغŒط± ظ…ط¹طھط¨ط± ظ†غŒط³طھ.");
        stream.Position = 0;

        var url = await _storage.SaveAsync(stream, ext, "products", ct);
        try
        {
            var dto = await _catalog.AddImageAsync(id, url, form.AltText, form.IsMain, ct);
            return Created(dto);
        }
        catch
        {
            await _storage.DeleteAsync(url, CancellationToken.None);
            throw;
        }
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    public async Task<IActionResult> DeleteImage(Guid id, Guid imageId, CancellationToken ct)
    {
        var url = await _catalog.RemoveImageAsync(id, imageId, ct);
        await _storage.DeleteAsync(url, ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/images/{imageId:guid}/main")]
    public async Task<IActionResult> SetMain(Guid id, Guid imageId, CancellationToken ct)
    {
        await _catalog.SetMainImageAsync(id, imageId, ct);
        return NoContent();
    }

    private static bool LooksLikeImage(byte[] h) =>
        (h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF) ||                                   // JPEG
        (h[0] == 0x89 && h[1] == 0x50 && h[2] == 0x4E && h[3] == 0x47) ||                   // PNG
        (h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F' && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P'); // WEBP
}

[Route("api/v1/admin/categories")]
[Authorize(Policy = "Staff")]
public class AdminCategoriesController : ApiControllerBase
{
    private readonly IAdminCatalogService _catalog;
    public AdminCategoriesController(IAdminCatalogService catalog) => _catalog = catalog;

    [HttpGet]
    public async Task<ActionResult<List<AdminCategoryDto>>> List(CancellationToken ct) => Ok(await _catalog.GetCategoriesAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Create(UpsertCategoryRequest request, CancellationToken ct) =>
        Created(await _catalog.CreateCategoryAsync(request, ct));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminCategoryDto>> Update(Guid id, UpsertCategoryRequest request, CancellationToken ct) =>
        Ok(await _catalog.UpdateCategoryAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _catalog.DeleteCategoryAsync(id, ct);
        return NoContent();
    }
}

[Route("api/v1/admin/reviews")]
[Authorize(Policy = "Staff")]
public class AdminReviewsController : ApiControllerBase
{
    private readonly IAdminCatalogService _catalog;
    public AdminReviewsController(IAdminCatalogService catalog) => _catalog = catalog;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminReviewDto>>> List([FromQuery] AdminReviewQuery query, CancellationToken ct) =>
        Ok(await _catalog.GetReviewsAsync(query, ct));

    [HttpPut("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        await _catalog.SetReviewApprovalAsync(id, true, ct);
        return NoContent();
    }

    [HttpPut("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, CancellationToken ct)
    {
        await _catalog.SetReviewApprovalAsync(id, false, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _catalog.DeleteReviewAsync(id, ct);
        return NoContent();
    }
}
