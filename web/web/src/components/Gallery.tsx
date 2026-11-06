'use client';

import { useState } from 'react';
import type { ProductImage } from '@/lib/types';
import { useI18n } from '@/lib/i18n/client';
import { ProductImg } from './Ui';

export default function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const cur = images[i];
  return (
    <div className="space-y-3">
      <ProductImg src={cur?.url} alt={cur?.altText || name} className="aspect-square w-full rounded-xl border" />
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((im, idx) => (
            <button key={im.id} onClick={() => setI(idx)} aria-label={t('ui.imageN', { n: idx + 1 })}
              className={`shrink-0 overflow-hidden rounded-lg border-2 ${idx === i ? 'border-brand-600' : 'border-transparent'}`}>
              <ProductImg src={im.url} alt={im.altText || name} className="h-16 w-16" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
