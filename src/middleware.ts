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

function clearAuthCookies(res: NextResponse) {
  res.cookies.set('crave-token', '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'strict', secure: true });
  res.cookies.set('crave-user', '', { maxAge: 0, path: '/', sameSite: 'strict', secure: true });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/checkout') && !pathname.startsWith('/orders') && !pathname.startsWith('/profile') && !pathname.startsWith('/rewards')) {
    return;
  }

  const tokenCookie = request.cookies.get('crave-token');

  if (!tokenCookie?.value) {
    if (pathname.startsWith('/admin')) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      clearAuthCookies(res);
      return res;
    }
    return;
  }

  // Decode JWT and check expiry — signature verification is done server-side by API routes
  const payload = decodeJwtPayload(tokenCookie.value);
  if (!payload || isTokenExpired(payload)) {
    if (pathname.startsWith('/admin')) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      clearAuthCookies(res);
      return res;
    }
    const res = NextResponse.next();
    clearAuthCookies(res);
    return res;
  }

  // Cookie role is never trusted — only Firebase token
  return;
}

export const config = {
  matcher: ['/admin/:path*', '/checkout', '/orders/:path*', '/profile', '/rewards'],
};
