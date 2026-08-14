'use client';

import { useState } from 'react';
import { updatePlatformSettings } from '@/actions/settings';
import { Loader2, Save, Users, Settings2, CreditCard } from 'lucide-react';

export default function SettingsClient({ initialSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    // Convert string inputs to correct types
    const payload = {
      ...settings,
      maxUsers: parseInt(settings.maxUsers, 10),
      starterPlanPrice: parseInt(settings.starterPlanPrice, 10),
      proPlanPrice: parseInt(settings.proPlanPrice, 10),
    };

    const res = await updatePlatformSettings(payload);
    if (res.success) {
      setSuccess('Platform settings updated successfully.');
      setSettings(res.settings);
    } else {
      setError(res.error || 'Failed to update settings.');
    }
    
    setIsSaving(false);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Master Control</h1>
            <p className="text-sm text-text-secondary">Configure platform limits, feature flags, and dynamic pricing.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-accent-violet hover:bg-accent-violet/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Registration & Limits */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Users size={120} />
             </div>
             <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-4">
               <Settings2 className="text-accent-blue" size={20} />
               <h2 className="text-lg font-semibold text-white">Registration Limits</h2>
             </div>
             
             <div className="space-y-5 relative z-10">
               <div>
                 <label className="flex items-center justify-between cursor-pointer">
                   <div>
                     <span className="block text-sm font-medium text-white">Enable Public Registration</span>
                     <span className="block text-[11px] text-text-tertiary">Allow users to sign up for the Starter Plan.</span>
                   </div>
                   <div className="relative">
                     <input 
                       type="checkbox" 
                       className="sr-only peer" 
                       checked={settings.starterPlanEnabled}
                       onChange={(e) => handleChange('starterPlanEnabled', e.target.checked)}
                     />
                     <div className="w-10 h-5 bg-black border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-blue"></div>
                   </div>
                 </label>
               </div>

               <div>
                 <label className="block text-sm font-medium text-white mb-2">Maximum User Capacity</label>
                 <p className="text-[11px] text-text-tertiary mb-3">Registrations will be blocked once this limit is reached to preserve server resources.</p>
                 <input 
                   type="number"
                   value={settings.maxUsers}
                   onChange={(e) => handleChange('maxUsers', e.target.value)}
                   className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                 />
               </div>
             </div>
          </div>

          {/* Pricing Master Control */}
          <div className="bg-[#111] border border-border-subtle rounded-xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <CreditCard size={120} />
             </div>
             <div className="flex items-center gap-2 mb-6 border-b border-border-subtle pb-4">
               <CreditCard className="text-accent-violet" size={20} />
               <h2 className="text-lg font-semibold text-white">Plan Configuration</h2>
             </div>

             <div className="space-y-6 relative z-10">
                {/* Starter */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    Starter Plan
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase text-text-tertiary mb-1 font-semibold tracking-wider">Price (₹)</label>
                      <input 
                        type="number"
                        value={settings.starterPlanPrice}
                        onChange={(e) => handleChange('starterPlanPrice', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-violet"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-text-tertiary mb-1 font-semibold tracking-wider">Description</label>
                      <input 
                        type="text"
                        value={settings.starterPlanDesc}
                        onChange={(e) => handleChange('starterPlanDesc', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-violet"
                      />
                    </div>
                  </div>
                </div>

                {/* Pro */}
                <div className="p-4 bg-white/5 border border-accent-violet/30 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-violet/5 to-transparent pointer-events-none"></div>
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      Professional Plan
                    </h3>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.proPlanEnabled}
                          onChange={(e) => handleChange('proPlanEnabled', e.target.checked)}
                        />
                        <div className="w-8 h-4 bg-black border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-accent-violet"></div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    <div>
                      <label className="block text-[10px] uppercase text-text-tertiary mb-1 font-semibold tracking-wider">Price (₹)</label>
                      <input 
                        type="number"
                        value={settings.proPlanPrice}
                        onChange={(e) => handleChange('proPlanPrice', e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-violet"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-text-tertiary mb-1 font-semibold tracking-wider">Description</label>
                      <textarea 
                        value={settings.proPlanDesc}
                        onChange={(e) => handleChange('proPlanDesc', e.target.value)}
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-violet resize-none"
                      />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
