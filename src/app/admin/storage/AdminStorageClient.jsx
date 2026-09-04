'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Database, 
  Search, 
  HardDrive, 
  AlertTriangle, 
  Users, 
  ExternalLink, 
  Film, 
  Image as ImageIcon,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import TruncatedText from '@/components/ui/TruncatedText';
import Select from '@/components/ui/Select';

export default function AdminStorageClient({ users }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Overall metrics
  const stats = useMemo(() => {
    let totalMB = 0;
    let totalLimitMB = 0;
    let graceCount = 0;
    let over80Count = 0;

    users.forEach(u => {
      const userMB = (u.media || []).reduce((sum, m) => sum + (m.sizeMB || 0), 0);
      totalMB += userMB;
      totalLimitMB += (u.maxStorageMB || 50);
      if (u.storageStatus === 'GRACE_PERIOD') graceCount++;
      if (userMB / (u.maxStorageMB || 50) > 0.8) over80Count++;
    });

    return {
      totalUsedMB: totalMB,
      totalLimitMB,
      totalTenants: users.length,
      graceCount,
      over80Count
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (tierFilter !== 'ALL' && (u.quotaTier || 'free').toLowerCase() !== tierFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (u.name || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });
  }, [users, tierFilter, searchQuery]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Global Storage Buckets</h1>
        <p className="text-sm text-text-secondary">
          Monitor media asset allocation, quota consumption, and storage grace periods across all tenant accounts.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#111] border border-border-subtle rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-text-secondary uppercase font-semibold tracking-wider">Total Managed Storage</span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {stats.totalUsedMB > 1024 
                ? `${(stats.totalUsedMB / 1024).toFixed(2)} GB` 
                : `${stats.totalUsedMB.toFixed(1)} MB`}
            </div>
            <span className="text-[11px] text-text-tertiary">Across {stats.totalTenants} tenant workspaces</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
            <HardDrive size={20} />
          </div>
        </div>

        <div className="p-4 bg-[#111] border border-border-subtle rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-text-secondary uppercase font-semibold tracking-wider">Active Tenants</span>
            <div className="text-xl font-bold text-white mt-1 font-mono">{stats.totalTenants}</div>
            <span className="text-[11px] text-text-tertiary">All provisioned client accounts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <Users size={20} />
          </div>
        </div>

        <div className="p-4 bg-[#111] border border-border-subtle rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-text-secondary uppercase font-semibold tracking-wider">Capacity Alerts</span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
              {stats.graceCount + stats.over80Count}
            </div>
            <span className="text-[11px] text-text-tertiary">
              {stats.graceCount > 0 ? `${stats.graceCount} in grace period` : 'Tenants near quota limit'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111] border border-border-subtle p-3.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenant by name or email..."
              className="w-full bg-background border border-border-subtle rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue"
            />
          </div>

          <div className="w-36 shrink-0">
            <Select
              value={tierFilter}
              onChange={setTierFilter}
              options={[
                { value: 'ALL', label: 'All Plans' },
                { value: 'free', label: 'Free Tier' },
                { value: 'starter', label: 'Starter' },
                { value: 'pro', label: 'Professional' },
                { value: 'enterprise', label: 'Enterprise' }
              ]}
            />
          </div>
        </div>

        <span className="text-xs text-text-tertiary font-medium">
          Showing {filteredUsers.length} of {users.length} tenant{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Responsive Table for Desktop + Tablets */}
      <div className="bg-[#111] border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Database size={32} className="text-text-tertiary mx-auto opacity-40" />
            <h3 className="text-sm font-semibold text-white">No matching tenants</h3>
            <p className="text-xs text-text-secondary">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="py-3.5 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider w-[28%]">Tenant</th>
                    <th className="py-3.5 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider w-[12%]">Plan Tier</th>
                    <th className="py-3.5 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider w-[12%]">Videos</th>
                    <th className="py-3.5 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider w-[12%]">Images</th>
                    <th className="py-3.5 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider w-[24%]">Storage Usage</th>
                    <th className="py-3.5 px-4 text-[10px] uppercase font-semibold text-text-secondary tracking-wider text-right w-[12%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map(u => {
                    const videoCount = (u.media || []).filter(m => m.type === 'VIDEO').length;
                    const imageCount = (u.media || []).filter(m => m.type === 'IMAGE').length;
                    const totalUsedMB = (u.media || []).reduce((sum, m) => sum + (m.sizeMB || 0), 0);
                    const percent = Math.min((totalUsedMB / (u.maxStorageMB || 50)) * 100, 100);
                    const isGrace = u.storageStatus === 'GRACE_PERIOD';

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue font-bold text-xs uppercase shrink-0">
                              {u.email.charAt(0)}
                            </div>
                            <div className="min-w-0 max-w-[220px]">
                              <div className="text-xs font-semibold text-white group-hover:text-accent-blue transition-colors truncate" data-tooltip={u.name}>
                                {u.name || 'Unnamed Tenant'}
                              </div>
                              <div className="text-[11px] text-text-tertiary truncate font-mono" data-tooltip={u.email}>
                                {u.email}
                              </div>
                            </div>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white capitalize">
                            {u.quotaTier || 'free'}
                          </span>
                          {isGrace && (
                            <span className="block text-[10px] text-amber-400 font-medium mt-1">
                              Grace Period
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs">
                          <span className={videoCount >= (u.maxVideos || 5) ? 'text-red-400 font-bold' : 'text-text-secondary'}>
                            {videoCount}
                          </span>
                          <span className="text-text-tertiary"> / {u.maxVideos || 5}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs">
                          <span className={imageCount >= (u.maxImages || 10) ? 'text-red-400 font-bold' : 'text-text-secondary'}>
                            {imageCount}
                          </span>
                          <span className="text-text-tertiary"> / {u.maxImages || 10}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-white font-semibold">
                                {totalUsedMB > 1024 ? `${(totalUsedMB / 1024).toFixed(1)} GB` : `${totalUsedMB.toFixed(1)} MB`}
                              </span>
                              <span className="text-text-tertiary">
                                of {u.maxStorageMB || 50} MB ({percent.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/10">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-amber-500' : 'bg-accent-blue'
                                }`} 
                                style={{ width: `${Math.max(percent, 2)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link 
                            href={`/admin/users/${u.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-white/10 transition-colors"
                            data-tooltip="Manage Tenant & Quotas"
                          >
                            <span>Manage</span>
                            <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredUsers.map(u => {
                const videoCount = (u.media || []).filter(m => m.type === 'VIDEO').length;
                const imageCount = (u.media || []).filter(m => m.type === 'IMAGE').length;
                const totalUsedMB = (u.media || []).reduce((sum, m) => sum + (m.sizeMB || 0), 0);
                const percent = Math.min((totalUsedMB / (u.maxStorageMB || 50)) * 100, 100);
                const isGrace = u.storageStatus === 'GRACE_PERIOD';

                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue font-bold text-xs uppercase shrink-0">
                          {u.email.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{u.name || 'Unnamed Tenant'}</h4>
                          <p className="text-[11px] text-text-tertiary truncate font-mono">{u.email}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white capitalize shrink-0">
                        {u.quotaTier || 'free'}
                      </span>
                    </div>

                    {/* Usage Progress */}
                    <div className="space-y-1 bg-black/40 p-2.5 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-text-secondary">Storage Used:</span>
                        <span className="text-white font-semibold">
                          {totalUsedMB > 1024 ? `${(totalUsedMB / 1024).toFixed(1)} GB` : `${totalUsedMB.toFixed(1)} MB`} / {u.maxStorageMB || 50} MB
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/10 mt-1">
                        <div 
                          className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : percent > 75 ? 'bg-amber-500' : 'bg-accent-blue'}`} 
                          style={{ width: `${Math.max(percent, 2)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs text-text-secondary">
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span><Film size={11} className="inline mr-1 text-sky-400" />{videoCount}/{u.maxVideos || 5}</span>
                        <span><ImageIcon size={11} className="inline mr-1 text-emerald-400" />{imageCount}/{u.maxImages || 10}</span>
                      </div>

                      <Link 
                        href={`/admin/users/${u.id}`}
                        className="px-3 py-1 rounded text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-1"
                      >
                        Manage <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
