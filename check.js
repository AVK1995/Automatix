const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.executionLog.findMany({
  orderBy: { createdAt: 'desc' },
  take: 1,
  include: { events: { orderBy: { createdAt: 'asc' } } }
}).then(logs => {
  console.log(JSON.stringify(logs, null, 2));
  process.exit(0);
});
