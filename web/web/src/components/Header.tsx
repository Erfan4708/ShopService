'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth, useCart } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n/client';
import { useStore } from './Providers';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { storeName } = useStore();
  const { t, fmt } = useI18n();
  const { user, logout, isStaff } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-extrabold text-brand-600">{storeName}</Link>

        <form
          className="hidden flex-1 md:block"
          onSubmit={(e) => { e.preventDefault(); router.push(`/products?search=${encodeURIComponent(q)}`); }}
        >
          <input className="input" placeholder={t('nav.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('nav.searchLabel')} />
        </form>

        <nav className="ms-auto flex items-center gap-2 text-sm">
          <Link href="/products" className="btn-outline hidden sm:inline-flex">{t('nav.products')}</Link>
          <Link href="/track" className="btn-outline hidden sm:inline-flex">{t('nav.trackOrder')}</Link>
          <Link href="/cart" className="btn-outline relative" aria-label={t('nav.cart')}>
            {t('nav.cart')}
            {cart && cart.itemCount > 0 && (
              <span className="absolute -top-2 -start-2 rounded-full bg-brand-600 px-1.5 text-xs text-white">{fmt.number(cart.itemCount)}</span>
            )}
          </Link>
          <LanguageSwitcher />
          {user ? (
            <div className="relative">
              <button className="btn-primary" onClick={() => setMenu((m) => !m)}>{user.firstName}</button>
              {menu && (
                <div className="absolute end-0 mt-2 w-44 rounded-lg border bg-white py-1 shadow-lg" onClick={() => setMenu(false)}>
                  <Link className="block px-4 py-2 hover:bg-gray-50" href="/account">{t('nav.account')}</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" href="/orders">{t('nav.myOrders')}</Link>
                  {isStaff && <Link className="block px-4 py-2 hover:bg-gray-50" href="/admin">{t('nav.admin')}</Link>}
                  <button className="block w-full px-4 py-2 text-start text-red-600 hover:bg-gray-50" onClick={async () => { await logout(); router.push('/'); router.refresh(); }}>{t('nav.logout')}</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-primary">{t('nav.login')}</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
