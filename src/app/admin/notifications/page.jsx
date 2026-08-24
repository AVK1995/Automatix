import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminCommunicationsHub from './AdminCommunicationsHub';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <AdminCommunicationsHub />;
}
