import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'kmafsar2006@gmail.com';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return;
  }

  const userCookie = request.cookies.get('crave-user');

  if (!userCookie?.value) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const user = JSON.parse(decodeURIComponent(userCookie.value));
    const userRole = user.role || 'customer';
    const userEmail = user.email || '';

    const isMasterAdmin = userRole === 'admin' || userEmail === ADMIN_EMAIL;
    const isOutletManager = userRole === 'outlet_manager';
    const isOutletStaff = userRole === 'outlet_staff';
    const isAnyStaff = isMasterAdmin || isOutletManager || isOutletStaff;

    if (!isAnyStaff) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Route-specific access control
    // Master admin: full /admin/* access
    // Outlet manager: /admin/manager/* (dashboard, orders, kitchen, menu, analytics)
    // Outlet staff: /admin/staff/* (orders, kitchen)

    if (isMasterAdmin) {
      return; // full access
    }

    if (isOutletManager && pathname.startsWith('/admin')) {
      if (pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')) {
        return NextResponse.redirect(new URL('/admin/manager', request.url));
      }
      return;
    }

    if (isOutletStaff) {
      if (pathname === '/admin' || pathname === '/admin/dashboard' ||
          pathname.startsWith('/admin/analytics') ||
          pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/outlets')) {
        return NextResponse.redirect(new URL('/admin/staff', request.url));
      }
      return;
    }

  } catch {
    return NextResponse.redirect(new URL('/auth', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
