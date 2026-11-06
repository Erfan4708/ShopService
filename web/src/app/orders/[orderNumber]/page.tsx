'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { post } from '@/lib/api';
import { useI18n } from '@/lib/i18n/client';
import type { OrderDetail, StartPayment } from '@/lib/types';
import { Alert, PageTitle, Price, ProductImg, Spinner, StatusBadge, Timeline } from '@/components/Ui';

export default function OrderPage({ params }: { params: { orderNumber: string } }) {
  const { t, fmt } = useI18n();
  const { data: o, error, mutate } = useSWR<OrderDetail>(`orders/${encodeURIComponent(params.orderNumber)}`);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (error) return <Alert>{(error as Error).message}</Alert>;
  if (!o) return <Spinner />;

  async function pay() {
    setBusy(true); setErr('');
    try { const r = await post<StartPayment>('payments/start', { orderId: o!.id }); window.location.href = r.paymentUrl; }
    catch (e: any) { setErr(e.message); setBusy(false); }
  }
  async function cancel() {
    if (!confirm(t('orders.cancelConfirm'))) return;
    setBusy(true); setErr('');
    try { await mutate(await post<OrderDetail>(`orders/${o!.orderNumber}/cancel`), false); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <PageTitle action={<Link href="/orders" className="text-sm text-brand-600">{t('orders.back')}</Link>}>
        {t('orders.heading')} <bdi>{o.orderNumber}</bdi> <StatusBadge status={o.status} />
      </PageTitle>
      {err && <Alert>{err}</Alert>}
      {o.status === 'PendingPayment' && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50">
          <span className="text-sm">{t('orders.pendingNotice')}</span>
          <span className="flex gap-2"><button className="btn-primary" disabled={busy} onClick={pay}>{t('orders.pay')}</button><button className="btn-outline" disabled={busy} onClick={cancel}>{t('orders.cancel')}</button></span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="card">
            <h2 className="mb-2 font-bold">{t('orders.itemsTitle')}</h2>
            <ul className="divide-y">
              {o.items.map((i) => (
                <li key={i.productId} className="flex items-center gap-3 py-2">
                  <ProductImg src={i.imageUrl} alt={i.productName} className="h-14 w-14 shrink-0 rounded-lg" />
                  <span className="flex-1 text-sm">{i.productName}<span className="block text-xs text-gray-400">{fmt.number(i.quantity)} × <Price value={i.unitPrice} /></span></span>
                  <Price value={i.lineTotal} className="font-medium" />
                </li>
              ))}
            </ul>
          </section>
          <section className="card"><h2 className="mb-3 font-bold">{t('orders.tracking')}</h2>
            {o.trackingCode && <p className="mb-3 text-sm">{t('orders.trackingCode')} <bdi className="font-bold">{o.trackingCode}</bdi></p>}
            <Timeline items={o.history} /></section>
        </div>
        <aside className="space-y-4">
          <section className="card text-sm">
            <h2 className="mb-2 font-bold">{t('orders.invoice')}</h2>
            <dl className="space-y-1.5">
              <div className="flex justify-between"><dt>{t('cart.subtotal')}</dt><dd><Price value={o.subtotal} /></dd></div>
              {o.discountTotal > 0 && <div className="flex justify-between text-green-700"><dt>{t('cart.discount')} {o.couponCode && <bdi>({o.couponCode})</bdi>}</dt><dd>− <Price value={o.discountTotal} /></dd></div>}
              <div className="flex justify-between"><dt>{t('orders.shippingLine', { method: o.shippingMethodName })}</dt><dd>{o.shippingCost === 0 ? t('common.free') : <Price value={o.shippingCost} />}</dd></div>
              {o.taxTotal > 0 && <div className="flex justify-between"><dt>{t('checkout.tax')}</dt><dd><Price value={o.taxTotal} /></dd></div>}
              <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>{t('orders.total')}</dt><dd><Price value={o.grandTotal} /></dd></div>
            </dl>
          </section>
          <section className="card text-sm"><h2 className="mb-2 font-bold">{t('orders.receiver')}</h2>
            <p>{o.receiverName} — <bdi>{o.receiverPhone}</bdi></p>
            <p className="text-gray-600">{[o.province, o.city, o.addressLine].join(t('list.separator'))}</p><p className="text-gray-600">{t('address.postalCodeLabel')} <bdi>{o.postalCode}</bdi></p>
            {o.note && <p className="mt-2 text-gray-500">{t('orders.note')} {o.note}</p>}</section>
          {o.payments.length > 0 && (
            <section className="card text-sm"><h2 className="mb-2 font-bold">{t('orders.payments')}</h2>
              <ul className="space-y-1">{o.payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-2"><span>{fmt.date(p.createdAt)}</span><span>{t(`payment.status.${p.status}`)}{p.refId && <> · <bdi>{p.refId}</bdi></>}</span></li>))}</ul></section>
          )}
        </aside>
      </div>
    </div>
  );
}
