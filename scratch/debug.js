const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const w = await prisma.workflow.findMany(); 
  console.log('Workflows:', JSON.stringify(w, null, 2)); 
  const i = await prisma.integration.findMany(); 
  console.log('Integrations:', JSON.stringify(i, null, 2)); 
} 

main().finally(() => prisma.$disconnect());
