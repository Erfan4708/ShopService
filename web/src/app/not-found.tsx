import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold">طµظپط­ظ‡ ظ¾غŒط¯ط§ ظ†ط´ط¯</h1>
      <p className="mb-6 text-gray-500">ط¢ط¯ط±ط³ ط¯ط±ط®ظˆط§ط³طھغŒ ظˆط¬ظˆط¯ ظ†ط¯ط§ط±ط¯ غŒط§ ط­ط°ظپ ط´ط¯ظ‡ ط§ط³طھ.</p>
      <Link href="/" className="btn-primary">ط¨ط§ط²ع¯ط´طھ ط¨ظ‡ ط®ط§ظ†ظ‡</Link>
    </div>
  );
}
