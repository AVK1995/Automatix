const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.executionLog.findMany({
  where: { status: 'WAITING' },
  select: { id: true, currentNodeState: true }
}).then(logs => {
  console.log(JSON.stringify(logs, null, 2));
  process.exit(0);
});
