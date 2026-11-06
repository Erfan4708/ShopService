'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/api';
import type { Locale } from '@/lib/i18n/config';
import { I18nProvider, useI18n } from '@/lib/i18n/client';

type Ctx = { storeName: string; currency: string; money: (value: number) => string };
const SettingsContext = createContext<Ctx>({ storeName: '', currency: '', money: (v) => String(v) });
export const useStore = () => useContext(SettingsContext);

function SettingsProvider({ storeName, currencyCode, children }: { storeName: string; currencyCode: string; children: ReactNode }) {
  const { t, fmt } = useI18n();
  const currency = currencyCode === 'IRR' ? t('currency.IRR') : currencyCode === 'IRT' || !currencyCode ? t('currency.IRT') : currencyCode;
  return (
    <SettingsContext.Provider value={{ storeName, currency, money: (value) => `${fmt.number(value)} ${currency}` }}>
      {children}
    </SettingsContext.Provider>
  );
}

export default function Providers({ children, locale, storeName, currency }: { children: ReactNode; locale: Locale; storeName: string; currency: string }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
      <I18nProvider locale={locale}>
        <SettingsProvider storeName={storeName} currencyCode={currency}>{children}</SettingsProvider>
      </I18nProvider>
    </SWRConfig>
  );
}
