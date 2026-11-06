using Shop.Domain.Common;
using Shop.Domain.Enums;

namespace Shop.Domain.Entities;

public class Cart : BaseEntity
{
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string? Token { get; set; }
    public string? CouponCode { get; set; }
    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}

public class CartItem : BaseEntity
{
    public Guid CartId { get; set; }
    public Cart Cart { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
}

public class Coupon : BaseEntity
{
    public string Code { get; set; } = "";
    public string? Description { get; set; }
    public DiscountType Type { get; set; }
    public decimal Value { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ShippingMethod : BaseEntity
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public decimal Cost { get; set; }
    public decimal? FreeAboveAmount { get; set; }
    public int? EstimatedDays { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public decimal CostFor(decimal orderAmount) =>
        FreeAboveAmount.HasValue && orderAmount >= FreeAboveAmount.Value ? 0 : Cost;
}

public class Order : BaseEntity
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> Transitions = new()
    {
        [OrderStatus.PendingPayment] = new[] { OrderStatus.Paid, OrderStatus.Cancelled },
        [OrderStatus.Paid] = new[] { OrderStatus.Processing, OrderStatus.Cancelled, OrderStatus.Refunded },
        [OrderStatus.Processing] = new[] { OrderStatus.Shipped, OrderStatus.Cancelled, OrderStatus.Refunded },
        [OrderStatus.Shipped] = new[] { OrderStatus.Delivered, OrderStatus.Refunded },
        [OrderStatus.Delivered] = new[] { OrderStatus.Refunded },
        [OrderStatus.Cancelled] = Array.Empty<OrderStatus>(),
        [OrderStatus.Refunded] = Array.Empty<OrderStatus>()
    };

    public string OrderNumber { get; set; } = "";
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public OrderStatus Status { get; set; } = OrderStatus.PendingPayment;

    public decimal Subtotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public string? CouponCode { get; set; }

    public string ShippingMethodName { get; set; } = "";
    public string ReceiverName { get; set; } = "";
    public string ReceiverPhone { get; set; } = "";
    public string Province { get; set; } = "";
    public string City { get; set; } = "";
    public string PostalCode { get; set; } = "";
    public string AddressLine { get; set; } = "";

    public string? Note { get; set; }
    public string? TrackingCode { get; set; }
    public DateTime? PaidAt { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();

    public bool CanTransitionTo(OrderStatus target) =>
        Transitions.TryGetValue(Status, out var allowed) && allowed.Contains(target);

    public void SetStatus(OrderStatus status, string? note = null, string? changedBy = null)
    {
        Status = status;
        StatusHistory.Add(new OrderStatusHistory
        {
            OrderId = Id,
            Status = status,
            Note = note,
            ChangedBy = changedBy,
            CreatedAt = DateTime.UtcNow
        });
    }
}

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string ProductName { get; set; } = "";
    public string Sku { get; set; } = "";
    public string? ImageUrl { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
}

public class OrderStatusHistory : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public OrderStatus Status { get; set; }
    public string? Note { get; set; }
    public string? ChangedBy { get; set; }
}

public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string Gateway { get; set; } = "";
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? Authority { get; set; }
    public string? RefId { get; set; }
    public string? CardPan { get; set; }
    public string? FailureReason { get; set; }
    public DateTime? PaidAt { get; set; }
    public uint RowVersion { get; set; }
}

public class SiteSetting : BaseEntity
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public string? Description { get; set; }
}
