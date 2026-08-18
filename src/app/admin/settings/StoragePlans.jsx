'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Database, Loader2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StoragePlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', priceRs: 0, maxVideos: 5, maxVideoMB: 25, maxImages: 10, maxImageMB: 5, maxStorageMB: 1000
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/storage-plans');
      const data = await res.json();
      setPlans(data);
    } catch (e) {
      toast.error('Failed to load storage plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/storage-plans', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to save plan');
      toast.success('Storage plan saved');
      setIsEditing(false);
      fetchPlans();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await fetch(`/api/admin/storage-plans?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete plan');
      toast.success('Plan deleted');
      fetchPlans();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const openEditor = (plan = null) => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData({ id: '', name: '', priceRs: 0, maxVideos: 5, maxVideoMB: 25, maxImages: 10, maxImageMB: 5, maxStorageMB: 1000 });
    }
    setIsEditing(true);
  };

  return (
    <div className="bg-[#111] border border-border-subtle rounded-xl overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
            <Database size={16} className="text-accent-blue" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Storage Quota Plans</h2>
            <p className="text-xs text-text-secondary">Configure available buckets for users to purchase.</p>
          </div>
        </div>
        {!isEditing && (
          <button 
            onClick={() => openEditor()}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-accent-blue text-white rounded hover:bg-accent-blue/90 transition-colors"
          >
            <Plus size={14} /> New Plan
          </button>
        )}
      </div>

      <div className="p-6">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 bg-black/20 p-5 rounded-lg border border-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Plan Name</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white"
                  placeholder="e.g. Golden Bucket"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Price (Rs)</label>
                <input 
                  type="number" required min="0"
                  value={formData.priceRs} onChange={e => setFormData({...formData, priceRs: Number(e.target.value)})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Max Videos</label>
                <input 
                  type="number" required min="1"
                  value={formData.maxVideos} onChange={e => setFormData({...formData, maxVideos: Number(e.target.value)})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Max Size Per Video (MB)</label>
                <input 
                  type="number" required min="1"
                  value={formData.maxVideoMB} onChange={e => setFormData({...formData, maxVideoMB: Number(e.target.value)})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Max Images</label>
                <input 
                  type="number" required min="1"
                  value={formData.maxImages} onChange={e => setFormData({...formData, maxImages: Number(e.target.value)})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Max Size Per Image (MB)</label>
                <input 
                  type="number" required min="1"
                  value={formData.maxImageMB} onChange={e => setFormData({...formData, maxImageMB: Number(e.target.value)})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-secondary mb-1">Total Storage Limit (MB) - e.g. 10000 = 10GB</label>
                <input 
                  type="number" required min="1"
                  value={formData.maxStorageMB} onChange={e => setFormData({...formData, maxStorageMB: Number(e.target.value)})}
                  className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-white/10">
              <button 
                type="button" onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-white"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-medium rounded hover:bg-white/90"
              >
                <Save size={14} /> Save Plan
              </button>
            </div>
          </form>
        ) : loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-accent-blue" /></div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">No storage plans created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Plan Name</th>
                  <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Price</th>
                  <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Videos</th>
                  <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Images</th>
                  <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Total Storage</th>
                  <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <tr key={plan.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-sm text-white font-medium">{plan.name}</td>
                    <td className="py-3 px-4 text-sm text-accent-blue font-bold">Rs {plan.priceRs}</td>
                    <td className="py-3 px-4 text-xs text-text-secondary">{plan.maxVideos} (Max {plan.maxVideoMB}MB)</td>
                    <td className="py-3 px-4 text-xs text-text-secondary">{plan.maxImages} (Max {plan.maxImageMB}MB)</td>
                    <td className="py-3 px-4 text-xs text-emerald-400">{(plan.maxStorageMB / 1024).toFixed(1)} GB</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditor(plan)} className="p-1.5 text-text-secondary hover:text-white hover:bg-white/10 rounded transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
