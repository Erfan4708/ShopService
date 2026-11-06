'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { post } from '@/lib/api';
import { useAuth } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n/client';
import type { Paged, Review } from '@/lib/types';
import { Alert, Pagination, Stars } from './Ui';
import Link from 'next/link';

export default function Reviews({ productId }: { productId: string }) {
  const { t, fmt } = useI18n();
  const [page, setPage] = useState(1);
  const { data, mutate } = useSWR<Paged<Review>>(`products/${productId}/reviews?page=${page}&pageSize=5`);
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success' | 'info'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await post<{ message?: string }>(`products/${productId}/reviews`, { rating, comment });
      setComment('');
      setMsg(r?.message ? { kind: 'info', text: r.message } : { kind: 'success', text: t('reviews.thanks') });
      await mutate();
    } catch (err: any) {
      setMsg({ kind: 'error', text: err.message });
    } finally { setBusy(false); }
  }

  return (
    <section className="card space-y-4" aria-labelledby="reviews-title">
      <h2 id="reviews-title" className="text-lg font-bold">{t('reviews.title')}</h2>
      {!data ? null : data.items.length === 0 ? (
        <p className="text-sm text-gray-500">{t('reviews.none')}</p>
      ) : (
        <ul className="divide-y">
          {data.items.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <b>{r.userName}</b> <Stars value={r.rating} />
                {r.isVerifiedPurchase && <span className="badge bg-green-100 text-green-800">{t('reviews.verified')}</span>}
                <span className="text-xs text-gray-400">{fmt.date(r.createdAt)}</span>
              </div>
              {r.comment && <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}

      {user ? (
        <form onSubmit={submit} className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <label htmlFor="rating" className="label !mb-0">{t('reviews.yourRating')}</label>
            <select id="rating" className="input !w-24" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{fmt.number(n)} ★</option>)}
            </select>
          </div>
          <textarea className="input" rows={3} maxLength={2000} placeholder={t('reviews.placeholder')} value={comment} onChange={(e) => setComment(e.target.value)} />
          {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
          <button className="btn-primary" disabled={busy}>{t('reviews.submit')}</button>
        </form>
      ) : (
        <p className="border-t pt-4 text-sm text-gray-500">{t('reviews.loginBefore')}<Link className="text-brand-600" href="/login">{t('reviews.loginLink')}</Link>{t('reviews.loginAfter')}</p>
      )}
    </section>
  );
}
