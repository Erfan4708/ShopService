'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import type { OrderSummary, Paged } from '@/lib/types';
import { useI18n } from '@/lib/i18n/client';
import { Empty, PageTitle, Pagination, Price, Spinner, StatusBadge } from '@/components/Ui';

export default function OrdersPage() {
  const { t, fmt } = useI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR<Paged<OrderSummary>>(`orders?page=${page}&pageSize=10`);
  if (isLoading || !data) return <Spinner />;
  return (
    <div>
      <PageTitle>{t('orders.title')}</PageTitle>
      {data.items.length === 0 ? <Empty>{t('orders.empty')}</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="border-b bg-gray-50"><tr><th className="th">{t('orders.number')}</th><th className="th">{t('orders.date')}</th><th className="th">{t('orders.items')}</th><th className="th">{t('orders.amount')}</th><th className="th">{t('orders.status')}</th><th className="th" /></tr></thead>
            <tbody className="divide-y">
              {data.items.map((o) => (
                <tr key={o.id}>
                  <td className="td font-medium"><bdi>{o.orderNumber}</bdi></td>
                  <td className="td">{fmt.date(o.createdAt)}</td>
                  <td className="td">{fmt.number(o.itemCount)}</td>
                  <td className="td"><Price value={o.grandTotal} /></td>
                  <td className="td"><StatusBadge status={o.status} /></td>
                  <td className="td"><Link className="text-brand-600" href={`/orders/${o.orderNumber}`}>{t('common.details')}</Link></td>
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
