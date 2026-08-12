import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Loader2, CheckSquare, Square } from 'lucide-react';
import { getWaitingLeads, resumeWaitingLeads, removeWaitingLeads } from '@/actions/workflows';
import { toast } from 'react-hot-toast';

export default function WaitingLeadsModal({ isOpen, onClose, workflowId, nodeId, nodeTitle }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [resuming, setResuming] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (isOpen && workflowId && nodeId) {
      setLoading(true);
      setSelectedIds(new Set());
      getWaitingLeads(workflowId, nodeId)
        .then(data => {
          setLeads(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load waiting leads");
          setLoading(false);
        });
    }
  }, [isOpen, workflowId, nodeId]);

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleRunSelected = async () => {
    if (selectedIds.size === 0) return;
    setResuming(true);
    try {
      await resumeWaitingLeads(Array.from(selectedIds));
      toast.success(`Successfully resumed ${selectedIds.size} lead(s)`);
      onClose();
    } catch (err) {
      toast.error("Failed to resume leads");
      console.error(err);
    } finally {
      setResuming(false);
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return;
    setRemoving(true);
    try {
      await removeWaitingLeads(Array.from(selectedIds));
      toast.success(`Successfully removed ${selectedIds.size} lead(s)`);
      
      // Update local state to remove them from the list
      setLeads(leads.filter(l => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
    } catch (err) {
      toast.error("Failed to remove leads");
      console.error(err);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-[#0f0f11] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div>
              <h2 className="text-lg font-semibold text-white">Waiting Leads</h2>
              <p className="text-sm text-text-secondary mt-1">
                Leads currently paused at: <span className="text-white font-medium">{nodeTitle}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-accent-blue" />
                <p>Loading waiting leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-white font-medium mb-1">No Leads Waiting</h3>
                <p className="text-sm text-text-secondary max-w-sm mx-auto">
                  There are currently no active executions paused at this step.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2 px-2">
                  <button 
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
                  >
                    {selectedIds.size === leads.length ? (
                      <CheckSquare className="w-4 h-4 text-accent-blue" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>Select All ({leads.length})</span>
                  </button>
                  <span className="text-xs text-text-tertiary">
                    {selectedIds.size} selected
                  </span>
                </div>
                
                {leads.map(lead => (
                  <div 
                    key={lead.id}
                    onClick={() => toggleSelect(lead.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedIds.has(lead.id) 
                        ? 'bg-accent-blue/10 border-accent-blue/30' 
                        : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {selectedIds.has(lead.id) ? (
                        <CheckSquare className="w-5 h-5 text-accent-blue" />
                      ) : (
                        <Square className="w-5 h-5 text-text-tertiary" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-white font-mono">
                          {lead.externalReferenceId || lead.id.split('-')[0]}
                        </div>
                        <div className="text-xs text-text-tertiary mt-0.5">
                          Waiting since {new Date(lead.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && leads.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveSelected}
                disabled={selectedIds.size === 0 || resuming || removing}
                className={`px-4 py-2 text-sm font-medium text-white bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg flex items-center gap-2 transition-all mr-auto ${
                  selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {removing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Remove ({selectedIds.size})
                  </>
                )}
              </button>
              <button
                onClick={handleRunSelected}
                disabled={selectedIds.size === 0 || resuming || removing}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-all ${
                  selectedIds.size === 0
                    ? 'bg-accent-blue/50 opacity-50 cursor-not-allowed'
                    : 'bg-accent-blue hover:bg-accent-blue/90 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                }`}
              >
                {resuming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resuming...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Now ({selectedIds.size})
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
