'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { mutate } from 'swr';
import { writeLocaleCookie, type Locale } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/client';

export default function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const target: Locale = locale === 'fa' ? 'en' : 'fa';

  function switchLocale() {
    writeLocaleCookie(target);
    startTransition(() => {
      router.refresh();
      void mutate(() => true);
    });
  }

  return (
    <button type="button" className="btn-outline" onClick={switchLocale} disabled={pending} aria-label={t('lang.switchLabel')} lang={target}>
      {t('lang.other')}
    </button>
  );
}
