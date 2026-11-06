import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSettings } from '@/lib/server';
import { getI18n } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = getI18n();
  const s = await getSettings();
  const name = s['Store.Name'] || t('meta.defaultStoreName');
  return { title: { default: name, template: `%s | ${name}` }, description: t('meta.description', { name }) };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { t, locale, dir } = getI18n();
  const s = await getSettings();
  return (
    <html lang={locale} dir={dir}>
      <body className="font-sans">
        <Providers locale={locale} storeName={s['Store.Name'] || t('meta.defaultStoreName')} currency={s['Store.Currency'] || 'IRT'}>
          <Header />
          <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
