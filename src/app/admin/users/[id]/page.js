import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TenantEditForm from './TenantEditForm';
import Link from 'next/link';
import StorageBucketClient from '@/app/dashboard/storage/StorageBucketClient';

export const dynamic = 'force-dynamic';

export default async function ManageTenantPage({ params }) {
  const { id } = await params;

  const tenant = await prisma.user.findUnique({
    where: { id },
    include: {
      media: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!tenant) return notFound();

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/admin/users" className="text-sm text-text-secondary hover:text-foreground">&larr; Back to Users & Tenants</Link>
      </div>
      
      <div>
        <h2 className="text-xl font-medium text-foreground mb-1">Manage Tenant</h2>
        <p className="text-sm text-text-secondary">Edit subscription settings or generate setup links for {tenant.name || tenant.email}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TenantEditForm tenant={tenant} />
        
        <div className="space-y-4">
          <h3 className="text-base font-medium text-foreground">User Storage Bucket</h3>
          <StorageBucketClient user={tenant} mediaFiles={tenant.media} isAdminView={true} />
        </div>
      </div>
    </div>
  );
}
