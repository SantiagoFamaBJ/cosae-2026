import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// /admin (minúscula) y sus subrutas redirigen a la ruta oficial /ADMIN
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.redirect(new URL('/ADMIN' + pathname.slice(6) + search, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
