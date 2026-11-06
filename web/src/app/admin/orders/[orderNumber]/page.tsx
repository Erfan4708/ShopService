'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { put } from '@/lib/api';
import { NEXT_STATUSES, STATUS_LABEL, formatDate, formatNumber } from '@/lib/format';
import type { OrderDetail, OrderStatus } from '@/lib/types';
import { Alert, Field, PageTitle, Price, Spinner, StatusBadge, Timeline } from '@/components/Ui';

export default function AdminOrder({ params }: { params: { orderNumber: string } }) {
  const { data: o, error, mutate } = useSWR<OrderDetail>(`admin/orders/${encodeURIComponent(params.orderNumber)}`);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (error) return <Alert>{(error as Error).message}</Alert>;
  if (!o) return <Spinner />;
  const next = NEXT_STATUSES[o.status];

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!status) return;
    setBusy(true); setMsg(null);
    try {
      await mutate(await put<OrderDetail>(`admin/orders/${o!.orderNumber}/status`, { status, note: note || undefined, trackingCode: tracking || undefined }), false);
      setStatus(''); setNote(''); setTracking(''); setMsg({ kind: 'success', text: 'ظˆط¶ط¹غŒطھ ط³ظپط§ط±ط´ ط¨ظ‡â€Œط±ظˆط² ط´ط¯.' });
    } catch (e: any) { setMsg({ kind: 'error', text: e.message }); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <PageTitle action={<Link className="text-sm text-brand-600" href="/admin/orders">â†گ ط¨ط§ط²ع¯ط´طھ</Link>}>ط³ظپط§ط±ط´ <bdi>{o.orderNumber}</bdi> <StatusBadge status={o.status} /></PageTitle>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="card overflow-x-auto p-0">
            <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">ع©ط§ظ„ط§</th><th className="th">SKU</th><th className="th">طھط¹ط¯ط§ط¯</th><th className="th">ظ‚غŒظ…طھ ظˆط§ط­ط¯</th><th className="th">ط¬ظ…ط¹</th></tr></thead>
              <tbody className="divide-y">{o.items.map((i) => <tr key={i.productId}><td className="td">{i.productName}</td><td className="td"><bdi>{i.sku}</bdi></td><td className="td">{formatNumber(i.quantity)}</td><td className="td"><Price value={i.unitPrice} /></td><td className="td"><Price value={i.lineTotal} /></td></tr>)}</tbody></table>
          </section>
          <section className="card"><h2 className="mb-3 font-bold">طھط§ط±غŒط®ع†ظ‡</h2><Timeline items={o.history} /></section>
          <section className="card text-sm"><h2 className="mb-2 font-bold">ظ¾ط±ط¯ط§ط®طھâ€Œظ‡ط§</h2>
            {o.payments.length === 0 ? <p className="text-gray-500">ظ¾ط±ط¯ط§ط®طھغŒ ط«ط¨طھ ظ†ط´ط¯ظ‡ ط§ط³طھ.</p> :
              <ul className="space-y-1">{o.payments.map((p) => <li key={p.id} className="flex flex-wrap justify-between gap-2"><span>{p.gateway} â€” {formatDate(p.createdAt)}</span><span><Price value={p.amount} /> آ· {p.status}{p.refId && <> آ· <bdi>{p.refId}</bdi></>}</span></li>)}</ul>}</section>
        </div>
        <aside className="space-y-4">
          <form onSubmit={submit} className="card space-y-3">
            <h2 className="font-bold">طھط؛غŒغŒط± ظˆط¶ط¹غŒطھ</h2>
            {next.length === 0 ? <p className="text-sm text-gray-500">ط§غŒظ† ط³ظپط§ط±ط´ ط¯ط± ظˆط¶ط¹غŒطھ ظ†ظ‡ط§غŒغŒ ط§ط³طھ.</p> : (
              <>
                <Field label="ظˆط¶ط¹غŒطھ ط¬ط¯غŒط¯"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="">ط§ظ†طھط®ط§ط¨ ع©ظ†غŒط¯â€¦</option>{next.map((s: OrderStatus) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
                {status === 'Shipped' && <Field label="ع©ط¯ ط±ظ‡ع¯غŒط±غŒ ظ…ط±ط³ظˆظ„ظ‡"><input className="input" dir="ltr" value={tracking} onChange={(e) => setTracking(e.target.value)} /></Field>}
                <Field label="غŒط§ط¯ط¯ط§ط´طھ (ط¨ظ‡ ظ…ط´طھط±غŒ ظ†ظ…ط§غŒط´ ط¯ط§ط¯ظ‡ ظ…غŒâ€Œط´ظˆط¯)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                {status === 'Cancelled' && <Alert kind="info">ط¨ط§ ظ„ط؛ظˆطŒ ظ…ظˆط¬ظˆط¯غŒ ظˆ ع©ظˆظ¾ظ† ط¨ط§ط²ع¯ط±ط¯ط§ظ†ط¯ظ‡ ظ…غŒâ€Œط´ظˆط¯. ط¨ط§ط²ع¯ط´طھ ظˆط¬ظ‡ ط±ط§ ط¨ط§غŒط¯ ط§ط² ظ¾ظ†ظ„ ط¯ط±ع¯ط§ظ‡ ط§ظ†ط¬ط§ظ… ط¯ظ‡غŒط¯.</Alert>}
                <button className="btn-primary w-full" disabled={busy || !status}>ط«ط¨طھ</button>
              </>
            )}
            {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
          </form>
          <section className="card text-sm space-y-1"><h2 className="mb-1 font-bold">ع¯غŒط±ظ†ط¯ظ‡</h2>
            <p>{o.receiverName} â€” <bdi>{o.receiverPhone}</bdi></p><p className="text-gray-600">{o.province}طŒ {o.city}طŒ {o.addressLine}</p><p className="text-gray-600">ع©ط¯ ظ¾ط³طھغŒ: <bdi>{o.postalCode}</bdi></p>
            <p className="text-gray-600">ط§ط±ط³ط§ظ„: {o.shippingMethodName}</p>{o.trackingCode && <p>ع©ط¯ ط±ظ‡ع¯غŒط±غŒ: <bdi>{o.trackingCode}</bdi></p>}{o.note && <p className="text-gray-500">طھظˆط¶غŒط­ ظ…ط´طھط±غŒ: {o.note}</p>}</section>
          <section className="card text-sm space-y-1"><h2 className="mb-1 font-bold">ظ…ط¨ط§ظ„ط؛</h2>
            <div className="flex justify-between"><span>ط¬ظ…ط¹ ع©ط§ظ„ط§ظ‡ط§</span><Price value={o.subtotal} /></div>
            {o.discountTotal > 0 && <div className="flex justify-between"><span>طھط®ظپغŒظپ {o.couponCode && <bdi>({o.couponCode})</bdi>}</span><Price value={o.discountTotal} /></div>}
            <div className="flex justify-between"><span>ط§ط±ط³ط§ظ„</span><Price value={o.shippingCost} /></div>{o.taxTotal > 0 && <div className="flex justify-between"><span>ظ…ط§ظ„غŒط§طھ</span><Price value={o.taxTotal} /></div>}
            <div className="flex justify-between border-t pt-1 font-bold"><span>ع©ظ„</span><Price value={o.grandTotal} /></div></section>
        </aside>
      </div>
    </div>
  );
}
