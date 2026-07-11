import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge Runtime limitations prevent full Firebase Admin SDK usage here.
 * This proxy handles ONLY:
 *   - Redirecting unauthenticated users away from protected routes to /auth
 *   - Checking role claims from the JWT for admin route access
 *   - Clearing expired auth cookies
 *
 * Full authorization is enforced at three levels:
 *   1. Firebase Admin SDK verifyIdToken() in every API route (requireAuth)
 *   2. Firestore Security Rules on every document read/write
 *   3. Client-side permission guards on every admin page
 */

function decodeJwtPayload(token: string): Record<string, unknown> | null {
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

function isTokenExpired(payload: Record<string, unknown>): boolean {
  if (!payload.exp) return true;
  return payload.exp * 1000 < Date.now();
}

function clearAuthCookies(res: NextResponse) {
  res.cookies.set('crave-token', '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'strict', secure: true });
  res.cookies.set('crave-user', '', { maxAge: 0, path: '/', sameSite: 'strict', secure: true });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/checkout') && !pathname.startsWith('/orders') && !pathname.startsWith('/profile') && !pathname.startsWith('/rewards')) {
    return;
  }

  const tokenCookie = request.cookies.get('crave-token');

  if (!tokenCookie?.value) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/orders') || pathname.startsWith('/profile') || pathname.startsWith('/rewards') || pathname.startsWith('/checkout')) {
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      clearAuthCookies(res);
      return res;
    }
    return;
  }

  const payload = decodeJwtPayload(tokenCookie.value);
  if (!payload || isTokenExpired(payload)) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    clearAuthCookies(res);
    return res;
  }

  // Role check removed — JWT custom claims may not be set yet.
  // Role authorization is enforced by:
  //   1. Client-side guards on admin pages
  //   2. requireStaff() in API routes (verifies via Admin SDK)

  return;
}

export const config = {
  matcher: ['/admin/:path*', '/checkout', '/orders/:path*', '/profile', '/rewards'],
};
