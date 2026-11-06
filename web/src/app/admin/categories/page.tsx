'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { del, post, put } from '@/lib/api';
import { useI18n } from '@/lib/i18n/client';
import type { AdminCategory } from '@/lib/types';
import { Alert, Field, PageTitle, Spinner } from '@/components/Ui';

const EMPTY = { name: '', slug: '', description: '', parentId: '', sortOrder: '0', isActive: true };

export default function AdminCategories() {
  const { t, fmt } = useI18n();
  const { data, mutate } = useSWR<AdminCategory[]>('admin/categories');
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');

  if (!data) return <Spinner />;
  const nameOf = (id: string | null) => data.find((c) => c.id === id)?.name ?? '—';

  function edit(c: AdminCategory | null) {
    setErr('');
    setEditing(c ? c.id : 'new');
    setF(c ? { name: c.name, slug: c.slug, description: c.description ?? '', parentId: c.parentId ?? '', sortOrder: String(c.sortOrder), isActive: c.isActive } : EMPTY);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const body = { name: f.name.trim(), slug: f.slug.trim() || null, description: f.description || null, imageUrl: null, parentId: f.parentId || null, sortOrder: Number(f.sortOrder || 0), isActive: f.isActive };
    try {
      if (editing === 'new') await post('admin/categories', body); else await put(`admin/categories/${editing}`, body);
      setEditing(null); await mutate();
    } catch (e: any) { setErr(e.message); }
  }

  return (
    <div className="space-y-4">
      <PageTitle action={editing === null && <button className="btn-primary" onClick={() => edit(null)}>{t('admin.cat.new')}</button>}>{t('admin.cat.title')}</PageTitle>
      {editing !== null && (
        <form onSubmit={save} className="card space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t('admin.cat.name')}><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Slug" hint={t('admin.cat.slugHint')}><input className="input" dir="ltr" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} /></Field>
            <Field label={t('admin.cat.parent')}><select className="input" value={f.parentId} onChange={(e) => setF({ ...f, parentId: e.target.value })}>
              <option value="">{t('admin.cat.noParent')}</option>{data.filter((c) => c.id !== editing).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label={t('admin.cat.sortOrder')}><input className="input" type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} /></Field>
          </div>
          <Field label={t('admin.cat.description')}><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> {t('common.active')}</label>
          {err && <Alert>{err}</Alert>}
          <div className="flex gap-2"><button className="btn-primary">{t('common.save')}</button><button type="button" className="btn-outline" onClick={() => setEditing(null)}>{t('common.cancel')}</button></div>
        </form>
      )}
      {err && editing === null && <Alert>{err}</Alert>}
      <div className="card overflow-x-auto p-0">
        <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">{t('admin.cat.name')}</th><th className="th">Slug</th><th className="th">{t('admin.cat.parent')}</th><th className="th">{t('admin.cat.order')}</th><th className="th">{t('orders.status')}</th><th className="th" /></tr></thead>
          <tbody className="divide-y">{data.map((c) => (
            <tr key={c.id}><td className="td font-medium">{c.name}</td><td className="td"><bdi>{c.slug}</bdi></td><td className="td">{nameOf(c.parentId)}</td><td className="td">{fmt.number(c.sortOrder)}</td>
              <td className="td">{c.isActive ? <span className="badge bg-green-100 text-green-800">{t('common.active')}</span> : <span className="badge bg-gray-200 text-gray-700">{t('common.inactive')}</span>}</td>
              <td className="td whitespace-nowrap"><button className="text-brand-600" onClick={() => edit(c)}>{t('common.edit')}</button>
                <button className="ms-3 text-red-600" onClick={async () => { if (!confirm(t('common.confirmDelete'))) return; try { await del(`admin/categories/${c.id}`); await mutate(); } catch (e: any) { setErr(e.message); } }}>{t('common.delete')}</button></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
