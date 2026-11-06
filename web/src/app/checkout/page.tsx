'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { post } from '@/lib/api';
import { useCart } from '@/lib/hooks';
import type { Address, CheckoutSummary, OrderDetail, ShippingMethod, StartPayment } from '@/lib/types';
import AddressForm from '@/components/AddressForm';
import { Alert, Empty, PageTitle, Price, Spinner } from '@/components/Ui';
import { formatNumber } from '@/lib/format';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading } = useCart();
  const { data: addresses, mutate: mutateAddresses } = useSWR<Address[]>('account/addresses');
  const { data: methods } = useSWR<ShippingMethod[]>('shipping-methods');
  const { data: gw } = useSWR<{ gateways: string[]; defaultGateway: string }>('payments/gateways');

  const [addressId, setAddressId] = useState('');
  const [shippingId, setShippingId] = useState('');
  const [gateway, setGateway] = useState('');
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (addresses && !addressId) setAddressId((addresses.find((a) => a.isDefault) ?? addresses[0])?.id ?? '');
  }, [addresses, addressId]);
  useEffect(() => { if (methods && !shippingId && methods[0]) setShippingId(methods[0].id); }, [methods, shippingId]);
  useEffect(() => { if (gw && !gateway) setGateway(gw.gateways.includes(gw.defaultGateway) ? gw.defaultGateway : gw.gateways[0] ?? ''); }, [gw, gateway]);

  useEffect(() => {
    if (!shippingId || !cart || cart.items.length === 0) return;
    let alive = true;
    post<CheckoutSummary>('checkout/preview', { shippingMethodId: shippingId })
      .then((s) => { if (alive) { setSummary(s); setErr(''); } })
      .catch((e) => alive && setErr(e.message));
    return () => { alive = false; };
  }, [shippingId, cart?.total, cart?.couponCode]);

  if (isLoading || !addresses || !methods) return <Spinner />;
  if (!cart || cart.items.length === 0) return <Empty>ط³ط¨ط¯ ط®ط±غŒط¯ ط´ظ…ط§ ط®ط§ظ„غŒ ط§ط³طھ. <Link href="/products" className="text-brand-600">ظ…ط´ط§ظ‡ط¯ظ‡ ظ…ط­طµظˆظ„ط§طھ</Link></Empty>;

  async function place() {
    setBusy(true); setErr('');
    let order: OrderDetail | null = null;
    try {
      order = await post<OrderDetail>('checkout', { addressId, shippingMethodId: shippingId, note: note.trim() || undefined });
      await mutate('cart', undefined, { revalidate: true });
      const pay = await post<StartPayment>('payments/start', { orderId: order.id, gateway: gateway || undefined });
      window.location.href = pay.paymentUrl; // ظ‡ط¯ط§غŒطھ ط¨ظ‡ ط¯ط±ع¯ط§ظ‡
    } catch (e: any) {
      if (order) router.push(`/orders/${order.orderNumber}`); // ط³ظپط§ط±ط´ ط«ط¨طھ ط´ط¯ظ‡ط› ط§ط² طµظپط­ظ‡ ط³ظپط§ط±ط´ ظ…غŒâ€Œطھظˆط§ظ† ط¯ظˆط¨ط§ط±ظ‡ ظ¾ط±ط¯ط§ط®طھ ع©ط±ط¯
      else { setErr(e.message); setBusy(false); }
    }
  }

  const ready = !!addressId && !!shippingId && !busy;

  return (
    <div>
      <PageTitle>طھع©ظ…غŒظ„ ط³ظپط§ط±ط´</PageTitle>
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="card space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-bold">ط¢ط¯ط±ط³ طھط­ظˆغŒظ„</h2>
              {!adding && <button className="text-sm text-brand-600" onClick={() => setAdding(true)}>+ ط¢ط¯ط±ط³ ط¬ط¯غŒط¯</button>}</div>
            {adding ? (
              <AddressForm onSaved={async (a) => { await mutateAddresses(); setAddressId(a.id); setAdding(false); }} onCancel={addresses.length ? () => setAdding(false) : undefined} />
            ) : addresses.length === 0 ? (
              <Alert kind="info">ط¨ط±ط§غŒ ط§ط¯ط§ظ…ظ‡ غŒع© ط¢ط¯ط±ط³ ط«ط¨طھ ع©ظ†غŒط¯.</Alert>
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${addressId === a.id ? 'border-brand-500 bg-brand-50' : ''}`}>
                    <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                    <span className="text-sm"><b>{a.title}</b> â€” {a.receiverName} (<bdi>{a.receiverPhone}</bdi>)<br />
                      <span className="text-gray-600">{a.province}طŒ {a.city}طŒ {a.addressLine} â€” ع©ط¯ ظ¾ط³طھغŒ: <bdi>{a.postalCode}</bdi></span></span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="card space-y-2">
            <h2 className="font-bold">ط±ظˆط´ ط§ط±ط³ط§ظ„</h2>
            {methods.length === 0 && <Alert>ط±ظˆط´ ط§ط±ط³ط§ظ„غŒ طھط¹ط±غŒظپ ظ†ط´ط¯ظ‡ ط§ط³طھ.</Alert>}
            {methods.map((m) => (
              <label key={m.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 ${shippingId === m.id ? 'border-brand-500 bg-brand-50' : ''}`}>
                <span className="flex items-center gap-3 text-sm">
                  <input type="radio" name="shipping" checked={shippingId === m.id} onChange={() => setShippingId(m.id)} />
                  <span><b>{m.name}</b>{m.estimatedDays ? ` â€” ط­ط¯ظˆط¯ ${formatNumber(m.estimatedDays)} ط±ظˆط² ع©ط§ط±غŒ` : ''}
                    {m.description && <span className="block text-gray-500">{m.description}</span>}
                    {m.freeAboveAmount && <span className="block text-xs text-green-700">ط§ط±ط³ط§ظ„ ط±ط§غŒع¯ط§ظ† ط¨ط±ط§غŒ ط®ط±غŒط¯ ط¨ط§ظ„ط§غŒ <Price value={m.freeAboveAmount} /></span>}</span>
                </span>
                <span className="text-sm font-medium">{m.cost === 0 ? 'ط±ط§غŒع¯ط§ظ†' : <Price value={m.cost} />}</span>
              </label>
            ))}
          </section>

          {gw && gw.gateways.length > 1 && (
            <section className="card space-y-2">
              <h2 className="font-bold">ط¯ط±ع¯ط§ظ‡ ظ¾ط±ط¯ط§ط®طھ</h2>
              {gw.gateways.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm"><input type="radio" name="gw" checked={gateway === g} onChange={() => setGateway(g)} /> {g === 'Fake' ? 'ط¯ط±ع¯ط§ظ‡ ط¢ط²ظ…ط§غŒط´غŒ' : g === 'ZarinPal' ? 'ط²ط±غŒظ†â€Œظ¾ط§ظ„' : g}</label>
              ))}
            </section>
          )}

          <section className="card">
            <label className="label" htmlFor="note">طھظˆط¶غŒط­ط§طھ ط³ظپط§ط±ط´ (ط§ط®طھغŒط§ط±غŒ)</label>
            <textarea id="note" className="input" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </section>
        </div>

        <aside className="card h-fit space-y-3">
          <h2 className="font-bold">ط®ظ„ط§طµظ‡ ط³ظپط§ط±ط´</h2>
          <ul className="space-y-1 text-sm text-gray-600">
            {cart.items.map((i) => <li key={i.productId} className="flex justify-between gap-2"><span className="line-clamp-1">{i.name} أ— {formatNumber(i.quantity)}</span><Price value={i.lineTotal} /></li>)}
          </ul>
          {summary && (
            <dl className="space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt>ط¬ظ…ط¹ ع©ط§ظ„ط§ظ‡ط§</dt><dd><Price value={summary.subtotal} /></dd></div>
              {summary.discount > 0 && <div className="flex justify-between text-green-700"><dt>طھط®ظپغŒظپ</dt><dd>âˆ’ <Price value={summary.discount} /></dd></div>}
              <div className="flex justify-between"><dt>ظ‡ط²غŒظ†ظ‡ ط§ط±ط³ط§ظ„</dt><dd>{summary.shippingCost === 0 ? 'ط±ط§غŒع¯ط§ظ†' : <Price value={summary.shippingCost} />}</dd></div>
              {summary.tax > 0 && <div className="flex justify-between"><dt>ظ…ط§ظ„غŒط§طھ</dt><dd><Price value={summary.tax} /></dd></div>}
              <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>ظ…ط¨ظ„ط؛ ظ†ظ‡ط§غŒغŒ</dt><dd><Price value={summary.grandTotal} /></dd></div>
            </dl>
          )}
          {err && <Alert>{err}</Alert>}
          <button className="btn-primary w-full" disabled={!ready || !summary} onClick={place}>{busy ? 'ط¯ط± ط­ط§ظ„ ط§ظ†طھظ‚ط§ظ„ ط¨ظ‡ ط¯ط±ع¯ط§ظ‡â€¦' : 'ط«ط¨طھ ط³ظپط§ط±ط´ ظˆ ظ¾ط±ط¯ط§ط®طھ'}</button>
          <p className="text-xs text-gray-400">ط¨ط§ ط«ط¨طھ ط³ظپط§ط±ط´طŒ ظ…ظˆط¬ظˆط¯غŒ ط¨ط±ط§غŒ ط´ظ…ط§ ط±ط²ط±ظˆ ظ…غŒâ€Œط´ظˆط¯. ط¯ط± طµظˆط±طھ ط¹ط¯ظ… ظ¾ط±ط¯ط§ط®طھ ط¯ط± ظ…ظ‡ظ„طھ ظ…ظ‚ط±ط±طŒ ط³ظپط§ط±ط´ ظ„ط؛ظˆ ط®ظˆط§ظ‡ط¯ ط´ط¯.</p>
        </aside>
      </div>
    </div>
  );
}
