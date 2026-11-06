namespace Shop.Domain.Enums;

public enum UserRole { Customer = 0, Manager = 1, Admin = 2 }

public enum OrderStatus
{
    PendingPayment = 0,
    Paid = 1,
    Processing = 2,
    Shipped = 3,
    Delivered = 4,
    Cancelled = 5,
    Refunded = 6
}

public enum PaymentStatus { Pending = 0, Succeeded = 1, Failed = 2 }

public enum DiscountType { Percent = 0, FixedAmount = 1 }
