'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { del, post, put } from '@/lib/api';
import type { AdminCategory } from '@/lib/types';
import { Alert, Field, PageTitle, Spinner } from '@/components/Ui';

const EMPTY = { name: '', slug: '', description: '', parentId: '', sortOrder: '0', isActive: true };

export default function AdminCategories() {
  const { data, mutate } = useSWR<AdminCategory[]>('admin/categories');
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');

  if (!data) return <Spinner />;
  const nameOf = (id: string | null) => data.find((c) => c.id === id)?.name ?? 'â€”';

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
      <PageTitle action={editing === null && <button className="btn-primary" onClick={() => edit(null)}>+ دسته جدید</button>}>دسته‌بندی‌ها</PageTitle>
      {editing !== null && (
        <form onSubmit={save} className="card space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="نام"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Slug" hint="خالی = خودکار"><input className="input" dir="ltr" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} /></Field>
            <Field label="دسته والد"><select className="input" value={f.parentId} onChange={(e) => setF({ ...f, parentId: e.target.value })}>
              <option value="">â€” بدون والد â€”</option>{data.filter((c) => c.id !== editing).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="ترتیب نمایش"><input className="input" type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} /></Field>
          </div>
          <Field label="توضیحات"><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> فعال</label>
          {err && <Alert>{err}</Alert>}
          <div className="flex gap-2"><button className="btn-primary">ذخیره</button><button type="button" className="btn-outline" onClick={() => setEditing(null)}>انصراف</button></div>
        </form>
      )}
      {err && editing === null && <Alert>{err}</Alert>}
      <div className="card overflow-x-auto p-0">
        <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">نام</th><th className="th">Slug</th><th className="th">والد</th><th className="th">ترتیب</th><th className="th">وضعیت</th><th className="th" /></tr></thead>
          <tbody className="divide-y">{data.map((c) => (
            <tr key={c.id}><td className="td font-medium">{c.name}</td><td className="td"><bdi>{c.slug}</bdi></td><td className="td">{nameOf(c.parentId)}</td><td className="td">{c.sortOrder.toLocaleString('fa-IR')}</td>
              <td className="td">{c.isActive ? <span className="badge bg-green-100 text-green-800">فعال</span> : <span className="badge bg-gray-200 text-gray-700">غیرفعال</span>}</td>
              <td className="td whitespace-nowrap"><button className="text-brand-600" onClick={() => edit(c)}>ویرایش</button>
                <button className="ms-3 text-red-600" onClick={async () => { if (!confirm('حذف شود؟')) return; try { await del(`admin/categories/${c.id}`); await mutate(); } catch (e: any) { setErr(e.message); } }}>حذف</button></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
