import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RequestsTabsClient from './RequestsTabsClient';

export default async function AdminRequestsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

  const quotaRequests = await prisma.quotaRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

  const conciergeRequests = tickets.filter(t => t.subject.startsWith('Concierge Setup'));
  const refundRequests = tickets.filter(t => t.type === 'REFUND');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Tenants & Users Requests</h1>
        <p className="text-sm text-text-secondary">Manage storage quotas, white-glove setups, and refunds.</p>
      </div>

      <RequestsTabsClient 
        quotaRequests={quotaRequests}
        conciergeRequests={conciergeRequests}
        refundRequests={refundRequests}
      />
    </div>
  );
}
