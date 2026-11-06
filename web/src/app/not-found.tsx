'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/client';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="card py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold">{t('notFound.title')}</h1>
      <p className="mb-6 text-gray-500">{t('notFound.text')}</p>
      <Link href="/" className="btn-primary">{t('notFound.home')}</Link>
    </div>
  );
}
