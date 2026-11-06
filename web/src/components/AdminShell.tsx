'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks';
import { Alert, Spinner } from './Ui';

const LINKS = [
  { href: '/admin', label: 'داشبورد', exact: true },
  { href: '/admin/products', label: 'محصولات' },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها' },
  { href: '/admin/orders', label: 'سفارش‌ها' },
  { href: '/admin/coupons', label: 'کدهای تخفیف' },
  { href: '/admin/shipping', label: 'روش‌های ارسال' },
  { href: '/admin/reviews', label: 'نظرات' },
  { href: '/admin/users', label: 'کاربران', adminOnly: true },
  { href: '/admin/settings', label: 'تنظیمات', adminOnly: true }
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, isLoading, isStaff, isAdmin } = useAuth();
  const path = usePathname();
  if (isLoading) return <Spinner />;
  if (!user || !isStaff) return <Alert>دسترسی به این بخش فقط برای مدیران فروشگاه مجاز است.</Alert>;
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav className="card h-fit space-y-1 p-2 text-sm" aria-label="منوی مدیریت">
        {LINKS.filter((l) => !l.adminOnly || isAdmin).map((l) => {
          const active = l.exact ? path === l.href : path.startsWith(l.href);
          return <Link key={l.href} href={l.href} className={`block rounded-lg px-3 py-2 ${active ? 'bg-brand-600 text-white' : 'hover:bg-gray-100'}`}>{l.label}</Link>;
        })}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
