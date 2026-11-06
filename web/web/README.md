# Shop Web — فرانت‌اند فروشگاه (Next.js 14 + Tailwind، RTL فارسی)

فرانت کامل برای Shop API: صفحات مشتری + پنل مدیریت. مرورگر هیچ‌وقت مستقیم با API حرف نمی‌زند؛ همه درخواست‌ها به `/api/*` (BFF داخل Next) می‌روند.

## معماری و امنیت
- **BFF Proxy** (`src/app/api/[...path]/route.ts`): توکن‌ها فقط در کوکی `httpOnly` هستند (JS مرورگر نمی‌بیند → ایمن در برابر XSS). Access Token منقضی‌شده خودکار با Refresh Token تمدید می‌شود، سبد مهمان با کوکی `cart_token` نگه‌داری و بعد از ورود به سبد کاربر ادغام می‌شود.
- **SEO**: صفحات خانه/لیست/جزئیات محصول Server Component هستند (داده از API داخلی).
- **Middleware**: صفحات `/checkout /orders /account /admin` بدون نشست به `/login?next=` هدایت می‌شوند (امنیت واقعی با JWT در API است). `next` فقط مسیر داخلی را می‌پذیرد.
- **تم**: رنگ برند با CSS variable در `globals.css`؛ نام فروشگاه/واحد پول از `Store.*` در تنظیمات API خوانده می‌شود → برای هر کسب‌وکار بدون تغییر کد قابل سفارشی‌سازی.

## صفحات
مشتری: `/` · `/products` · `/products/[slug]` · `/cart` · `/login` (ورود+ثبت‌نام) · `/checkout` · `/payment/result` · `/orders` · `/orders/[n]` · `/track` · `/account`  
مدیریت (`/admin`، نقش Admin/Manager): داشبورد · محصولات (فرم + مشخصات دلخواه + آپلود تصویر + موجودی) · دسته‌ها · سفارش‌ها (تغییر وضعیت طبق ماشین حالت) · کوپن · روش ارسال · نظرات · کاربران و تنظیمات (فقط Admin).

## اجرا
از ریشه پروژه: `docker compose up --build` → فروشگاه روی http://localhost:3000  
توسعه محلی: `cd web && cp .env.example .env.local && npm install && npm run dev` (API باید روی `API_INTERNAL_URL` باشد). بررسی تایپ: `npm run typecheck`.

## نکات استقرار
- پشت HTTPS: `COOKIE_SECURE=true`.
- پشت Reverse Proxy حتماً `X-Forwarded-For` را ست کنید تا Rate limit API بر اساس IP واقعی کاربر کار کند.
- `Payment__FrontendResultUrl` در API باید `https://دامنه-شما/payment/result` باشد.

## زبان‌ها (فارسی / English)
- زبان با کوکی `locale` ذخیره می‌شود (پیش‌فرض: فارسی) و با دکمهٔ تغییر زبان در هدر عوض می‌شود؛ جهت صفحه (`rtl`/`ltr`) و `lang` خودکار تنظیم می‌شوند.
- متن‌ها در `src/lib/i18n/messages/fa.ts` و `en.ts` هستند. کلیدهای `en.ts` با `fa.ts` تایپ‌چک می‌شوند، پس کلید جاافتاده خطای کامپایل می‌دهد. برای افزودن زبان جدید: به `LOCALES` در `src/lib/i18n/config.ts` اضافه کنید و یک فایل پیام بسازید.
- در کامپوننت‌های کلاینت از `useI18n()` و در Server Componentها از `getI18n()` استفاده کنید. اعداد، تاریخ و درصد از `fmt` می‌آیند.
- BFF مقدار زبان را به‌صورت هدر `Accept-Language` به API می‌فرستد.
