import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const nextAuthMiddleware = NextAuth(authConfig).auth;

export async function proxy(req) {
  return nextAuthMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
