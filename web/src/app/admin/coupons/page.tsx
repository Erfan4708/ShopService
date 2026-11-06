'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { del, post, put } from '@/lib/api';
import { formatDate, numOrNull, toIsoOrNull, toLocalInput } from '@/lib/format';
import type { Coupon } from '@/lib/types';
import { Alert, Field, PageTitle, Spinner } from '@/components/Ui';

const EMPTY = { code: '', description: '', type: 'Percent', value: '', maxDiscountAmount: '', minOrderAmount: '', usageLimit: '', startsAt: '', expiresAt: '', isActive: true };

export default function AdminCoupons() {
  const { data, mutate } = useSWR<Coupon[]>('admin/coupons');
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');
  if (!data) return <Spinner />;

  function edit(c: Coupon | null) {
    setErr(''); setEditing(c ? c.id : 'new');
    setF(c ? { code: c.code, description: c.description ?? '', type: c.type, value: String(c.value), maxDiscountAmount: c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : '', minOrderAmount: c.minOrderAmount != null ? String(c.minOrderAmount) : '', usageLimit: c.usageLimit != null ? String(c.usageLimit) : '', startsAt: toLocalInput(c.startsAt), expiresAt: toLocalInput(c.expiresAt), isActive: c.isActive } : EMPTY);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const body = { code: f.code.trim(), description: f.description || null, type: f.type, value: Number(f.value), maxDiscountAmount: numOrNull(f.maxDiscountAmount), minOrderAmount: numOrNull(f.minOrderAmount), usageLimit: numOrNull(f.usageLimit), startsAt: toIsoOrNull(f.startsAt), expiresAt: toIsoOrNull(f.expiresAt), isActive: f.isActive };
    try { if (editing === 'new') await post('admin/coupons', body); else await put(`admin/coupons/${editing}`, body); setEditing(null); await mutate(); }
    catch (e: any) { setErr(e.message); }
  }
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <PageTitle action={editing === null && <button className="btn-primary" onClick={() => edit(null)}>+ ع©ظˆظ¾ظ† ط¬ط¯غŒط¯</button>}>ع©ط¯ظ‡ط§غŒ طھط®ظپغŒظپ</PageTitle>
      {editing !== null && (
        <form onSubmit={save} className="card space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="ع©ط¯"><input className="input" dir="ltr" required value={f.code} onChange={set('code')} /></Field>
            <Field label="ظ†ظˆط¹"><select className="input" value={f.type} onChange={set('type')}><option value="Percent">ط¯ط±طµط¯غŒ</option><option value="FixedAmount">ظ…ط¨ظ„ط؛ ط«ط§ط¨طھ</option></select></Field>
            <Field label={f.type === 'Percent' ? 'ط¯ط±طµط¯ طھط®ظپغŒظپ' : 'ظ…ط¨ظ„ط؛ طھط®ظپغŒظپ'}><input className="input" type="number" min="0" step="any" required value={f.value} onChange={set('value')} /></Field>
            <Field label="ط³ظ‚ظپ طھط®ظپغŒظپ" hint="ط§ط®طھغŒط§ط±غŒ"><input className="input" type="number" min="0" value={f.maxDiscountAmount} onChange={set('maxDiscountAmount')} /></Field>
            <Field label="ط­ط¯ط§ظ‚ظ„ ظ…ط¨ظ„ط؛ ط³ظپط§ط±ط´" hint="ط§ط®طھغŒط§ط±غŒ"><input className="input" type="number" min="0" value={f.minOrderAmount} onChange={set('minOrderAmount')} /></Field>
            <Field label="ط³ظ‚ظپ ط¯ظپط¹ط§طھ ط§ط³طھظپط§ط¯ظ‡" hint="ط§ط®طھغŒط§ط±غŒ"><input className="input" type="number" min="1" value={f.usageLimit} onChange={set('usageLimit')} /></Field>
            <Field label="ط´ط±ظˆط¹ ط§ط¹طھط¨ط§ط±"><input className="input" type="datetime-local" value={f.startsAt} onChange={set('startsAt')} /></Field>
            <Field label="ظ¾ط§غŒط§ظ† ط§ط¹طھط¨ط§ط±"><input className="input" type="datetime-local" value={f.expiresAt} onChange={set('expiresAt')} /></Field>
            <Field label="طھظˆط¶غŒط­ط§طھ"><input className="input" value={f.description} onChange={set('description')} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> ظپط¹ط§ظ„</label>
          {err && <Alert>{err}</Alert>}
          <div className="flex gap-2"><button className="btn-primary">ط°ط®غŒط±ظ‡</button><button type="button" className="btn-outline" onClick={() => setEditing(null)}>ط§ظ†طµط±ط§ظپ</button></div>
        </form>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">ع©ط¯</th><th className="th">ظ…ظ‚ط¯ط§ط±</th><th className="th">ط§ط³طھظپط§ط¯ظ‡</th><th className="th">ط§ظ†ظ‚ط¶ط§</th><th className="th">ظˆط¶ط¹غŒطھ</th><th className="th" /></tr></thead>
          <tbody className="divide-y">{data.map((c) => (
            <tr key={c.id}><td className="td font-medium"><bdi>{c.code}</bdi></td><td className="td">{c.type === 'Percent' ? `${c.value.toLocaleString('fa-IR')}ظھ` : c.value.toLocaleString('fa-IR')}</td>
              <td className="td">{c.usedCount.toLocaleString('fa-IR')}{c.usageLimit ? ` / ${c.usageLimit.toLocaleString('fa-IR')}` : ''}</td><td className="td">{formatDate(c.expiresAt)}</td>
              <td className="td">{c.isActive ? <span className="badge bg-green-100 text-green-800">ظپط¹ط§ظ„</span> : <span className="badge bg-gray-200 text-gray-700">ط؛غŒط±ظپط¹ط§ظ„</span>}</td>
              <td className="td whitespace-nowrap"><button className="text-brand-600" onClick={() => edit(c)}>ظˆغŒط±ط§غŒط´</button>
                <button className="ms-3 text-red-600" onClick={async () => { if (confirm('ط­ط°ظپ ط´ظˆط¯طں')) { await del(`admin/coupons/${c.id}`); await mutate(); } }}>ط­ط°ظپ</button></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
