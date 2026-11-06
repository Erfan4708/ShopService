'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import { api, del, post, put } from '@/lib/api';
import { numOrNull } from '@/lib/format';
import type { AdminCategory, AdminProduct, ProductImage } from '@/lib/types';
import { Alert, Field, ProductImg, Spinner } from './Ui';

type Attr = { name: string; value: string };

export default function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const { data: cats } = useSWR<AdminCategory[]>('admin/categories');
  const { data: product, mutate } = useSWR<AdminProduct>(id ? `admin/products/${id}` : null);
  if (!cats || (id && !product)) return <Spinner />;
  return <Inner key={product?.id ?? 'new'} id={id} product={product} cats={cats} mutate={mutate} onCreated={(nid) => router.push(`/admin/products/${nid}`)} />;
}

function Inner({ id, product, cats, mutate, onCreated }: { id?: string; product?: AdminProduct; cats: AdminCategory[]; mutate: () => Promise<unknown>; onCreated: (id: string) => void }) {
  const [f, setF] = useState({
    name: product?.name ?? '', slug: product?.slug ?? '', sku: product?.sku ?? '', shortDescription: product?.shortDescription ?? '',
    description: product?.description ?? '', brand: product?.brand ?? '', price: String(product?.price ?? ''), compareAtPrice: product?.compareAtPrice != null ? String(product.compareAtPrice) : '',
    stockQuantity: String(product?.stockQuantity ?? 0), weight: product?.weight != null ? String(product.weight) : '', categoryId: product?.categoryId ?? cats[0]?.id ?? '',
    trackInventory: product?.trackInventory ?? true, isActive: product?.isActive ?? true, isFeatured: product?.isFeatured ?? false
  });
  const [attrs, setAttrs] = useState<Attr[]>(product?.attributes.map((a) => ({ ...a })) ?? []);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const chk = (k: 'trackInventory' | 'isActive' | 'isFeatured') => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.checked });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const body = {
      name: f.name.trim(), slug: f.slug.trim() || null, sku: f.sku.trim(), shortDescription: f.shortDescription || null, description: f.description || null,
      brand: f.brand || null, price: Number(f.price), compareAtPrice: numOrNull(f.compareAtPrice), stockQuantity: Number(f.stockQuantity || 0),
      trackInventory: f.trackInventory, isActive: f.isActive, isFeatured: f.isFeatured, weight: numOrNull(f.weight), categoryId: f.categoryId,
      attributes: attrs.filter((a) => a.name.trim() && a.value.trim())
    };
    try {
      if (id) { await put(`admin/products/${id}`, body); await mutate(); setMsg({ kind: 'success', text: 'تغییرات ذخیره شد.' }); }
      else { const p = await post<AdminProduct>('admin/products', body); onCreated(p.id); }
    } catch (err: any) { setMsg({ kind: 'error', text: err.message }); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card space-y-4">
        <h1 className="text-xl font-bold">{id ? 'ویرایش محصول' : 'محصول جدید'}</h1>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="نام محصول"><input className="input" required value={f.name} onChange={set('name')} /></Field>
          <Field label="کد کالا (SKU)"><input className="input" dir="ltr" required value={f.sku} onChange={set('sku')} /></Field>
          <Field label="دسته‌بندی"><select className="input" required value={f.categoryId} onChange={set('categoryId')}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="برند"><input className="input" value={f.brand} onChange={set('brand')} /></Field>
          <Field label="قیمت"><input className="input" type="number" min="0" step="any" required value={f.price} onChange={set('price')} /></Field>
          <Field label="قیمت قبل از تخفیف" hint="اختیاری؛ برای نمایش خط‌خورده"><input className="input" type="number" min="0" step="any" value={f.compareAtPrice} onChange={set('compareAtPrice')} /></Field>
          <Field label="موجودی انبار"><input className="input" type="number" min="0" value={f.stockQuantity} onChange={set('stockQuantity')} /></Field>
          <Field label="وزن (کیلوگرم)"><input className="input" type="number" min="0" step="any" value={f.weight} onChange={set('weight')} /></Field>
          <Field label="Slug (آدرس)" hint="خالی = ساخت خودکار از نام"><input className="input" dir="ltr" value={f.slug} onChange={set('slug')} /></Field>
        </div>
        <Field label="توضیح کوتاه"><input className="input" maxLength={500} value={f.shortDescription} onChange={set('shortDescription')} /></Field>
        <Field label="توضیحات کامل"><textarea className="input" rows={5} value={f.description} onChange={set('description')} /></Field>
        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.isActive} onChange={chk('isActive')} /> فعال (نمایش در فروشگاه)</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.isFeatured} onChange={chk('isFeatured')} /> محصول ویژه</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.trackInventory} onChange={chk('trackInventory')} /> مدیریت موجودی</label>
        </div>

        <fieldset className="space-y-2 rounded-lg border p-3">
          <legend className="px-1 text-sm font-medium">مشخصات فنی (دلخواه)</legend>
          {attrs.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" placeholder="نام (مثلاً رنگ)" value={a.name} onChange={(e) => setAttrs(attrs.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
              <input className="input" placeholder="مقدار" value={a.value} onChange={(e) => setAttrs(attrs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
              <button type="button" className="px-2 text-red-600" aria-label="حذف ردیف" onClick={() => setAttrs(attrs.filter((_, k) => k !== i))}>âœ•</button>
            </div>
          ))}
          <button type="button" className="text-sm text-brand-600" onClick={() => setAttrs([...attrs, { name: '', value: '' }])}>+ افزودن مشخصه</button>
        </fieldset>

        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        <button className="btn-primary" disabled={busy}>{id ? 'ذخیره تغییرات' : 'ایجاد محصول'}</button>
      </form>

      {id && product && <Images productId={id} images={product.images} reload={mutate} />}
      {id && product && <Stock productId={id} current={product.stockQuantity} reload={mutate} />}
    </div>
  );
}

function Images({ productId, images, reload }: { productId: string; images: ProductImage[]; reload: () => Promise<unknown> }) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [main, setMain] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault(); if (!file) return;
    setBusy(true); setErr('');
    const fd = new FormData();
    fd.append('File', file); fd.append('AltText', alt); fd.append('IsMain', String(main));
    try { await api(`admin/products/${productId}/images`, { method: 'POST', body: fd }); setFile(null); setAlt(''); (document.getElementById('img-file') as HTMLInputElement).value = ''; await reload(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <section className="card space-y-3">
      <h2 className="font-bold">تصاویر</h2>
      <div className="flex flex-wrap gap-3">
        {images.map((im) => (
          <div key={im.id} className={`w-32 space-y-1 rounded-lg border p-1 ${im.isMain ? 'border-brand-500' : ''}`}>
            <ProductImg src={im.url} alt={im.altText || 'تصویر محصول'} className="aspect-square w-full rounded" />
            <div className="flex justify-between text-xs">
              {im.isMain ? <span className="text-brand-600">اصلی</span> : <button className="text-brand-600" onClick={async () => { await put(`admin/products/${productId}/images/${im.id}/main`); await reload(); }}>انتخاب اصلی</button>}
              <button className="text-red-600" onClick={async () => { if (confirm('تصویر حذف شود؟')) { await del(`admin/products/${productId}/images/${im.id}`); await reload(); } }}>حذف</button>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="text-sm text-gray-500">تصویری آپلود نشده است.</p>}
      </div>
      <form onSubmit={upload} className="flex flex-wrap items-end gap-3 border-t pt-3">
        <Field label="فایل (jpg / png / webp، حداکثر ۵ مگابایت)"><input id="img-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
        <Field label="متن جایگزین"><input className="input" value={alt} onChange={(e) => setAlt(e.target.value)} /></Field>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={main} onChange={(e) => setMain(e.target.checked)} /> تصویر اصلی</label>
        <button className="btn-primary" disabled={!file || busy}>آپلود</button>
      </form>
      {err && <Alert>{err}</Alert>}
    </section>
  );
}

function Stock({ productId, current, reload }: { productId: string; current: number; reload: () => Promise<unknown> }) {
  const [qty, setQty] = useState(String(current));
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    try { await post(`admin/products/${productId}/stock`, { newQuantity: Number(qty), reason: reason || undefined }); await reload(); setMsg({ kind: 'success', text: 'موجودی به‌روز شد.' }); }
    catch (e: any) { setMsg({ kind: 'error', text: e.message }); }
  }
  return (
    <form onSubmit={save} className="card flex flex-wrap items-end gap-3">
      <h2 className="w-full font-bold">تنظیم سریع موجودی <span className="text-sm font-normal text-gray-500">(فعلی: {current.toLocaleString('fa-IR')})</span></h2>
      <Field label="موجودی جدید"><input className="input" type="number" min="0" required value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
      <Field label="دلیل (اختیاری)"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <button className="btn-outline">به‌روزرسانی</button>
      {msg && <div className="w-full"><Alert kind={msg.kind}>{msg.text}</Alert></div>}
    </form>
  );
}
