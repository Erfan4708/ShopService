export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch('/api/' + path.replace(/^\//, ''), {
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(headers || {}) },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: 'same-origin',
    cache: 'no-store'
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    let msg: string = data?.title || data?.message || 'ط®ط·ط§غŒغŒ ط±ط® ط¯ط§ط¯. ط¯ظˆط¨ط§ط±ظ‡ طھظ„ط§ط´ ع©ظ†غŒط¯.';
    if (data?.errors && typeof data.errors === 'object') {
      const first = Object.values(data.errors as Record<string, string[]>)[0];
      if (Array.isArray(first) && first[0]) msg = first[0];
    }
    if (res.status === 429) msg = 'طھط¹ط¯ط§ط¯ ط¯ط±ط®ظˆط§ط³طھâ€Œظ‡ط§ ط²غŒط§ط¯ ط§ط³طھ. ع©ظ…غŒ ط¨ط¹ط¯ طھظ„ط§ط´ ع©ظ†غŒط¯.';
    throw new ApiError(msg, res.status, data?.code);
  }
  return data as T;
}

export const fetcher = <T = unknown>(path: string) => api<T>(path);
export const post = <T = unknown>(path: string, json?: unknown) => api<T>(path, { method: 'POST', json: json ?? {} });
export const put = <T = unknown>(path: string, json?: unknown) => api<T>(path, { method: 'PUT', json: json ?? {} });
export const del = <T = unknown>(path: string) => api<T>(path, { method: 'DELETE' });

export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, String(v));
  });
  const s = p.toString();
  return s ? '?' + s : '';
}
