using System.Linq.Expressions;
using Shop.Application.Dtos;
using Shop.Domain.Entities;

namespace Shop.Application.Common;

public static class Mappers
{
    public static UserDto ToDto(this User u) =>
        new(u.Id, u.Email, u.PhoneNumber, u.FirstName, u.LastName, u.Role);

    public static AddressDto ToDto(this Address a) =>
        new(a.Id, a.Title, a.ReceiverName, a.ReceiverPhone, a.Province, a.City, a.PostalCode, a.AddressLine, a.IsDefault);

    public static ProductImageDto ToDto(this ProductImage i) => new(i.Id, i.Url, i.AltText, i.IsMain, i.SortOrder);

    public static AdminCategoryDto ToAdminDto(this Category c) =>
        new(c.Id, c.Name, c.Slug, c.Description, c.ImageUrl, c.ParentId, c.SortOrder, c.IsActive);

    public static ShippingMethodDto ToDto(this ShippingMethod s) =>
        new(s.Id, s.Name, s.Description, s.Cost, s.FreeAboveAmount, s.EstimatedDays);

    public static AdminShippingMethodDto ToAdminDto(this ShippingMethod s) =>
        new(s.Id, s.Name, s.Description, s.Cost, s.FreeAboveAmount, s.EstimatedDays, s.SortOrder, s.IsActive);

    public static CouponDto ToDto(this Coupon c) =>
        new(c.Id, c.Code, c.Description, c.Type, c.Value, c.MaxDiscountAmount, c.MinOrderAmount, c.UsageLimit,
            c.UsedCount, c.StartsAt, c.ExpiresAt, c.IsActive);

    public static ProductDetailDto ToDetailDto(this Product p, bool exposeStock) =>
        new(p.Id, p.Name, p.Slug, p.Sku, p.ShortDescription, p.Description, p.Brand, p.Price, p.CompareAtPrice,
            !p.TrackInventory || p.StockQuantity > 0, exposeStock && p.TrackInventory ? p.StockQuantity : null,
            p.CategoryId, p.Category.Name, p.Category.Slug, p.AverageRating, p.ReviewCount, p.IsFeatured,
            p.Images.OrderByDescending(i => i.IsMain).ThenBy(i => i.SortOrder).Select(i => i.ToDto()).ToList(),
            p.Attributes.OrderBy(a => a.SortOrder).Select(a => new ProductAttributeDto(a.Name, a.Value)).ToList());

    public static AdminProductDto ToAdminDto(this Product p) =>
        new(p.Id, p.Name, p.Slug, p.Sku, p.ShortDescription, p.Description, p.Brand, p.Price, p.CompareAtPrice,
            p.StockQuantity, p.TrackInventory, p.IsActive, p.IsFeatured, p.Weight, p.CategoryId, p.Category.Name,
            p.SalesCount, p.CreatedAt,
            p.Images.OrderByDescending(i => i.IsMain).ThenBy(i => i.SortOrder).Select(i => i.ToDto()).ToList(),
            p.Attributes.OrderBy(a => a.SortOrder).Select(a => new ProductAttributeDto(a.Name, a.Value)).ToList());

    public static readonly Expression<Func<Product, ProductListItemDto>> ProductListProjection = p =>
        new ProductListItemDto(p.Id, p.Name, p.Slug, p.Sku, p.Price, p.CompareAtPrice,
            p.Images.OrderByDescending(i => i.IsMain).ThenBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
            !p.TrackInventory || p.StockQuantity > 0, p.CategoryId, p.Category.Name, p.AverageRating,
            p.ReviewCount, p.IsFeatured);

    public static OrderDetailDto ToDetailDto(this Order o) =>
        new(o.Id, o.OrderNumber, o.Status, o.Subtotal, o.DiscountTotal, o.ShippingCost, o.TaxTotal, o.GrandTotal,
            o.CouponCode, o.ShippingMethodName, o.ReceiverName, o.ReceiverPhone, o.Province, o.City, o.PostalCode,
            o.AddressLine, o.Note, o.TrackingCode, o.CreatedAt, o.PaidAt,
            o.Items.Select(i => new OrderItemDto(i.ProductId, i.ProductName, i.Sku, i.ImageUrl, i.UnitPrice, i.Quantity, i.LineTotal)).ToList(),
            o.StatusHistory.OrderBy(h => h.CreatedAt).Select(h => new OrderStatusHistoryDto(h.Status, h.Note, h.CreatedAt)).ToList(),
            o.Payments.OrderBy(p => p.CreatedAt).Select(p => new PaymentDto(p.Id, p.Gateway, p.Amount, p.Status, p.RefId, p.CreatedAt, p.PaidAt)).ToList());
}
