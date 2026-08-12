import ClientDashboardLayout from './ClientDashboardLayout';
import { auth } from "@/auth";

export default async function DashboardLayout({ children }) {
  const session = await auth();
  return <ClientDashboardLayout user={session?.user}>{children}</ClientDashboardLayout>;
}
