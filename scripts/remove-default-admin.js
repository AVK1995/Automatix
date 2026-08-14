require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Looking for default admin...');
  
  try {
    const deletedUser = await prisma.user.delete({
      where: { email: 'admin@automatix.local' }
    });
    console.log(`✅ Successfully deleted old admin account: ${deletedUser.email}`);
  } catch (error) {
    console.log(`❌ Default admin account 'admin@automatix.local' not found or already deleted.`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error).finally(() => process.exit(0));
