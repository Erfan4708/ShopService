'use client';

import Link from 'next/link';
import { useState } from 'react';
import { del, post, put } from '@/lib/api';
import { useCart } from '@/lib/hooks';
import type { Cart } from '@/lib/types';
import { Alert, Empty, PageTitle, Price, ProductImg, Spinner } from '@/components/Ui';
import { formatNumber } from '@/lib/format';

export default function CartPage() {
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
    return <Empty>ط³ط¨ط¯ ط®ط±غŒط¯ ط´ظ…ط§ ط®ط§ظ„غŒ ط§ط³طھ. <Link href="/products" className="text-brand-600">ظ…ط´ط§ظ‡ط¯ظ‡ ظ…ط­طµظˆظ„ط§طھ</Link></Empty>;

  const blocked = cart.items.some((i) => !i.inStock);

  return (
    <div>
      <PageTitle action={<button className="text-sm text-red-600" disabled={busy} onClick={() => confirm('ط³ط¨ط¯ ط®ط§ظ„غŒ ط´ظˆط¯طں') && run(() => del<Cart>('cart'))}>ط®ط§ظ„غŒ ع©ط±ط¯ظ† ط³ط¨ط¯</button>}>
        ط³ط¨ط¯ ط®ط±غŒط¯
      </PageTitle>
      {err && <div className="mb-3"><Alert>{err}</Alert></div>}
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <ul className="space-y-3">
          {cart.items.map((i) => (
            <li key={i.productId} className="card flex gap-3">
              <ProductImg src={i.imageUrl} alt={i.name} className="h-24 w-24 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-2">
                <Link href={`/products/${encodeURIComponent(i.slug)}`} className="font-medium hover:text-brand-600">{i.name}</Link>
                {!i.inStock && <span className="text-sm text-red-600">ظ…ظˆط¬ظˆط¯غŒ ع©ط§ظپغŒ ظ†غŒط³طھ{i.availableQuantity !== null ? ` (ظ…ظˆط¬ظˆط¯: ${formatNumber(i.availableQuantity)})` : ''}. طھط¹ط¯ط§ط¯ ط±ط§ ع©ظ… ع©ظ†غŒط¯.</span>}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center rounded-lg border">
                    <button className="px-3 py-1" disabled={busy} aria-label="ع©ظ… ع©ط±ط¯ظ†" onClick={() => run(() => put<Cart>(`cart/items/${i.productId}`, { quantity: i.quantity - 1 }))}>âˆ’</button>
                    <span className="w-10 text-center">{formatNumber(i.quantity)}</span>
                    <button className="px-3 py-1" disabled={busy} aria-label="ط²غŒط§ط¯ ع©ط±ط¯ظ†" onClick={() => run(() => put<Cart>(`cart/items/${i.productId}`, { quantity: i.quantity + 1 }))}>+</button>
                  </div>
                  <div className="text-sm text-gray-500"><Price value={i.unitPrice} /> أ— {formatNumber(i.quantity)}</div>
                  <Price value={i.lineTotal} className="font-bold" />
                  <button className="text-sm text-red-600" disabled={busy} onClick={() => run(() => del<Cart>(`cart/items/${i.productId}`))}>ط­ط°ظپ</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit space-y-3">
          {cart.couponCode ? (
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              <span>ع©ط¯ طھط®ظپغŒظپ: <bdi className="font-bold">{cart.couponCode}</bdi></span>
              <button className="text-red-600" disabled={busy} onClick={() => run(() => del<Cart>('cart/coupon'))}>ط­ط°ظپ</button>
            </div>
          ) : (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) run(() => post<Cart>('cart/coupon', { code: code.trim() })); }}>
              <input className="input" placeholder="ع©ط¯ طھط®ظپغŒظپ" value={code} onChange={(e) => setCode(e.target.value)} dir="ltr" />
              <button className="btn-outline" disabled={busy}>ط§ط¹ظ…ط§ظ„</button>
            </form>
          )}
          <dl className="space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between"><dt>ط¬ظ…ط¹ ع©ط§ظ„ط§ظ‡ط§</dt><dd><Price value={cart.subtotal} /></dd></div>
            {cart.discount > 0 && <div className="flex justify-between text-green-700"><dt>طھط®ظپغŒظپ</dt><dd>âˆ’ <Price value={cart.discount} /></dd></div>}
            <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>ظ…ط¨ظ„ط؛ ظ‚ط§ط¨ظ„ ظ¾ط±ط¯ط§ط®طھ</dt><dd><Price value={cart.total} /></dd></div>
          </dl>
          <p className="text-xs text-gray-400">ظ‡ط²غŒظ†ظ‡ ط§ط±ط³ط§ظ„ ظˆ ظ…ط§ظ„غŒط§طھ ط¯ط± ظ…ط±ط­ظ„ظ‡ ط¨ط¹ط¯ ظ…ط­ط§ط³ط¨ظ‡ ظ…غŒâ€Œط´ظˆط¯.</p>
          {blocked ? <Alert kind="info">ط§ط¨طھط¯ط§ ظ…ظˆط¬ظˆط¯غŒ ع©ط§ظ„ط§ظ‡ط§غŒ ظ†ط§ع©ط§ظپغŒ ط±ط§ ط§طµظ„ط§ط­ ع©ظ†غŒط¯.</Alert> : <Link href="/checkout" className="btn-primary w-full">ط§ط¯ط§ظ…ظ‡ ظˆ ط«ط¨طھ ط³ظپط§ط±ط´</Link>}
        </aside>
      </div>
    </div>
  );
}
