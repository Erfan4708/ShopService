import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server';
import type { ProductDetail } from '@/lib/types';
import Gallery from '@/components/Gallery';
import AddToCart from '@/components/AddToCart';
import Reviews from '@/components/Reviews';
import { Price, Stars } from '@/components/Ui';

const decode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
const load = (slug: string) => serverGet<ProductDetail>(`products/${encodeURIComponent(decode(slug))}`);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  return p ? { title: p.name, description: p.shortDescription ?? undefined } : { title: 'ظ…ط­طµظˆظ„' };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();
  const discount = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500" aria-label="ظ…ط³غŒط±">
        <Link href="/products" className="hover:text-brand-600">ظ…ط­طµظˆظ„ط§طھ</Link> /{' '}
        <Link href={`/products?category=${encodeURIComponent(p.categorySlug)}`} className="hover:text-brand-600">{p.categoryName}</Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <Gallery images={p.images} name={p.name} />
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {p.brand && <span>ط¨ط±ظ†ط¯: <b className="text-gray-700">{p.brand}</b></span>}
            <span>ع©ط¯ ع©ط§ظ„ط§: <bdi>{p.sku}</bdi></span>
            {p.reviewCount > 0 && <span><Stars value={p.averageRating} /> ({p.reviewCount.toLocaleString('fa-IR')} ظ†ط¸ط±)</span>}
          </div>
          {p.shortDescription && <p className="text-gray-600">{p.shortDescription}</p>}

          <div className="card space-y-3 bg-gray-50">
            <div className="flex items-baseline gap-3">
              <Price value={p.price} className="text-2xl font-extrabold" />
              {discount > 0 && (
                <>
                  <span className="text-sm text-gray-400 line-through"><Price value={p.compareAtPrice!} /></span>
                  <span className="badge bg-red-600 text-white">{discount.toLocaleString('fa-IR')}ظھ</span>
                </>
              )}
            </div>
            {p.inStock && p.stockQuantity !== null && p.stockQuantity <= 5 && (
              <p className="text-sm text-amber-700">طھظ†ظ‡ط§ {p.stockQuantity.toLocaleString('fa-IR')} ط¹ط¯ط¯ ط¯ط± ط§ظ†ط¨ط§ط± ط¨ط§ظ‚غŒ ظ…ط§ظ†ط¯ظ‡ ط§ط³طھ.</p>
            )}
            <AddToCart productId={p.id} inStock={p.inStock} maxQty={p.stockQuantity} />
          </div>

          {p.attributes.length > 0 && (
            <div className="card">
              <h2 className="mb-2 font-bold">ظ…ط´ط®طµط§طھ</h2>
              <dl className="divide-y text-sm">
                {p.attributes.map((a, i) => (
                  <div key={i} className="flex justify-between gap-4 py-2"><dt className="text-gray-500">{a.name}</dt><dd>{a.value}</dd></div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {p.description && (
        <section className="card">
          <h2 className="mb-2 text-lg font-bold">طھظˆط¶غŒط­ط§طھ</h2>
          <p className="whitespace-pre-line leading-8 text-gray-700">{p.description}</p>
        </section>
      )}

      <Reviews productId={p.id} />
    </div>
  );
}
