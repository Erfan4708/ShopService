'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { del, post, put } from '@/lib/api';
import { useAuth } from '@/lib/hooks';
import { faToEn } from '@/lib/format';
import type { Address } from '@/lib/types';
import AddressForm from '@/components/AddressForm';
import { Alert, Field, PageTitle, Spinner } from '@/components/Ui';

export default function AccountPage() {
  const { user } = useAuth();
  const { mutate: mutateUser } = useSWR('account/profile');
  const { data: addresses, mutate: mutateAddr } = useSWR<Address[]>('account/addresses');
  const [p, setP] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [pm, setPm] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwm, setPwm] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  useEffect(() => { if (user) setP({ firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber ?? '' }); }, [user]);
  if (!user) return <Spinner />;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setPm(null);
    try { await put('account/profile', { ...p, phoneNumber: faToEn(p.phoneNumber.trim()) || null }); await mutateUser(); setPm({ kind: 'success', text: 'پروفایل ذخیره شد.' }); }
    catch (e: any) { setPm({ kind: 'error', text: e.message }); }
  }
  async function savePw(e: React.FormEvent) {
    e.preventDefault(); setPwm(null);
    try { await post('account/change-password', pw); setPw({ currentPassword: '', newPassword: '' }); setPwm({ kind: 'success', text: 'رمز عبور تغییر کرد. در سایر دستگاه‌ها باید دوباره وارد شوید.' }); }
    catch (e: any) { setPwm({ kind: 'error', text: e.message }); }
  }

  return (
    <div className="space-y-6">
      <PageTitle>حساب کاربری</PageTitle>
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-3">
          <h2 className="font-bold">اطلاعات شخصی</h2>
          <p className="text-sm text-gray-500" dir="ltr">{user.email}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="نام"><input className="input" required value={p.firstName} onChange={(e) => setP({ ...p, firstName: e.target.value })} /></Field>
            <Field label="نام خانوادگی"><input className="input" required value={p.lastName} onChange={(e) => setP({ ...p, lastName: e.target.value })} /></Field>
          </div>
          <Field label="موبایل"><input className="input" dir="ltr" inputMode="tel" value={p.phoneNumber} onChange={(e) => setP({ ...p, phoneNumber: e.target.value })} /></Field>
          {pm && <Alert kind={pm.kind}>{pm.text}</Alert>}
          <button className="btn-primary">ذخیره</button>
        </form>
        <form onSubmit={savePw} className="card space-y-3">
          <h2 className="font-bold">تغییر رمز عبور</h2>
          <Field label="رمز فعلی"><input className="input" dir="ltr" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="رمز جدید" hint="حداقل ۸ کاراکتر"><input className="input" dir="ltr" type="password" required minLength={8} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          {pwm && <Alert kind={pwm.kind}>{pwm.text}</Alert>}
          <button className="btn-primary">تغییر رمز</button>
        </form>
      </div>

      <section className="card space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-bold">آدرس‌ها</h2>
          {editing !== 'new' && <button className="text-sm text-brand-600" onClick={() => setEditing('new')}>+ آدرس جدید</button>}</div>
        {editing === 'new' && <AddressForm onSaved={async () => { await mutateAddr(); setEditing(null); }} onCancel={() => setEditing(null)} />}
        {addresses?.length === 0 && editing !== 'new' && <p className="text-sm text-gray-500">آدرسی ثبت نشده است.</p>}
        <ul className="space-y-3">
          {addresses?.map((a) => (
            <li key={a.id} className="rounded-lg border p-3">
              {editing === a.id ? (
                <AddressForm initial={a} onSaved={async () => { await mutateAddr(); setEditing(null); }} onCancel={() => setEditing(null)} />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                  <div><b>{a.title}</b> {a.isDefault && <span className="badge bg-brand-100 text-brand-700">پیش‌فرض</span>}
                    <p>{a.receiverName} â€” <bdi>{a.receiverPhone}</bdi></p>
                    <p className="text-gray-600">{a.province}، {a.city}، {a.addressLine} â€” <bdi>{a.postalCode}</bdi></p></div>
                  <div className="flex gap-3"><button className="text-brand-600" onClick={() => setEditing(a.id)}>ویرایش</button>
                    <button className="text-red-600" onClick={async () => { if (confirm('این آدرس حذف شود؟')) { await del(`account/addresses/${a.id}`); await mutateAddr(); } }}>حذف</button></div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
