import { prisma } from '@/lib/prisma';
import ProvisionForm from './ProvisionForm';
import AdminUsersClient from './AdminUsersClient';

export const dynamic = 'force-dynamic';

export default async function TenantProvisioningPage({ searchParams }) {
  const params = await searchParams;
  const q = params?.q || '';

  const whereClause = {
    role: 'CLIENT',
    ...(q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    } : {})
  };

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { workflows: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">User & Tenant Management</h1>
        <p className="text-sm text-text-secondary">Provision new tenants and manage existing client subscriptions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ProvisionForm />
        </div>
        
        <div className="lg:col-span-2 bg-[#111] border border-border-subtle rounded-xl p-6 shadow-xl relative overflow-hidden">
          <AdminUsersClient initialUsers={users} />
        </div>
      </div>
    </div>
  );
}
