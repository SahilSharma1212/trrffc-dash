import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { AUTH_COOKIE_NAME, SIGNIN_PATH, DASHBOARD_PATH, ROOT_PATH } from '@/lib/constants';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isSigninPage = pathname === SIGNIN_PATH;
  const isDashboardOrRoot = pathname.startsWith(DASHBOARD_PATH) || pathname === ROOT_PATH;

  const payload = await verifyToken(token);
  const isAuthenticated = !!payload;

  // Redirect authenticated users away from signin page
  if (isSigninPage && isAuthenticated) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  // Redirect unauthenticated users to signin
  if (isDashboardOrRoot && !isAuthenticated) {
    return NextResponse.redirect(new URL(SIGNIN_PATH, request.url));
  }

  // Authenticated users at root -> dashboard
  if (pathname === ROOT_PATH && isAuthenticated) {
    return NextResponse.redirect(new URL(DASHBOARD_PATH, request.url));
  }

  return NextResponse.next();
}

// Add default export as well to satisfy all possible Next.js 16 requirements
export default proxy;

export const config = {
  matcher: ['/', '/dashboard/:path*', '/signin'],
};
