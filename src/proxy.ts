import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || 'admin';

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
  return (payload.exp as number) * 1000 < Date.now();
}

function clearAuthCookies(res: NextResponse) {
  res.cookies.set('crave-token', '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'strict', secure: true });
  res.cookies.set('crave-user', '', { maxAge: 0, path: '/', sameSite: 'strict', secure: true });
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isAdminSlug = pathname === `/${ADMIN_SLUG}` || pathname.startsWith(`/${ADMIN_SLUG}/`);
  const isProtected =
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/rewards');

  if (!isAdminSlug && !isProtected) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get('crave-token');

  if (!tokenCookie?.value) {
    const redirectPath = isAdminSlug ? `/admin${pathname.slice(ADMIN_SLUG.length + 1) || '/dashboard'}` : pathname;
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', redirectPath);
    const res = NextResponse.redirect(loginUrl);
    clearAuthCookies(res);
    return res;
  }

  const payload = decodeJwtPayload(tokenCookie.value);
  if (!payload || isTokenExpired(payload)) {
    const redirectPath = isAdminSlug ? `/admin${pathname.slice(ADMIN_SLUG.length + 1) || '/dashboard'}` : pathname;
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', redirectPath);
    const res = NextResponse.redirect(loginUrl);
    clearAuthCookies(res);
    return res;
  }

  if (isAdminSlug) {
    const adminPath = `/admin${pathname.slice(ADMIN_SLUG.length + 1) || '/dashboard'}`;
    return NextResponse.rewrite(new URL(adminPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|images/|Font/).*)',
  ],
};
