export const authConfig = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 }, // 7 days
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      
      const isAuthRoute = nextUrl.pathname === '/login' || nextUrl.pathname === '/setup-password';
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');
      const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/workflows');

      if (!isLoggedIn && (isAdminRoute || isDashboardRoute)) {
        return false; // NextAuth automatically redirects to signIn page
      }

      if (isLoggedIn) {
        if (isAuthRoute) {
          if (role === 'ADMIN') return Response.redirect(new URL('/admin', nextUrl));
          if (role === 'CLIENT') return Response.redirect(new URL('/dashboard', nextUrl));
        }

        if (role === 'CLIENT' && isAdminRoute) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }

        if (role === 'ADMIN' && nextUrl.pathname === '/dashboard') {
          return Response.redirect(new URL('/admin', nextUrl));
        }
      }

      return true;
    },
  },
  providers: [], // Leave empty for edge, populate in auth.js
};
