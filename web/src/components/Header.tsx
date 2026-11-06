'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth, useCart } from '@/lib/hooks';
import { useStore } from './Providers';
import { formatNumber } from '@/lib/format';

export default function Header() {
  const { storeName } = useStore();
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
          <input className="input" placeholder="جستجوی محصول…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجو" />
        </form>

        <nav className="ms-auto flex items-center gap-2 text-sm">
          <Link href="/products" className="btn-outline hidden sm:inline-flex">محصولات</Link>
          <Link href="/track" className="btn-outline hidden sm:inline-flex">پیگیری سفارش</Link>
          <Link href="/cart" className="btn-outline relative" aria-label="سبد خرید">
            سبد خرید
            {cart && cart.itemCount > 0 && (
              <span className="absolute -top-2 -start-2 rounded-full bg-brand-600 px-1.5 text-xs text-white">{formatNumber(cart.itemCount)}</span>
            )}
          </Link>
          {user ? (
            <div className="relative">
              <button className="btn-primary" onClick={() => setMenu((m) => !m)}>{user.firstName}</button>
              {menu && (
                <div className="absolute end-0 mt-2 w-44 rounded-lg border bg-white py-1 shadow-lg" onClick={() => setMenu(false)}>
                  <Link className="block px-4 py-2 hover:bg-gray-50" href="/account">حساب کاربری</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" href="/orders">سفارش‌های من</Link>
                  {isStaff && <Link className="block px-4 py-2 hover:bg-gray-50" href="/admin">پنل مدیریت</Link>}
                  <button className="block w-full px-4 py-2 text-start text-red-600 hover:bg-gray-50" onClick={async () => { await logout(); router.push('/'); router.refresh(); }}>خروج</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-primary">ورود / ثبت‌نام</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
