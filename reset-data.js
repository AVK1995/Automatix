require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Starting data wipe...');
  const logs = await prisma.executionLog.deleteMany({});
  console.log(`Deleted ${logs.count} execution logs.`);
  
  const workflows = await prisma.workflow.deleteMany({});
  console.log(`Deleted ${workflows.count} workflows.`);
  
  console.log('Data wipe complete!');
  await prisma.$disconnect();
}

main().catch(console.error).finally(() => process.exit(0));
