'use client';

import { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Sparkles, 
  Layers, 
  Code, 
  Activity, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Search, 
  Filter, 
  ArrowLeft,
  Key,
  ChevronDown,
  Terminal,
  Send,
  Loader2,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import WhatsAppTemplateStudio from './WhatsAppTemplateStudio';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { getWhatsAppTemplates, deleteWhatsAppTemplate, getWhatsAppAccountStats } from '@/actions/whatsapp';

export default function WhatsAppDashboardClient({ connections, initialConnectionId, initialTab = 'studio' }) {
  const [selectedConnId, setSelectedConnId] = useState(initialConnectionId || (connections[0]?.id ?? null));
  const [activeTab, setActiveTab] = useState(initialTab); // 'studio' | 'templates' | 'api' | 'health'

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [accountStats, setAccountStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [copiedKey, setCopiedKey] = useState(null);
  const [apiLanguage, setApiLanguage] = useState('curl'); // 'curl' | 'node' | 'python'

  const activeConnection = connections.find(c => c.id === selectedConnId) || connections[0];

  // Fetch templates when connection changes
  useEffect(() => {
    if (selectedConnId) {
      loadTemplates(selectedConnId);
      loadStats(selectedConnId);
    }
  }, [selectedConnId]);

  const loadTemplates = async (connId) => {
    setLoadingTemplates(true);
    try {
      const res = await getWhatsAppTemplates(connId);
      if (res.success) {
        setTemplates(res.templates || []);
      } else {
        toast.error(res.error || 'Failed to load templates.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadStats = async (connId) => {
    setLoadingStats(true);
    try {
      const res = await getWhatsAppAccountStats(connId);
      if (res.success) {
        setAccountStats(res.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteWhatsAppTemplate(
        templateToDelete.id,
        templateToDelete.templateName,
        selectedConnId
      );
      if (res.success) {
        toast.success(`Template "${templateToDelete.templateName}" deleted.`);
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
        setTemplateToDelete(null);
      } else {
        toast.error(res.error || 'Failed to delete template.');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred during deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered Templates
  const filteredTemplates = templates.filter(t => {
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (templateSearch.trim()) {
      const q = templateSearch.toLowerCase();
      return t.templateName.toLowerCase().includes(q) || t.language.toLowerCase().includes(q);
    }
    return true;
  });

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://automatix.com';
  const apiKey = activeConnection?.id || 'ax_wa_live_xxxxxxxxxx';

  // API Code Snippets
  const curlSnippet = `curl -X POST "${appUrl}/api/v1/whatsapp/send" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+1234567890",
    "templateName": "${filteredTemplates[0]?.templateName || 'order_confirmation'}",
    "language": "en_US",
    "variables": {
      "1": "John Doe",
      "2": "ORD-9842"
    }
  }'`;

  const nodeSnippet = `const response = await fetch("${appUrl}/api/v1/whatsapp/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    to: "+1234567890",
    templateName: "${filteredTemplates[0]?.templateName || 'order_confirmation'}",
    language: "en_US",
    variables: {
      "1": "John Doe",
      "2": "ORD-9842"
    }
  })
});

const data = await response.json();
console.log(data);`;

  const pythonSnippet = `import requests

url = "${appUrl}/api/v1/whatsapp/send"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "to": "+1234567890",
    "templateName": "${filteredTemplates[0]?.templateName || 'order_confirmation'}",
    "language": "en_US",
    "variables": {
        "1": "John Doe",
        "2": "ORD-9842"
    }
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

  if (!connections || connections.length === 0) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/connections" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">WhatsApp Business Platform</h1>
            <p className="text-xs text-text-secondary">Direct Meta Cloud API integration</p>
          </div>
        </div>

        <div className="bg-[#111] border border-border-subtle rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Smartphone size={32} />
          </div>
          <h2 className="text-lg font-bold text-white">No Connected WhatsApp Account</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Connect your WhatsApp Business number directly in Connections to start creating verified templates and triggering automated broadcasts.
          </p>
          <Link
            href="/dashboard/connections"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)]"
          >
            <Plus size={16} />
            Go to Connections & Add WhatsApp
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Top Header & Connection Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111] border border-border-subtle p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <Link 
            href="/dashboard/connections" 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0"
          >
            <ArrowLeft size={15} />
            <span>Connections</span>
          </Link>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">{activeConnection.name}</h1>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  {activeConnection.accountEmail || 'CONNECTED'}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">Official Meta Cloud API • Zero middleman markup</p>
            </div>
          </div>
        </div>

        {/* Multi-Account Switcher & Meta BM Link */}
        <div className="flex items-center gap-2.5">
          {connections.length > 1 && (
            <div className="relative">
              <select
                value={selectedConnId}
                onChange={(e) => setSelectedConnId(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer pr-8 font-medium"
              >
                {connections.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.accountEmail})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            </div>
          )}

          <a
            href="https://business.facebook.com/billing_hub"
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3.5 py-2 rounded-xl font-medium transition-colors flex items-center gap-1.5 shrink-0"
            title="Manage direct credit card billing in Meta Business Suite"
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Meta Direct Billing</span>
            <ExternalLink size={12} className="text-text-tertiary" />
          </a>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex border-b border-border-subtle bg-[#111] rounded-xl px-3 overflow-x-auto w-full">
        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'studio'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Sparkles size={15} className={activeTab === 'studio' ? 'text-emerald-400' : 'text-text-tertiary'} />
          <span>Template Studio (Live Preview)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'templates'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Layers size={15} className={activeTab === 'templates' ? 'text-emerald-400' : 'text-text-tertiary'} />
          <span>My Approved Templates ({templates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'api'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Code size={15} className={activeTab === 'api' ? 'text-emerald-400' : 'text-text-tertiary'} />
          <span>Account Public API (cURL)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('health')}
          className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'health'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-text-secondary hover:text-white'
          }`}
        >
          <Activity size={15} className={activeTab === 'health' ? 'text-emerald-400' : 'text-text-tertiary'} />
          <span>Account Health & Quality</span>
        </button>
      </div>

      {/* TAB 1: TEMPLATE STUDIO */}
      {activeTab === 'studio' && (
        <WhatsAppTemplateStudio 
          connectionId={selectedConnId} 
          onTemplateCreated={(newTmpl) => {
            setTemplates(prev => [newTmpl, ...prev]);
            setActiveTab('templates');
          }} 
        />
      )}

      {/* TAB 2: MY TEMPLATES LIST */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-[#111] border border-border-subtle p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates by name or language..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Categories</option>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending Review</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <button
                type="button"
                onClick={() => loadTemplates(selectedConnId)}
                disabled={loadingTemplates}
                className="p-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Sync from Meta Cloud API"
              >
                <RefreshCw size={14} className={loadingTemplates ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Sync Meta</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <Plus size={14} />
                <span>New Template</span>
              </button>
            </div>
          </div>

          {/* Templates Grid / Table */}
          {loadingTemplates ? (
            <div className="p-12 text-center text-text-secondary bg-[#111] border border-border-subtle rounded-2xl flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-emerald-400" />
              <p className="text-xs">Fetching templates from Meta Cloud API...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center text-text-secondary bg-[#111] border border-border-subtle rounded-2xl space-y-3">
              <Layers size={32} className="mx-auto opacity-30 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">No Templates Found</h3>
              <p className="text-xs max-w-sm mx-auto">
                {templateSearch || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No templates match your search filters.'
                  : 'You have not created any templates for this WhatsApp number yet.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                Create Your First Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTemplates.map(tmpl => {
                const components = Array.isArray(tmpl.componentsJson) ? tmpl.componentsJson : [];
                const bodyComp = components.find(c => c.type === 'BODY') || {};
                const headerComp = components.find(c => c.type === 'HEADER');
                const buttonsComp = components.find(c => c.type === 'BUTTONS');

                return (
                  <div key={tmpl.id} className="bg-[#111] border border-border-subtle hover:border-emerald-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all group">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
                            {tmpl.templateName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-text-secondary">
                              {tmpl.category}
                            </span>
                            <span className="text-[10px] text-text-tertiary font-mono">
                              {tmpl.language}
                            </span>
                          </div>
                        </div>

                        <div>
                          {tmpl.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={11} /> Approved
                            </span>
                          )}
                          {tmpl.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <Clock size={11} /> In Review
                            </span>
                          )}
                          {tmpl.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={11} /> Rejected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Header Badge */}
                      {headerComp && (
                        <div className="text-[10px] font-semibold text-emerald-400/90 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1.5">
                          <span>Header:</span>
                          <span className="font-mono text-white">{headerComp.format || 'TEXT'}</span>
                        </div>
                      )}

                      {/* Message Preview */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-text-secondary leading-relaxed line-clamp-4 font-sans whitespace-pre-wrap">
                        {bodyComp.text || 'No message body recorded.'}
                      </div>

                      {/* Buttons Count */}
                      {buttonsComp?.buttons?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {buttonsComp.buttons.map((b, bi) => (
                            <span key={bi} className="text-[10px] font-semibold text-[#53bdeb] bg-[#53bdeb]/10 border border-[#53bdeb]/20 px-2 py-0.5 rounded-md">
                              {b.text}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Rejection notice if any */}
                      {tmpl.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300">
                          <span className="font-bold">Meta Notice:</span> {tmpl.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-text-tertiary">
                        Created {new Date(tmpl.createdAt).toLocaleDateString()}
                      </span>

                      <button
                        type="button"
                        onClick={() => setTemplateToDelete(tmpl)}
                        className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="Delete Template from Meta & Automatix"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACCOUNT PUBLIC API GATEWAY */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* API Header & Key Card */}
          <div className="bg-[#111] border border-border-subtle rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal size={18} className="text-emerald-400" />
                  Account-Level Public WhatsApp API Gateway
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Trigger your approved WhatsApp templates from Shopify, CRM, Zapier, Make, Postman, or any backend with standard cURL requests.
                </p>
              </div>

              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                Active & Live
              </span>
            </div>

            {/* API Key Box */}
            <div className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Your Account API Bearer Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKey}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(apiKey, 'api_key')}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedKey === 'api_key' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedKey === 'api_key' ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
              <p className="text-[11px] text-text-tertiary">
                Pass this key in the <code className="text-emerald-400 font-mono">Authorization: Bearer &lt;KEY&gt;</code> header.
              </p>
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="bg-[#111] border border-border-subtle rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-border-subtle bg-[#141414] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'node', label: 'Node.js (Fetch)' },
                  { id: 'python', label: 'Python (requests)' },
                ].map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setApiLanguage(l.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      apiLanguage === l.id
                        ? 'bg-emerald-500 text-black'
                        : 'text-text-secondary hover:text-white bg-white/5'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleCopy(apiLanguage === 'curl' ? curlSnippet : apiLanguage === 'node' ? nodeSnippet : pythonSnippet, 'code')}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'code' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedKey === 'code' ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>

            <div className="p-5 bg-black/60 overflow-x-auto">
              <pre className="text-xs font-mono text-emerald-300/90 leading-relaxed whitespace-pre">
                {apiLanguage === 'curl' ? curlSnippet : apiLanguage === 'node' ? nodeSnippet : pythonSnippet}
              </pre>
            </div>
          </div>

          {/* Legal Opt-in Disclaimer */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3 text-text-secondary text-xs leading-relaxed">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Compliance & Opt-in Consent Requirement: </span>
              Meta requires that all recipients have explicitly opted in to receive WhatsApp communications from your business. By triggering this API, you certify that recipient consent has been collected according to Meta’s Business Messaging Policy.
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT HEALTH & QUALITY */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Health Rating */}
            <div className="bg-[#111] border border-border-subtle rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
                Meta Quality Rating
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  accountStats?.qualityRating === 'GREEN' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                  accountStats?.qualityRating === 'YELLOW' ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                  'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                }`} />
                <span className="text-base font-bold text-white">
                  {accountStats?.qualityRating || 'GREEN'} (Healthy)
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary">Maintained by low block/report rates.</p>
            </div>

            {/* Messaging Tier */}
            <div className="bg-[#111] border border-border-subtle rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
                Daily Limit Tier
              </span>
              <div className="text-base font-bold text-white font-mono">
                {accountStats?.tier === 'TIER_1K' ? '1,000 conversations / 24h' :
                 accountStats?.tier === 'TIER_10K' ? '10,000 conversations / 24h' :
                 accountStats?.tier === 'TIER_100K' ? '100,000 conversations / 24h' :
                 accountStats?.tier || '1,000 conversations / 24h'}
              </div>
              <p className="text-[11px] text-text-tertiary">Scales automatically with usage.</p>
            </div>

            {/* 30-Day Volume */}
            <div className="bg-[#111] border border-border-subtle rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
                30-Day Messages Sent
              </span>
              <div className="text-base font-bold text-white font-mono">
                {accountStats?.totalSent || 0}
              </div>
              <p className="text-[11px] text-text-tertiary">
                {accountStats?.delivered || 0} delivered ({accountStats?.deliveryRate || 100}%)
              </p>
            </div>

            {/* Direct Billing */}
            <div className="bg-[#111] border border-border-subtle rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">
                Billing Model
              </span>
              <div className="text-base font-bold text-emerald-400">
                Direct Meta Card
              </div>
              <p className="text-[11px] text-text-tertiary">Wholesale rates billed by Meta.</p>
            </div>
          </div>

          {/* Meta Direct Link Box */}
          <div className="bg-[#111] border border-border-subtle rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                Manage Meta Credit Cards & Conversation Invoices
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                View detailed conversation cost breakdowns, download official Meta tax invoices, and update your billing card directly inside Meta Business Suite.
              </p>
            </div>

            <a
              href="https://business.facebook.com/billing_hub"
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0"
            >
              <span>Open Meta Billing Hub</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <ConfirmModal
          isOpen={!!templateToDelete}
          title={`Delete Template "${templateToDelete.templateName}"?`}
          message="This will delete the template permanently from Meta Cloud API and your Automatix workspace. Workflows using this template will fail until updated."
          confirmText={isDeleting ? 'Deleting...' : 'Delete Template'}
          confirmButtonClass="bg-red-600 hover:bg-red-500"
          onConfirm={handleDeleteTemplate}
          onCancel={() => setTemplateToDelete(null)}
        />
      )}
    </div>
  );
}
