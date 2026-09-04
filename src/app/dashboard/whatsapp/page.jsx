import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import WhatsAppDashboardClient from '@/components/whatsapp/WhatsAppDashboardClient';

export const dynamic = 'force-dynamic';

export default async function WhatsAppPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const sParams = await searchParams;
  const initialConnectionId = sParams?.connectionId || null;
  const initialTab = sParams?.tab || 'studio';

  // Fetch all active WhatsApp connections for this tenant
  const connections = await prisma.integration.findMany({
    where: {
      clientId: session.user.id,
      providerName: 'whatsapp'
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="w-full">
      <WhatsAppDashboardClient 
        connections={connections} 
        initialConnectionId={initialConnectionId} 
        initialTab={initialTab} 
      />
    </div>
  );
}
