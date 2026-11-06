import type { OrderStatus } from './types';

export const currencyLabel = (code?: string) => (code === 'IRR' ? 'ریال' : code === 'IRT' || !code ? 'تومان' : code);

export const formatNumber = (n: number | string) => Number(n).toLocaleString('fa-IR');

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }) : 'â€”';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PendingPayment: 'در انتظار پرداخت',
  Paid: 'پرداخت شده',
  Processing: 'در حال پردازش',
  Shipped: 'ارسال شده',
  Delivered: 'تحویل داده شده',
  Cancelled: 'لغو شده',
  Refunded: 'مرجوع شده'
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  PendingPayment: 'bg-amber-100 text-amber-800',
  Paid: 'bg-blue-100 text-blue-800',
  Processing: 'bg-indigo-100 text-indigo-800',
  Shipped: 'bg-cyan-100 text-cyan-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-200 text-gray-700',
  Refunded: 'bg-red-100 text-red-800'
};

export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PendingPayment: ['Paid', 'Cancelled'],
  Paid: ['Processing', 'Cancelled', 'Refunded'],
  Processing: ['Shipped', 'Cancelled', 'Refunded'],
  Shipped: ['Delivered', 'Refunded'],
  Delivered: ['Refunded'],
  Cancelled: [],
  Refunded: []
};

/** ارقام فارسی/عربی را به لاتین تبدیل می‌کند (برای فیلدهای عددی/موبایل) */
export const faToEn = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

/** فقط مسیر داخلی سایت را برای redirect بعد از ورود می‌پذیرد (جلوگیری از Open Redirect) */
export const safeNext = (n: string | null | undefined, fallback = '/') =>
  n && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : fallback;

export const toIsoOrNull = (v: string) => (v ? new Date(v).toISOString() : null);
export const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));
