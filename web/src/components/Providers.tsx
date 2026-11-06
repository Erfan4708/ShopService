'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/api';
import { currencyLabel } from '@/lib/format';

type Ctx = { storeName: string; currency: string };
const SettingsContext = createContext<Ctx>({ storeName: 'ظپط±ظˆط´ع¯ط§ظ‡', currency: 'طھظˆظ…ط§ظ†' });
export const useStore = () => useContext(SettingsContext);

export default function Providers({ children, storeName, currency }: { children: ReactNode; storeName: string; currency: string }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}>
      <SettingsContext.Provider value={{ storeName, currency: currencyLabel(currency) }}>{children}</SettingsContext.Provider>
    </SWRConfig>
  );
}
