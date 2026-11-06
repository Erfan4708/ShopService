import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import AdminShell from '@/components/AdminShell';

export const metadata: Metadata = { title: 'ظ¾ظ†ظ„ ظ…ط¯غŒط±غŒطھ', robots: { index: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
