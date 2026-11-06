'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_LOCALE, type Locale } from './config';
import { createI18n, type I18n } from './translate';

const I18nContext = createContext<I18n>(createI18n(DEFAULT_LOCALE));

export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => createI18n(locale), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
