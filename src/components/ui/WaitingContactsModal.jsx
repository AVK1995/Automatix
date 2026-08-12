'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Clock, RefreshCw, Send, PlayCircle, Loader2 } from 'lucide-react';
import { getWaitingLeads, resumeWaitingLeads } from '@/actions/workflows';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export default function WaitingContactsModal({ isOpen, onClose, workflowId, node, onResumed }) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resumingIds, setResumingIds] = useState(new Set());

  useEffect(() => {
    if (isOpen && workflowId && node) {
      fetchContacts();
    }
  }, [isOpen, workflowId, node]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const data = await getWaitingLeads(workflowId, node.id);
      setContacts(data || []);
    } catch (error) {
      toast.error('Failed to load active contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceResume = async (logId) => {
    try {
      setResumingIds(prev => new Set(prev).add(logId));
      const res = await resumeWaitingLeads([logId]);
      if (res.success) {
        toast.success('Successfully resumed workflow for contact');
        // Remove from list
        setContacts(prev => prev.filter(c => c.id !== logId));
        if (onResumed) onResumed();
      } else {
        throw new Error('Resume failed');
      }
    } catch (error) {
      toast.error('Failed to resume contact');
    } finally {
      setResumingIds(prev => {
        const next = new Set(prev);
        next.delete(logId);
        return next;
      });
    }
  };

  const extractContactInfo = (payload) => {
    if (!payload) return 'Unknown User';
    
    // Instagram specific
    if (payload.object === 'instagram' && payload.entry?.[0]?.messaging?.[0]?.sender?.id) {
      return `IG ID: ${payload.entry[0].messaging[0].sender.id}`;
    }
    
    // Try some common paths
    if (payload.email) return payload.email;
    if (payload.name) return payload.name;
    if (payload.contact) return payload.contact;
    
    return 'Unknown Contact';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-3xl bg-[#0F0F13] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
              <div>
                <h2 className="text-lg font-medium text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-accent-blue" />
                  Active Contacts
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  Currently waiting at step: <span className="text-white font-mono">{node?.title || node?.type}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchContacts}
                  disabled={isLoading}
                  className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
                  title="Refresh List"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent-blue' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {isLoading && contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-blue mb-3" />
                  <p className="text-sm">Loading active contacts...</p>
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <User className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">No one is waiting here</p>
                  <p className="text-xs text-center max-w-[250px]">
                    There are no active workflow executions currently paused at this step.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-white/5 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="px-4 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Contact Info</th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Waiting Since</th>
                        <th className="px-4 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {contacts.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                                <User className="w-4 h-4 text-accent-blue" />
                              </div>
                              <div>
                                <p className="text-sm text-white font-medium">
                                  {extractContactInfo(log.currentNodeState?.payload)}
                                </p>
                                <p className="text-xs text-text-tertiary font-mono truncate max-w-[150px]">
                                  ID: {log.id.substring(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-medium uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                              Waiting
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <Clock className="w-3.5 h-3.5 opacity-70" />
                              {dayjs(log.updatedAt).format('MMM D, h:mm A')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleForceResume(log.id)}
                              disabled={resumingIds.has(log.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-white transition-all disabled:opacity-50"
                            >
                              {resumingIds.has(log.id) ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5 text-brand-primary group-hover:scale-110 transition-transform" />
                              )}
                              Force Resume
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
