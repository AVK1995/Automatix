'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, HardDrive, Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuotaUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTier, setSelectedTier] = useState('tier1');

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-quota-modal', handleOpen);
    return () => window.removeEventListener('open-quota-modal', handleOpen);
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/media/quota-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedTier })
      });
      if (!res.ok) throw new Error('Failed to submit request');
      
      toast.success('Upgrade request submitted! An admin will review it shortly.');
      setIsOpen(false);
    } catch (e) {
      toast.error('Failed to submit upgrade request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#0d0d0d] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                <HardDrive size={16} className="text-accent-blue" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Storage Limit Reached</h2>
                <p className="text-xs text-text-secondary">Upgrade your storage quota to upload more media.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto">
            <div className="space-y-4">
              {/* Tier 1 */}
              <div 
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTier === 'tier1' 
                    ? 'border-accent-blue bg-accent-blue/5' 
                    : 'border-white/10 hover:border-white/20 bg-black/20'
                }`}
                onClick={() => setSelectedTier('tier1')}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      Basic Boost
                      {selectedTier === 'tier1' && <CheckCircle2 size={14} className="text-accent-blue" />}
                    </h3>
                    <p className="text-xs text-text-tertiary">Perfect for small campaigns.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">50 Rs</span>
                  </div>
                </div>
                <ul className="space-y-1.5 mt-3">
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-blue/50" />
                    +1 Video Upload (Max 25MB)
                  </li>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-blue/50" />
                    +5 Image Uploads (Max 1MB each)
                  </li>
                </ul>
              </div>

              {/* Tier 2 */}
              <div 
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedTier === 'tier2' 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-white/10 hover:border-white/20 bg-black/20'
                }`}
                onClick={() => setSelectedTier('tier2')}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      Pro Storage
                      <Zap size={14} className="text-emerald-400" />
                      {selectedTier === 'tier2' && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </h3>
                    <p className="text-xs text-text-tertiary">For heavy media workflows.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">100 Rs</span>
                  </div>
                </div>
                <ul className="space-y-1.5 mt-3">
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                    +5 Video Uploads (Max 100MB each)
                  </li>
                  <li className="text-xs text-text-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                    +10 Image Uploads (Max 5MB each)
                  </li>
                </ul>
              </div>
            </div>
            
            <p className="text-[11px] text-text-tertiary text-center mt-5">
              By submitting this request, an admin will review your account and apply the expanded storage limits.
            </p>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-md text-xs font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-md text-xs font-medium text-white bg-accent-blue hover:bg-accent-blue/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit Upgrade Request
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
