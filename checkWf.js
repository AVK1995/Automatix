const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const wfs = await prisma.workflow.findMany({
    where: { name: 'Alpha Test Automation' }
  });
  console.log(JSON.stringify(wfs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
