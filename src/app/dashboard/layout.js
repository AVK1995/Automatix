import ClientDashboardLayout from './ClientDashboardLayout';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionTier: true,
      subscriptionCycle: true,
      quotaTier: true,
      maxStorageMB: true,
      aiCredits: true,
      maxVideos: true,
      maxImages: true,
      maxDocMB: true,
      maxVideoMB: true,
      maxImageMB: true,
      media: {
        select: { sizeMB: true, type: true }
      }
    }
  });

  const totalStorageUsedMB = (dbUser?.media || []).reduce((sum, m) => sum + (m.sizeMB || 0), 0);

  const fullUserData = {
    ...(dbUser || session.user),
    totalStorageUsedMB: Number(totalStorageUsedMB.toFixed(1))
  };

  return <ClientDashboardLayout user={fullUserData}>{children}</ClientDashboardLayout>;
}

