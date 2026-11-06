import Link from 'next/link';
import type { Metadata } from 'next';
import { getI18n } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: getI18n().t('meta.paymentResult') };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default function PaymentResult({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const { t } = getI18n();
  const ok = one(searchParams.success) === 'true';
  const orderNumber = one(searchParams.orderNumber);
  const refId = one(searchParams.refId);
  const message = one(searchParams.message);

  return (
    <div className="mx-auto max-w-lg">
      <div className="card space-y-4 py-10 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} aria-hidden>{ok ? '✓' : '✕'}</div>
        <h1 className="text-xl font-bold">{ok ? t('payment.successTitle') : t('payment.failTitle')}</h1>
        {message && <p className="text-gray-600">{message}</p>}
        {orderNumber && <p className="text-sm">{t('payment.orderNumber')} <bdi className="font-bold">{orderNumber}</bdi></p>}
        {ok && refId && <p className="text-sm">{t('payment.refId')} <bdi className="font-bold">{refId}</bdi></p>}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {orderNumber && <Link className="btn-primary" href={`/orders/${encodeURIComponent(orderNumber)}`}>{ok ? t('payment.viewOrder') : t('payment.retry')}</Link>}
          <Link className="btn-outline" href="/">{t('payment.home')}</Link>
        </div>
      </div>
    </div>
  );
}
