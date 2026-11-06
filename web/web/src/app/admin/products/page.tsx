'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { del, qs } from '@/lib/api';
import { useI18n } from '@/lib/i18n/client';
import type { Paged, ProductListItem } from '@/lib/types';
import { Alert, Empty, PageTitle, Pagination, Price, ProductImg, Spinner } from '@/components/Ui';

export default function AdminProducts() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [low, setLow] = useState(false);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');
  const { data, mutate } = useSWR<Paged<ProductListItem>>(`admin/products${qs({ search: q, lowStockOnly: low, page, pageSize: 15 })}`);

  return (
    <div className="space-y-4">
      <PageTitle action={<Link className="btn-primary" href="/admin/products/new">{t('admin.products.new')}</Link>}>{t('admin.products.title')}</PageTitle>
      <form className="card flex flex-wrap items-center gap-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
        <input className="input !w-64" placeholder={t('admin.products.searchPlaceholder')} aria-label={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={low} onChange={(e) => { setLow(e.target.checked); setPage(1); }} /> {t('admin.products.lowOnly')}</label>
        <button className="btn-outline">{t('common.search')}</button>
      </form>
      {err && <Alert>{err}</Alert>}
      {!data ? <Spinner /> : data.items.length === 0 ? <Empty>{t('admin.products.empty')}</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="border-b bg-gray-50"><tr><th className="th" /><th className="th">{t('admin.products.name')}</th><th className="th">SKU</th><th className="th">{t('admin.products.category')}</th><th className="th">{t('admin.products.price')}</th><th className="th">{t('admin.products.stock')}</th><th className="th" /></tr></thead>
            <tbody className="divide-y">
              {data.items.map((p) => (
                <tr key={p.id}>
                  <td className="td"><ProductImg src={p.mainImageUrl} alt={p.name} className="h-10 w-10 rounded" /></td>
                  <td className="td font-medium">{p.name}</td><td className="td"><bdi>{p.sku}</bdi></td><td className="td">{p.categoryName}</td>
                  <td className="td"><Price value={p.price} /></td>
                  <td className="td">{p.inStock ? <span className="badge bg-green-100 text-green-800">{t('admin.products.inStock')}</span> : <span className="badge bg-red-100 text-red-800">{t('product.outOfStock')}</span>}</td>
                  <td className="td whitespace-nowrap"><Link className="text-brand-600" href={`/admin/products/${p.id}`}>{t('common.edit')}</Link>{' '}
                    <button className="ms-3 text-red-600" onClick={async () => { if (!confirm(t('admin.products.deleteConfirm', { name: p.name }))) return; try { await del(`admin/products/${p.id}`); await mutate(); } catch (e: any) { setErr(e.message); } }}>{t('common.delete')}</button></td>
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
