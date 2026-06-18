const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
