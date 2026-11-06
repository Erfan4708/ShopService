import type { Setting } from './types';
import { getLocale } from './i18n/server';

export const API_INTERNAL = process.env.API_INTERNAL_URL || 'http://localhost:8080';

export async function serverGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_INTERNAL}/api/v1/${path}`, { cache: 'no-store', headers: { 'Accept-Language': getLocale() } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  const list = await serverGet<Setting[]>('settings/public');
  return Object.fromEntries((list ?? []).map((s) => [s.key, s.value]));
}
