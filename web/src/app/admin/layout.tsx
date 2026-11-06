import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import AdminShell from '@/components/AdminShell';

export const metadata: Metadata = { title: 'پنل مدیریت', robots: { index: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
