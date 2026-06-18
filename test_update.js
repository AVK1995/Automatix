require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return console.log("No users found");
    
    console.log("Updating user:", user.id);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'Enterprise',
        subscriptionCycle: 'yearly',
        subscriptionExpiresAt: new Date(),
      }
    });
    console.log("Success:", updated);
  } catch (err) {
    console.error("Error updating:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
