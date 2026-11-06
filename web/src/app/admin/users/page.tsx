'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { put, qs } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Paged, Role } from '@/lib/types';
import { Alert, Empty, PageTitle, Pagination, Spinner } from '@/components/Ui';

type AdminUser = { id: string; email: string; phoneNumber: string | null; fullName: string; role: Role; isActive: boolean; createdAt: string; ordersCount: number };
const ROLE_LABEL: Record<Role, string> = { Customer: 'مشتری', Manager: 'مدیر محتوا', Admin: 'مدیر کل' };

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');
  const { data, mutate } = useSWR<Paged<AdminUser>>(`admin/users${qs({ search: q, page, pageSize: 15 })}`);
  async function update(id: string, body: { role?: Role; isActive?: boolean }) { setErr(''); try { await put(`admin/users/${id}`, body); await mutate(); } catch (e: any) { setErr(e.message); } }

  return (
    <div className="space-y-4">
      <PageTitle>کاربران</PageTitle>
      <form className="card flex gap-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
        <input className="input !w-72" placeholder="ایمیل / نام / موبایل" value={search} onChange={(e) => setSearch(e.target.value)} /><button className="btn-outline">جستجو</button>
      </form>
      {err && <Alert>{err}</Alert>}
      {!data ? <Spinner /> : data.items.length === 0 ? <Empty>کاربری یافت نشد.</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">نام</th><th className="th">ایمیل</th><th className="th">موبایل</th><th className="th">سفارش‌ها</th><th className="th">عضویت</th><th className="th">نقش</th><th className="th">وضعیت</th></tr></thead>
            <tbody className="divide-y">{data.items.map((u) => (
              <tr key={u.id}><td className="td font-medium">{u.fullName}</td><td className="td"><bdi>{u.email}</bdi></td><td className="td"><bdi>{u.phoneNumber ?? 'â€”'}</bdi></td><td className="td">{u.ordersCount.toLocaleString('fa-IR')}</td><td className="td">{formatDate(u.createdAt)}</td>
                <td className="td"><select className="input !w-32 !py-1" value={u.role} aria-label="نقش" onChange={(e) => update(u.id, { role: e.target.value as Role })}>
                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></td>
                <td className="td"><button className={u.isActive ? 'text-red-600' : 'text-green-700'} onClick={() => update(u.id, { isActive: !u.isActive })}>{u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</button></td></tr>))}</tbody></table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </div>
  );
}
