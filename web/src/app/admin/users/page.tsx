'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { put, qs } from '@/lib/api';
import { useI18n } from '@/lib/i18n/client';
import type { Paged, Role } from '@/lib/types';
import { Alert, Empty, PageTitle, Pagination, Spinner } from '@/components/Ui';

type AdminUser = { id: string; email: string; phoneNumber: string | null; fullName: string; role: Role; isActive: boolean; createdAt: string; ordersCount: number };
const ROLES: Role[] = ['Customer', 'Manager', 'Admin'];

export default function AdminUsers() {
  const { t, fmt } = useI18n();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');
  const { data, mutate } = useSWR<Paged<AdminUser>>(`admin/users${qs({ search: q, page, pageSize: 15 })}`);
  async function update(id: string, body: { role?: Role; isActive?: boolean }) { setErr(''); try { await put(`admin/users/${id}`, body); await mutate(); } catch (e: any) { setErr(e.message); } }

  return (
    <div className="space-y-4">
      <PageTitle>{t('admin.users.title')}</PageTitle>
      <form className="card flex gap-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
        <input className="input !w-72" placeholder={t('admin.users.searchPlaceholder')} aria-label={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} /><button className="btn-outline">{t('common.search')}</button>
      </form>
      {err && <Alert>{err}</Alert>}
      {!data ? <Spinner /> : data.items.length === 0 ? <Empty>{t('admin.users.empty')}</Empty> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full"><thead className="border-b bg-gray-50"><tr><th className="th">{t('admin.users.name')}</th><th className="th">{t('admin.users.email')}</th><th className="th">{t('admin.users.mobile')}</th><th className="th">{t('admin.users.orders')}</th><th className="th">{t('admin.users.joined')}</th><th className="th">{t('admin.users.role')}</th><th className="th">{t('admin.users.status')}</th></tr></thead>
            <tbody className="divide-y">{data.items.map((u) => (
              <tr key={u.id}><td className="td font-medium">{u.fullName}</td><td className="td"><bdi>{u.email}</bdi></td><td className="td"><bdi>{u.phoneNumber ?? '—'}</bdi></td><td className="td">{fmt.number(u.ordersCount)}</td><td className="td">{fmt.date(u.createdAt)}</td>
                <td className="td"><select className="input !w-32 !py-1" value={u.role} aria-label={t('admin.users.role')} onChange={(e) => update(u.id, { role: e.target.value as Role })}>
                  {ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}</select></td>
                <td className="td"><button className={u.isActive ? 'text-red-600' : 'text-green-700'} onClick={() => update(u.id, { isActive: !u.isActive })}>{u.isActive ? t('admin.users.deactivate') : t('admin.users.activate')}</button></td></tr>))}</tbody></table>
        </div>
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />}
    </div>
  );
}
