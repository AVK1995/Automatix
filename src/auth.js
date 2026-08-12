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
        console.log("Credentials received:", { email: credentials?.email, password: credentials?.password ? '***' : 'missing' });
        
        if (!credentials?.email || !credentials?.password) return null;

        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        
        console.log("User found in DB:", !!user, "Has password:", !!user?.password);

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@automatix.local';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
        
        console.log("Expected Admin:", { email: adminEmail, password: adminPassword ? '***' : 'missing' });

        // Developer Fallback: Always allow Master Admin and auto-provision it if missing or corrupted
        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          console.log("Matched Developer Fallback logic!");
          if (!user || !user.password) {
            console.log("Auto-provisioning missing/corrupted admin...");
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
            console.log("Provisioned admin successfully!");
          }
          return { id: user.id, email: user.email, name: user.name, role: user.role };
        }

        if (!user || !user.password) {
          console.log("Failed: No user or no password hash in DB");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        
        console.log("Password valid check:", isPasswordValid);

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
