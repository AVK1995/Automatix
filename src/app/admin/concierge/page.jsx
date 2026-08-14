import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
export default async function AdminConciergePage() {
  const session = await auth();
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

  const conciergeRequests = tickets.filter(t => t.subject.startsWith('Concierge Setup'));
  const refundRequests = tickets.filter(t => t.type === 'REFUND');

  return (
    <>
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Concierge & Support Requests</h1>
          <p className="text-sm text-text-secondary">Manage white-glove setup requests and refunds.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Concierge Requests */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Concierge Setup Requests</h2>
            <div className="space-y-4">
              {conciergeRequests.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">No pending concierge requests.</p>
              ) : (
                conciergeRequests.map(ticket => (
                  <div key={ticket.id} className="bg-background border border-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-accent-violet px-2 py-1 rounded-full bg-accent-violet/10 border border-accent-violet/20">
                        {ticket.status}
                      </span>
                      <span className="text-xs text-text-secondary">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{ticket.subject}</h3>
                    <p className="text-xs text-text-secondary mb-3">{ticket.message}</p>
                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                      <div className="text-xs">
                        <span className="text-text-secondary">Client: </span>
                        <span className="text-white font-medium">{ticket.user.email}</span>
                      </div>
                      <a 
                        href={`mailto:${ticket.user.email}?subject=Automatix Concierge Setup`}
                        className="text-[10px] bg-white text-black px-3 py-1.5 rounded hover:bg-white/90 transition-colors font-medium"
                      >
                        Contact Client
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Refund/General Support */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Refund Requests</h2>
            <div className="space-y-4">
              {refundRequests.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">No pending refund requests.</p>
              ) : (
                refundRequests.map(ticket => (
                  <div key={ticket.id} className="bg-background border border-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-accent-blue px-2 py-1 rounded-full bg-accent-blue/10 border border-accent-blue/20">
                        {ticket.status}
                      </span>
                      <span className="text-xs text-text-secondary">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{ticket.subject}</h3>
                    <p className="text-xs text-text-secondary mb-3 line-clamp-3">{ticket.message}</p>
                    <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3">
                      <div className="text-xs">
                        <span className="text-text-secondary">Client: </span>
                        <span className="text-white font-medium">{ticket.user.email}</span>
                      </div>
                      <a 
                        href={`mailto:${ticket.user.email}?subject=Re: Your Automatix Refund Request`}
                        className="text-[10px] bg-white text-black px-3 py-1.5 rounded hover:bg-white/90 transition-colors font-medium"
                      >
                        Email Client
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
