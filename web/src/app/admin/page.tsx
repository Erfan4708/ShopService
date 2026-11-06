'use client';

import Link from 'next/link';
import useSWR from 'swr';
import type { Dashboard, OrderStatus } from '@/lib/types';
import { useI18n } from '@/lib/i18n/client';
import { PageTitle, Price, Spinner } from '@/components/Ui';

export default function AdminDashboard() {
  const { t, fmt, has } = useI18n();
  const { data: d, error } = useSWR<Dashboard>('admin/dashboard');
  if (error) return <p className="text-red-600">{(error as Error).message}</p>;
  if (!d) return <Spinner />;
  const max = Math.max(1, ...d.last30Days.map((x) => x.revenue));
  const statusLabel = (s: string) => (has(`status.${s}`) ? t(`status.${s as OrderStatus}`) : s);
  const cards = [
    { t: t('admin.dash.todaySales'), v: <Price value={d.todayRevenue} /> }, { t: t('admin.dash.totalSales'), v: <Price value={d.totalRevenue} /> },
    { t: t('admin.dash.todayOrders'), v: fmt.number(d.todayOrders) }, { t: t('admin.dash.totalOrders'), v: fmt.number(d.totalOrders) },
    { t: t('admin.dash.customers'), v: fmt.number(d.totalCustomers) }, { t: t('admin.dash.activeProducts'), v: fmt.number(d.activeProducts) }
  ];
  return (
    <div className="space-y-6">
      <PageTitle>{t('admin.dash.title')}</PageTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cards.map((c) => <div key={c.t} className="card"><div className="text-xs text-gray-500">{c.t}</div><div className="mt-1 text-lg font-bold">{c.v}</div></div>)}</div>

      <section className="card">
        <h2 className="mb-3 font-bold">{t('admin.dash.salesChart')}</h2>
        <svg viewBox="0 0 600 140" className="w-full" role="img" aria-label={t('admin.dash.salesChart')}>
          {d.last30Days.map((x, i) => {
            const h = (x.revenue / max) * 120;
            return <rect key={x.date} x={i * 20 + 2} y={130 - h} width={16} height={Math.max(h, 1)} rx={2} className="fill-brand-500"><title>{fmt.dayOnly(x.date)}: {fmt.number(x.revenue)}</title></rect>;
          })}
        </svg>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card"><h2 className="mb-2 font-bold">{t('admin.dash.ordersByStatus')}</h2>
          <ul className="space-y-1 text-sm">{Object.entries(d.ordersByStatus).map(([s, n]) => (
            <li key={s} className="flex justify-between"><Link className="hover:text-brand-600" href={`/admin/orders?status=${s}`}>{statusLabel(s)}</Link><b>{fmt.number(n)}</b></li>))}</ul></section>
        <section className="card"><h2 className="mb-2 font-bold">{t('admin.dash.topProducts')}</h2>
          {d.topProducts.length === 0 ? <p className="text-sm text-gray-500">{t('admin.dash.noSales')}</p> :
            <ul className="space-y-1 text-sm">{d.topProducts.map((p) => <li key={p.productId} className="flex justify-between gap-2"><span className="line-clamp-1">{p.name}</span><b>{fmt.number(p.quantitySold)}</b></li>)}</ul>}</section>
      </div>

      <section className="card"><h2 className="mb-2 font-bold">{t('admin.dash.lowStock')}</h2>
        {d.lowStock.length === 0 ? <p className="text-sm text-gray-500">{t('admin.dash.noLowStock')}</p> :
          <ul className="space-y-1 text-sm">{d.lowStock.map((p) => <li key={p.productId} className="flex justify-between gap-2"><Link className="hover:text-brand-600" href={`/admin/products/${p.productId}`}>{p.name} <bdi className="text-gray-400">({p.sku})</bdi></Link><b className={p.stockQuantity === 0 ? 'text-red-600' : 'text-amber-600'}>{fmt.number(p.stockQuantity)}</b></li>)}</ul>}</section>
    </div>
  );
}
