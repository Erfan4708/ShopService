'use client';

import { useState } from 'react';
import { post } from '@/lib/api';
import { useI18n } from '@/lib/i18n/client';
import type { TrackOrder } from '@/lib/types';
import { Alert, Field, PageTitle, StatusBadge, Timeline } from '@/components/Ui';
import { faToEn } from '@/lib/format';

export default function TrackPage() {
  const { t, fmt } = useI18n();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [res, setRes] = useState<TrackOrder | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(''); setRes(null);
    try { setRes(await post<TrackOrder>('orders/track', { orderNumber: faToEn(orderNumber.trim()), phone: faToEn(phone.trim()) })); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageTitle>{t('track.title')}</PageTitle>
      <form onSubmit={submit} className="card space-y-3">
        <Field label={t('track.orderNumber')}><input className="input" dir="ltr" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} /></Field>
        <Field label={t('track.phone')} hint={t('track.phoneHint')}><input className="input" dir="ltr" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        {err && <Alert>{err}</Alert>}
        <button className="btn-primary w-full" disabled={busy}>{t('track.submit')}</button>
      </form>
      {res && (
        <section className="card space-y-3">
          <div className="flex flex-wrap items-center gap-2"><b>{t('orders.heading')} <bdi>{res.orderNumber}</bdi></b><StatusBadge status={res.status} /><span className="text-xs text-gray-500">{fmt.date(res.createdAt)}</span></div>
          {res.trackingCode && <p className="text-sm">{t('orders.trackingCode')} <bdi className="font-bold">{res.trackingCode}</bdi></p>}
          <ul className="text-sm text-gray-600">{res.items.map((i, k) => <li key={k}>• {i.productName} × {fmt.number(i.quantity)}</li>)}</ul>
          <Timeline items={res.history} />
        </section>
      )}
    </div>
  );
}
