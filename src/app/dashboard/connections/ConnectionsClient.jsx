'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, KeyRound, X, Calendar, Mail, Smartphone, Camera, Users, MessageSquare, Database, ArrowLeft, AlertTriangle, CheckCircle2, HelpCircle, Edit2, ExternalLink, Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { deleteConnectionById, updateConnectionName } from '@/actions/connections';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Select from '@/components/ui/Select';
import SmtpModal from '@/components/connections/SmtpModal';
import GoogleSheetsModal from '@/components/connections/GoogleSheetsModal';
import PlaceholderModal from '@/components/connections/PlaceholderModal';
import ConnectionGuideModal from '@/components/ui/ConnectionGuideModal';
import InstagramModal from '@/components/connections/InstagramModal';
import FacebookModal from '@/components/connections/FacebookModal';
import WhatsappModal from '@/components/connections/WhatsappModal';
import ApiKeyModal from '@/components/connections/ApiKeyModal';

const PROVIDERS = [
  { name: 'Automatix Calendar', icon: Calendar, color: 'text-accent-blue bg-accent-blue/10 border-accent-blue/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-accent-blue/50', isPremium: true },
  { name: 'Google Sheets', icon: Database, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
  { name: 'Calendly', icon: Calendar, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { name: 'Cal.com', icon: Calendar, color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
  { name: 'SMTP', icon: Mail, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { name: 'WhatsApp', icon: Smartphone, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { name: 'Instagram', icon: Camera, color: 'text-pink-600 bg-pink-600/10 border-pink-600/20' },
  { name: 'Facebook', icon: Users, color: 'text-blue-600 bg-blue-600/10 border-blue-600/20' },
  { name: 'Slack', icon: MessageSquare, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
  { name: 'Stripe', icon: Database, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' }
];

export default function ConnectionsClient({ initialConnections, usageMap = {}, workflowStats = {} }) {
  const [connections, setConnections] = useState(initialConnections);
  const [isAdding, setIsAdding] = useState(false);
  const [isSmtpOpen, setIsSmtpOpen] = useState(false);
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [isInstagramOpen, setIsInstagramOpen] = useState(false);
  const [isFacebookOpen, setIsFacebookOpen] = useState(false);
  const [isWhatsappOpen, setIsWhatsappOpen] = useState(false);
  const [apiKeyProvider, setApiKeyProvider] = useState(null);
  const [placeholderProvider, setPlaceholderProvider] = useState(null);
  const [guideProvider, setGuideProvider] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingConfigConn, setEditingConfigConn] = useState(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflowFilter, setSelectedWorkflowFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const router = useRouter();

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    
    // Optimistic update
    setConnections(connections.map(c => c.id === id ? { ...c, name: editName } : c));
    setEditingId(null);
    
    // Server update
    const result = await updateConnectionName(id, editName);
    if (!result.success) {
      // Revert if failed (using router.refresh as fallback)
      router.refresh();
    }
  };



  // Update local state when initialConnections changes from a router.refresh()
  useEffect(() => {
    setConnections(initialConnections);
  }, [initialConnections]);

  // Extract unique workflows for the workflow filter dropdown
  const availableWorkflows = useMemo(() => {
    const map = {};
    Object.values(usageMap).forEach(list => {
      list.forEach(item => {
        if (item.workflowId && !map[item.workflowId]) {
          map[item.workflowId] = item.workflowName;
        }
      });
    });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [usageMap]);

  // Filter and sort connections dynamically
  const filteredConnections = useMemo(() => {
    return connections.filter(conn => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = conn.name?.toLowerCase().includes(q);
        const matchEmail = (conn.accountEmail || conn.spreadsheetId || '').toLowerCase().includes(q);
        const usage = usageMap[conn.id] || [];
        const matchWorkflow = usage.some(u => 
          u.workflowName?.toLowerCase().includes(q) || u.nodeTitle?.toLowerCase().includes(q)
        );
        if (!matchName && !matchEmail && !matchWorkflow) return false;
      }

      // 2. Workflow Filter
      if (selectedWorkflowFilter !== 'all') {
        const usage = usageMap[conn.id] || [];
        const isInWorkflow = usage.some(u => u.workflowId === selectedWorkflowFilter);
        if (!isInWorkflow) return false;
      }

      // 3. Status Filter
      if (selectedStatusFilter !== 'all') {
        const usage = usageMap[conn.id] || [];
        const isActive = usage.length > 0;
        if (selectedStatusFilter === 'active' && !isActive) return false;
        if (selectedStatusFilter === 'inactive' && isActive) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'usage') return (usageMap[b.id]?.length || 0) - (usageMap[a.id]?.length || 0);
      return 0;
    });
  }, [connections, searchQuery, selectedWorkflowFilter, selectedStatusFilter, sortBy, usageMap]);

  const handleOAuthStart = (provider) => {
    if (provider === 'Automatix Calendar') {
      router.push('/dashboard/calendars');
      return;
    }

    if (provider === 'SMTP') {
      setIsSmtpOpen(true);
      return;
    }
    
    if (provider === 'Google Sheets') {
      setIsSheetsOpen(true);
      return;
    }

    if (provider === 'Instagram') {
      setIsInstagramOpen(true);
      return;
    }

    if (provider === 'Facebook') {
      setIsFacebookOpen(true);
      return;
    }

    if (provider === 'WhatsApp') {
      setIsWhatsappOpen(true);
      return;
    }

    if (provider === 'Calendly' || provider === 'Cal.com') {
      setApiKeyProvider(provider);
      return;
    }

    // All other apps fall back to the placeholder modal
    setPlaceholderProvider(provider);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;

    try {
      await deleteConnectionById(confirmDeleteId);
      setConnections(connections.filter(c => c.id !== confirmDeleteId));
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action & Filter Bar */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-card border border-border-subtle p-4 rounded-sm">
          <div>
            <h2 className="text-sm font-medium text-foreground">Active Connections</h2>
            <p className="text-xs text-text-secondary mt-1">Manage external tool integrations</p>
          </div>
          {!isAdding && (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (connections.length >= 5) {
                    alert('You have reached the maximum limit of 5 connections on the free plan. Please upgrade your plan to add more.');
                    return;
                  }
                  setIsAdding(true);
                }}
                className="flex items-center gap-2 bg-accent-blue hover:opacity-90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-opacity"
              >
                <Plus size={16} />
                Add Connection
              </button>
            </div>
          )}
        </div>

        {/* Search & Filters Bar */}
        {selectedProvider && (
          <div className="bg-card border border-border-subtle p-3 rounded-sm flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by connection name, email, or workflow..."
              className="w-full bg-black/40 border border-border-subtle rounded-md pl-9 pr-8 py-1.5 text-xs text-white placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Workflow Filter */}
            <div className="w-48 shrink-0">
              <Select
                value={selectedWorkflowFilter}
                onChange={setSelectedWorkflowFilter}
                options={[
                  { value: 'all', label: 'All Workflows', icon: <Filter size={14} className="text-text-tertiary" /> },
                  ...availableWorkflows.map(wf => ({ value: wf.id, label: wf.name, icon: <Filter size={14} className="text-text-tertiary" /> }))
                ]}
                placeholder="All Workflows"
                buttonClassName="py-1 text-xs bg-black/40 border-border-subtle h-[32px]"
              />
            </div>

            {/* Status Filter */}
            <div className="w-40 shrink-0">
              <Select
                value={selectedStatusFilter}
                onChange={setSelectedStatusFilter}
                options={[
                  { value: 'all', label: 'All Statuses', icon: <SlidersHorizontal size={14} className="text-text-tertiary" /> },
                  { value: 'active', label: 'Active Only', icon: <SlidersHorizontal size={14} className="text-text-tertiary" /> },
                  { value: 'inactive', label: 'Inactive Only', icon: <SlidersHorizontal size={14} className="text-text-tertiary" /> }
                ]}
                placeholder="All Statuses"
                buttonClassName="py-1 text-xs bg-black/40 border-border-subtle h-[32px]"
              />
            </div>

            {/* Date Filter */}
            <div className="w-36 shrink-0">
              <Select
                value={selectedDateFilter}
                onChange={setSelectedDateFilter}
                options={[
                  { value: 'all', label: 'All Time', icon: <Calendar size={14} className="text-text-tertiary" /> },
                  { value: '24h', label: 'Past 24 Hours', icon: <Calendar size={14} className="text-text-tertiary" /> },
                  { value: '7d', label: 'Past 7 Days', icon: <Calendar size={14} className="text-text-tertiary" /> },
                  { value: '14d', label: 'Past 14 Days', icon: <Calendar size={14} className="text-text-tertiary" /> }
                ]}
                placeholder="All Time"
                buttonClassName="py-1 text-xs bg-black/40 border-border-subtle h-[32px]"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-40 shrink-0">
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'newest', label: 'Newest First', icon: <ArrowUpDown size={14} className="text-text-tertiary" /> },
                  { value: 'oldest', label: 'Oldest First', icon: <ArrowUpDown size={14} className="text-text-tertiary" /> },
                  { value: 'name', label: 'Name (A-Z)', icon: <ArrowUpDown size={14} className="text-text-tertiary" /> },
                  { value: 'usage', label: 'Most Workflows', icon: <ArrowUpDown size={14} className="text-text-tertiary" /> }
                ]}
                placeholder="Sort by"
                buttonClassName="py-1 text-xs bg-black/40 border-border-subtle h-[32px]"
              />
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Add New Selection */}
      {isAdding && (
        <div className="bg-card border border-border-subtle p-6 rounded-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Select an Integration</h3>
            <button onClick={() => setIsAdding(false)} className="text-text-secondary hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PROVIDERS.map(p => {
              return (
                <div key={p.name} className="relative group/card">
                  <button 
                    onClick={() => handleOAuthStart(p.name)} 
                    className={`flex flex-col items-start justify-center gap-3 w-full p-5 border ${p.isPremium ? 'border-accent-blue bg-accent-blue/5 shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:bg-accent-blue/10' : 'border-border-subtle hover:border-accent-blue hover:bg-white/5'} rounded-lg transition-all group relative overflow-hidden`}
                  >
                    {p.isPremium && (
                       <div className="absolute top-0 right-0 px-2 py-0.5 bg-accent-blue text-white text-[9px] font-bold tracking-wider uppercase rounded-bl-lg">
                         Built-in Pro
                       </div>
                    )}
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${p.color}`}>
                        <p.icon size={20} />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-semibold text-foreground group-hover:text-accent-blue transition-colors block">{p.name}</span>
                        {p.isPremium && <span className="text-[10px] text-accent-blue/80">Premium Scheduling App</span>}
                      </div>
                    </div>
                  </button>
                  {p.name !== 'Automatix Calendar' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setGuideProvider(p.name);
                      }}
                      title="Learn more about connecting this app"
                      className="absolute top-1/2 -translate-y-1/2 right-4 p-1.5 text-text-tertiary hover:text-accent-blue transition-colors z-10 bg-[#111] rounded-full border border-border-subtle"
                    >
                      <HelpCircle size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* App Cards or Detail View */}
      {selectedProvider ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => setSelectedProvider(null)}
              className="p-2 text-text-secondary hover:text-white bg-card border border-border-subtle rounded-md hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <h3 className="text-lg font-medium text-foreground">{selectedProvider} Connections</h3>
            {selectedProvider === 'WhatsApp' && (
              <div className="ml-auto">
                <Link
                  href="/dashboard/whatsapp"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Smartphone size={14} /> Open Template Studio →
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {(() => {
              const providerConnections = filteredConnections.filter(conn => {
                const providerName = (conn.providerName || conn.provider || 'Unknown').toLowerCase();
                let displayProvider = PROVIDERS.find(p => p.name.toLowerCase() === providerName)?.name || providerName;
                if (providerName.includes('sheet')) displayProvider = 'Google Sheets';
                return displayProvider === selectedProvider;
              });

              if (providerConnections.length === 0) {
                return (
                  <div className="bg-card border border-border-subtle p-8 rounded-md flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-text-secondary mb-2">
                      <KeyRound size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">No {selectedProvider} connection found</h4>
                      <p className="text-xs text-text-tertiary">You haven't added any {selectedProvider} accounts yet.</p>
                    </div>
                    <button 
                      onClick={() => handleOAuthStart(selectedProvider)}
                      className="mt-2 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium px-4 py-2 rounded-md text-xs flex items-center gap-2 transition-colors"
                    >
                      <Plus size={16} /> Add {selectedProvider} Connection
                    </button>
                  </div>
                );
              }

              return providerConnections.map(conn => {
                const isPseudo = conn.isPseudo;
                const usage = usageMap[conn.id] || [];

                return (
                  <div key={conn.id} className="bg-card border border-border-subtle p-6 rounded-md flex flex-col">
                    <div className="flex items-start justify-between mb-4 border-b border-border-subtle pb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                        <div className="w-10 h-10 rounded-sm bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0">
                          {isPseudo ? <Database size={20} /> : <KeyRound size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {editingId === conn.id ? (
                              <input
                                autoFocus
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => handleSaveEdit(conn.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(conn.id);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                className="bg-black/50 border border-white/20 rounded px-2 py-0.5 text-base font-medium text-white focus:outline-none focus:border-accent-blue"
                              />
                            ) : (
                              <>
                                <p className="text-base font-medium text-white truncate">{conn.name}</p>
                                {!isPseudo && (
                                  <button
                                    onClick={() => {
                                      setEditingId(conn.id);
                                      setEditName(conn.name);
                                    }}
                                    className="p-1 text-text-secondary hover:text-white transition-colors"
                                    title="Edit Connection Name"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5 truncate">
                            {isPseudo ? `ID: ${conn.spreadsheetId}` : conn.accountEmail}
                          </p>
                        </div>
                      </div>
                      {!isPseudo ? (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setEditingConfigConn(conn)}
                            className="p-2 text-text-secondary hover:text-accent-blue hover:bg-accent-blue/10 rounded-sm transition-colors"
                            title="Edit Configuration"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(conn.id)}
                            className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-colors"
                            title="Delete Connection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 text-text-secondary/50" title="This is an action-only connection. Delete it by removing the step from the workflow.">
                          <Trash2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center justify-between text-xs text-green-400">
                        <span className="flex items-center gap-2 font-medium">
                          <CheckCircle2 size={14} /> Connection Status: Active & Secured
                        </span>
                        <span className="text-text-tertiary text-[11px]">Your account credentials are stored and operating cleanly</span>
                      </div>

                      {conn.providerName === 'whatsapp' && (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                WhatsApp Cloud API Active
                              </div>
                              <div className="text-[11px] text-text-tertiary mt-0.5 font-mono">
                                WABA ID: {conn.clientEmail || 'N/A'} • Phone ID: {conn.privateKey || 'N/A'}
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Direct Meta Billing
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-500/10">
                            <Link
                              href="/dashboard/whatsapp?tab=templates"
                              className="px-3 py-1.5 text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-md transition-colors flex items-center gap-1.5"
                            >
                              Browse Templates
                            </Link>
                            <Link
                              href="/dashboard/whatsapp?tab=studio"
                              className="px-3 py-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-md transition-colors flex items-center gap-1.5"
                            >
                              + Template Studio
                            </Link>
                            <Link
                              href="/dashboard/whatsapp?tab=api"
                              className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-border-subtle rounded-md transition-colors flex items-center gap-1.5"
                            >
                              Public cURL API
                            </Link>
                          </div>
                        </div>
                      )}

                      {(() => {
                        const q = searchQuery.trim().toLowerCase();
                        const matchConn = q ? (conn.name?.toLowerCase().includes(q) || (conn.accountEmail || conn.spreadsheetId || '').toLowerCase().includes(q)) : false;

                        const usageByWorkflow = {};
                        usage.forEach(u => {
                          if (selectedWorkflowFilter !== 'all' && u.workflowId !== selectedWorkflowFilter) return;

                          if (selectedDateFilter !== 'all') {
                             const wfDate = new Date(u.createdAt || 0);
                             const diffDays = (new Date() - wfDate) / (1000 * 60 * 60 * 24);
                             if (selectedDateFilter === '24h' && diffDays > 1) return;
                             if (selectedDateFilter === '7d' && diffDays > 7) return;
                             if (selectedDateFilter === '14d' && diffDays > 14) return;
                          }

                          if (q && !matchConn) {
                             const matchWorkflow = u.workflowName?.toLowerCase().includes(q) || u.nodeTitle?.toLowerCase().includes(q);
                             if (!matchWorkflow) return;
                          }

                          if (!usageByWorkflow[u.workflowId]) {
                            usageByWorkflow[u.workflowId] = {
                              workflowId: u.workflowId,
                              workflowName: u.workflowName,
                              steps: []
                            };
                          }
                          usageByWorkflow[u.workflowId].steps.push(u);
                        });
                        const workflowGroups = Object.values(usageByWorkflow).sort((a, b) => {
                          const aDate = new Date(a.steps[0].createdAt || 0);
                          const bDate = new Date(b.steps[0].createdAt || 0);
                          
                          if (sortBy === 'newest') return bDate - aDate;
                          if (sortBy === 'oldest') return aDate - bDate;
                          if (sortBy === 'name') return (a.workflowName || '').localeCompare(b.workflowName || '');
                          if (sortBy === 'usage') return b.steps.length - a.steps.length;
                          return 0;
                        });

                        return workflowGroups.length > 0 ? (
                          workflowGroups.map((wfGroup) => {
                            const stats = workflowStats[wfGroup.workflowId] || { total: 0, failed: 0 };

                            return (
                              <div key={wfGroup.workflowId} className="bg-background border border-border-subtle rounded-lg p-5 space-y-4">
                                {/* Workflow Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs uppercase tracking-wider text-text-tertiary font-semibold shrink-0">Workflow:</span>
                                    <Link 
                                      href={`/workflows/${wfGroup.workflowId}`} 
                                      className="text-base font-semibold text-accent-blue hover:underline flex items-center gap-1.5 group/link min-w-0"
                                      title="Open this workflow in builder"
                                    >
                                      <span className="truncate">{wfGroup.workflowName}</span>
                                      <ExternalLink size={14} className="opacity-70 group-hover/link:opacity-100 transition-opacity shrink-0" />
                                    </Link>
                                  </div>

                                  <Link
                                    href={`/workflows/${wfGroup.workflowId}`}
                                    className="text-xs bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/30 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 shrink-0 w-full sm:w-auto"
                                  >
                                    Open Workflow →
                                  </Link>
                                </div>

                                {/* Steps List */}
                                <div className="space-y-2">
                                  <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Connected Steps in this Workflow ({wfGroup.steps.length})</p>
                                  <div className="divide-y divide-border-subtle/50 bg-black/20 rounded-md border border-white/5 overflow-hidden">
                                    {wfGroup.steps.map((step, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-3 text-xs">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
                                          <span className="font-medium text-white">{step.nodeTitle}</span>
                                        </div>

                                        <div className="flex items-center gap-6">
                                          <div className="flex items-center gap-1.5 text-text-secondary">
                                            <span>Runs:</span>
                                            <span className="font-semibold text-white">{stats.total}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-text-secondary">
                                            <span>Failed:</span>
                                            <span className={`font-semibold ${stats.failed > 0 ? 'text-red-400' : 'text-text-tertiary'}`}>{stats.failed}</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 bg-background border border-border-subtle rounded-md flex items-center gap-2 text-text-secondary">
                            <AlertTriangle size={16} />
                            <p className="text-sm italic">This connection is not currently used in any workflows.</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            })()}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const groupedByApp = {};
            filteredConnections.forEach(conn => {
              const providerName = (conn.providerName || conn.provider || 'Unknown').toLowerCase();
              
              let appDef = PROVIDERS.find(p => p.name.toLowerCase() === providerName);
              if (!appDef) {
                appDef = {
                  name: providerName,
                  icon: Database,
                  color: 'text-gray-400 bg-gray-400/10 border-gray-400/20'
                };
              }
              if (providerName.includes('sheet')) {
                appDef = {
                  name: 'Google Sheets',
                  icon: Database,
                  color: 'text-green-500 bg-green-500/10 border-green-500/20'
                };
              }

              if (!groupedByApp[appDef.name]) {
                groupedByApp[appDef.name] = {
                  appDef,
                  total: 0,
                  active: 0,
                  inactive: 0,
                  needsAttention: 0
                };
              }

              const group = groupedByApp[appDef.name];
              group.total += 1;

              const usage = usageMap[conn.id] || [];
              let hasIssues = false;
              usage.forEach(u => {
                const stats = workflowStats[u.workflowId];
                if (stats && stats.failed > 0) hasIssues = true;
              });

              if (usage.length === 0) {
                group.inactive += 1;
              } else {
                group.active += 1;
              }
            });

            const appCards = Object.values(groupedByApp);

            if (appCards.length === 0 && !isAdding) {
              return (
                <div className="col-span-full py-12 text-center border border-dashed border-border-subtle rounded-sm">
                  <p className="text-sm text-text-secondary">You haven't added any connections yet.</p>
                </div>
              );
            }

            return appCards.map(group => {
              const { appDef, total, active, inactive, needsAttention } = group;
              const isError = needsAttention > 0;
              
              return (
                <button
                  key={appDef.name}
                  onClick={() => setSelectedProvider(appDef.name)}
                  className={`bg-card border p-6 rounded-md flex flex-col text-left transition-all hover:bg-white/5 ${
                    isError ? 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'border-border-subtle hover:border-accent-blue/50'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border ${appDef.color}`}>
                      <appDef.icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{appDef.name}</h3>
                      <p className="text-sm text-text-secondary">{total} {total === 1 ? 'Connection' : 'Connections'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mt-auto w-full">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-text-secondary"><CheckCircle2 size={14} className="text-green-500" /> Active</span>
                      <span className="font-medium text-white">{active}</span>
                    </div>
                    {needsAttention > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-orange-400"><AlertTriangle size={14} /> Needs Attention</span>
                        <span className="font-medium text-orange-400">{needsAttention}</span>
                      </div>
                    )}
                    {inactive > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-text-secondary"><Database size={14} /> Inactive</span>
                        <span className="font-medium text-white">{inactive}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            });
          })()}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={executeDelete}
        title="Remove Connection"
        message="Are you sure you want to remove this connection? Workflows relying on it will fail."
        confirmText="Remove"
        isDestructive={true}
      />

      <SmtpModal 
        isOpen={isSmtpOpen || editingConfigConn?.providerName === 'smtp'}
        initialData={editingConfigConn?.providerName === 'smtp' ? editingConfigConn : null}
        onClose={() => {
          setIsSmtpOpen(false);
          setEditingConfigConn(null);
        }}
        onSuccess={() => {
          setIsSmtpOpen(false);
          setEditingConfigConn(null);
          setIsAdding(false);
          router.refresh();
        }}
      />

      <GoogleSheetsModal
        isOpen={isSheetsOpen || editingConfigConn?.providerName === 'sheets'}
        initialData={editingConfigConn?.providerName === 'sheets' ? editingConfigConn : null}
        onClose={() => {
          setIsSheetsOpen(false);
          setEditingConfigConn(null);
        }}
        onSuccess={() => {
          setIsSheetsOpen(false);
          setEditingConfigConn(null);
          setIsAdding(false);
          router.refresh();
        }}
      />

      <InstagramModal
        isOpen={isInstagramOpen || editingConfigConn?.providerName === 'instagram'}
        initialData={editingConfigConn?.providerName === 'instagram' ? editingConfigConn : null}
        onClose={() => {
          setIsInstagramOpen(false);
          setEditingConfigConn(null);
        }}
        onSuccess={() => {
          setIsInstagramOpen(false);
          setEditingConfigConn(null);
          setIsAdding(false);
          router.refresh();
        }}
      />

      <FacebookModal
        isOpen={isFacebookOpen || editingConfigConn?.providerName === 'facebook'}
        initialData={editingConfigConn?.providerName === 'facebook' ? editingConfigConn : null}
        onClose={() => {
          setIsFacebookOpen(false);
          setEditingConfigConn(null);
        }}
        onSuccess={() => {
          setIsFacebookOpen(false);
          setEditingConfigConn(null);
          setIsAdding(false);
          router.refresh();
        }}
      />

      <WhatsappModal
        isOpen={isWhatsappOpen || editingConfigConn?.providerName === 'whatsapp'}
        initialData={editingConfigConn?.providerName === 'whatsapp' ? editingConfigConn : null}
        onClose={() => {
          setIsWhatsappOpen(false);
          setEditingConfigConn(null);
        }}
        onSuccess={() => {
          setIsWhatsappOpen(false);
          setEditingConfigConn(null);
          setIsAdding(false);
          router.refresh();
        }}
      />

      <ApiKeyModal
        isOpen={!!apiKeyProvider || (editingConfigConn && !['instagram', 'facebook', 'whatsapp', 'smtp', 'sheets'].includes(editingConfigConn?.providerName))}
        onClose={() => {
          setApiKeyProvider(null);
          setEditingConfigConn(null);
        }}
        providerName={apiKeyProvider || editingConfigConn?.providerName}
        initialData={editingConfigConn && !['instagram', 'facebook', 'whatsapp', 'smtp', 'sheets'].includes(editingConfigConn?.providerName) ? editingConfigConn : null}
        onSuccess={() => {
          setApiKeyProvider(null);
          setEditingConfigConn(null);
          setIsAdding(false);
          router.refresh();
        }}
      />

      <PlaceholderModal
        isOpen={!!placeholderProvider}
        onClose={() => setPlaceholderProvider(null)}
        providerName={placeholderProvider}
      />

      <ConnectionGuideModal
        isOpen={!!guideProvider}
        onClose={() => setGuideProvider(null)}
        providerName={guideProvider}
      />
    </div>
  );
}
