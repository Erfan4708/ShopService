'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import useSWR from 'swr';
import { qs } from '@/lib/api';
import { ORDER_STATUSES } from '@/lib/format';
import { useI18n } from '@/lib/i18n/client';
import type { OrderSummary, Paged } from '@/lib/types';
import { Empty, PageTitle, Pagination, Price, Spinner, StatusBadge } from '@/components/Ui';

function List() {
  const { t, fmt } = useI18n();
  const sp = useSearchParams();
  const [status, setStatus] = useState(sp.get('status') ?? '');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data } = useSWR<Paged<OrderSummary>>(`admin/orders${qs({ status, search: q, page, pageSize: 15 })}`);

  return (
    <div className="space-y-4">
      <PageTitle>{t('admin.orders.title')}</PageTitle>
      <form className="card flex flex-wrap items-center gap-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
        <select className="input !w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label={t('orders.status')}>
          <option value="">{t('admin.orders.allStatuses')}</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>
        <input className="input !w-64" placeholder={t('admin.orders.searchPlaceholder')} aria-label={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-outline">{t('common.search')}</button>
      </form>
      {!data ? <Spinner /> : data.items.length === 0 ? <Empty>{t('admin.orders.empty')}</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">{t('admin.orders.number')}</th><th className="th">{t('admin.orders.customer')}</th><th className="th">{t('orders.date')}</th><th className="th">{t('orders.amount')}</th><th className="th">{t('orders.status')}</th><th className="th" /></tr></thead>
            <tbody className="divide-y">{data.items.map((o) => (
              <tr key={o.id}><td className="td font-medium"><bdi>{o.orderNumber}</bdi></td><td className="td">{o.customerName}<span className="block text-xs text-gray-400"><bdi>{o.receiverPhone}</bdi></span></td>
                <td className="td">{fmt.date(o.createdAt)}</td><td className="td"><Price value={o.grandTotal} /></td><td className="td"><StatusBadge status={o.status} /></td>
                <td className="td"><Link className="text-brand-600" href={`/admin/orders/${o.orderNumber}`}>{t('admin.orders.manage')}</Link></td></tr>))}</tbody></table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </div>
  );
}

export default function AdminOrders() { return <Suspense fallback={<Spinner />}><List /></Suspense>; }
