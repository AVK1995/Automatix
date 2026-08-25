import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

// Initialize Prisma with the PostgreSQL adapter as required by Prisma 7+
let connectionString = process.env.DATABASE_URL;
if (connectionString) {
  try {
    const url = new URL(connectionString);
    if (url.searchParams.has('sslmode')) {
      url.searchParams.delete('sslmode');
      connectionString = url.toString();
    }
  } catch (e) {}
}

const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);

// Force re-initialization on next reload
delete globalForPrisma.prisma;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
// Triggered reload for new WAITING enum
