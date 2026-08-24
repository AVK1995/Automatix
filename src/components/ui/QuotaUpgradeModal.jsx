'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, HardDrive, Zap, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuotaUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'custom'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  // Custom Request Form state
  const [customMessage, setCustomMessage] = useState('');
  const [customStorage, setCustomStorage] = useState('500');

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
      const payload = activeTab === 'plans' 
        ? { plan: selectedPlan }
        : { plan: `Custom Upgrade (${customStorage} MB)`, message: customMessage };

      const res = await fetch('/api/media/quota-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to submit request');
      
      toast.success(activeTab === 'plans' ? 'Storage upgrade request submitted!' : 'Custom storage inquiry sent to admin!');
      setIsOpen(false);
      setCustomMessage('');
    } catch (e) {
      toast.error('Failed to submit request. Please try again.');
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
                <h2 className="text-base font-semibold text-white">Storage Expansion & Limits</h2>
                <p className="text-xs text-text-secondary">Upgrade your quota or request a custom limit package.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-black/30 px-5 pt-3 gap-4">
            <button
              onClick={() => setActiveTab('plans')}
              className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'plans'
                  ? 'border-accent-blue text-accent-blue'
                  : 'border-transparent text-text-secondary hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              Add-On Storage Packs
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'custom'
                  ? 'border-accent-blue text-accent-blue'
                  : 'border-transparent text-text-secondary hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              Talk to Team / Custom Storage
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto">
            {activeTab === 'plans' ? (
              loadingPlans ? (
                <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-accent-blue" /></div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary text-sm">No upgrade plans are currently active.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plans.map((plan, idx) => {
                    const isSelected = selectedPlan === plan.name;
                    return (
                      <div 
                        key={plan.id}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-accent-blue bg-accent-blue/5' : 'border-white/10 hover:border-white/20 bg-black/20'
                        }`}
                        onClick={() => setSelectedPlan(plan.name)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            {plan.name}
                            {isSelected && <CheckCircle2 size={14} className="text-accent-blue" />}
                          </h3>
                          <span className="text-sm font-bold text-accent-blue">₹{plan.priceRs}/mo</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs text-text-secondary">
                          <div className="bg-white/[0.02] p-2 rounded border border-white/5">
                            <span className="text-[10px] text-text-tertiary block">Storage Boost</span>
                            <span className="font-medium text-white">{plan.maxStorageMB} MB Total</span>
                          </div>
                          <div className="bg-white/[0.02] p-2 rounded border border-white/5">
                            <span className="text-[10px] text-text-tertiary block">Media Allowance</span>
                            <span className="font-medium text-white">{plan.maxVideos} Videos • {plan.maxImages} Images</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-text-tertiary mt-2">
                          Max Video Size: {plan.maxVideoMB}MB • Max Image Size: {plan.maxImageMB}MB
                        </p>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="bg-accent-blue/10 border border-accent-blue/20 p-3.5 rounded-lg text-xs text-text-secondary leading-relaxed">
                  <span className="font-medium text-white block mb-1">Need a custom capacity for your agency or high-volume workflows?</span>
                  Submit your query below. Our team will review your requirements and assign custom limits to your account.
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Desired Storage Capacity (MB)
                  </label>
                  <input
                    type="number"
                    value={customStorage}
                    onChange={(e) => setCustomStorage(e.target.value)}
                    placeholder="e.g. 500, 1000"
                    className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                  />
                  <span className="text-[11px] text-text-tertiary mt-1 block">500 MB = 0.5 GB, 1000 MB = 1 GB</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Tell us about your requirements & use case
                  </label>
                  <textarea
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Describe how many videos/images you plan to send per month and your preferred video sizes..."
                    className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue resize-none placeholder:text-text-tertiary"
                  />
                </div>
              </div>
            )}
            
            <p className="text-[11px] text-text-tertiary text-center mt-4">
              All plans include high-speed CDN delivery and Meta Graph API format optimization.
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
              disabled={isSubmitting || (activeTab === 'plans' && plans.length === 0)}
              className="px-5 py-2 rounded-md text-xs font-medium text-white bg-accent-blue hover:bg-accent-blue/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {activeTab === 'plans' ? 'Submit Upgrade Request' : 'Send Custom Inquiry'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
