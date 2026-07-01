import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kmafsar2006@gmail.com';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return;
  }

  // Check for Firebase ID token first, then fallback to user cookie
  const tokenCookie = request.cookies.get('crave-token');
  const userCookie = request.cookies.get('crave-user');

  const hasAuth = !!tokenCookie?.value || !!userCookie?.value;

  if (!hasAuth) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fast-path role hint from cookie (not authoritative — enforced by Firestore rules + API)
  let role = 'customer';
  let email = '';
  if (userCookie?.value) {
    try {
      const user = JSON.parse(decodeURIComponent(userCookie.value));
      role = user.role || 'customer';
      email = user.email || '';
    } catch {
      // malformed cookie — let page-level auth handle it
    }
  }

  const isMasterAdmin = role === 'admin' || email === ADMIN_EMAIL;
  const isOutletManager = role === 'outlet_manager';
  const isOutletStaff = role === 'outlet_staff';

  if (!isMasterAdmin && !isOutletManager && !isOutletStaff) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Route-specific access control (UX convenience — actual enforcement is in Firestore rules)
  if (isMasterAdmin) {
    return;
  }

  if (isOutletManager && (pathname === '/admin/settings' || pathname.startsWith('/admin/settings/'))) {
    return NextResponse.redirect(new URL('/admin/manager', request.url));
  }

  if (isOutletStaff) {
    const restricted = ['/admin', '/admin/dashboard', '/admin/analytics', '/admin/settings', '/admin/outlets'];
    if (restricted.includes(pathname) || pathname.startsWith('/admin/analytics/') || pathname.startsWith('/admin/settings/') || pathname.startsWith('/admin/outlets/')) {
      return NextResponse.redirect(new URL('/admin/staff', request.url));
    }
    return;
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
