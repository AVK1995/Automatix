import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth;
export { auth as proxy, auth as middleware };

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

