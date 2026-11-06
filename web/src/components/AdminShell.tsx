'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/hooks';
import { Alert, Spinner } from './Ui';

const LINKS = [
  { href: '/admin', label: 'ط¯ط§ط´ط¨ظˆط±ط¯', exact: true },
  { href: '/admin/products', label: 'ظ…ط­طµظˆظ„ط§طھ' },
  { href: '/admin/categories', label: 'ط¯ط³طھظ‡â€Œط¨ظ†ط¯غŒâ€Œظ‡ط§' },
  { href: '/admin/orders', label: 'ط³ظپط§ط±ط´â€Œظ‡ط§' },
  { href: '/admin/coupons', label: 'ع©ط¯ظ‡ط§غŒ طھط®ظپغŒظپ' },
  { href: '/admin/shipping', label: 'ط±ظˆط´â€Œظ‡ط§غŒ ط§ط±ط³ط§ظ„' },
  { href: '/admin/reviews', label: 'ظ†ط¸ط±ط§طھ' },
  { href: '/admin/users', label: 'ع©ط§ط±ط¨ط±ط§ظ†', adminOnly: true },
  { href: '/admin/settings', label: 'طھظ†ط¸غŒظ…ط§طھ', adminOnly: true }
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, isLoading, isStaff, isAdmin } = useAuth();
  const path = usePathname();
  if (isLoading) return <Spinner />;
  if (!user || !isStaff) return <Alert>ط¯ط³طھط±ط³غŒ ط¨ظ‡ ط§غŒظ† ط¨ط®ط´ ظپظ‚ط· ط¨ط±ط§غŒ ظ…ط¯غŒط±ط§ظ† ظپط±ظˆط´ع¯ط§ظ‡ ظ…ط¬ط§ط² ط§ط³طھ.</Alert>;
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <nav className="card h-fit space-y-1 p-2 text-sm" aria-label="ظ…ظ†ظˆغŒ ظ…ط¯غŒط±غŒطھ">
        {LINKS.filter((l) => !l.adminOnly || isAdmin).map((l) => {
          const active = l.exact ? path === l.href : path.startsWith(l.href);
          return <Link key={l.href} href={l.href} className={`block rounded-lg px-3 py-2 ${active ? 'bg-brand-600 text-white' : 'hover:bg-gray-100'}`}>{l.label}</Link>;
        })}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
