'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/lib/api';
import { useCart } from '@/lib/hooks';
import { useI18n } from '@/lib/i18n/client';
import type { Cart } from '@/lib/types';
import { Alert } from './Ui';

export default function AddToCart({ productId, inStock, maxQty }: { productId: string; inStock: boolean; maxQty?: number | null }) {
  const { t, fmt } = useI18n();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const { mutateCart } = useCart();
  const router = useRouter();

  if (!inStock) return <Alert kind="info">{t('cart.outOfStockNotice')}</Alert>;

  async function add(goToCart: boolean) {
    setBusy(true); setMsg(null);
    try {
      const cart = await post<Cart>('cart/items', { productId, quantity: qty });
      await mutateCart(cart, false);
      if (goToCart) router.push('/cart');
      else setMsg({ kind: 'success', text: t('cart.added') });
    } catch (e: any) {
      setMsg({ kind: 'error', text: e.message });
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border">
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t('cart.decrease')}>−</button>
          <span className="w-10 text-center">{fmt.number(qty)}</span>
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.min(maxQty ?? 100, q + 1))} aria-label={t('cart.increase')}>+</button>
        </div>
        <button className="btn-primary flex-1" disabled={busy} onClick={() => add(false)}>{t('cart.add')}</button>
        <button className="btn-outline" disabled={busy} onClick={() => add(true)}>{t('cart.buyNow')}</button>
      </div>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
    </div>
  );
}
