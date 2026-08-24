import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ManageTenantClient from './ManageTenantClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ManageTenantPage({ params }) {
  const { id } = await params;

  const tenant = await prisma.user.findUnique({
    where: { id },
    include: {
      media: {
        orderBy: { createdAt: 'desc' }
      },
      workflows: {
        orderBy: { createdAt: 'desc' },
        include: {
          executionLogs: {
            orderBy: { createdAt: 'desc' },
            take: 100
          }
        }
      }
    }
  });

  if (!tenant) return notFound();

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/admin/users" className="text-sm text-text-secondary hover:text-foreground">&larr; Back to Users & Tenants</Link>
      </div>
      
      <div>
        <h2 className="text-xl font-medium text-foreground mb-1">Manage Tenant</h2>
        <p className="text-sm text-text-secondary">Edit subscription settings, quotas, support tickets, and export workflow execution logs for {tenant.name || tenant.email}.</p>
      </div>

      <ManageTenantClient tenant={tenant} mediaFiles={tenant.media} userWorkflows={tenant.workflows} />
    </div>
  );
}
