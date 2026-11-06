import { NextRequest } from 'next/server';
import { API_INTERNAL } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: { path: string[] } }) {
  const safe = ctx.params.path.map((s) => encodeURIComponent(s)).join('/');
  const upstream = await fetch(`${API_INTERNAL}/uploads/${safe}`, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, immutable'
    }
  });
}
