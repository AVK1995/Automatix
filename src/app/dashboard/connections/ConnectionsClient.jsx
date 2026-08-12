'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, KeyRound, X, Calendar, Mail, Smartphone, Camera, Users, MessageSquare, Database, ArrowLeft, AlertTriangle, CheckCircle2, HelpCircle, Edit2 } from 'lucide-react';
import { deleteConnectionById, updateConnectionName } from '@/actions/connections';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SmtpModal from '@/components/connections/SmtpModal';
import GoogleSheetsModal from '@/components/connections/GoogleSheetsModal';
import PlaceholderModal from '@/components/connections/PlaceholderModal';
import ConnectionGuideModal from '@/components/ui/ConnectionGuideModal';

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
  const [placeholderProvider, setPlaceholderProvider] = useState(null);
  const [guideProvider, setGuideProvider] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
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
      {/* Action Bar */}
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
          </div>

          <div className="space-y-4">
            {(() => {
              const providerConnections = connections.filter(conn => {
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-accent-blue/10 text-accent-blue flex items-center justify-center">
                          {isPseudo ? <Database size={20} /> : <KeyRound size={20} />}
                        </div>
                        <div>
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
                                <p className="text-base font-medium text-white">{conn.name}</p>
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
                          <p className="text-xs text-text-secondary mt-0.5">
                            {isPseudo ? `ID: ${conn.spreadsheetId}` : conn.accountEmail}
                          </p>
                        </div>
                      </div>
                      {!isPseudo ? (
                        <button 
                          onClick={() => setConfirmDeleteId(conn.id)}
                          className="p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="p-2 text-text-secondary/50" title="This is an action-only connection. Delete it by removing the step from the workflow.">
                          <Trash2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {usage.length > 0 ? (
                        usage.map((u, i) => {
                          const stats = workflowStats[u.workflowId] || { total: 0, failed: 0 };
                          return (
                            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background border border-border-subtle rounded-md gap-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Connection Name</p>
                                  <p className="text-sm font-medium text-white">{conn.name}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Main Workflow Name</p>
                                  <p className="text-sm font-medium text-white">{u.workflowName}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Step Name</p>
                                  <p className="text-sm font-medium text-white">{u.nodeTitle}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 px-6 py-2 bg-card border-l border-border-subtle">
                                <div className="text-center">
                                  <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Total Runs</p>
                                  <p className="text-sm font-semibold text-white">{stats.total}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] uppercase tracking-wider text-text-secondary mb-1">Total Failed</p>
                                  <p className="text-sm font-semibold text-red-400">{stats.failed}</p>
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
                      )}
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
            connections.forEach(conn => {
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
              } else if (hasIssues) {
                group.needsAttention += 1;
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
        isOpen={isSmtpOpen}
        onClose={() => setIsSmtpOpen(false)}
        onSuccess={() => {
          setIsSmtpOpen(false);
          setIsAdding(false);
          router.refresh();
        }}
      />

      <GoogleSheetsModal
        isOpen={isSheetsOpen}
        onClose={() => setIsSheetsOpen(false)}
        onSuccess={() => {
          setIsSheetsOpen(false);
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
