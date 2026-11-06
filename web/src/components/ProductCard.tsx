import Link from 'next/link';
import type { ProductListItem } from '@/lib/types';
import { Price, ProductImg, Stars } from './Ui';

export default function ProductCard({ p }: { p: ProductListItem }) {
  const discount = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0;
  return (
    <Link href={`/products/${encodeURIComponent(p.slug)}`} className="card group flex flex-col overflow-hidden p-0 transition hover:shadow-md">
      <div className="relative">
        <ProductImg src={p.mainImageUrl} alt={p.name} className="aspect-square w-full" />
        {discount > 0 && <span className="badge absolute start-2 top-2 bg-red-600 text-white">{discount.toLocaleString('fa-IR')}٪ تخفیف</span>}
        {!p.inStock && <span className="badge absolute end-2 top-2 bg-gray-800 text-white">ناموجود</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-brand-600">{p.name}</h3>
        <div className="text-xs text-gray-500">{p.categoryName}</div>
        {p.reviewCount > 0 && <div className="text-xs"><Stars value={p.averageRating} /> <span className="text-gray-400">({p.reviewCount.toLocaleString('fa-IR')})</span></div>}
        <div className="mt-auto pt-2">
          {p.compareAtPrice && p.compareAtPrice > p.price && <div className="text-xs text-gray-400 line-through"><Price value={p.compareAtPrice} /></div>}
          <Price value={p.price} className="font-bold" />
        </div>
      </div>
    </Link>
  );
}
