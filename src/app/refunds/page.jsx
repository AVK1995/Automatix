import { auth } from '@/auth';
import RefundsForm from './RefundsForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/ui/Footer';
import Logo from '@/components/Logo';

export default async function RefundsPage() {
  const session = await auth();

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden flex flex-col items-center">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[150px] pointer-events-none"></div>
      
      <div className="w-full max-w-7xl mx-auto p-8 relative z-20">
         <Link href="/" className="inline-flex items-center text-accent-blue hover:underline mb-12">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
         </Link>

         <div className="max-w-2xl mx-auto bg-[#111] border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
           <div className="text-center mb-8">
             <Logo size={40} className="mx-auto mb-4" />
             <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Refund Request</h1>
             <p className="text-text-secondary mt-2">Submit a request to our support team.</p>
           </div>
           
           {!session ? (
             <div className="text-center py-8 bg-black/40 rounded-xl border border-white/5">
                <p className="text-text-secondary mb-6">You must be logged into your Automatix account to submit a refund request.</p>
                <Link href="/login">
                  <button className="px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    Login to Submit Request
                  </button>
                </Link>
             </div>
           ) : (
             <RefundsForm />
           )}
         </div>
      </div>

      <div className="mt-auto w-full z-20">
        <Footer />
      </div>
    </div>
  );
}
