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
      <PageTitle action={editing === null && <button className="btn-primary" onClick={() => edit(null)}>+ ط¯ط³طھظ‡ ط¬ط¯غŒط¯</button>}>ط¯ط³طھظ‡â€Œط¨ظ†ط¯غŒâ€Œظ‡ط§</PageTitle>
      {editing !== null && (
        <form onSubmit={save} className="card space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="ظ†ط§ظ…"><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Slug" hint="ط®ط§ظ„غŒ = ط®ظˆط¯ع©ط§ط±"><input className="input" dir="ltr" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} /></Field>
            <Field label="ط¯ط³طھظ‡ ظˆط§ظ„ط¯"><select className="input" value={f.parentId} onChange={(e) => setF({ ...f, parentId: e.target.value })}>
              <option value="">â€” ط¨ط¯ظˆظ† ظˆط§ظ„ط¯ â€”</option>{data.filter((c) => c.id !== editing).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="طھط±طھغŒط¨ ظ†ظ…ط§غŒط´"><input className="input" type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} /></Field>
          </div>
          <Field label="طھظˆط¶غŒط­ط§طھ"><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> ظپط¹ط§ظ„</label>
          {err && <Alert>{err}</Alert>}
          <div className="flex gap-2"><button className="btn-primary">ط°ط®غŒط±ظ‡</button><button type="button" className="btn-outline" onClick={() => setEditing(null)}>ط§ظ†طµط±ط§ظپ</button></div>
        </form>
      )}
      {err && editing === null && <Alert>{err}</Alert>}
      <div className="card overflow-x-auto p-0">
        <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">ظ†ط§ظ…</th><th className="th">Slug</th><th className="th">ظˆط§ظ„ط¯</th><th className="th">طھط±طھغŒط¨</th><th className="th">ظˆط¶ط¹غŒطھ</th><th className="th" /></tr></thead>
          <tbody className="divide-y">{data.map((c) => (
            <tr key={c.id}><td className="td font-medium">{c.name}</td><td className="td"><bdi>{c.slug}</bdi></td><td className="td">{nameOf(c.parentId)}</td><td className="td">{c.sortOrder.toLocaleString('fa-IR')}</td>
              <td className="td">{c.isActive ? <span className="badge bg-green-100 text-green-800">ظپط¹ط§ظ„</span> : <span className="badge bg-gray-200 text-gray-700">ط؛غŒط±ظپط¹ط§ظ„</span>}</td>
              <td className="td whitespace-nowrap"><button className="text-brand-600" onClick={() => edit(c)}>ظˆغŒط±ط§غŒط´</button>
                <button className="ms-3 text-red-600" onClick={async () => { if (!confirm('ط­ط°ظپ ط´ظˆط¯طں')) return; try { await del(`admin/categories/${c.id}`); await mutate(); } catch (e: any) { setErr(e.message); } }}>ط­ط°ظپ</button></td></tr>))}</tbody></table>
      </div>
    </div>
  );
}
