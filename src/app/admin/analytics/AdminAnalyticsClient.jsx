'use client';

import { useState, useMemo } from 'react';
import MetricCard from '@/components/MetricCard';
import DashboardAnalytics from '@/app/dashboard/DashboardAnalytics';
import DataTable from '@/components/DataTable';
import Link from 'next/link';
import { Download, Filter, Calendar, BarChart3, Activity, Layers, User } from 'lucide-react';
import { exportToCsv } from '@/lib/csvExport';
import TruncatedText from '@/components/ui/TruncatedText';
import Select from '@/components/ui/Select';

export default function AdminAnalyticsClient({ 
  totalWorkflows, 
  activeRuns, 
  cancelledRuns, 
  allLogs, 
  usages, 
  populatedIntegrations,
  allTenants = []
}) {
  const [dateRange, setDateRange] = useState('30'); // '7' | '30' | '90' | 'ALL'
  const [selectedTenantId, setSelectedTenantId] = useState('ALL');

  // Filter logs by date range and tenant
  const filteredLogs = useMemo(() => {
    const now = new Date().getTime();
    const days = dateRange === 'ALL' ? null : parseInt(dateRange);
    const cutoff = days ? now - days * 24 * 60 * 60 * 1000 : null;

    return allLogs.filter(log => {
      if (cutoff && new Date(log.createdAt).getTime() < cutoff) return false;
      if (selectedTenantId !== 'ALL' && log.workflow?.clientId !== selectedTenantId) return false;
      return true;
    });
  }, [allLogs, dateRange, selectedTenantId]);

  // Filter usage by date range
  const filteredUsages = useMemo(() => {
    const now = new Date().getTime();
    const days = dateRange === 'ALL' ? null : parseInt(dateRange);
    const cutoff = days ? now - days * 24 * 60 * 60 * 1000 : null;

    return usages.filter(u => {
      if (cutoff && new Date(u.date).getTime() < cutoff) return false;
      return true;
    });
  }, [usages, dateRange]);

  const exportFilteredAnalyticsCsv = () => {
    const columns = [
      { key: 'id', label: 'Log ID' },
      { label: 'Workflow Name', accessor: l => l.workflow?.name || 'Unknown' },
      { label: 'Tenant', accessor: l => l.workflow?.client?.email || 'N/A' },
      { key: 'externalReferenceId', label: 'External Ref' },
      { key: 'status', label: 'Status' },
      { label: 'Created At', accessor: l => new Date(l.createdAt).toISOString() },
      { label: 'Completed At', accessor: l => l.completedAt ? new Date(l.completedAt).toISOString() : 'N/A' }
    ];

    exportToCsv(`analytics_logs_${dateRange}d_${new Date().toISOString().slice(0, 10)}.csv`, columns, filteredLogs);
  };

  const tableColumns = [
    { 
      header: 'Log ID', 
      accessor: (row) => <TruncatedText text={row.id} maxChars={8} copyable={true} /> 
    },
    { 
      header: 'Workflow Name', 
      accessor: (row) => row.workflow ? (
        <div className="min-w-0 max-w-[240px]">
          <Link 
            href={`/admin/workflows/${row.workflow.id}`} 
            className="font-medium text-foreground hover:text-accent-blue transition-colors block truncate"
            data-tooltip={row.workflow.name}
          >
            {row.workflow.name}
          </Link>
          {row.workflow.client && (
            <div className="text-[11px] text-text-tertiary truncate" data-tooltip={row.workflow.client.email}>
              {row.workflow.client.name ? `${row.workflow.client.name} • ${row.workflow.client.email}` : row.workflow.client.email}
            </div>
          )}
        </div>
      ) : 'Unknown'
    },
    { 
      header: 'Ext. Reference', 
      accessor: (row) => row.externalReferenceId ? (
        <TruncatedText text={row.externalReferenceId} maxChars={12} copyable={true} />
      ) : <span className="text-text-tertiary">N/A</span> 
    },
    { header: 'Status', accessor: (row) => row.status, isStatus: true },
    { header: 'Started At', accessor: (row) => new Date(row.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Header with Filters and Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2.5">
            <BarChart3 size={22} className="text-accent-blue" />
            Platform Analytics & Execution Metrics
          </h1>
          <p className="text-text-secondary text-sm">System-wide workflow runs, event throughput, and API connection consumption.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tenant Filter Selector */}
          {allTenants && allTenants.length > 0 && (
            <div className="w-48">
              <Select
                value={selectedTenantId}
                onChange={setSelectedTenantId}
                options={[
                  { value: 'ALL', label: 'All Tenants' },
                  ...allTenants.map(t => ({
                    value: t.id,
                    label: t.name ? `${t.name} (${t.email})` : t.email
                  }))
                ]}
              />
            </div>
          )}

          {/* Date Range Selector */}
          <div className="flex items-center gap-1 bg-[#111] p-1 rounded-lg border border-white/10 text-xs">
            {['7', '30', '90', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-md transition-colors font-medium cursor-pointer ${
                  dateRange === range ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-white'
                }`}
              >
                {range === 'ALL' ? 'All Time' : `${range} Days`}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={exportFilteredAnalyticsCsv}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold border border-white/10 flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} />
            Export Analytics CSV
          </button>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Workflows" 
          value={totalWorkflows} 
          description="Configured across all tenants" 
        />
        <MetricCard 
          title="Active Executions" 
          value={activeRuns} 
          description="Currently executing or sleeping" 
        />
        <MetricCard 
          title="Kill Switch Aborts" 
          value={cancelledRuns} 
          description="Halted by cancellation webhooks" 
        />
      </div>

      {/* Interactive Charts */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Execution Throughput (Filtered: {filteredLogs.length} events)</span>
        </div>
        <DashboardAnalytics logs={filteredLogs} dateRange={dateRange} isAdmin={true} />
      </div>

      {/* API Connection Usage Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-border-subtle p-6 rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-4">Daily API Requests ({dateRange === 'ALL' ? 'All Time' : `Last ${dateRange} Days`})</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-white/5">
            {filteredUsages.length === 0 ? (
              <p className="text-xs text-text-secondary">No usage data recorded for this date range.</p>
            ) : (
              filteredUsages.map(u => {
                const dateKey = typeof u.date === 'string' ? u.date : (u.date?.toISOString ? u.date.toISOString() : String(Math.random()));
                const formattedDate = isNaN(new Date(u.date).getTime()) ? 'Unknown Date' : new Date(u.date).toLocaleDateString();
                return (
                  <div key={dateKey} className="flex justify-between items-center py-2 text-xs">
                    <span className="text-text-secondary">{formattedDate}</span>
                    <span className="text-white font-mono font-semibold">{u._sum?.requestCount || 0} requests</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[#111] border border-border-subtle p-6 rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-4">Top API Connections (All Time)</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto divide-y divide-white/5">
            {populatedIntegrations.length === 0 ? (
              <p className="text-xs text-text-secondary">No connections usage recorded yet.</p>
            ) : (
              populatedIntegrations.map((u) => (
                <div key={u.integrationId} className="flex justify-between items-center py-2 text-xs">
                  <div>
                    <p className="text-white font-medium">{u.integration?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-text-tertiary">{u.integration?.client?.email || 'Unknown'}</p>
                  </div>
                  <span className="text-accent-blue font-mono font-semibold bg-accent-blue/10 px-2 py-1 rounded">
                    {u._sum.requestCount} reqs
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Filtered Execution Logs Table */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Execution Logs ({filteredLogs.length} events)</h2>
        </div>
        <DataTable data={filteredLogs.slice(0, 20)} columns={tableColumns} />
      </div>
    </div>
  );
}
