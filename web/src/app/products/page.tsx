import Link from 'next/link';
import type { Metadata } from 'next';
import { serverGet } from '@/lib/server';
import type { Category, Paged, ProductListItem } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { Empty, Pagination } from '@/components/Ui';

export const metadata: Metadata = { title: 'ظ…ط­طµظˆظ„ط§طھ' };

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
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
            <label className="label" htmlFor="search">ط¬ط³طھط¬ظˆ</label>
            <input id="search" name="search" defaultValue={search} className="input" />
          </div>
          {category && <input type="hidden" name="category" value={category} />}
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label" htmlFor="minPrice">ط§ط² ظ‚غŒظ…طھ</label><input id="minPrice" name="minPrice" type="number" min="0" defaultValue={minPrice} className="input" /></div>
            <div><label className="label" htmlFor="maxPrice">طھط§ ظ‚غŒظ…طھ</label><input id="maxPrice" name="maxPrice" type="number" min="0" defaultValue={maxPrice} className="input" /></div>
          </div>
          <div>
            <label className="label" htmlFor="sort">ظ…ط±طھط¨â€Œط³ط§ط²غŒ</label>
            <select id="sort" name="sort" defaultValue={sort} className="input">
              <option value="Newest">ط¬ط¯غŒط¯طھط±غŒظ†</option>
              <option value="PriceAsc">ط§ط±ط²ط§ظ†â€Œطھط±غŒظ†</option>
              <option value="PriceDesc">ع¯ط±ط§ظ†â€Œطھط±غŒظ†</option>
              <option value="BestSelling">ظ¾ط±ظپط±ظˆط´â€Œطھط±غŒظ†</option>
              <option value="Rating">ط¨غŒط´طھط±غŒظ† ط§ظ…طھغŒط§ط²</option>
              <option value="Name">ظ†ط§ظ…</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="inStock" value="true" defaultChecked={!!inStock} /> ظپظ‚ط· ع©ط§ظ„ط§ظ‡ط§غŒ ظ…ظˆط¬ظˆط¯</label>
          <button className="btn-primary w-full">ط§ط¹ظ…ط§ظ„ ظپغŒظ„طھط±</button>
          <Link href="/products" className="block text-center text-sm text-gray-500">ط­ط°ظپ ظپغŒظ„طھط±ظ‡ط§</Link>
        </form>

        {cats && cats.length > 0 && (
          <nav className="card" aria-label="ط¯ط³طھظ‡â€Œط¨ظ†ط¯غŒâ€Œظ‡ط§">
            <h2 className="mb-2 font-bold">ط¯ط³طھظ‡â€Œط¨ظ†ط¯غŒâ€Œظ‡ط§</h2>
            <CategoryTree cats={cats} active={category} />
          </nav>
        )}
      </aside>

      <section>
        {!data ? (
          <Empty>ط§ط±طھط¨ط§ط· ط¨ط§ ط³ط±ظˆط± ط¨ط±ظ‚ط±ط§ط± ظ†ط´ط¯.</Empty>
        ) : data.items.length === 0 ? (
          <Empty>ظ…ط­طµظˆظ„غŒ ط¨ط§ ط§غŒظ† ظ…ط´ط®طµط§طھ ظ¾غŒط¯ط§ ظ†ط´ط¯.</Empty>
        ) : (
          <>
            <p className="mb-3 text-sm text-gray-500">{data.totalCount.toLocaleString('fa-IR')} ظ…ط­طµظˆظ„</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{data.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              basePath="/products"
              query={paginationQuery.toString()}
            />          </>
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
