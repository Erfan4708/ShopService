import Link from 'next/link';
import { serverGet } from '@/lib/server';
import { getI18n } from '@/lib/i18n/server';
import type { TFunction } from '@/lib/i18n/translate';
import type { Category, Paged, ProductListItem } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { Empty } from '@/components/Ui';

export default async function HomePage() {
  const { t } = getI18n();
  const [featured, newest, cats] = await Promise.all([
    serverGet<Paged<ProductListItem>>('products?featuredOnly=true&pageSize=8'),
    serverGet<Paged<ProductListItem>>('products?sort=Newest&pageSize=8'),
    serverGet<Category[]>('categories')
  ]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-12 text-white rtl:bg-gradient-to-l">
        <h1 className="mb-2 text-3xl font-extrabold">{t('home.heroTitle')}</h1>
        <p className="mb-6 max-w-xl text-brand-100">{t('home.heroText')}</p>
        <Link href="/products" className="btn bg-white text-brand-700 hover:bg-brand-50">{t('home.browse')}</Link>
      </section>

      {cats && cats.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">{t('home.categories')}</h2>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Link key={c.id} href={`/products?category=${encodeURIComponent(c.slug)}`} className="btn-outline">{c.name}</Link>
            ))}
          </div>
        </section>
      )}

      <Section t={t} title={t('home.featured')} data={featured} />
      <Section t={t} title={t('home.newest')} data={newest} more />
    </div>
  );
}

function Section({ t, title, data, more }: { t: TFunction; title: string; data: Paged<ProductListItem> | null; more?: boolean }) {
  if (!data) return <Empty>{t('common.serverUnreachable')}</Empty>;
  if (data.items.length === 0) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {more && <Link href="/products" className="text-sm text-brand-600">{t('home.viewAll')}</Link>}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
