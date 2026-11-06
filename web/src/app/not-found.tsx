import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold">صفحه پیدا نشد</h1>
      <p className="mb-6 text-gray-500">آدرس درخواستی وجود ندارد یا حذف شده است.</p>
      <Link href="/" className="btn-primary">بازگشت به خانه</Link>
    </div>
  );
}
