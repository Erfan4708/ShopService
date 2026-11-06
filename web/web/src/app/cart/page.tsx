'use client';

import Link from 'next/link';
import { useState } from 'react';
import { del, post, put } from '@/lib/api';
import { useCart } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n/client';
import type { Cart } from '@/lib/types';
import { Alert, Empty, PageTitle, Price, ProductImg, Spinner } from '@/components/Ui';

export default function CartPage() {
  const { t, fmt } = useI18n();
  const { cart, isLoading, mutateCart } = useCart();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');

  async function run(fn: () => Promise<Cart>) {
    setBusy(true); setErr('');
    try { await mutateCart(await fn(), false); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  if (isLoading) return <Spinner />;
  if (!cart || cart.items.length === 0)
    return <Empty>{t('cart.empty')} <Link href="/products" className="text-brand-600">{t('home.browse')}</Link></Empty>;

  const blocked = cart.items.some((i) => !i.inStock);

  return (
    <div>
      <PageTitle action={<button className="text-sm text-red-600" disabled={busy} onClick={() => confirm(t('cart.clearConfirm')) && run(() => del<Cart>('cart'))}>{t('cart.clear')}</button>}>
        {t('cart.title')}
      </PageTitle>
      {err && <div className="mb-3"><Alert>{err}</Alert></div>}
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <ul className="space-y-3">
          {cart.items.map((i) => (
            <li key={i.productId} className="card flex gap-3">
              <ProductImg src={i.imageUrl} alt={i.name} className="h-24 w-24 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Link href={`/products/${encodeURIComponent(i.slug)}`} className="font-medium hover:text-brand-600">{i.name}</Link>
                {!i.inStock && (
                  <span className="text-sm text-red-600">
                    {i.availableQuantity !== null ? t('cart.insufficientStockAvailable', { available: i.availableQuantity }) : t('cart.insufficientStock')}
                  </span>
                )}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center rounded-lg border">
                    <button className="px-3 py-1" disabled={busy} aria-label={t('cart.decrease')} onClick={() => run(() => put<Cart>(`cart/items/${i.productId}`, { quantity: i.quantity - 1 }))}>−</button>
                    <span className="w-10 text-center">{fmt.number(i.quantity)}</span>
                    <button className="px-3 py-1" disabled={busy} aria-label={t('cart.increase')} onClick={() => run(() => put<Cart>(`cart/items/${i.productId}`, { quantity: i.quantity + 1 }))}>+</button>
                  </div>
                  <div className="text-sm text-gray-500"><Price value={i.unitPrice} /> × {fmt.number(i.quantity)}</div>
                  <Price value={i.lineTotal} className="font-bold" />
                  <button className="text-sm text-red-600" disabled={busy} onClick={() => run(() => del<Cart>(`cart/items/${i.productId}`))}>{t('cart.remove')}</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit space-y-3">
          {cart.couponCode ? (
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              <span>{t('cart.couponApplied')} <bdi className="font-bold">{cart.couponCode}</bdi></span>
              <button className="text-red-600" disabled={busy} onClick={() => run(() => del<Cart>('cart/coupon'))}>{t('cart.remove')}</button>
            </div>
          ) : (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(() => post<Cart>('cart/coupon', { code: code.trim() })); }}>
              <input className="input" placeholder={t('cart.couponCode')} aria-label={t('cart.couponCode')} value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" />
              <button className="btn-outline" disabled={busy}>{t('cart.applyCoupon')}</button>
            </form>
          )}
          <dl className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between"><dt>{t('cart.subtotal')}</dt><dd><Price value={cart.subtotal} /></dd></div>
            {cart.discount > 0 && <div className="flex justify-between text-green-700"><dt>{t('cart.discount')}</dt><dd>− <Price value={cart.discount} /></dd></div>}
            <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>{t('cart.payable')}</dt><dd><Price value={cart.total} /></dd></div>
          </dl>
          <p className="text-xs text-gray-400">{t('cart.shippingNote')}</p>
          {blocked ? <Alert kind="info">{t('cart.fixStock')}</Alert> : <Link href="/checkout" className="btn-primary w-full">{t('cart.checkout')}</Link>}
        </aside>
      </div>
    </div>
  );
}
