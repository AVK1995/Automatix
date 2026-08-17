import { Suspense } from 'react';
import CalendarManager from './CalendarManager';
import { getCalendars } from '@/actions/calendars';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, Sparkles, Zap, LayoutTemplate, Link as LinkIcon } from 'lucide-react';

export const metadata = {
  title: 'My Calendars | Automatix',
  description: 'Manage your Premium Calendars and events.',
};

export default async function CalendarsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true }
  });

  const isFree = !user || !user.subscriptionTier || user.subscriptionTier.toLowerCase() === 'free';

  if (isFree) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="max-w-3xl w-full bg-[#0a0a0a] border border-border-subtle rounded-2xl overflow-hidden relative shadow-2xl">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-accent-blue/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="p-8 sm:p-12 relative z-10 text-center">
            <div className="w-20 h-20 bg-accent-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-accent-blue/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               <Calendar className="w-10 h-10 text-accent-blue relative z-10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-violet">Premium Calendars</span>
            </h1>
            <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto mb-10">
              Ditch third-party booking tools. Build custom, branded scheduling pages that integrate seamlessly with your Automatix workflows.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-10">
               {[
                 { title: "Custom Branded Pages", desc: "Design booking pages that match your brand perfectly.", icon: <LayoutTemplate size={20} className="text-accent-blue" /> },
                 { title: "Direct Workflow Sync", desc: "Instantly trigger flows the second someone books.", icon: <Zap size={20} className="text-accent-violet" /> },
                 { title: "Unlimited Calendars", desc: "Create separate calendars for every use case.", icon: <Sparkles size={20} className="text-pink-500" /> },
                 { title: "Custom Domains", desc: "Host scheduling links on your own domain.", icon: <LinkIcon size={20} className="text-emerald-500" /> }
               ].map((feature, i) => (
                 <div key={i} className="bg-[#111] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-5 flex gap-4 items-start transition-all duration-300">
                    <div className="mt-1 bg-black/50 p-2 rounded-lg border border-white/5">{feature.icon}</div>
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">{feature.title}</h4>
                      <p className="text-text-secondary text-xs leading-relaxed">{feature.desc}</p>
                    </div>
                 </div>
               ))}
            </div>

            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-white/90 font-semibold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 group">
              Upgrade to Professional <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initialCalendars = await getCalendars();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">My Calendars</h1>
          <p className="text-text-secondary">Create and manage your premium scheduling events.</p>
        </div>
        
        <Suspense fallback={<div className="text-white">Loading calendars...</div>}>
          <CalendarManager initialCalendars={initialCalendars} />
        </Suspense>
      </div>
    </div>
  );
}
