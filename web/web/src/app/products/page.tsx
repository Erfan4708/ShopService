import Link from 'next/link';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server';
import { getI18n } from '@/lib/i18n/server';
import type { Category, Paged, ProductListItem } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { Empty, Pagination } from '@/components/Ui';

export async function generateMetadata(): Promise<Metadata> {
  return { title: getI18n().t('meta.products') };
}

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const { t } = getI18n();
  const search = one(searchParams.search), category = one(searchParams.category);
  const minPrice = one(searchParams.minPrice), maxPrice = one(searchParams.maxPrice);
  const inStock = one(searchParams.inStock), sort = one(searchParams.sort) || 'Newest';
  const page = Math.max(1, Number(one(searchParams.page)) || 1);

  const q = new URLSearchParams({ pageSize: '12', page: String(page), sort });
  if (search) q.set('search', search);
  if (category) q.set('categorySlug', category);
  if (minPrice) q.set('minPrice', minPrice);
  if (maxPrice) q.set('maxPrice', maxPrice);
  if (inStock) q.set('inStockOnly', 'true');

  const [data, cats] = await Promise.all([serverGet<Paged<ProductListItem>>(`products?${q}`), serverGet<Category[]>('categories')]);

  const paginationQuery = new URLSearchParams();

  Object.entries({
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
    sort,
  }).forEach(([k, v]) => {
    if (v) paginationQuery.set(k, v);
  });

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside className="space-y-4">
        <form method="get" action="/products" className="card space-y-3">
          <div>
            <label className="label" htmlFor="search">{t('products.search')}</label>
            <input id="search" name="search" defaultValue={search} className="input" />
          </div>
          {category && <input type="hidden" name="category" value={category} />}
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label" htmlFor="minPrice">{t('products.minPrice')}</label><input id="minPrice" name="minPrice" type="number" min="0" defaultValue={minPrice} className="input" /></div>
            <div><label className="label" htmlFor="maxPrice">{t('products.maxPrice')}</label><input id="maxPrice" name="maxPrice" type="number" min="0" defaultValue={maxPrice} className="input" /></div>
          </div>
          <div>
            <label className="label" htmlFor="sort">{t('products.sort')}</label>
            <select id="sort" name="sort" defaultValue={sort} className="input">
              <option value="Newest">{t('products.sort.newest')}</option>
              <option value="PriceAsc">{t('products.sort.priceAsc')}</option>
              <option value="PriceDesc">{t('products.sort.priceDesc')}</option>
              <option value="BestSelling">{t('products.sort.bestSelling')}</option>
              <option value="Rating">{t('products.sort.rating')}</option>
              <option value="Name">{t('products.sort.name')}</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="inStock" value="true" defaultChecked={!!inStock} /> {t('products.inStockOnly')}</label>
          <button className="btn-primary w-full">{t('products.applyFilters')}</button>
          <Link href="/products" className="block text-center text-sm text-gray-500">{t('products.clearFilters')}</Link>
        </form>

        {cats && cats.length > 0 && (
          <nav className="card" aria-label={t('products.categories')}>
            <h2 className="mb-2 font-bold">{t('products.categories')}</h2>
            <CategoryTree cats={cats} active={category} />
          </nav>
        )}
      </aside>

      <section>
        {!data ? (
          <Empty>{t('common.serverUnreachable')}</Empty>
        ) : data.items.length === 0 ? (
          <Empty>{t('products.noResults')}</Empty>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-500">{t('products.count', { count: data.totalCount })}</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{data.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              basePath="/products"
              query={paginationQuery.toString()}
            />
          </>
        )}
      </section>
    </div>
  );
}

function CategoryTree({ cats, active }: { cats: Category[]; active: string }) {
  return (
    <ul className="space-y-1 text-sm">
      {cats.map((c) => (
        <li key={c.id}>
          <Link href={`/products?category=${encodeURIComponent(c.slug)}`} className={active === c.slug ? 'font-bold text-brand-600' : 'hover:text-brand-600'}>{c.name}</Link>
          {c.children.length > 0 && <div className="ms-3 mt-1 border-s ps-2"><CategoryTree cats={c.children} active={active} /></div>}
        </li>
      ))}
    </ul>
  );
}
