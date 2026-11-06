'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { del, post, put } from '@/lib/api';
import { numOrNull } from '@/lib/format';
import type { ShippingMethod } from '@/lib/types';
import { Alert, Field, PageTitle, Price, Spinner } from '@/components/Ui';

type Row = ShippingMethod & { sortOrder: number; isActive: boolean };
const EMPTY = { name: '', description: '', cost: '0', freeAboveAmount: '', estimatedDays: '', sortOrder: '0', isActive: true };

export default function AdminShipping() {
  const { data, mutate } = useSWR<Row[]>('admin/shipping-methods');
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');
  if (!data) return <Spinner />;

  function edit(m: Row | null) {
    setErr(''); setEditing(m ? m.id : 'new');
    setF(m ? { name: m.name, description: m.description ?? '', cost: String(m.cost), freeAboveAmount: m.freeAboveAmount != null ? String(m.freeAboveAmount) : '', estimatedDays: m.estimatedDays != null ? String(m.estimatedDays) : '', sortOrder: String(m.sortOrder), isActive: m.isActive } : EMPTY);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const body = { name: f.name.trim(), description: f.description || null, cost: Number(f.cost || 0), freeAboveAmount: numOrNull(f.freeAboveAmount), estimatedDays: numOrNull(f.estimatedDays), sortOrder: Number(f.sortOrder || 0), isActive: f.isActive };
    try { if (editing === 'new') await post('admin/shipping-methods', body); else await put(`admin/shipping-methods/${editing}`, body); setEditing(null); await mutate(); }
    catch (e: any) { setErr(e.message); }
  }
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <PageTitle action={editing === null && <button className="btn-primary" onClick={() => edit(null)}>+ ط±ظˆط´ ط§ط±ط³ط§ظ„ ط¬ط¯غŒط¯</button>}>ط±ظˆط´â€Œظ‡ط§غŒ ط§ط±ط³ط§ظ„</PageTitle>
      {editing !== null && (
        <form onSubmit={save} className="card space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="ظ†ط§ظ…"><input className="input" required value={f.name} onChange={set('name')} /></Field>
            <Field label="ظ‡ط²غŒظ†ظ‡"><input className="input" type="number" min="0" required value={f.cost} onChange={set('cost')} /></Field>
            <Field label="ط±ط§غŒع¯ط§ظ† ط¨ط§ظ„ط§غŒ ظ…ط¨ظ„ط؛" hint="ط§ط®طھغŒط§ط±غŒ"><input className="input" type="number" min="0" value={f.freeAboveAmount} onChange={set('freeAboveAmount')} /></Field>
            <Field label="ط²ظ…ط§ظ† طھط­ظˆغŒظ„ (ط±ظˆط²)"><input className="input" type="number" min="0" value={f.estimatedDays} onChange={set('estimatedDays')} /></Field>
            <Field label="طھط±طھغŒط¨"><input className="input" type="number" value={f.sortOrder} onChange={set('sortOrder')} /></Field>
            <Field label="طھظˆط¶غŒط­ط§طھ"><input className="input" value={f.description} onChange={set('description')} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> ظپط¹ط§ظ„</label>
          {err && <Alert>{err}</Alert>}
          <div className="flex gap-2"><button className="btn-primary">ط°ط®غŒط±ظ‡</button><button type="button" className="btn-outline" onClick={() => setEditing(null)}>ط§ظ†طµط±ط§ظپ</button></div>
        </form>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">ظ†ط§ظ…</th><th className="th">ظ‡ط²غŒظ†ظ‡</th><th className="th">ط±ط§غŒع¯ط§ظ† ط¨ط§ظ„ط§غŒ</th><th className="th">ط²ظ…ط§ظ†</th><th className="th">ظˆط¶ط¹غŒطھ</th><th className="th" /></tr></thead>
          <tbody className="divide-y">{data.map((m) => (
            <tr key={m.id}><td className="td font-medium">{m.name}</td><td className="td"><Price value={m.cost} /></td><td className="td">{m.freeAboveAmount ? <Price value={m.freeAboveAmount} /> : 'â€”'}</td>
              <td className="td">{m.estimatedDays ? `${m.estimatedDays.toLocaleString('fa-IR')} ط±ظˆط²` : 'â€”'}</td>
              <td className="td">{m.isActive ? <span className="badge bg-green-100 text-green-800">ظپط¹ط§ظ„</span> : <span className="badge bg-gray-200 text-gray-700">ط؛غŒط±ظپط¹ط§ظ„</span>}</td>
              <td className="td whitespace-nowrap"><button className="text-brand-600" onClick={() => edit(m)}>ظˆغŒط±ط§غŒط´</button>
                <button className="ms-3 text-red-600" onClick={async () => { if (confirm('ط­ط°ظپ ط´ظˆط¯طں')) { await del(`admin/shipping-methods/${m.id}`); await mutate(); } }}>ط­ط°ظپ</button></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
