export type Paged<T> = { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number };

export type Role = 'Customer' | 'Manager' | 'Admin';
export type User = { id: string; email: string; phoneNumber: string | null; firstName: string; lastName: string; role: Role };

export type OrderStatus = 'PendingPayment' | 'Paid' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';

export type Category = { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; parentId: string | null; children: Category[] };
export type AdminCategory = { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; parentId: string | null; sortOrder: number; isActive: boolean };

export type ProductListItem = {
  id: string; name: string; slug: string; sku: string; price: number; compareAtPrice: number | null; mainImageUrl: string | null;
  inStock: boolean; categoryId: string; categoryName: string; averageRating: number; reviewCount: number; isFeatured: boolean;
};
export type ProductImage = { id: string; url: string; altText: string | null; isMain: boolean; sortOrder: number };
export type ProductAttribute = { name: string; value: string };
export type ProductDetail = {
  id: string; name: string; slug: string; sku: string; shortDescription: string | null; description: string | null; brand: string | null;
  price: number; compareAtPrice: number | null; inStock: boolean; stockQuantity: number | null; categoryId: string; categoryName: string;
  categorySlug: string; averageRating: number; reviewCount: number; isFeatured: boolean; images: ProductImage[]; attributes: ProductAttribute[];
};
export type AdminProduct = {
  id: string; name: string; slug: string; sku: string; shortDescription: string | null; description: string | null; brand: string | null;
  price: number; compareAtPrice: number | null; stockQuantity: number; trackInventory: boolean; isActive: boolean; isFeatured: boolean;
  weight: number | null; categoryId: string; categoryName: string; salesCount: number; createdAt: string; images: ProductImage[]; attributes: ProductAttribute[];
};
export type Review = { id: string; productId: string; userName: string; rating: number; comment: string | null; isVerifiedPurchase: boolean; createdAt: string };

export type CartItem = { productId: string; name: string; slug: string; imageUrl: string | null; unitPrice: number; quantity: number; lineTotal: number; inStock: boolean; availableQuantity: number | null };
export type Cart = { token: string | null; items: CartItem[]; itemCount: number; subtotal: number; discount: number; total: number; couponCode: string | null };

export type Address = { id: string; title: string; receiverName: string; receiverPhone: string; province: string; city: string; postalCode: string; addressLine: string; isDefault: boolean };
export type ShippingMethod = { id: string; name: string; description: string | null; cost: number; freeAboveAmount: number | null; estimatedDays: number | null };
export type CheckoutSummary = { subtotal: number; discount: number; shippingCost: number; tax: number; grandTotal: number; couponCode: string | null };

export type OrderSummary = { id: string; orderNumber: string; status: OrderStatus; grandTotal: number; itemCount: number; createdAt: string; customerName: string; receiverPhone: string };
export type OrderItem = { productId: string; productName: string; sku: string; imageUrl: string | null; unitPrice: number; quantity: number; lineTotal: number };
export type OrderHistory = { status: OrderStatus; note: string | null; createdAt: string };
export type Payment = { id: string; gateway: string; amount: number; status: 'Pending' | 'Succeeded' | 'Failed'; refId: string | null; createdAt: string; paidAt: string | null };
export type OrderDetail = {
  id: string; orderNumber: string; status: OrderStatus; subtotal: number; discountTotal: number; shippingCost: number; taxTotal: number; grandTotal: number;
  couponCode: string | null; shippingMethodName: string; receiverName: string; receiverPhone: string; province: string; city: string; postalCode: string;
  addressLine: string; note: string | null; trackingCode: string | null; createdAt: string; paidAt: string | null;
  items: OrderItem[]; history: OrderHistory[]; payments: Payment[];
};
export type TrackOrder = { orderNumber: string; status: OrderStatus; trackingCode: string | null; createdAt: string; history: OrderHistory[]; items: { productName: string; quantity: number }[] };
export type StartPayment = { paymentId: string; gateway: string; paymentUrl: string; authority: string };

export type Coupon = {
  id: string; code: string; description: string | null; type: 'Percent' | 'FixedAmount'; value: number; maxDiscountAmount: number | null;
  minOrderAmount: number | null; usageLimit: number | null; usedCount: number; startsAt: string | null; expiresAt: string | null; isActive: boolean;
};
export type Setting = { key: string; value: string; description: string | null };

export type Dashboard = {
  totalOrders: number; todayOrders: number; totalRevenue: number; todayRevenue: number; totalCustomers: number; activeProducts: number;
  ordersByStatus: Record<string, number>;
  last30Days: { date: string; ordersCount: number; revenue: number }[];
  topProducts: { productId: string; name: string; quantitySold: number; revenue: number }[];
  lowStock: { productId: string; name: string; sku: string; stockQuantity: number }[];
};
