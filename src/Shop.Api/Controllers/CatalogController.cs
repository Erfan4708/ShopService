using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shop.Application.Common;
using Shop.Application.Dtos;
using Shop.Application.Services;

namespace Shop.Api.Controllers;

[Route("api/v1/products")]
public class ProductsController : ApiControllerBase
{
    private readonly ICatalogService _catalog;
    public ProductsController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductListItemDto>>> List([FromQuery] ProductQuery query, CancellationToken ct) =>
        Ok(await _catalog.GetProductsAsync(query, ct));

    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductDetailDto>> Get(string slug, CancellationToken ct) =>
        Ok(await _catalog.GetProductBySlugAsync(slug, ct));

    [HttpGet("{productId:guid}/reviews")]
    public async Task<ActionResult<PagedResult<ReviewDto>>> Reviews(Guid productId, [FromQuery] PageQueryBase page, CancellationToken ct) =>
        Ok(await _catalog.GetReviewsAsync(productId, page, ct));

    [HttpPost("{productId:guid}/reviews")]
    [Authorize]
    public async Task<IActionResult> AddReview(Guid productId, CreateReviewRequest request, CancellationToken ct)
    {
        var review = await _catalog.AddReviewAsync(UserId, productId, request, ct);
        return review == null
            ? Accepted(new { message = "ظ†ط¸ط± ط´ظ…ط§ ط«ط¨طھ ط´ط¯ ظˆ ظ¾ط³ ط§ط² طھط§غŒغŒط¯ ظ†ظ…ط§غŒط´ ط¯ط§ط¯ظ‡ ظ…غŒâ€Œط´ظˆط¯." })
            : Created(review);
    }
}

[Route("api/v1/categories")]
public class CategoriesController : ApiControllerBase
{
    private readonly ICatalogService _catalog;
    public CategoriesController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> Tree(CancellationToken ct) => Ok(await _catalog.GetCategoryTreeAsync(ct));
}

[Route("api/v1/settings")]
public class SettingsController : ApiControllerBase
{
    private readonly ISettingsService _settings;
    public SettingsController(ISettingsService settings) => _settings = settings;

    [HttpGet("public")]
    public async Task<ActionResult<List<SettingDto>>> GetPublic(CancellationToken ct) => Ok(await _settings.GetPublicAsync(ct));
}
