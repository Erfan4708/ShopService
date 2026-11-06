import { getSettings } from '@/lib/server';

export default async function Footer() {
  const s = await getSettings();
  return (
    <footer className="mt-12 border-t bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-gray-500">
        <span>آ© {s['Store.Name'] || 'ظپط±ظˆط´ع¯ط§ظ‡'}</span>
        <span>
          {s['Store.ContactPhone'] && <>طھظ„ظپظ† ظ¾ط´طھغŒط¨ط§ظ†غŒ: <bdi>{s['Store.ContactPhone']}</bdi></>}
          {s['Store.ContactEmail'] && <> آ· <bdi>{s['Store.ContactEmail']}</bdi></>}
        </span>
      </div>
    </footer>
  );
}
