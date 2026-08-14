import { prisma } from '@/lib/prisma';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await prisma.platformSettings.findFirst() || {
    id: "default",
    maxUsers: 10,
    starterPlanEnabled: true,
    starterPlanPrice: 0,
    starterPlanDesc: "Perfect for testing and small projects.",
    proPlanEnabled: true,
    proPlanPrice: 499,
    proPlanDesc: "For businesses automating at scale."
  };

  return <SettingsClient initialSettings={settings} />;
}
