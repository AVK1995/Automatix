import Footer from '@/components/ui/Footer';
import PublicHeader from '@/components/ui/PublicHeader';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import PricingClient from './PricingClient';

export default async function PricingPage() {
  const session = await auth();

  const settings = await prisma.platformSettings.findFirst() || {
    starterPlanEnabled: true,
    starterPlanPrice: 0,
    starterPlanDesc: "Perfect for testing and small projects.",
    proPlanEnabled: true,
    proPlanPrice: 499,
    proPlanDesc: "For businesses automating at scale."
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white flex flex-col w-full">
      <PublicHeader showBack={true} />

      {/* Main Container stretched to full width */}
      <main className="w-full flex-1 flex flex-col items-center">
        <PricingClient session={session} settings={settings} />
      </main>

      <div className="w-full border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
          <Footer />
        </div>
      </div>
    </div>
  );
}
