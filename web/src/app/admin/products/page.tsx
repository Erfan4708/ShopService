'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { del, qs } from '@/lib/api';
import type { Paged, ProductListItem } from '@/lib/types';
import { Alert, Empty, PageTitle, Pagination, Price, ProductImg, Spinner } from '@/components/Ui';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [low, setLow] = useState(false);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');
  const { data, mutate } = useSWR<Paged<ProductListItem>>(`admin/products${qs({ search: q, lowStockOnly: low, page, pageSize: 15 })}`);

  return (
    <div className="space-y-4">
      <PageTitle action={<Link className="btn-primary" href="/admin/products/new">+ ظ…ط­طµظˆظ„ ط¬ط¯غŒط¯</Link>}>ظ…ط­طµظˆظ„ط§طھ</PageTitle>
      <form className="card flex flex-wrap items-center gap-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
        <input className="input !w-64" placeholder="ط¬ط³طھط¬ظˆ ظ†ط§ظ… / SKU / ط¨ط±ظ†ط¯" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={low} onChange={(e) => { setLow(e.target.checked); setPage(1); }} /> ظپظ‚ط· ظ…ظˆط¬ظˆط¯غŒ ع©ظ…</label>
        <button className="btn-outline">ط¬ط³طھط¬ظˆ</button>
      </form>
      {err && <Alert>{err}</Alert>}
      {!data ? <Spinner /> : data.items.length === 0 ? <Empty>ظ…ط­طµظˆظ„غŒ غŒط§ظپطھ ظ†ط´ط¯.</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="border-b bg-gray-50"><tr><th className="th" /><th className="th">ظ†ط§ظ…</th><th className="th">SKU</th><th className="th">ط¯ط³طھظ‡</th><th className="th">ظ‚غŒظ…طھ</th><th className="th">ظ…ظˆط¬ظˆط¯غŒ</th><th className="th" /></tr></thead>
            <tbody className="divide-y">
              {data.items.map((p) => (
                <tr key={p.id}>
                  <td className="td"><ProductImg src={p.mainImageUrl} alt={p.name} className="h-10 w-10 rounded" /></td>
                  <td className="td font-medium">{p.name}</td><td className="td"><bdi>{p.sku}</bdi></td><td className="td">{p.categoryName}</td>
                  <td className="td"><Price value={p.price} /></td>
                  <td className="td">{p.inStock ? <span className="badge bg-green-100 text-green-800">ظ…ظˆط¬ظˆط¯</span> : <span className="badge bg-red-100 text-red-800">ظ†ط§ظ…ظˆط¬ظˆط¯</span>}</td>
                  <td className="td whitespace-nowrap"><Link className="text-brand-600" href={`/admin/products/${p.id}`}>ظˆغŒط±ط§غŒط´</Link>{' '}
                    <button className="ms-3 text-red-600" onClick={async () => { if (!confirm(`آ«${p.name}آ» ط­ط°ظپ ط´ظˆط¯طں`)) return; try { await del(`admin/products/${p.id}`); await mutate(); } catch (e: any) { setErr(e.message); } }}>ط­ط°ظپ</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </div>
  );
}
