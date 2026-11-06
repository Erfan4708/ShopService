using System.ComponentModel.DataAnnotations;
using Shop.Domain.Enums;

namespace Shop.Application.Dtos;

// ---------- Cart ----------
public record CartOwner(Guid? UserId, string? Token);

public record CartItemDto(Guid ProductId, string Name, string Slug, string? ImageUrl, decimal UnitPrice,
    int Quantity, decimal LineTotal, bool InStock, int? AvailableQuantity);

public record CartDto(string? Token, List<CartItemDto> Items, int ItemCount, decimal Subtotal, decimal Discount,
    decimal Total, string? CouponCode);

public class AddCartItemRequest
{
    [Required] public Guid ProductId { get; set; }
    [Range(1, 100)] public int Quantity { get; set; } = 1;
}

public class UpdateCartItemRequest
{
    [Range(0, 100)] public int Quantity { get; set; }
}

public class ApplyCouponRequest
{
    [Required, StringLength(50)] public string Code { get; set; } = "";
}

// ---------- Shipping / Coupon ----------
public record ShippingMethodDto(Guid Id, string Name, string? Description, decimal Cost, decimal? FreeAboveAmount,
    int? EstimatedDays);

public record AdminShippingMethodDto(Guid Id, string Name, string? Description, decimal Cost,
    decimal? FreeAboveAmount, int? EstimatedDays, int SortOrder, bool IsActive);

public class UpsertShippingMethodRequest
{
    [Required, StringLength(150)] public string Name { get; set; } = "";
    [StringLength(500)] public string? Description { get; set; }
    [Range(0, 1_000_000_000_000)] public decimal Cost { get; set; }
    [Range(0, 1_000_000_000_000)] public decimal? FreeAboveAmount { get; set; }
    [Range(0, 365)] public int? EstimatedDays { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public record CouponDto(Guid Id, string Code, string? Description, DiscountType Type, decimal Value,
    decimal? MaxDiscountAmount, decimal? MinOrderAmount, int? UsageLimit, int UsedCount, DateTime? StartsAt,
    DateTime? ExpiresAt, bool IsActive);

public class UpsertCouponRequest
{
    [Required, StringLength(50)] public string Code { get; set; } = "";
    [StringLength(500)] public string? Description { get; set; }
    public DiscountType Type { get; set; }
    [Range(0.01, 1_000_000_000_000)] public decimal Value { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    [Range(1, int.MaxValue)] public int? UsageLimit { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}

// ---------- Checkout / Orders ----------
public class CheckoutPreviewRequest
{
    public Guid? ShippingMethodId { get; set; }
}

public record CheckoutSummaryDto(decimal Subtotal, decimal Discount, decimal ShippingCost, decimal Tax,
    decimal GrandTotal, string? CouponCode);

public class CheckoutRequest
{
    [Required] public Guid AddressId { get; set; }
    [Required] public Guid ShippingMethodId { get; set; }
    [StringLength(1000)] public string? Note { get; set; }
}

public record OrderItemDto(Guid ProductId, string ProductName, string Sku, string? ImageUrl, decimal UnitPrice,
    int Quantity, decimal LineTotal);

public record OrderStatusHistoryDto(OrderStatus Status, string? Note, DateTime CreatedAt);

public record PaymentDto(Guid Id, string Gateway, decimal Amount, PaymentStatus Status, string? RefId,
    DateTime CreatedAt, DateTime? PaidAt);

public record OrderDetailDto(Guid Id, string OrderNumber, OrderStatus Status, decimal Subtotal,
    decimal DiscountTotal, decimal ShippingCost, decimal TaxTotal, decimal GrandTotal, string? CouponCode,
    string ShippingMethodName, string ReceiverName, string ReceiverPhone, string Province, string City,
    string PostalCode, string AddressLine, string? Note, string? TrackingCode, DateTime CreatedAt, DateTime? PaidAt,
    List<OrderItemDto> Items, List<OrderStatusHistoryDto> History, List<PaymentDto> Payments);

public record OrderSummaryDto(Guid Id, string OrderNumber, OrderStatus Status, decimal GrandTotal, int ItemCount,
    DateTime CreatedAt, string CustomerName, string ReceiverPhone);

public class TrackOrderRequest
{
    [Required, StringLength(50)] public string OrderNumber { get; set; } = "";
    [Required, StringLength(20)] public string Phone { get; set; } = "";
}

public record TrackOrderDto(string OrderNumber, OrderStatus Status, string? TrackingCode, DateTime CreatedAt,
    List<OrderStatusHistoryDto> History, List<TrackItemDto> Items);

public record TrackItemDto(string ProductName, int Quantity);

public class AdminOrderQuery : PageQueryBase
{
    public OrderStatus? Status { get; set; }
    public string? Search { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}

public class UpdateOrderStatusRequest
{
    [Required] public OrderStatus Status { get; set; }
    [StringLength(500)] public string? Note { get; set; }
    [StringLength(100)] public string? TrackingCode { get; set; }
}

// ---------- Payment ----------
public class StartPaymentRequest
{
    [Required] public Guid OrderId { get; set; }
    public string? Gateway { get; set; }
}

public record StartPaymentResponse(Guid PaymentId, string Gateway, string PaymentUrl, string Authority);

public record PaymentCallbackResult(bool Success, string OrderNumber, string? RefId, string Message);

// ---------- Dashboard ----------
public record DailySalesDto(DateTime Date, int OrdersCount, decimal Revenue);

public record TopProductDto(Guid ProductId, string Name, int QuantitySold, decimal Revenue);

public record LowStockProductDto(Guid ProductId, string Name, string Sku, int StockQuantity);

public record DashboardDto(int TotalOrders, int TodayOrders, decimal TotalRevenue, decimal TodayRevenue,
    int TotalCustomers, int ActiveProducts, Dictionary<string, int> OrdersByStatus, List<DailySalesDto> Last30Days,
    List<TopProductDto> TopProducts, List<LowStockProductDto> LowStock);
