'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n/client';
import type { MessageKey } from '@/lib/i18n/messages';
import { Alert, Spinner } from './Ui';

const LINKS: { href: string; label: MessageKey; exact?: boolean; adminOnly?: boolean }[] = [
  { href: '/admin', label: 'admin.nav.dashboard', exact: true },
  { href: '/admin/products', label: 'admin.nav.products' },
  { href: '/admin/categories', label: 'admin.nav.categories' },
  { href: '/admin/orders', label: 'admin.nav.orders' },
  { href: '/admin/coupons', label: 'admin.nav.coupons' },
  { href: '/admin/shipping', label: 'admin.nav.shipping' },
  { href: '/admin/reviews', label: 'admin.nav.reviews' },
  { href: '/admin/users', label: 'admin.nav.users', adminOnly: true },
  { href: '/admin/settings', label: 'admin.nav.settings', adminOnly: true }
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user, isLoading, isStaff, isAdmin } = useAuth();
  const path = usePathname();
  if (isLoading) return <Spinner />;
  if (!user || !isStaff) return <Alert>{t('admin.denied')}</Alert>;
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav className="card h-fit space-y-1 p-2 text-sm" aria-label={t('admin.menuLabel')}>
        {LINKS.filter((l) => !l.adminOnly || isAdmin).map((l) => {
          const active = l.exact ? path === l.href : path.startsWith(l.href);
          return <Link key={l.href} href={l.href} className={`block rounded-lg px-3 py-2 ${active ? 'bg-brand-600 text-white' : 'hover:bg-gray-100'}`}>{t(l.label)}</Link>;
        })}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
