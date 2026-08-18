import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Global Notifications</h1>
        <p className="text-sm text-text-secondary">Draft and send announcements to all registered tenants using AI.</p>
      </div>

      <NotificationsClient />
    </div>
  );
}
