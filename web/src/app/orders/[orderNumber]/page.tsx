'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { post } from '@/lib/api';
import type { OrderDetail, StartPayment } from '@/lib/types';
import { Alert, PageTitle, Price, ProductImg, Spinner, StatusBadge, Timeline } from '@/components/Ui';
import { formatDate, formatNumber } from '@/lib/format';

const PAY_STATUS = { Pending: 'ط¯ط± ط§ظ†طھط¸ط§ط±', Succeeded: 'ظ…ظˆظپظ‚', Failed: 'ظ†ط§ظ…ظˆظپظ‚' } as const;

export default function OrderPage({ params }: { params: { orderNumber: string } }) {
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
    if (!confirm('ط³ظپط§ط±ط´ ظ„ط؛ظˆ ط´ظˆط¯طں')) return;
    setBusy(true); setErr('');
    try { await mutate(await post<OrderDetail>(`orders/${o!.orderNumber}/cancel`), false); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <PageTitle action={<Link href="/orders" className="text-sm text-brand-600">â†گ ظ‡ظ…ظ‡ ط³ظپط§ط±ط´â€Œظ‡ط§</Link>}>
        ط³ظپط§ط±ط´ <bdi>{o.orderNumber}</bdi> <StatusBadge status={o.status} />
      </PageTitle>
      {err && <Alert>{err}</Alert>}
      {o.status === 'PendingPayment' && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50">
          <span className="text-sm">ط§غŒظ† ط³ظپط§ط±ط´ ظ‡ظ†ظˆط² ظ¾ط±ط¯ط§ط®طھ ظ†ط´ط¯ظ‡ ظˆ ط¯ط± ظ…ظ‡ظ„طھ ظ…ظ‚ط±ط± ظ„ط؛ظˆ ظ…غŒâ€Œط´ظˆط¯.</span>
          <span className="flex gap-2"><button className="btn-primary" disabled={busy} onClick={pay}>ظ¾ط±ط¯ط§ط®طھ</button><button className="btn-outline" disabled={busy} onClick={cancel}>ظ„ط؛ظˆ ط³ظپط§ط±ط´</button></span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="card">
            <h2 className="mb-2 font-bold">ط§ظ‚ظ„ط§ظ…</h2>
            <ul className="divide-y">
              {o.items.map((i) => (
                <li key={i.productId} className="flex items-center gap-3 py-2">
                  <ProductImg src={i.imageUrl} alt={i.productName} className="h-14 w-14 shrink-0 rounded-lg" />
                  <span className="flex-1 text-sm">{i.productName}<span className="block text-xs text-gray-400">{formatNumber(i.quantity)} أ— <Price value={i.unitPrice} /></span></span>
                  <Price value={i.lineTotal} className="font-medium" />
                </li>
              ))}
            </ul>
          </section>
          <section className="card"><h2 className="mb-3 font-bold">ظ¾غŒع¯غŒط±غŒ</h2>
            {o.trackingCode && <p className="mb-3 text-sm">ع©ط¯ ط±ظ‡ع¯غŒط±غŒ ظ…ط±ط³ظˆظ„ظ‡: <bdi className="font-bold">{o.trackingCode}</bdi></p>}
            <Timeline items={o.history} /></section>
        </div>
        <aside className="space-y-4">
          <section className="card text-sm">
            <h2 className="mb-2 font-bold">طµظˆط±طھâ€Œط­ط³ط§ط¨</h2>
            <dl className="space-y-1.5">
              <div className="flex justify-between"><dt>ط¬ظ…ط¹ ع©ط§ظ„ط§ظ‡ط§</dt><dd><Price value={o.subtotal} /></dd></div>
              {o.discountTotal > 0 && <div className="flex justify-between text-green-700"><dt>طھط®ظپغŒظپ {o.couponCode && <bdi>({o.couponCode})</bdi>}</dt><dd>âˆ’ <Price value={o.discountTotal} /></dd></div>}
              <div className="flex justify-between"><dt>ط§ط±ط³ط§ظ„ ({o.shippingMethodName})</dt><dd>{o.shippingCost === 0 ? 'ط±ط§غŒع¯ط§ظ†' : <Price value={o.shippingCost} />}</dd></div>
              {o.taxTotal > 0 && <div className="flex justify-between"><dt>ظ…ط§ظ„غŒط§طھ</dt><dd><Price value={o.taxTotal} /></dd></div>}
              <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>ظ…ط¨ظ„ط؛ ع©ظ„</dt><dd><Price value={o.grandTotal} /></dd></div>
            </dl>
          </section>
          <section className="card text-sm"><h2 className="mb-2 font-bold">طھط­ظˆغŒظ„â€Œع¯غŒط±ظ†ط¯ظ‡</h2>
            <p>{o.receiverName} â€” <bdi>{o.receiverPhone}</bdi></p>
            <p className="text-gray-600">{o.province}طŒ {o.city}طŒ {o.addressLine}</p><p className="text-gray-600">ع©ط¯ ظ¾ط³طھغŒ: <bdi>{o.postalCode}</bdi></p>
            {o.note && <p className="mt-2 text-gray-500">طھظˆط¶غŒط­ط§طھ: {o.note}</p>}</section>
          {o.payments.length > 0 && (
            <section className="card text-sm"><h2 className="mb-2 font-bold">ظ¾ط±ط¯ط§ط®طھâ€Œظ‡ط§</h2>
              <ul className="space-y-1">{o.payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-2"><span>{formatDate(p.createdAt)}</span><span>{PAY_STATUS[p.status]}{p.refId && <> آ· <bdi>{p.refId}</bdi></>}</span></li>))}</ul></section>
          )}
        </aside>
      </div>
    </div>
  );
}
