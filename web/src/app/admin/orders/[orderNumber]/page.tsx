'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { put } from '@/lib/api';
import { NEXT_STATUSES } from '@/lib/format';
import { useI18n } from '@/lib/i18n/client';
import type { OrderDetail, OrderStatus } from '@/lib/types';
import { Alert, Field, PageTitle, Price, Spinner, StatusBadge, Timeline } from '@/components/Ui';

export default function AdminOrder({ params }: { params: { orderNumber: string } }) {
  const { t, fmt } = useI18n();
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
      setStatus(''); setNote(''); setTracking(''); setMsg({ kind: 'success', text: t('admin.order.updated') });
    } catch (e: any) { setMsg({ kind: 'error', text: e.message }); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <PageTitle action={<Link className="text-sm text-brand-600" href="/admin/orders">{t('admin.orders.back')}</Link>}>{t('orders.heading')} <bdi>{o.orderNumber}</bdi> <StatusBadge status={o.status} /></PageTitle>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="card overflow-x-auto p-0">
            <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">{t('admin.order.product')}</th><th className="th">SKU</th><th className="th">{t('admin.order.qty')}</th><th className="th">{t('admin.order.unitPrice')}</th><th className="th">{t('admin.order.lineTotal')}</th></tr></thead>
              <tbody className="divide-y">{o.items.map((i) => <tr key={i.productId}><td className="td">{i.productName}</td><td className="td"><bdi>{i.sku}</bdi></td><td className="td">{fmt.number(i.quantity)}</td><td className="td"><Price value={i.unitPrice} /></td><td className="td"><Price value={i.lineTotal} /></td></tr>)}</tbody></table>
          </section>
          <section className="card"><h2 className="mb-3 font-bold">{t('admin.order.history')}</h2><Timeline items={o.history} /></section>
          <section className="card text-sm"><h2 className="mb-2 font-bold">{t('orders.payments')}</h2>
            {o.payments.length === 0 ? <p className="text-gray-500">{t('admin.order.noPayments')}</p> :
              <ul className="space-y-1">{o.payments.map((p) => <li key={p.id} className="flex flex-wrap justify-between gap-2"><span>{p.gateway} — {fmt.date(p.createdAt)}</span><span><Price value={p.amount} /> · {t(`payment.status.${p.status}`)}{p.refId && <> · <bdi>{p.refId}</bdi></>}</span></li>)}</ul>}</section>
        </div>
        <aside className="space-y-4">
          <form onSubmit={submit} className="card space-y-3">
            <h2 className="font-bold">{t('admin.order.changeStatus')}</h2>
            {next.length === 0 ? <p className="text-sm text-gray-500">{t('admin.order.finalState')}</p> : (
              <>
                <Field label={t('admin.order.newStatus')}><select className="input" value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="">{t('admin.order.selectStatus')}</option>{next.map((s: OrderStatus) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}</select></Field>
                {status === 'Shipped' && <Field label={t('admin.order.trackingCode')}><input className="input" dir="ltr" value={tracking} onChange={(e) => setTracking(e.target.value)} /></Field>}
                <Field label={t('admin.order.note')}><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                {status === 'Cancelled' && <Alert kind="info">{t('admin.order.cancelNotice')}</Alert>}
                <button className="btn-primary w-full" disabled={busy || !status}>{t('admin.order.submit')}</button>
              </>
            )}
            {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
          </form>
          <section className="card text-sm space-y-1"><h2 className="mb-1 font-bold">{t('admin.order.recipient')}</h2>
            <p>{o.receiverName} — <bdi>{o.receiverPhone}</bdi></p><p className="text-gray-600">{[o.province, o.city, o.addressLine].join(t('list.separator'))}</p><p className="text-gray-600">{t('address.postalCodeLabel')} <bdi>{o.postalCode}</bdi></p>
            <p className="text-gray-600">{t('admin.order.shippingMethod', { name: o.shippingMethodName })}</p>{o.trackingCode && <p>{t('admin.order.trackingLine')} <bdi>{o.trackingCode}</bdi></p>}{o.note && <p className="text-gray-500">{t('admin.order.customerNote')} {o.note}</p>}</section>
          <section className="card text-sm space-y-1"><h2 className="mb-1 font-bold">{t('admin.order.amounts')}</h2>
            <div className="flex justify-between"><span>{t('cart.subtotal')}</span><Price value={o.subtotal} /></div>
            {o.discountTotal > 0 && <div className="flex justify-between"><span>{t('cart.discount')} {o.couponCode && <bdi>({o.couponCode})</bdi>}</span><Price value={o.discountTotal} /></div>}
            <div className="flex justify-between"><span>{t('admin.order.shipping')}</span><Price value={o.shippingCost} /></div>{o.taxTotal > 0 && <div className="flex justify-between"><span>{t('checkout.tax')}</span><Price value={o.taxTotal} /></div>}
            <div className="flex justify-between border-t pt-1 font-bold"><span>{t('admin.order.total')}</span><Price value={o.grandTotal} /></div></section>
        </aside>
      </div>
    </div>
  );
}
