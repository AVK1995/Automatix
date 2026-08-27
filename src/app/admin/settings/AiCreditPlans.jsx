'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sparkles, Zap, Loader2, Save, X, CheckCircle2, Shield, Coins, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

const DEFAULT_AI_PLANS = [
  {
    id: 'ai_starter_250',
    name: 'Starter AI Pack',
    credits: 250,
    priceRs: 199,
    perCreditRate: '₹0.80',
    badge: 'Starter',
    description: 'Perfect for testing and light video/image workflow generations.',
    isActive: true,
  },
  {
    id: 'ai_creator_1000',
    name: 'Creator AI Pack',
    credits: 1000,
    priceRs: 499,
    perCreditRate: '₹0.50',
    badge: 'Most Popular',
    description: 'Ideal for content creators and daily automated social publishing.',
    isActive: true,
  },
  {
    id: 'ai_growth_3000',
    name: 'Growth AI Pack',
    credits: 3000,
    priceRs: 1199,
    perCreditRate: '₹0.40',
    badge: 'Best Value',
    description: 'For growing marketing agencies and multi-account automation setups.',
    isActive: true,
  },
  {
    id: 'ai_power_10000',
    name: 'Scale Power Pack',
    credits: 10000,
    priceRs: 2999,
    perCreditRate: '₹0.30',
    badge: 'Enterprise',
    description: 'High-volume batch workflows with dedicated multimodal quota priority.',
    isActive: true,
  }
];

export default function AiCreditPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    credits: 1000,
    priceRs: 499,
    badge: '',
    description: '',
    isActive: true
  });
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    try {
      const saved = localStorage.getItem('automatix_admin_ai_credit_plans');
      if (saved) {
        setPlans(JSON.parse(saved));
      } else {
        setPlans(DEFAULT_AI_PLANS);
        localStorage.setItem('automatix_admin_ai_credit_plans', JSON.stringify(DEFAULT_AI_PLANS));
      }
    } catch (e) {
      setPlans(DEFAULT_AI_PLANS);
    } finally {
      setLoading(false);
    }
  };

  const savePlansToStorage = (updatedPlans) => {
    setPlans(updatedPlans);
    try {
      localStorage.setItem('automatix_admin_ai_credit_plans', JSON.stringify(updatedPlans));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.credits || formData.priceRs < 0) {
      toast.error('Please fill in all required plan details.');
      return;
    }

    const perCredit = (formData.priceRs / formData.credits).toFixed(2);
    const updatedPlan = {
      ...formData,
      id: formData.id || `ai_plan_${Date.now()}`,
      perCreditRate: `₹${perCredit}`,
    };

    let newPlans;
    if (formData.id) {
      newPlans = plans.map(p => p.id === formData.id ? updatedPlan : p);
      toast.success(`Updated "${formData.name}"`);
    } else {
      newPlans = [...plans, updatedPlan];
      toast.success(`Created "${formData.name}" pack`);
    }

    savePlansToStorage(newPlans);
    setIsEditing(false);
  };

  const togglePlanActive = (id) => {
    const newPlans = plans.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    savePlansToStorage(newPlans);
    toast.success('Updated plan visibility');
  };

  const promptDeletePlan = (id) => {
    setPlanToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!planToDelete) return;
    const newPlans = plans.filter(p => p.id !== planToDelete);
    savePlansToStorage(newPlans);
    toast.success('AI credit plan deleted');
    setIsDeleteModalOpen(false);
    setPlanToDelete(null);
  };

  const resetToDefaults = () => {
    savePlansToStorage(DEFAULT_AI_PLANS);
    toast.success('Reset AI credit packs to defaults');
  };

  const openEditor = (plan = null) => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData({
        id: '',
        name: '',
        credits: 1000,
        priceRs: 499,
        badge: 'New',
        description: 'Instant AI workflow credits add-on pack.',
        isActive: true
      });
    }
    setIsEditing(true);
  };

  return (
    <div className="bg-[#111] border border-border-subtle rounded-xl overflow-hidden shadow-xl w-full">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">AI Credit Add-on Plans</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                1 credit / run
              </span>
            </div>
            <p className="text-xs text-text-secondary">Configure top-up credit packs for AI workflow executions and live testing.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isEditing && (
            <>
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                title="Reset to recommended standard packs"
              >
                Reset Defaults
              </button>
              <button 
                type="button"
                onClick={() => openEditor()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded shadow-sm transition-all"
              >
                <Plus size={14} /> New AI Pack
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 bg-black/40 p-5 rounded-xl border border-purple-500/20 shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                {formData.id ? 'Edit AI Credit Pack' : 'Create New AI Credit Pack'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded hover:bg-white/10 text-text-secondary hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Pack Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Creator AI Pack"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">AI Credits Included *</label>
                <input 
                  type="number" 
                  required 
                  min="50"
                  step="50"
                  value={formData.credits} 
                  onChange={e => setFormData({...formData, credits: Number(e.target.value)})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="e.g. 1000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Price in INR (₹) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={formData.priceRs} 
                  onChange={e => setFormData({...formData, priceRs: Number(e.target.value)})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="e.g. 499"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Badge / Tag (Optional)</label>
                <input 
                  type="text" 
                  value={formData.badge || ''} 
                  onChange={e => setFormData({...formData, badge: e.target.value})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Most Popular, 20% OFF"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1">Pack Description</label>
                <input 
                  type="text" 
                  value={formData.description || ''} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Ideal for content creators and daily automated social publishing."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="text-xs text-text-tertiary font-mono">
                Calculated Rate: <span className="text-purple-300 font-semibold">₹{formData.credits > 0 ? (formData.priceRs / formData.credits).toFixed(2) : 0}</span> / credit
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-sm transition-all"
                >
                  <Save size={14} /> Save Pack
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                  plan.isActive 
                    ? 'bg-zinc-900/60 border-purple-500/20 hover:border-purple-500/40 hover:bg-zinc-900/90 shadow-md' 
                    : 'bg-zinc-900/20 border-white/5 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{plan.name}</h4>
                      {plan.badge && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <Tag size={10} /> {plan.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditor(plan)}
                        className="p-1 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                        title="Edit Pack"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDeletePlan(plan.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors"
                        title="Delete Pack"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="my-3 space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-white font-mono">₹{plan.priceRs}</span>
                      <span className="text-xs text-text-tertiary">/ one-time</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium">
                      <Coins size={13} className="text-amber-400" />
                      <span className="font-mono font-bold text-white">{plan.credits.toLocaleString()}</span>
                      <span>AI Credits</span>
                    </div>
                    <div className="text-[10px] text-text-tertiary font-mono">
                      Cost: {plan.perCreditRate || `₹${(plan.priceRs / plan.credits).toFixed(2)}`} / run
                    </div>
                  </div>

                  <p className="text-[11px] text-text-secondary leading-relaxed mb-4">
                    {plan.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    plan.isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800'
                  }`}>
                    {plan.isActive ? 'Active' : 'Disabled'}
                  </span>

                  <button
                    type="button"
                    onClick={() => togglePlanActive(plan.id)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-medium"
                  >
                    {plan.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPlanToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete AI Credit Pack"
        message="Are you sure you want to delete this AI credit pack? Users will no longer be able to purchase this add-on."
        confirmText="Delete Pack"
        isDestructive={true}
      />
    </div>
  );
}
