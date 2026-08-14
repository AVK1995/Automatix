import Link from 'next/link';
import { auth } from '@/auth';
import Logo from '@/components/Logo';
import ProfileDropdown from '@/components/ProfileDropdown';
import Footer from '@/components/ui/Footer';

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden flex flex-col items-center p-8">
      {/* Header with Logo */}
      <div className="w-full max-w-7xl flex items-center justify-between z-20 relative mb-24">
        <Logo size={48} />
        {session && (
          <div className="flex items-center gap-4">
            <ProfileDropdown user={session.user} />
          </div>
        )}
      </div>

      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-violet/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-3xl text-center flex flex-col items-center mt-12">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-medium text-text-secondary mb-8">
          <span className="w-2 h-2 rounded-full bg-accent-violet mr-2 animate-pulse"></span>
          Engine v1.0 is Live
        </div>
        
        <h1 className="text-5xl md:text-[4rem] md:leading-[1.1] font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          The Automation Engine <br /> for Modern Teams
        </h1>
        
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-12 leading-relaxed">
          Unify your webhooks, marketing sequences, and chat bots into a single, high-performance visual canvas. Build faster, scale infinitely.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
          <Link href="/pricing" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-semibold hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 cursor-pointer">
              View Pricing & Plans
            </button>
          </Link>
          
          {session ? (
            <Link href={session.user.role === 'ADMIN' ? '/admin' : '/dashboard'} className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-accent-blue text-white font-semibold hover:bg-accent-blue/90 hover:scale-105 transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                Access Automatix
              </button>
            </Link>
          ) : (
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white font-semibold hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer">
                Login to Workspace
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 w-full">
        <Footer />
      </div>
    </div>
  );
}
