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
      setStatus(''); setNote(''); setTracking(''); setMsg({ kind: 'success', text: 'وضعیت سفارش به‌روز شد.' });
    } catch (e: any) { setMsg({ kind: 'error', text: e.message }); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <PageTitle action={<Link className="text-sm text-brand-600" href="/admin/orders">â†گ بازگشت</Link>}>سفارش <bdi>{o.orderNumber}</bdi> <StatusBadge status={o.status} /></PageTitle>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="card overflow-x-auto p-0">
            <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">کالا</th><th className="th">SKU</th><th className="th">تعداد</th><th className="th">قیمت واحد</th><th className="th">جمع</th></tr></thead>
              <tbody className="divide-y">{o.items.map((i) => <tr key={i.productId}><td className="td">{i.productName}</td><td className="td"><bdi>{i.sku}</bdi></td><td className="td">{formatNumber(i.quantity)}</td><td className="td"><Price value={i.unitPrice} /></td><td className="td"><Price value={i.lineTotal} /></td></tr>)}</tbody></table>
          </section>
          <section className="card"><h2 className="mb-3 font-bold">تاریخچه</h2><Timeline items={o.history} /></section>
          <section className="card text-sm"><h2 className="mb-2 font-bold">پرداخت‌ها</h2>
            {o.payments.length === 0 ? <p className="text-gray-500">پرداختی ثبت نشده است.</p> :
              <ul className="space-y-1">{o.payments.map((p) => <li key={p.id} className="flex flex-wrap justify-between gap-2"><span>{p.gateway} â€” {formatDate(p.createdAt)}</span><span><Price value={p.amount} /> آ· {p.status}{p.refId && <> آ· <bdi>{p.refId}</bdi></>}</span></li>)}</ul>}</section>
        </div>
        <aside className="space-y-4">
          <form onSubmit={submit} className="card space-y-3">
            <h2 className="font-bold">تغییر وضعیت</h2>
            {next.length === 0 ? <p className="text-sm text-gray-500">این سفارش در وضعیت نهایی است.</p> : (
              <>
                <Field label="وضعیت جدید"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)} required>
                  <option value="">انتخاب کنید…</option>{next.map((s: OrderStatus) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
                {status === 'Shipped' && <Field label="کد رهگیری مرسوله"><input className="input" dir="ltr" value={tracking} onChange={(e) => setTracking(e.target.value)} /></Field>}
                <Field label="یادداشت (به مشتری نمایش داده می‌شود)"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                {status === 'Cancelled' && <Alert kind="info">با لغو، موجودی و کوپن بازگردانده می‌شود. بازگشت وجه را باید از پنل درگاه انجام دهید.</Alert>}
                <button className="btn-primary w-full" disabled={busy || !status}>ثبت</button>
              </>
            )}
            {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
          </form>
          <section className="card text-sm space-y-1"><h2 className="mb-1 font-bold">گیرنده</h2>
            <p>{o.receiverName} â€” <bdi>{o.receiverPhone}</bdi></p><p className="text-gray-600">{o.province}، {o.city}، {o.addressLine}</p><p className="text-gray-600">کد پستی: <bdi>{o.postalCode}</bdi></p>
            <p className="text-gray-600">ارسال: {o.shippingMethodName}</p>{o.trackingCode && <p>کد رهگیری: <bdi>{o.trackingCode}</bdi></p>}{o.note && <p className="text-gray-500">توضیح مشتری: {o.note}</p>}</section>
          <section className="card text-sm space-y-1"><h2 className="mb-1 font-bold">مبالغ</h2>
            <div className="flex justify-between"><span>جمع کالاها</span><Price value={o.subtotal} /></div>
            {o.discountTotal > 0 && <div className="flex justify-between"><span>تخفیف {o.couponCode && <bdi>({o.couponCode})</bdi>}</span><Price value={o.discountTotal} /></div>}
            <div className="flex justify-between"><span>ارسال</span><Price value={o.shippingCost} /></div>{o.taxTotal > 0 && <div className="flex justify-between"><span>مالیات</span><Price value={o.taxTotal} /></div>}
            <div className="flex justify-between border-t pt-1 font-bold"><span>کل</span><Price value={o.grandTotal} /></div></section>
        </aside>
      </div>
    </div>
  );
}
