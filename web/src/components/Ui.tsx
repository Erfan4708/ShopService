'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useStore } from './Providers';
import { formatDate, formatNumber, STATUS_COLOR, STATUS_LABEL } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

export function Price({ value, className = '' }: { value: number; className?: string }) {
  const { currency } = useStore();
  return (
    <span className={className}>
      {formatNumber(value)} <span className="text-xs font-normal text-gray-500">{currency}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const c = kind === 'error' ? 'bg-red-50 text-red-700 border-red-200' : kind === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200';
  return <div className={`rounded-lg border px-3 py-2 text-sm ${c}`}>{children}</div>;
}

export function Spinner() {
  return <div className="py-12 text-center text-sm text-gray-500">ط¯ط± ط­ط§ظ„ ط¨ط§ط±ع¯ط°ط§ط±غŒâ€¦</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="card py-12 text-center text-gray-500">{children}</div>;
}

export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="text-amber-500" aria-label={`ط§ظ…طھغŒط§ط² ${value}`}>
      {'âک…'.repeat(full)}
      <span className="text-gray-300">{'âک…'.repeat(5 - full)}</span>
    </span>
  );
}

export function Pagination({ page, totalPages, basePath = '/products', query = '', onPage }: { page: number; totalPages: number; basePath?: string; query?: string; onPage?: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);
  const cls = (active: boolean) => `btn ${active ? 'bg-brand-600 text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} min-w-9 px-3`;
  return (
    <nav className="mt-6 flex flex-wrap justify-center gap-1" aria-label="طµظپط­ظ‡â€Œط¨ظ†ط¯غŒ">
      {pages.map((p) => {
        const params = new URLSearchParams(query);
        params.set('page', String(p));
        const href = `${basePath}?${params.toString()}`;

        return (
          <Link
            key={p}
            href={href}
            className={cls(p === page)}
          >
            {formatNumber(p)}
          </Link>
        );
      })}
    </nav>
  );
}

export function PageTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-xl font-bold">{children}</h1>
      {action}
    </div>
  );
}

export function ProductImg({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
  return (
    <div className={`flex items-center justify-center bg-gray-100 text-gray-300 ${className}`} aria-label={alt}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

export function Timeline({ items }: { items: { status: OrderStatus; note: string | null; createdAt: string }[] }) {
  return (
    <ol className="space-y-3 border-s-2 border-gray-200 ps-4">
      {items.map((h, i) => (
        <li key={i} className="relative">
          <span className="absolute -start-[1.4rem] top-1.5 h-3 w-3 rounded-full bg-brand-600" />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={h.status} />
            <span className="text-xs text-gray-500">{formatDate(h.createdAt)}</span>
          </div>
          {h.note && <p className="mt-1 text-sm text-gray-600">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}
