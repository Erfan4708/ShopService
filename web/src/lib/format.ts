import type { OrderStatus } from './types';

export const currencyLabel = (code?: string) => (code === 'IRR' ? 'ط±غŒط§ظ„' : code === 'IRT' || !code ? 'طھظˆظ…ط§ظ†' : code);

export const formatNumber = (n: number | string) => Number(n).toLocaleString('fa-IR');

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }) : 'â€”';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PendingPayment: 'ط¯ط± ط§ظ†طھط¸ط§ط± ظ¾ط±ط¯ط§ط®طھ',
  Paid: 'ظ¾ط±ط¯ط§ط®طھ ط´ط¯ظ‡',
  Processing: 'ط¯ط± ط­ط§ظ„ ظ¾ط±ط¯ط§ط²ط´',
  Shipped: 'ط§ط±ط³ط§ظ„ ط´ط¯ظ‡',
  Delivered: 'طھط­ظˆغŒظ„ ط¯ط§ط¯ظ‡ ط´ط¯ظ‡',
  Cancelled: 'ظ„ط؛ظˆ ط´ط¯ظ‡',
  Refunded: 'ظ…ط±ط¬ظˆط¹ ط´ط¯ظ‡'
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

/** ط§ط±ظ‚ط§ظ… ظپط§ط±ط³غŒ/ط¹ط±ط¨غŒ ط±ط§ ط¨ظ‡ ظ„ط§طھغŒظ† طھط¨ط¯غŒظ„ ظ…غŒâ€Œع©ظ†ط¯ (ط¨ط±ط§غŒ ظپغŒظ„ط¯ظ‡ط§غŒ ط¹ط¯ط¯غŒ/ظ…ظˆط¨ط§غŒظ„) */
export const faToEn = (s: string) =>
  s.replace(/[غ°-غ¹]/g, (d) => String('غ°غ±غ²غ³غ´غµغ¶غ·غ¸غ¹'.indexOf(d))).replace(/[ظ -ظ©]/g, (d) => String('ظ ظ،ظ¢ظ£ظ¤ظ¥ظ¦ظ§ظ¨ظ©'.indexOf(d)));

/** ظپظ‚ط· ظ…ط³غŒط± ط¯ط§ط®ظ„غŒ ط³ط§غŒطھ ط±ط§ ط¨ط±ط§غŒ redirect ط¨ط¹ط¯ ط§ط² ظˆط±ظˆط¯ ظ…غŒâ€Œظ¾ط°غŒط±ط¯ (ط¬ظ„ظˆع¯غŒط±غŒ ط§ط² Open Redirect) */
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
