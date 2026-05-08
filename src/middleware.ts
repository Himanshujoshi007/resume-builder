import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const SUBSCRIPTION_DAYS = 30;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/seed-admin')) {
    return NextResponse.next();
  }

  // API routes that handle their own auth
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
  }

  // Admin routes - only admin can access
  if (pathname.startsWith('/admin') && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // For client accessing the main app, we need to check subscription
  // We do this via a header that the client-side will verify
  if (payload.role === 'client' && !pathname.startsWith('/api/')) {
    // Add user info to headers so client can check subscription
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
