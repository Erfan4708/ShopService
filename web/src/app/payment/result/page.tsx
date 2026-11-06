import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'ظ†طھغŒط¬ظ‡ ظ¾ط±ط¯ط§ط®طھ' };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default function PaymentResult({ searchParams }: { searchParams: { [k: string]: string | string[] | undefined } }) {
  const ok = one(searchParams.success) === 'true';
  const orderNumber = one(searchParams.orderNumber);
  const refId = one(searchParams.refId);
  const message = one(searchParams.message);

  return (
    <div className="mx-auto max-w-lg">
      <div className="card space-y-4 py-10 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} aria-hidden>{ok ? 'âœ“' : 'âœ•'}</div>
        <h1 className="text-xl font-bold">{ok ? 'ظ¾ط±ط¯ط§ط®طھ ط¨ط§ ظ…ظˆظپظ‚غŒطھ ط§ظ†ط¬ط§ظ… ط´ط¯' : 'ظ¾ط±ط¯ط§ط®طھ ظ†ط§ظ…ظˆظپظ‚ ط¨ظˆط¯'}</h1>
        {message && <p className="text-gray-600">{message}</p>}
        {orderNumber && <p className="text-sm">ط´ظ…ط§ط±ظ‡ ط³ظپط§ط±ط´: <bdi className="font-bold">{orderNumber}</bdi></p>}
        {ok && refId && <p className="text-sm">ع©ط¯ ظ¾غŒع¯غŒط±غŒ ط¨ط§ظ†ع©غŒ: <bdi className="font-bold">{refId}</bdi></p>}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {orderNumber && <Link className="btn-primary" href={`/orders/${encodeURIComponent(orderNumber)}`}>{ok ? 'ظ…ط´ط§ظ‡ط¯ظ‡ ط³ظپط§ط±ط´' : 'ط¨ط§ط²ع¯ط´طھ ط¨ظ‡ ط³ظپط§ط±ط´ ظˆ ظ¾ط±ط¯ط§ط®طھ ظ…ط¬ط¯ط¯'}</Link>}
          <Link className="btn-outline" href="/">طµظپط­ظ‡ ط§طµظ„غŒ</Link>
        </div>
      </div>
    </div>
  );
}
