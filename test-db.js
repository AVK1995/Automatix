const { prisma } = require('./src/lib/prisma');

async function main() {
  const workflows = await prisma.workflow.findMany({ include: { executionLogs: true } });
  console.log(JSON.stringify(workflows, null, 2));
}

main().finally(() => process.exit(0));
