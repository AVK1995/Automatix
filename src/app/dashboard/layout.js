import ClientDashboardLayout from './ClientDashboardLayout';
import { auth } from "@/auth";
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  return <ClientDashboardLayout user={session.user}>{children}</ClientDashboardLayout>;
}

