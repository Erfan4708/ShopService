'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { del, post, put } from '@/lib/api';
import { numOrNull, toIsoOrNull, toLocalInput } from '@/lib/format';
import { useI18n } from '@/lib/i18n/client';
import type { Coupon } from '@/lib/types';
import { Alert, Field, PageTitle, Spinner } from '@/components/Ui';

const EMPTY = { code: '', description: '', type: 'Percent', value: '', maxDiscountAmount: '', minOrderAmount: '', usageLimit: '', startsAt: '', expiresAt: '', isActive: true };

export default function AdminCoupons() {
  const { t, fmt } = useI18n();
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
      <PageTitle action={editing === null && <button className="btn-primary" onClick={() => edit(null)}>{t('admin.coupons.new')}</button>}>{t('admin.coupons.title')}</PageTitle>
      {editing !== null && (
        <form onSubmit={save} className="card space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label={t('admin.coupons.code')}><input className="input" dir="ltr" required value={f.code} onChange={set('code')} /></Field>
            <Field label={t('admin.coupons.type')}><select className="input" value={f.type} onChange={set('type')}><option value="Percent">{t('admin.coupons.percent')}</option><option value="FixedAmount">{t('admin.coupons.fixed')}</option></select></Field>
            <Field label={f.type === 'Percent' ? t('admin.coupons.valuePercent') : t('admin.coupons.valueAmount')}><input className="input" type="number" min="0" step="any" required value={f.value} onChange={set('value')} /></Field>
            <Field label={t('admin.coupons.maxDiscount')} hint={t('common.optional')}><input className="input" type="number" min="0" value={f.maxDiscountAmount} onChange={set('maxDiscountAmount')} /></Field>
            <Field label={t('admin.coupons.minOrder')} hint={t('common.optional')}><input className="input" type="number" min="0" value={f.minOrderAmount} onChange={set('minOrderAmount')} /></Field>
            <Field label={t('admin.coupons.usageLimit')} hint={t('common.optional')}><input className="input" type="number" min="1" value={f.usageLimit} onChange={set('usageLimit')} /></Field>
            <Field label={t('admin.coupons.startsAt')}><input className="input" type="datetime-local" value={f.startsAt} onChange={set('startsAt')} /></Field>
            <Field label={t('admin.coupons.expiresAt')}><input className="input" type="datetime-local" value={f.expiresAt} onChange={set('expiresAt')} /></Field>
            <Field label={t('admin.coupons.description')}><input className="input" value={f.description} onChange={set('description')} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> {t('common.active')}</label>
          {err && <Alert>{err}</Alert>}
          <div className="flex gap-2"><button className="btn-primary">{t('common.save')}</button><button type="button" className="btn-outline" onClick={() => setEditing(null)}>{t('common.cancel')}</button></div>
        </form>
      )}
      <div className="card overflow-x-auto p-0">
        <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">{t('admin.coupons.code')}</th><th className="th">{t('admin.coupons.value')}</th><th className="th">{t('admin.coupons.usage')}</th><th className="th">{t('admin.coupons.expiry')}</th><th className="th">{t('orders.status')}</th><th className="th" /></tr></thead>
          <tbody className="divide-y">{data.map((c) => (
            <tr key={c.id}><td className="td font-medium"><bdi>{c.code}</bdi></td><td className="td">{c.type === 'Percent' ? fmt.percent(c.value) : fmt.number(c.value)}</td>
              <td className="td">{fmt.number(c.usedCount)}{c.usageLimit ? ` / ${fmt.number(c.usageLimit)}` : ''}</td><td className="td">{fmt.date(c.expiresAt)}</td>
              <td className="td">{c.isActive ? <span className="badge bg-green-100 text-green-800">{t('common.active')}</span> : <span className="badge bg-gray-200 text-gray-700">{t('common.inactive')}</span>}</td>
              <td className="td whitespace-nowrap"><button className="text-brand-600" onClick={() => edit(c)}>{t('common.edit')}</button>
                <button className="ms-3 text-red-600" onClick={async () => { if (confirm(t('common.confirmDelete'))) { await del(`admin/coupons/${c.id}`); await mutate(); } }}>{t('common.delete')}</button></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
