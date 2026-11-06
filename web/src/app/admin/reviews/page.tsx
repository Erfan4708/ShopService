'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { del, put, qs } from '@/lib/api';
import { useI18n } from '@/lib/i18n/client';
import type { Paged } from '@/lib/types';
import { Alert, Empty, PageTitle, Pagination, Spinner, Stars } from '@/components/Ui';

type AdminReview = { id: string; productId: string; productName: string; userName: string; rating: number; comment: string | null; isApproved: boolean; createdAt: string };

export default function AdminReviews() {
  const { t, fmt } = useI18n();
  const [filter, setFilter] = useState<'false' | 'true' | ''>('false');
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');
  const { data, mutate } = useSWR<Paged<AdminReview>>(`admin/reviews${qs({ isApproved: filter, page, pageSize: 10 })}`);
  async function act(fn: () => Promise<unknown>) { setErr(''); try { await fn(); await mutate(); } catch (e: any) { setErr(e.message); } }

  return (
    <div className="space-y-4">
      <PageTitle>{t('admin.reviews.title')}</PageTitle>
      <select className="input !w-56" value={filter} onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }} aria-label={t('admin.reviews.filterLabel')}>
        <option value="false">{t('admin.reviews.pending')}</option><option value="true">{t('admin.reviews.approved')}</option><option value="">{t('common.all')}</option>
      </select>
      {err && <Alert>{err}</Alert>}
      {!data ? <Spinner /> : data.items.length === 0 ? <Empty>{t('admin.reviews.empty')}</Empty> : (
        <ul className="space-y-3">{data.items.map((r) => (
          <li key={r.id} className="card space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm"><b>{r.productName}</b><span className="text-gray-500">{t('admin.reviews.by', { name: r.userName })}</span><Stars value={r.rating} /><span className="text-xs text-gray-400">{fmt.date(r.createdAt)}</span>
              {r.isApproved ? <span className="badge bg-green-100 text-green-800">{t('admin.reviews.approved')}</span> : <span className="badge bg-amber-100 text-amber-800">{t('admin.reviews.pendingBadge')}</span>}</div>
            {r.comment && <p className="whitespace-pre-line text-sm text-gray-700">{r.comment}</p>}
            <div className="flex gap-3 text-sm">
              {!r.isApproved && <button className="text-green-700" onClick={() => act(() => put(`admin/reviews/${r.id}/approve`))}>{t('admin.reviews.approve')}</button>}
              {r.isApproved && <button className="text-amber-700" onClick={() => act(() => put(`admin/reviews/${r.id}/reject`))}>{t('admin.reviews.hide')}</button>}
              <button className="text-red-600" onClick={() => confirm(t('admin.reviews.deleteConfirm')) && act(() => del(`admin/reviews/${r.id}`))}>{t('common.delete')}</button>
            </div>
          </li>))}</ul>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </div>
  );
}
