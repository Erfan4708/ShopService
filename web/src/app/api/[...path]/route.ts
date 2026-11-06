import { NextRequest, NextResponse } from 'next/server';
import { API_INTERNAL } from '@/lib/server';


export const dynamic = 'force-dynamic';

const SECURE = process.env.COOKIE_SECURE === 'true';
const COOKIE = { httpOnly: true, sameSite: 'lax' as const, secure: SECURE, path: '/' };

type Tokens = { accessToken: string; accessTokenExpiresAt: string; refreshToken: string; user?: unknown };

const inflight = new Map<string, Promise<Tokens | null>>();

function refreshTokens(refreshToken: string): Promise<Tokens | null> {
  const existing = inflight.get(refreshToken);
  if (existing) return existing;
  const p = (async () => {
    try {
      const res = await fetch(`${API_INTERNAL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store'
      });
      return res.ok ? ((await res.json()) as Tokens) : null;
    } catch {
      return null;
    }
  })();
  inflight.set(refreshToken, p);
  setTimeout(() => inflight.delete(refreshToken), 30_000); // ط¯ط±ط®ظˆط§ط³طھâ€Œظ‡ط§غŒغŒ ع©ظ‡ ظ‡ظ†ظˆط² ع©ظˆع©غŒ ظ‚ط¯غŒظ…غŒ ط¯ط§ط±ظ†ط¯ ظ‡ظ…ط§ظ† ظ†طھغŒط¬ظ‡ ط±ط§ ظ…غŒâ€Œع¯غŒط±ظ†ط¯
  return p;
}

function setAuthCookies(res: NextResponse, t: Tokens) {
  res.cookies.set('access_token', t.accessToken, { ...COOKIE, expires: new Date(t.accessTokenExpiresAt) });
  res.cookies.set('refresh_token', t.refreshToken, { ...COOKIE, maxAge: 60 * 60 * 24 * 7 });
}

function clearAuthCookies(res: NextResponse) {
  res.cookies.set('access_token', '', { ...COOKIE, maxAge: 0 });
  res.cookies.set('refresh_token', '', { ...COOKIE, maxAge: 0 });
}

async function handle(req: NextRequest, ctx: { params: { path: string[] } }) {
  const path = ctx.params.path.join('/');
  const method = req.method;
  const isAuthPath = path.startsWith('auth/');
  let access = req.cookies.get('access_token')?.value;
  const refresh = req.cookies.get('refresh_token')?.value;
  const cartToken = req.cookies.get('cart_token')?.value;

  let body: BodyInit | undefined;
  let contentType = req.headers.get('content-type') || undefined;
  if (path === 'auth/logout' || path === 'auth/refresh') {
    body = JSON.stringify({ refreshToken: refresh ?? '' });
    contentType = 'application/json';
  } else if (method !== 'GET' && method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  let rotated: Tokens | null = null;
  if (!access && refresh && !isAuthPath) {
    rotated = await refreshTokens(refresh);
    if (rotated) access = rotated.accessToken;
  }

  const call = (token?: string) => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (contentType) headers['Content-Type'] = contentType;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (cartToken) headers['X-Cart-Token'] = cartToken;
    const xff = req.headers.get('x-forwarded-for');
    if (xff) headers['X-Forwarded-For'] = xff;
    return fetch(`${API_INTERNAL}/api/v1/${path}${req.nextUrl.search}`, { method, headers, body, redirect: 'manual', cache: 'no-store' });
  };

  let upstream: Response;
  try {
    upstream = await call(access);
    if (upstream.status === 401 && !isAuthPath && refresh && !rotated) {
      rotated = await refreshTokens(refresh);
      if (rotated) upstream = await call(rotated.accessToken);
    }
  } catch {
    return NextResponse.json({ status: 502, code: 'upstream_unreachable', title: 'ط§ط±طھط¨ط§ط· ط¨ط§ ط³ط±ظˆط± ط¨ط±ظ‚ط±ط§ط± ظ†ط´ط¯.' }, { status: 502 });
  }

  const text = upstream.status === 204 ? '' : await upstream.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }

  if (isAuthPath && upstream.ok && json?.accessToken && (path === 'auth/login' || path === 'auth/register' || path === 'auth/refresh')) {
    const res = NextResponse.json({ user: json.user }, { status: upstream.status });
    setAuthCookies(res, json as Tokens);
    if (cartToken && path !== 'auth/refresh') {
      try {
        await fetch(`${API_INTERNAL}/api/v1/cart/merge`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${json.accessToken}`, 'X-Cart-Token': cartToken },
          cache: 'no-store'
        });
      } catch { /* ط§ط¯ط؛ط§ظ… ط³ط¨ط¯ ط­غŒط§طھغŒ ظ†غŒط³طھ */ }
      res.cookies.set('cart_token', '', { ...COOKIE, maxAge: 0 });
    }
    return res;
  }

  const out = text
    ? new NextResponse(text, { status: upstream.status, headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' } })
    : new NextResponse(null, { status: upstream.status });

  if (path === 'auth/logout') clearAuthCookies(out);
  if (rotated) setAuthCookies(out, rotated);
  else if (upstream.status === 401 && refresh && !isAuthPath) clearAuthCookies(out); // refresh ظ‡ظ… ظ†ط§ظ…ط¹طھط¨ط± ط§ط³طھ
  if (path.startsWith('cart') && upstream.ok && json && typeof json.token === 'string' && !access) {
    out.cookies.set('cart_token', json.token, { ...COOKIE, maxAge: 60 * 60 * 24 * 30 });
  }
  return out;
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH };
