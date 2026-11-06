# تصمیم‌های معماری

## لایه‌ها (Clean Architecture)
- **Shop.Domain**: موجودیت‌ها. ماشین حالت سفارش در `Order.CanTransitionTo/SetStatus`؛ هزینه ارسال در `ShippingMethod.CostFor`.
- **Shop.Application**: سرویس‌ها، DTOها، قراردادها. فقط به `IAppDbContext` (EF Core بدون provider) و interfaceها وابسته است. خطاها با `AppException` (NotFound/Conflict/BusinessRule/Unauthorized/Forbidden) پرتاب و در Middleware به JSON یکدست تبدیل می‌شوند.
- **Shop.Infrastructure**: EF Core + SQL Server، PBKDF2، JWT، درگاه‌ها، ذخیره فایل، اطلاع‌رسانی، Seeder.
- **Shop.Api**: کنترلرهای نازک، Auth، Swagger، Rate limit، CORS، Health، Job انقضای سفارش.

## تصمیم‌های کلیدی
| موضوع | تصمیم |
|---|---|
| موجودی | هنگام ثبت سفارش رزرو می‌شود؛ `RowVersion` روی Product از oversell همزمان جلوگیری می‌کند. لغو/انقضا موجودی و کوپن را برمی‌گرداند. |
| انقضای سفارش | `OrderExpirationService` هر دقیقه سفارش‌های PendingPayment قدیمی‌تر از `Order.PendingExpirationMinutes` را لغو می‌کند. |
| پرداخت | Payment جدا از Order (چند تلاش برای یک سفارش). callback ایدمپوتنت است، `Authority` تطبیق داده می‌شود، مبلغ سمت سرور وریفای می‌شود. اگر سفارش منقضی شده باشد وریفای انجام نمی‌شود تا درگاه مبلغ را خودکار برگرداند. |
| قیمت | قیمت لحظه‌ای از Product خوانده می‌شود و هنگام سفارش در OrderItem اسنپ‌شات می‌شود (نام، SKU، قیمت، آدرس، روش ارسال). |
| حذف محصول | حذف نرم (`IsDeleted` + Query Filter) تا سابقه سفارش‌ها حفظ شود. |
| سبد مهمان | توکن تصادفی در هدر `X-Cart-Token`؛ بعد از ورود با `/cart/merge` ادغام می‌شود. |
| امنیت | PBKDF2-SHA256 (210k)، قفل موقت حساب بعد از ۵ تلاش، Refresh Token چرخشی با ذخیره Hash و تشخیص استفاده مجدد، Rate limit، اعتبارسنجی magic-byte تصویر، پیام یکسان در پیگیری سفارش (ضد enumeration). |
| Guid کلیدها | `ValueGeneratedNever` تا افزودن فرزند جدید به موجودیت tracked به‌اشتباه UPDATE نشود. |

## نقاط توسعه (برای سفارشی‌سازی هر کسب‌وکار)
1. **ویژگی‌های محصول**: `ProductAttribute` (کلید/مقدار) بدون تغییر دیتابیس.
2. **تنظیمات**: `SettingKeys.Defaults` را افزایش دهید؛ از `ISettingsService` بخوانید؛ از `/admin/settings` تغییر دهید.
3. **درگاه پرداخت**: `IPaymentGateway` را پیاده‌سازی و در `Infrastructure/DependencyInjection.cs` یک خط `AddTransient<IPaymentGateway, X>` اضافه کنید.
4. **ذخیره فایل**: `IFileStorage` (S3/MinIO/Azure Blob).
5. **ایمیل/پیامک**: `INotificationSender` (رویدادها: user.registered, order.created, order.paid, order.status_changed, order.cancelled).
6. **قوانین قیمت/مالیات**: `CheckoutService.ComputeAsync` تنها نقطه محاسبه مبلغ نهایی است.
7. **ماشین حالت سفارش**: جدول `Transitions` در `Order`.
8. **Variant محصول** (سایز/رنگ): موجودیت `ProductVariant` اضافه و `CartItem/OrderItem` به آن ارجاع داده شود (در این نسخه پیاده‌سازی نشده).
