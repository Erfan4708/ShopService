'use client';

import Link from 'next/link';
import useSWR from 'swr';
import type { Dashboard } from '@/lib/types';
import { PageTitle, Price, Spinner } from '@/components/Ui';
import { formatNumber, STATUS_LABEL } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';

export default function AdminDashboard() {
  const { data: d, error } = useSWR<Dashboard>('admin/dashboard');
  if (error) return <p className="text-red-600">{(error as Error).message}</p>;
  if (!d) return <Spinner />;
  const max = Math.max(1, ...d.last30Days.map((x) => x.revenue));
  const cards = [
    { t: 'فروش امروز', v: <Price value={d.todayRevenue} /> }, { t: 'کل فروش', v: <Price value={d.totalRevenue} /> },
    { t: 'سفارش‌های امروز', v: formatNumber(d.todayOrders) }, { t: 'کل سفارش‌ها', v: formatNumber(d.totalOrders) },
    { t: 'مشتریان', v: formatNumber(d.totalCustomers) }, { t: 'محصولات فعال', v: formatNumber(d.activeProducts) }
  ];
  return (
    <div className="space-y-6">
      <PageTitle>داشبورد</PageTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{cards.map((c) => <div key={c.t} className="card"><div className="text-xs text-gray-500">{c.t}</div><div className="mt-1 text-lg font-bold">{c.v}</div></div>)}</div>

      <section className="card">
        <h2 className="mb-3 font-bold">فروش ۳۰ روز اخیر</h2>
        <svg viewBox="0 0 600 140" className="w-full" role="img" aria-label="نمودار فروش ۳۰ روز اخیر">
          {d.last30Days.map((x, i) => {
            const h = (x.revenue / max) * 120;
            return <rect key={x.date} x={i * 20 + 2} y={130 - h} width={16} height={Math.max(h, 1)} rx={2} className="fill-brand-500"><title>{new Date(x.date).toLocaleDateString('fa-IR')}: {formatNumber(x.revenue)}</title></rect>;
          })}
        </svg>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card"><h2 className="mb-2 font-bold">وضعیت سفارش‌ها</h2>
          <ul className="space-y-1 text-sm">{Object.entries(d.ordersByStatus).map(([s, n]) => (
            <li key={s} className="flex justify-between"><Link className="hover:text-brand-600" href={`/admin/orders?status=${s}`}>{STATUS_LABEL[s as OrderStatus] ?? s}</Link><b>{formatNumber(n)}</b></li>))}</ul></section>
        <section className="card"><h2 className="mb-2 font-bold">پرفروش‌ترین‌ها</h2>
          {d.topProducts.length === 0 ? <p className="text-sm text-gray-500">هنوز فروشی ثبت نشده است.</p> :
            <ul className="space-y-1 text-sm">{d.topProducts.map((p) => <li key={p.productId} className="flex justify-between gap-2"><span className="line-clamp-1">{p.name}</span><b>{formatNumber(p.quantitySold)}</b></li>)}</ul>}</section>
      </div>

      <section className="card"><h2 className="mb-2 font-bold">کالاهای رو به اتمام</h2>
        {d.lowStock.length === 0 ? <p className="text-sm text-gray-500">موردی نیست.</p> :
          <ul className="space-y-1 text-sm">{d.lowStock.map((p) => <li key={p.productId} className="flex justify-between gap-2"><Link className="hover:text-brand-600" href={`/admin/products/${p.productId}`}>{p.name} <bdi className="text-gray-400">({p.sku})</bdi></Link><b className={p.stockQuantity === 0 ? 'text-red-600' : 'text-amber-600'}>{formatNumber(p.stockQuantity)}</b></li>)}</ul>}</section>
    </div>
  );
}
