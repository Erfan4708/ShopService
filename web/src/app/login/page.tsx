'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { faToEn, safeNext } from '@/lib/format';
import { Alert, Field } from '@/components/Ui';

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get('next'));
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(sp.get('mode') === 'register' ? 'register' : 'login');
  const [f, setF] = useState({ identifier: '', password: '', email: '', firstName: '', lastName: '', phoneNumber: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      if (mode === 'login') await login(faToEn(f.identifier.trim()), f.password);
      else await register({ email: f.email.trim(), password: f.password, firstName: f.firstName.trim(), lastName: f.lastName.trim(), phoneNumber: faToEn(f.phoneNumber.trim()) || undefined });
      router.push(next);
      router.refresh();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card space-y-4">
        <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm">
          {(['login', 'register'] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setErr(''); }}
              className={`rounded-md py-2 ${mode === m ? 'bg-white font-bold shadow-sm' : 'text-gray-500'}`}>{m === 'login' ? 'ورود' : 'ثبت‌نام'}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'login' ? (
            <Field label="ایمیل یا شماره موبایل"><input className="input" dir="ltr" required autoComplete="username" value={f.identifier} onChange={set('identifier')} /></Field>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="نام"><input className="input" required value={f.firstName} onChange={set('firstName')} /></Field>
                <Field label="نام خانوادگی"><input className="input" required value={f.lastName} onChange={set('lastName')} /></Field>
              </div>
              <Field label="ایمیل"><input className="input" dir="ltr" type="email" required autoComplete="email" value={f.email} onChange={set('email')} /></Field>
              <Field label="شماره موبایل (اختیاری)"><input className="input" dir="ltr" inputMode="tel" value={f.phoneNumber} onChange={set('phoneNumber')} /></Field>
            </>
          )}
          <Field label="رمز عبور" hint={mode === 'register' ? 'حداقل ۸ کاراکتر' : undefined}>
            <input className="input" dir="ltr" type="password" required minLength={mode === 'register' ? 8 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={set('password')} />
          </Field>
          {err && <Alert>{err}</Alert>}
          <button className="btn-primary w-full" disabled={busy}>{mode === 'login' ? 'ورود' : 'ساخت حساب'}</button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
