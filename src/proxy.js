import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role;
  
  const isAuthRoute = nextUrl.pathname === '/login';
  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  const isWorkflowRoute = nextUrl.pathname.startsWith('/workflows');

  // If visiting login while authenticated, redirect to proper dashboard
  if (isAuthRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(userRole === 'ADMIN' ? '/admin' : '/workflows', nextUrl));
    }
    return null; // Let them see the login page
  }

  // Protect Admin routes
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', nextUrl));
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/workflows', nextUrl));
    }
  }

  // Protect Workflow routes
  if (isWorkflowRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  return null;
});

// Run middleware on all routes except API, static assets, and images
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
