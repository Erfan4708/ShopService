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
  if (!cart || cart.items.length === 0) return <Empty>سبد خرید شما خالی است. <Link href="/products" className="text-brand-600">مشاهده محصولات</Link></Empty>;

  async function place() {
    setBusy(true); setErr('');
    let order: OrderDetail | null = null;
    try {
      order = await post<OrderDetail>('checkout', { addressId, shippingMethodId: shippingId, note: note.trim() || undefined });
      await mutate('cart', undefined, { revalidate: true });
      const pay = await post<StartPayment>('payments/start', { orderId: order.id, gateway: gateway || undefined });
      window.location.href = pay.paymentUrl; // هدایت به درگاه
    } catch (e: any) {
      if (order) router.push(`/orders/${order.orderNumber}`); // سفارش ثبت شده؛ از صفحه سفارش می‌توان دوباره پرداخت کرد
      else { setErr(e.message); setBusy(false); }
    }
  }

  const ready = !!addressId && !!shippingId && !busy;

  return (
    <div>
      <PageTitle>تکمیل سفارش</PageTitle>
      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="card space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-bold">آدرس تحویل</h2>
              {!adding && <button className="text-sm text-brand-600" onClick={() => setAdding(true)}>+ آدرس جدید</button>}</div>
            {adding ? (
              <AddressForm onSaved={async (a) => { await mutateAddresses(); setAddressId(a.id); setAdding(false); }} onCancel={addresses.length ? () => setAdding(false) : undefined} />
            ) : addresses.length === 0 ? (
              <Alert kind="info">برای ادامه یک آدرس ثبت کنید.</Alert>
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${addressId === a.id ? 'border-brand-500 bg-brand-50' : ''}`}>
                    <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                    <span className="text-sm"><b>{a.title}</b> â€” {a.receiverName} (<bdi>{a.receiverPhone}</bdi>)<br />
                      <span className="text-gray-600">{a.province}، {a.city}، {a.addressLine} â€” کد پستی: <bdi>{a.postalCode}</bdi></span></span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="card space-y-2">
            <h2 className="font-bold">روش ارسال</h2>
            {methods.length === 0 && <Alert>روش ارسالی تعریف نشده است.</Alert>}
            {methods.map((m) => (
              <label key={m.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 ${shippingId === m.id ? 'border-brand-500 bg-brand-50' : ''}`}>
                <span className="flex items-center gap-3 text-sm">
                  <input type="radio" name="shipping" checked={shippingId === m.id} onChange={() => setShippingId(m.id)} />
                  <span><b>{m.name}</b>{m.estimatedDays ? ` â€” حدود ${formatNumber(m.estimatedDays)} روز کاری` : ''}
                    {m.description && <span className="block text-gray-500">{m.description}</span>}
                    {m.freeAboveAmount && <span className="block text-xs text-green-700">ارسال رایگان برای خرید بالای <Price value={m.freeAboveAmount} /></span>}</span>
                </span>
                <span className="text-sm font-medium">{m.cost === 0 ? 'رایگان' : <Price value={m.cost} />}</span>
              </label>
            ))}
          </section>

          {gw && gw.gateways.length > 1 && (
            <section className="card space-y-2">
              <h2 className="font-bold">درگاه پرداخت</h2>
              {gw.gateways.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm"><input type="radio" name="gw" checked={gateway === g} onChange={() => setGateway(g)} /> {g === 'Fake' ? 'درگاه آزمایشی' : g === 'ZarinPal' ? 'زرین‌پال' : g}</label>
              ))}
            </section>
          )}

          <section className="card">
            <label className="label" htmlFor="note">توضیحات سفارش (اختیاری)</label>
            <textarea id="note" className="input" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </section>
        </div>

        <aside className="card h-fit space-y-3">
          <h2 className="font-bold">خلاصه سفارش</h2>
          <ul className="space-y-1 text-sm text-gray-600">
            {cart.items.map((i) => <li key={i.productId} className="flex justify-between gap-2"><span className="line-clamp-1">{i.name} أ— {formatNumber(i.quantity)}</span><Price value={i.lineTotal} /></li>)}
          </ul>
          {summary && (
            <dl className="space-y-2 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt>جمع کالاها</dt><dd><Price value={summary.subtotal} /></dd></div>
              {summary.discount > 0 && <div className="flex justify-between text-green-700"><dt>تخفیف</dt><dd>âˆ’ <Price value={summary.discount} /></dd></div>}
              <div className="flex justify-between"><dt>هزینه ارسال</dt><dd>{summary.shippingCost === 0 ? 'رایگان' : <Price value={summary.shippingCost} />}</dd></div>
              {summary.tax > 0 && <div className="flex justify-between"><dt>مالیات</dt><dd><Price value={summary.tax} /></dd></div>}
              <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>مبلغ نهایی</dt><dd><Price value={summary.grandTotal} /></dd></div>
            </dl>
          )}
          {err && <Alert>{err}</Alert>}
          <button className="btn-primary w-full" disabled={!ready || !summary} onClick={place}>{busy ? 'در حال انتقال به درگاه…' : 'ثبت سفارش و پرداخت'}</button>
          <p className="text-xs text-gray-400">با ثبت سفارش، موجودی برای شما رزرو می‌شود. در صورت عدم پرداخت در مهلت مقرر، سفارش لغو خواهد شد.</p>
        </aside>
      </div>
    </div>
  );
}
