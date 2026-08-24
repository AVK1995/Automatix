'use client';

import { useState } from 'react';
import { Database, HelpCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function RequestsTabsClient({ quotaRequests, conciergeRequests, refundRequests }) {
  const [activeTab, setActiveTab] = useState('quota');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleApproveQuota = async (requestId) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/quota-requests/${requestId}/approve`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to approve request');
      toast.success('Quota request approved successfully');
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectQuota = async (requestId) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/quota-requests/${requestId}/reject`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to reject request');
      toast.success('Quota request rejected');
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs = [
    { id: 'quota', label: 'Storage Quotas', icon: <Database size={14} />, count: quotaRequests.filter(r => r.status === 'PENDING').length },
    { id: 'concierge', label: 'Concierge Setup', icon: <HelpCircle size={14} />, count: conciergeRequests.length },
    { id: 'refunds', label: 'Refunds', icon: <RefreshCw size={14} />, count: refundRequests.length }
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative top-px ${
              activeTab === tab.id 
                ? 'border-accent-blue text-white' 
                : 'border-transparent text-text-secondary hover:text-white hover:border-white/20'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-accent-blue text-white' : 'bg-white/10 text-text-secondary'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-6">
        
        {/* QUOTA TAB */}
        {activeTab === 'quota' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Storage Quota Requests</h2>
            {quotaRequests.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-8">No quota upgrade requests.</p>
            ) : (
              quotaRequests.map(req => (
                <div key={req.id} className="bg-background border border-white/5 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        req.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-xs text-text-secondary">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-text-secondary">Client: </span>
                      <span className="text-white font-medium">{req.user.email}</span>
                    </div>
                    <div className="text-sm mt-1">
                      <span className="text-text-secondary">Requested Plan: </span>
                      <span className="text-accent-blue font-medium">{req.requestedPlan}</span>
                    </div>
                    {req.message && (
                      <div className="text-xs text-text-secondary mt-2 bg-white/[0.03] border border-white/10 p-2.5 rounded-md">
                        <span className="text-white font-medium block mb-1">Client Query / Notes:</span>
                        {req.message}
                      </div>
                    )}
                  </div>
                  
                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleRejectQuota(req.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button 
                        onClick={() => handleApproveQuota(req.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-black bg-white hover:bg-white/90 rounded transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} /> Approve & Apply
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* CONCIERGE TAB */}
        {activeTab === 'concierge' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Concierge Setup Requests</h2>
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
        )}

        {/* REFUNDS TAB */}
        {activeTab === 'refunds' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Refund Requests</h2>
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
        )}

      </div>
    </div>
  );
}
