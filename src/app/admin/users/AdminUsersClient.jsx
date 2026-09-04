'use client';

import { useState, useMemo } from 'react';
import DataTable from '@/components/DataTable';
import Link from 'next/link';
import DeleteButton from '@/components/DeleteButton';
import TruncatedText from '@/components/ui/TruncatedText';
import Select from '@/components/ui/Select';
import { Search, X, RotateCcw, Users, ArrowRight } from 'lucide-react';

export default function AdminUsersClient({ initialUsers = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL'); // 'ALL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS'

  const filteredUsers = useMemo(() => {
    const now = Date.now();
    return initialUsers.filter((user) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (user.name || '').toLowerCase().includes(q);
        const matchEmail = (user.email || '').toLowerCase().includes(q);
        const matchId = (user.id || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId) return false;
      }

      // Tier filter
      if (tierFilter !== 'ALL') {
        const userTier = (user.subscriptionTier || 'starter').toUpperCase();
        if (userTier !== tierFilter) return false;
      }

      // Date Joined filter
      if (dateRange !== 'ALL') {
        const joinedMs = new Date(user.createdAt).getTime();
        const ageDays = (now - joinedMs) / (1000 * 60 * 60 * 24);
        if (dateRange === 'LAST_7_DAYS' && ageDays > 7) return false;
        if (dateRange === 'LAST_30_DAYS' && ageDays > 30) return false;
        if (dateRange === 'LAST_90_DAYS' && ageDays > 90) return false;
      }

      return true;
    });
  }, [initialUsers, searchQuery, tierFilter, dateRange]);

  const hasActiveFilters = searchQuery.trim() !== '' || tierFilter !== 'ALL' || dateRange !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setTierFilter('ALL');
    setDateRange('ALL');
  };

  const tableColumns = [
    { 
      header: 'Tenant / Email', 
      className: 'w-[30%] text-left',
      accessor: (row) => (
        <div className="min-w-0 max-w-[260px] text-left">
          <Link href={`/admin/users/${row.id}`} className="block group">
            <div className="font-semibold text-foreground group-hover:text-accent-blue transition-colors truncate text-sm" data-tooltip={row.name}>
              {row.name || 'Pending Setup'}
            </div>
            <div className="text-xs text-text-secondary mt-0.5 group-hover:text-accent-blue/70 transition-colors truncate" data-tooltip={row.email}>
              {row.email}
            </div>
          </Link>
          <div className="text-[10px] text-text-tertiary font-mono mt-0.5">
            <TruncatedText text={row.id} prefix="ID: " maxChars={8} copyable={true} />
          </div>
        </div>
      )
    },
    { 
      header: 'Subscription', 
      className: 'w-[20%] text-center',
      accessor: (row) => (
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
            {row.subscriptionTier} [{row.subscriptionCycle || 'monthly'}]
          </span>
          {row.subscriptionExpiresAt && (
            <div className="text-[10px] text-text-secondary mt-1.5 font-medium">
              Expires: {new Date(row.subscriptionExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
      )
    },
    { 
      header: 'Workflows', 
      className: 'w-[15%] text-center',
      accessor: (row) => (
        <Link 
          href={`/admin/workflows?tenantId=${row.id}`} 
          className="group inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue hover:text-white transition-all shadow-sm"
        >
          {row._count?.workflows || 0} Built
          <ArrowRight className="ml-1.5 w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) 
    },
    { 
      header: 'Joined At', 
      className: 'w-[15%] text-center', 
      accessor: (row) => (
        <span className="text-xs text-text-secondary">
          {new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ) 
    },
    { 
      header: 'Actions', 
      className: 'w-[20%] text-center',
      accessor: (row) => (
        <div className="flex justify-center items-center gap-2">
          <Link 
            href={`/admin/users/${row.id}`} 
            className="group inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md bg-background border border-border-subtle hover:bg-border-subtle hover:text-foreground text-text-secondary transition-colors"
          >
            Manage
          </Link>
          <DeleteButton id={row.id} type="user" confirmMessage={`Are you sure you want to completely delete ${row.email}? This will also delete ALL of their workflows.`} />
        </div>
      ) 
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            All Provisioned Tenants
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-secondary">
              {filteredUsers.length} of {initialUsers.length}
            </span>
          </h2>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-2.5 py-1 text-xs font-semibold text-accent-blue hover:text-white bg-accent-blue/10 hover:bg-accent-blue/20 rounded-md border border-accent-blue/20 transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw size={11} />
            Reset Filters
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className="w-full bg-background border border-border-subtle rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Tier Filter */}
        <div className="w-36 shrink-0">
          <Select
            value={tierFilter}
            onChange={setTierFilter}
            options={[
              { value: 'ALL', label: 'All Tiers' },
              { value: 'STARTER', label: 'Starter' },
              { value: 'PROFESSIONAL', label: 'Professional' },
              { value: 'ENTERPRISE', label: 'Enterprise' }
            ]}
            buttonClassName="py-2 text-xs"
          />
        </div>

        {/* Date Joined Filter */}
        <div className="w-36 shrink-0">
          <Select
            value={dateRange}
            onChange={setDateRange}
            options={[
              { value: 'ALL', label: 'All Time' },
              { value: 'LAST_7_DAYS', label: 'Joined Last 7d' },
              { value: 'LAST_30_DAYS', label: 'Joined Last 30d' },
              { value: 'LAST_90_DAYS', label: 'Joined Last 90d' }
            ]}
            buttonClassName="py-2 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="relative z-10">
        <DataTable data={filteredUsers} columns={tableColumns} />
      </div>
    </div>
  );
}
