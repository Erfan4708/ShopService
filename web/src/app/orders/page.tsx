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
      <PageTitle>سفارش‌های من</PageTitle>
      {data.items.length === 0 ? <Empty>هنوز سفارشی ثبت نکرده‌اید.</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full">
            <thead className="border-b bg-gray-50"><tr><th className="th">شماره سفارش</th><th className="th">تاریخ</th><th className="th">تعداد اقلام</th><th className="th">مبلغ</th><th className="th">وضعیت</th><th className="th" /></tr></thead>
            <tbody className="divide-y">
              {data.items.map((o) => (
                <tr key={o.id}>
                  <td className="td font-medium"><bdi>{o.orderNumber}</bdi></td>
                  <td className="td">{formatDate(o.createdAt)}</td>
                  <td className="td">{o.itemCount.toLocaleString('fa-IR')}</td>
                  <td className="td"><Price value={o.grandTotal} /></td>
                  <td className="td"><StatusBadge status={o.status} /></td>
                  <td className="td"><Link className="text-brand-600" href={`/orders/${o.orderNumber}`}>جزئیات</Link></td>
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
