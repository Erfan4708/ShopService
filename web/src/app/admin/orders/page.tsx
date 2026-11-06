'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import useSWR from 'swr';
import { qs } from '@/lib/api';
import { STATUS_LABEL, formatDate } from '@/lib/format';
import type { OrderStatus, OrderSummary, Paged } from '@/lib/types';
import { Empty, PageTitle, Pagination, Price, Spinner, StatusBadge } from '@/components/Ui';

function List() {
  const sp = useSearchParams();
  const [status, setStatus] = useState(sp.get('status') ?? '');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data } = useSWR<Paged<OrderSummary>>(`admin/orders${qs({ status, search: q, page, pageSize: 15 })}`);

  return (
    <div className="space-y-4">
      <PageTitle>ط³ظپط§ط±ط´â€Œظ‡ط§</PageTitle>
      <form className="card flex flex-wrap items-center gap-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
        <select className="input !w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="ظˆط¶ط¹غŒطھ">
          <option value="">ظ‡ظ…ظ‡ ظˆط¶ط¹غŒطھâ€Œظ‡ط§</option>
          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <input className="input !w-64" placeholder="ط´ظ…ط§ط±ظ‡ ط³ظپط§ط±ط´ / ظ…ظˆط¨ط§غŒظ„ / ظ†ط§ظ… / ط§غŒظ…غŒظ„" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-outline">ط¬ط³طھط¬ظˆ</button>
      </form>
      {!data ? <Spinner /> : data.items.length === 0 ? <Empty>ط³ظپط§ط±ط´غŒ غŒط§ظپطھ ظ†ط´ط¯.</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">ط´ظ…ط§ط±ظ‡</th><th className="th">ظ…ط´طھط±غŒ</th><th className="th">طھط§ط±غŒط®</th><th className="th">ظ…ط¨ظ„ط؛</th><th className="th">ظˆط¶ط¹غŒطھ</th><th className="th" /></tr></thead>
            <tbody className="divide-y">{data.items.map((o) => (
              <tr key={o.id}><td className="td font-medium"><bdi>{o.orderNumber}</bdi></td><td className="td">{o.customerName}<span className="block text-xs text-gray-400"><bdi>{o.receiverPhone}</bdi></span></td>
                <td className="td">{formatDate(o.createdAt)}</td><td className="td"><Price value={o.grandTotal} /></td><td className="td"><StatusBadge status={o.status} /></td>
                <td className="td"><Link className="text-brand-600" href={`/admin/orders/${o.orderNumber}`}>ظ…ط¯غŒط±غŒطھ</Link></td></tr>))}</tbody></table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </div>
  );
}

export default function AdminOrders() { return <Suspense fallback={<Spinner />}><List /></Suspense>; }
