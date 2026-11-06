import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('access_token') || req.cookies.has('refresh_token');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/checkout/:path*', '/orders/:path*', '/account/:path*', '/admin/:path*'] };
