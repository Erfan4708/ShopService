'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { post } from '@/lib/api';
import { useCart } from '@/lib/hooks';
import type { Cart } from '@/lib/types';
import { Alert } from './Ui';

export default function AddToCart({ productId, inStock, maxQty }: { productId: string; inStock: boolean; maxQty?: number | null }) {
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const { mutateCart } = useCart();
  const router = useRouter();

  if (!inStock) return <Alert kind="info">ط§غŒظ† ظ…ط­طµظˆظ„ ط¯ط± ط­ط§ظ„ ط­ط§ط¶ط± ظ†ط§ظ…ظˆط¬ظˆط¯ ط§ط³طھ.</Alert>;

  async function add(goToCart: boolean) {
    setBusy(true); setMsg(null);
    try {
      const cart = await post<Cart>('cart/items', { productId, quantity: qty });
      await mutateCart(cart, false);
      if (goToCart) router.push('/cart');
      else setMsg({ kind: 'success', text: 'ط¨ظ‡ ط³ط¨ط¯ ط®ط±غŒط¯ ط§ط¶ط§ظپظ‡ ط´ط¯.' });
    } catch (e: any) {
      setMsg({ kind: 'error', text: e.message });
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border">
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="ع©ظ… ع©ط±ط¯ظ†">âˆ’</button>
          <span className="w-10 text-center">{qty.toLocaleString('fa-IR')}</span>
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.min(maxQty ?? 100, q + 1))} aria-label="ط²غŒط§ط¯ ع©ط±ط¯ظ†">+</button>
        </div>
        <button className="btn-primary flex-1" disabled={busy} onClick={() => add(false)}>ط§ظپط²ظˆط¯ظ† ط¨ظ‡ ط³ط¨ط¯ ط®ط±غŒط¯</button>
        <button className="btn-outline" disabled={busy} onClick={() => add(true)}>ط®ط±غŒط¯ ظپظˆط±غŒ</button>
      </div>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
    </div>
  );
}
