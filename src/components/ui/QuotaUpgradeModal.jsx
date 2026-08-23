'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, HardDrive, Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuotaUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-quota-modal', handleOpen);
    return () => window.removeEventListener('open-quota-modal', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen && plans.length === 0) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch('/api/media/plans');
      const data = await res.json();
      setPlans(data);
      if (data.length > 0) setSelectedPlan(data[0].name);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/media/quota-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan })
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
            {loadingPlans ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-accent-blue" /></div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary text-sm">No upgrade plans are currently available.</p>
                <p className="text-text-tertiary text-xs mt-2">If you are an admin, you can create plans in the Master Settings.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {plans.map((plan, idx) => {
                  const isSelected = selectedPlan === plan.name;
                  const colorClass = idx % 2 === 0 ? 'accent-blue' : 'emerald';
                  const borderClass = isSelected && colorClass === 'accent-blue' ? 'border-accent-blue bg-accent-blue/5' :
                                      isSelected && colorClass === 'emerald' ? 'border-emerald-500 bg-emerald-500/5' :
                                      'border-white/10 hover:border-white/20 bg-black/20';

                  return (
                    <div 
                      key={plan.id}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${borderClass}`}
                      onClick={() => setSelectedPlan(plan.name)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            {plan.name}
                            {colorClass === 'emerald' && <Zap size={14} className="text-emerald-400" />}
                            {isSelected && <CheckCircle2 size={14} className={`text-${colorClass === 'emerald' ? 'emerald-500' : 'accent-blue'}`} />}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-white">{plan.priceRs} Rs</span>
                        </div>
                      </div>
                      <ul className="space-y-1.5 mt-3">
                        <li className="text-xs text-text-secondary flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full bg-${colorClass === 'emerald' ? 'emerald-500/50' : 'accent-blue/50'}`} />
                          Max {plan.maxVideos} Videos (Up to {plan.maxVideoMB}MB each)
                        </li>
                        <li className="text-xs text-text-secondary flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full bg-${colorClass === 'emerald' ? 'emerald-500/50' : 'accent-blue/50'}`} />
                          Total Bucket Limit: {(plan.maxStorageMB / 1024).toFixed(1)} GB
                        </li>
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
            
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
              disabled={isSubmitting || plans.length === 0}
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
