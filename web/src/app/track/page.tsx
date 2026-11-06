'use client';

import { useState } from 'react';
import { post } from '@/lib/api';
import type { TrackOrder } from '@/lib/types';
import { Alert, Field, PageTitle, StatusBadge, Timeline } from '@/components/Ui';
import { faToEn, formatDate } from '@/lib/format';

export default function TrackPage() {
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
      <PageTitle>ظ¾غŒع¯غŒط±غŒ ط³ظپط§ط±ط´</PageTitle>
      <form onSubmit={submit} className="card space-y-3">
        <Field label="ط´ظ…ط§ط±ظ‡ ط³ظپط§ط±ط´"><input className="input" dir="ltr" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} /></Field>
        <Field label="ط´ظ…ط§ط±ظ‡ ظ…ظˆط¨ط§غŒظ„ ع¯غŒط±ظ†ط¯ظ‡" hint="ظ‡ظ…ط§ظ† ط´ظ…ط§ط±ظ‡â€Œط§غŒ ع©ظ‡ ظ‡ظ†ع¯ط§ظ… ط«ط¨طھ ط³ظپط§ط±ط´ ظˆط§ط±ط¯ ع©ط±ط¯ظ‡â€Œط§غŒط¯"><input className="input" dir="ltr" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        {err && <Alert>{err}</Alert>}
        <button className="btn-primary w-full" disabled={busy}>ظ¾غŒع¯غŒط±غŒ</button>
      </form>
      {res && (
        <section className="card space-y-3">
          <div className="flex flex-wrap items-center gap-2"><b>ط³ظپط§ط±ط´ <bdi>{res.orderNumber}</bdi></b><StatusBadge status={res.status} /><span className="text-xs text-gray-500">{formatDate(res.createdAt)}</span></div>
          {res.trackingCode && <p className="text-sm">ع©ط¯ ط±ظ‡ع¯غŒط±غŒ ظ…ط±ط³ظˆظ„ظ‡: <bdi className="font-bold">{res.trackingCode}</bdi></p>}
          <ul className="text-sm text-gray-600">{res.items.map((i, k) => <li key={k}>â€¢ {i.productName} أ— {i.quantity.toLocaleString('fa-IR')}</li>)}</ul>
          <Timeline items={res.history} />
        </section>
      )}
    </div>
  );
}
