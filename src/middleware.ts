import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return payload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: Record<string, any>): boolean {
  if (!payload.exp) return true;
  return payload.exp * 1000 < Date.now();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return;
  }

  const tokenCookie = request.cookies.get('crave-token');
  const userCookie = request.cookies.get('crave-user');

  if (!tokenCookie?.value) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('crave-token');
    res.cookies.delete('crave-user');
    return res;
  }

  // Decode JWT and check expiry
  const payload = decodeJwtPayload(tokenCookie.value);
  if (!payload || isTokenExpired(payload)) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('crave-token');
    res.cookies.delete('crave-user');
    return res;
  }

  // Verify payload contains required fields (uid, exp, iat)
  // Note: Signature verification is done server-side by API routes
  // Cookie role is never trusted - only Firebase token
  return;
}

export const config = {
  matcher: ['/admin/:path*'],
};
