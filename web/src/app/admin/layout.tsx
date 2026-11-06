import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import AdminShell from '@/components/AdminShell';
import { getI18n } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  return { title: getI18n().t('meta.admin'), robots: { index: false } };
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
