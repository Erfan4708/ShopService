import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'نتیجه پرداخت' };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default function PaymentResult({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const ok = one(searchParams.success) === 'true';
  const orderNumber = one(searchParams.orderNumber);
  const refId = one(searchParams.refId);
  const message = one(searchParams.message);

  return (
    <div className="mx-auto max-w-lg">
      <div className="card space-y-4 py-10 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} aria-hidden>{ok ? 'âœ“' : 'âœ•'}</div>
        <h1 className="text-xl font-bold">{ok ? 'پرداخت با موفقیت انجام شد' : 'پرداخت ناموفق بود'}</h1>
        {message && <p className="text-gray-600">{message}</p>}
        {orderNumber && <p className="text-sm">شماره سفارش: <bdi className="font-bold">{orderNumber}</bdi></p>}
        {ok && refId && <p className="text-sm">کد پیگیری بانکی: <bdi className="font-bold">{refId}</bdi></p>}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {orderNumber && <Link className="btn-primary" href={`/orders/${encodeURIComponent(orderNumber)}`}>{ok ? 'مشاهده سفارش' : 'بازگشت به سفارش و پرداخت مجدد'}</Link>}
          <Link className="btn-outline" href="/">صفحه اصلی</Link>
        </div>
      </div>
    </div>
  );
}
