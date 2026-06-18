import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@automatix.local" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@automatix.local';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

        // Developer Fallback: Always allow Master Admin and auto-provision it if missing or corrupted
        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          if (!user || !user.password) {
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            user = await prisma.user.upsert({
              where: { email: credentials.email },
              update: { password: hashedPassword, role: 'ADMIN' },
              create: {
                email: credentials.email,
                password: hashedPassword,
                name: 'Automatix Admin',
                role: 'ADMIN',
              }
            });
          }
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
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
  },
  pages: {
    signIn: "/login",
  },
});
