import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminConnectionsClient from '@/components/admin/AdminConnectionsClient';

export const dynamic = 'force-dynamic';

export default async function AdminConnectionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [connections, templateCounts, logCounts] = await Promise.all([
    prisma.integration.findMany({
      include: {
        client: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.whatsAppTemplate.groupBy({
      by: ['integrationId'],
      _count: { id: true }
    }).catch(() => []),
    prisma.whatsAppLog.groupBy({
      by: ['integrationId'],
      _count: { id: true }
    }).catch(() => [])
  ]);

  const statsMap = {};
  templateCounts.forEach(t => {
    if (t.integrationId) {
      statsMap[t.integrationId] = {
        ...(statsMap[t.integrationId] || {}),
        templateCount: t._count.id
      };
    }
  });
  logCounts.forEach(l => {
    if (l.integrationId) {
      statsMap[l.integrationId] = {
        ...(statsMap[l.integrationId] || {}),
        messageCount: l._count.id
      };
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Global Connections & Integrations</h1>
        <p className="text-text-secondary text-sm">
          Browse supported application integrations, review connected tenant accounts, and manage third-party API provisions.
        </p>
      </div>

      <AdminConnectionsClient initialConnections={connections} whatsAppStats={statsMap} />
    </div>
  );
}
