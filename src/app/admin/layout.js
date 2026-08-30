import AdminClientLayout from './AdminClientLayout';
import { auth } from "@/auth";
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <AdminClientLayout user={session.user}>{children}</AdminClientLayout>;
}

