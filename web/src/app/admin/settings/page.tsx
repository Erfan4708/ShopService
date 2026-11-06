'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { put } from '@/lib/api';
import type { Setting } from '@/lib/types';
import { Alert, PageTitle, Spinner } from '@/components/Ui';

export default function AdminSettings() {
  const { data, mutate } = useSWR<Setting[]>('admin/settings');
  const [vals, setVals] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  useEffect(() => { if (data) setVals(Object.fromEntries(data.map((s) => [s.key, s.value]))); }, [data]);
  if (!data) return <Spinner />;

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    try { await mutate(await put<Setting[]>('admin/settings', { settings: vals }), false); setMsg({ kind: 'success', text: 'طھظ†ط¸غŒظ…ط§طھ ط°ط®غŒط±ظ‡ ط´ط¯. (ظ†ط§ظ… ظپط±ظˆط´ع¯ط§ظ‡ ظˆ ظˆط§ط­ط¯ ظ¾ظˆظ„ ط¨ط§ ط±ظپط±ط´ طµظپط­ظ‡ ط§ط¹ظ…ط§ظ„ ظ…غŒâ€Œط´ظˆط¯.)' }); }
    catch (e: any) { setMsg({ kind: 'error', text: e.message }); }
  }

  return (
    <form onSubmit={save} className="card space-y-4">
      <PageTitle>طھظ†ط¸غŒظ…ط§طھ ظپط±ظˆط´ع¯ط§ظ‡</PageTitle>
      {data.map((s) => (
        <label key={s.key} className="block">
          <span className="label">{s.description ?? s.key} <bdi className="font-normal text-gray-400">({s.key})</bdi></span>
          <input className="input" value={vals[s.key] ?? ''} onChange={(e) => setVals({ ...vals, [s.key]: e.target.value })} />
        </label>
      ))}
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <button className="btn-primary">ط°ط®غŒط±ظ‡ طھظ†ط¸غŒظ…ط§طھ</button>
    </form>
  );
}
