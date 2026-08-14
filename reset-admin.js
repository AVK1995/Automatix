require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@automatix.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

  console.log('Resetting admin password...');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'ADMIN'
    }
  });
  
  console.log('Admin user updated/created successfully!');
  console.log(`Email: ${admin.email}`);
  console.log(`Password: ${adminPassword}`);
  
  await prisma.$disconnect();
}

main().catch(console.error).finally(() => process.exit(0));
