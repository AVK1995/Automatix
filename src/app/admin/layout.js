import AdminClientLayout from './AdminClientLayout';
import { auth } from "@/auth";

export default async function AdminLayout({ children }) {
  const session = await auth();
  return <AdminClientLayout user={session?.user}>{children}</AdminClientLayout>;
}
