import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
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
        console.log("=== AUTH ATTEMPT ===");
        if (!credentials?.email || !credentials?.password) return null;

        const inputEmail = credentials.email.trim().toLowerCase();
        const inputPassword = credentials.password;

        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@automatix.local').trim().toLowerCase();
        const adminPassword = (process.env.ADMIN_PASSWORD || 'admin').trim();

        let user = await prisma.user.findFirst({
          where: {
            email: { equals: inputEmail, mode: 'insensitive' }
          },
        });

        // Developer Fallback: Always allow Master Admin and auto-provision / fix role if needed
        if (inputEmail === adminEmail && inputPassword === adminPassword) {
          console.log("Matched Developer Fallback / Master Admin login!");
          if (!user || !user.password || user.role !== 'ADMIN') {
            console.log("Auto-provisioning / syncing master admin...");
            const hashedPassword = await bcrypt.hash(inputPassword, 10);
            user = await prisma.user.upsert({
              where: { email: inputEmail },
              update: { password: hashedPassword, role: 'ADMIN' },
              create: {
                email: inputEmail,
                password: hashedPassword,
                name: 'Automatix Admin',
                role: 'ADMIN',
              }
            });
            console.log("Synced master admin successfully!");
          }
          return { id: user.id, email: user.email, name: user.name, role: 'ADMIN' };
        }

        if (!user || !user.password) {
          console.log("Failed: No user or no password hash in DB");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          inputPassword,
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
});
