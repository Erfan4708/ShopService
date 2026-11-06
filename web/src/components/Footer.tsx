import { getSettings } from '@/lib/server';
import { getI18n } from '@/lib/i18n/server';

export default async function Footer() {
  const { t } = getI18n();
  const s = await getSettings();
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-gray-500">
        <span>© {s['Store.Name'] || t('meta.defaultStoreName')}</span>
        <span>
          {s['Store.ContactPhone'] && <>{t('footer.supportPhone')} <bdi>{s['Store.ContactPhone']}</bdi></>}
          {s['Store.ContactEmail'] && <> · <bdi>{s['Store.ContactEmail']}</bdi></>}
        </span>
      </div>
    </footer>
  );
}
