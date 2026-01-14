import { NextRequest, NextResponse } from 'next/server';

// Protect only /app and /profile routes
const isProtectedRoute = (pathname: string) => {
  return (
    pathname.startsWith('/app') ||
    pathname.startsWith('/profile')
  );
};

// Check if route is authentication page
const isAuthRoute = (pathname: string) => {
  return pathname.startsWith('/auth');
};

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Get token from cookie
  const accessToken = req.cookies.get('accessToken')?.value;

  // If user is authenticated and on homepage, redirect to app
  if (accessToken && path === '/') {
    return NextResponse.redirect(new URL('/app', req.url));
  }

  // If user is NOT authenticated and on homepage, redirect to login
  if (!accessToken && path === '/') {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url));
  }

  // Check if route needs protection
  if (isProtectedRoute(path)) {
    // If no token, redirect to login page
    if (!accessToken) {
      const url = new URL('/auth/sign-in', req.url);
      // Add check for circular redirect - only add callbackUrl if not already on auth page
      if (!path.includes('/auth/sign-in') && !path.includes('/auth')) {
        url.searchParams.set('callbackUrl', encodeURIComponent(path));
      }
      return NextResponse.redirect(url);
    }
  }

  // If user is authenticated and tries to access auth pages,
  // redirect to /app
  if (accessToken && isAuthRoute(path)) {
    return NextResponse.redirect(new URL('/app', req.url));
  }

  return NextResponse.next();
}

// Specify which routes middleware applies to
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
