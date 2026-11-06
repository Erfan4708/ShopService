import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSettings } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s['Store.Name'] || 'ظپط±ظˆط´ع¯ط§ظ‡';
  return { title: { default: name, template: `%s | ${name}` }, description: `ط®ط±غŒط¯ ط¢ظ†ظ„ط§غŒظ† ط§ط² ${name}` };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const s = await getSettings();
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans">
        <Providers storeName={s['Store.Name'] || 'ظپط±ظˆط´ع¯ط§ظ‡'} currency={s['Store.Currency'] || 'IRT'}>
          <Header />
          <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
