'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import type { OrderSummary, Paged } from '@/lib/types';
import { Empty, PageTitle, Pagination, Price, Spinner, StatusBadge } from '@/components/Ui';
import { formatDate } from '@/lib/format';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR<Paged<OrderSummary>>(`orders?page=${page}&pageSize=10`);
  if (isLoading || !data) return <Spinner />;
  return (
    <div>
      <PageTitle>ط³ظپط§ط±ط´â€Œظ‡ط§غŒ ظ…ظ†</PageTitle>
      {data.items.length === 0 ? <Empty>ظ‡ظ†ظˆط² ط³ظپط§ط±ط´غŒ ط«ط¨طھ ظ†ع©ط±ط¯ظ‡â€Œط§غŒط¯.</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="border-b bg-gray-50"><tr><th className="th">ط´ظ…ط§ط±ظ‡ ط³ظپط§ط±ط´</th><th className="th">طھط§ط±غŒط®</th><th className="th">طھط¹ط¯ط§ط¯ ط§ظ‚ظ„ط§ظ…</th><th className="th">ظ…ط¨ظ„ط؛</th><th className="th">ظˆط¶ط¹غŒطھ</th><th className="th" /></tr></thead>
            <tbody className="divide-y">
              {data.items.map((o) => (
                <tr key={o.id}>
                  <td className="td font-medium"><bdi>{o.orderNumber}</bdi></td>
                  <td className="td">{formatDate(o.createdAt)}</td>
                  <td className="td">{o.itemCount.toLocaleString('fa-IR')}</td>
                  <td className="td"><Price value={o.grandTotal} /></td>
                  <td className="td"><StatusBadge status={o.status} /></td>
                  <td className="td"><Link className="text-brand-600" href={`/orders/${o.orderNumber}`}>ط¬ط²ط¦غŒط§طھ</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
    </div>
  );
}
