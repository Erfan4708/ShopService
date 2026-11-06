import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server';
import { getI18n } from '@/lib/i18n/server';
import type { ProductDetail } from '@/lib/types';
import Gallery from '@/components/Gallery';
import AddToCart from '@/components/AddToCart';
import Reviews from '@/components/Reviews';
import { Price, Stars } from '@/components/Ui';

const decode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
const load = (slug: string) => serverGet<ProductDetail>(`products/${encodeURIComponent(decode(slug))}`);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  return p ? { title: p.name, description: p.shortDescription ?? undefined } : { title: getI18n().t('meta.product') };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { t, fmt } = getI18n();
  const p = await load(params.slug);
  if (!p) notFound();
  const discount = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500" aria-label={t('product.breadcrumb')}>
        <Link href="/products" className="hover:text-brand-600">{t('nav.products')}</Link> /{' '}
        <Link href={`/products?category=${encodeURIComponent(p.categorySlug)}`} className="hover:text-brand-600">{p.categoryName}</Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <Gallery images={p.images} name={p.name} />
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {p.brand && <span>{t('product.brand')} <b className="text-gray-700">{p.brand}</b></span>}
            <span>{t('product.sku')} <bdi>{p.sku}</bdi></span>
            {p.reviewCount > 0 && <span><Stars value={p.averageRating} /> {t('product.reviewsCount', { count: p.reviewCount })}</span>}
          </div>
          {p.shortDescription && <p className="text-gray-600">{p.shortDescription}</p>}

          <div className="card space-y-3 bg-gray-50">
            <div className="flex items-baseline gap-3">
              <Price value={p.price} className="text-2xl font-extrabold" />
              {discount > 0 && (
                <>
                  <span className="text-sm text-gray-400 line-through"><Price value={p.compareAtPrice!} /></span>
                  <span className="badge bg-red-600 text-white">{fmt.percent(discount)}</span>
                </>
              )}
            </div>
            {p.inStock && p.stockQuantity !== null && p.stockQuantity <= 5 && (
              <p className="text-sm text-amber-700">{t('product.lowStock', { count: p.stockQuantity })}</p>
            )}
            <AddToCart productId={p.id} inStock={p.inStock} maxQty={p.stockQuantity} />
          </div>

          {p.attributes.length > 0 && (
            <div className="card">
              <h2 className="mb-2 font-bold">{t('product.specs')}</h2>
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
          <h2 className="mb-2 text-lg font-bold">{t('product.description')}</h2>
          <p className="whitespace-pre-line leading-8 text-gray-700">{p.description}</p>
        </section>
      )}

      <Reviews productId={p.id} />
    </div>
  );
}
