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
      <PageTitle action={editing === null && <button className="btn-primary" onClick={() => edit(null)}>+ روش ارسال جدید</button>}>روش‌های ارسال</PageTitle>
      {editing !== null && (
        <form onSubmit={save} className="card space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="نام"><input className="input" required value={f.name} onChange={set('name')} /></Field>
            <Field label="هزینه"><input className="input" type="number" min="0" required value={f.cost} onChange={set('cost')} /></Field>
            <Field label="رایگان بالای مبلغ" hint="اختیاری"><input className="input" type="number" min="0" value={f.freeAboveAmount} onChange={set('freeAboveAmount')} /></Field>
            <Field label="زمان تحویل (روز)"><input className="input" type="number" min="0" value={f.estimatedDays} onChange={set('estimatedDays')} /></Field>
            <Field label="ترتیب"><input className="input" type="number" value={f.sortOrder} onChange={set('sortOrder')} /></Field>
            <Field label="توضیحات"><input className="input" value={f.description} onChange={set('description')} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> فعال</label>
          {err && <Alert>{err}</Alert>}
          <div className="flex gap-2"><button className="btn-primary">ذخیره</button><button type="button" className="btn-outline" onClick={() => setEditing(null)}>انصراف</button></div>
        </form>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">نام</th><th className="th">هزینه</th><th className="th">رایگان بالای</th><th className="th">زمان</th><th className="th">وضعیت</th><th className="th" /></tr></thead>
          <tbody className="divide-y">{data.map((m) => (
            <tr key={m.id}><td className="td font-medium">{m.name}</td><td className="td"><Price value={m.cost} /></td><td className="td">{m.freeAboveAmount ? <Price value={m.freeAboveAmount} /> : 'â€”'}</td>
              <td className="td">{m.estimatedDays ? `${m.estimatedDays.toLocaleString('fa-IR')} روز` : 'â€”'}</td>
              <td className="td">{m.isActive ? <span className="badge bg-green-100 text-green-800">فعال</span> : <span className="badge bg-gray-200 text-gray-700">غیرفعال</span>}</td>
              <td className="td whitespace-nowrap"><button className="text-brand-600" onClick={() => edit(m)}>ویرایش</button>
                <button className="ms-3 text-red-600" onClick={async () => { if (confirm('حذف شود؟')) { await del(`admin/shipping-methods/${m.id}`); await mutate(); } }}>حذف</button></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
