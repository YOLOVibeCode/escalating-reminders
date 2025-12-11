import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if route is admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get JWT token from auth store (stored in localStorage)
    // In production, you'd want to verify the JWT and check admin role server-side
    // For now, we rely on the API returning 403 if user is not an admin
    
    // You could add a cookie-based auth check here if needed
    // const token = request.cookies.get('auth_token')?.value;
    
    // For now, let the client-side layout handle the auth check
    // and the API will reject non-admin requests
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
