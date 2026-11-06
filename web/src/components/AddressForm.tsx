'use client';

import { useState } from 'react';
import { post, put } from '@/lib/api';
import { faToEn } from '@/lib/format';
import type { Address } from '@/lib/types';
import { Alert, Field } from './Ui';

export default function AddressForm({ initial, onSaved, onCancel }: { initial?: Address; onSaved: (a: Address) => void; onCancel?: () => void }) {
  const [f, setF] = useState({
    title: initial?.title ?? '', receiverName: initial?.receiverName ?? '', receiverPhone: initial?.receiverPhone ?? '',
    province: initial?.province ?? '', city: initial?.city ?? '', postalCode: initial?.postalCode ?? '',
    addressLine: initial?.addressLine ?? '', isDefault: initial?.isDefault ?? false
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const body = { ...f, receiverPhone: faToEn(f.receiverPhone.trim()), postalCode: faToEn(f.postalCode.trim()) };
    try {
      const saved = initial ? await put<Address>(`account/addresses/${initial.id}`, body) : await post<Address>('account/addresses', body);
      onSaved(saved);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ط¹ظ†ظˆط§ظ† ط¢ط¯ط±ط³ (ظ…ط«ظ„ط§ظ‹ ط®ط§ظ†ظ‡)"><input className="input" required value={f.title} onChange={set('title')} /></Field>
        <Field label="ظ†ط§ظ… ع¯غŒط±ظ†ط¯ظ‡"><input className="input" required value={f.receiverName} onChange={set('receiverName')} /></Field>
        <Field label="ظ…ظˆط¨ط§غŒظ„ ع¯غŒط±ظ†ط¯ظ‡"><input className="input" dir="ltr" inputMode="tel" required value={f.receiverPhone} onChange={set('receiverPhone')} /></Field>
        <Field label="ع©ط¯ ظ¾ط³طھغŒ"><input className="input" dir="ltr" inputMode="numeric" required value={f.postalCode} onChange={set('postalCode')} /></Field>
        <Field label="ط§ط³طھط§ظ†"><input className="input" required value={f.province} onChange={set('province')} /></Field>
        <Field label="ط´ظ‡ط±"><input className="input" required value={f.city} onChange={set('city')} /></Field>
      </div>
      <Field label="ظ†ط´ط§ظ†غŒ ع©ط§ظ…ظ„"><textarea className="input" rows={2} required value={f.addressLine} onChange={set('addressLine')} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isDefault} onChange={(e) => setF({ ...f, isDefault: e.target.checked })} /> ط¢ط¯ط±ط³ ظ¾غŒط´â€Œظپط±ط¶</label>
      {err && <Alert>{err}</Alert>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={busy}>ط°ط®غŒط±ظ‡ ط¢ط¯ط±ط³</button>
        {onCancel && <button type="button" className="btn-outline" onClick={onCancel}>ط§ظ†طµط±ط§ظپ</button>}
      </div>
    </form>
  );
}
