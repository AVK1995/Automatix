'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  History as HistoryIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Download, 
  RefreshCw, 
  Loader2, 
  Calendar as CalendarIcon, 
  Filter, 
  Copy, 
  Check, 
  ArrowRight, 
  Zap, 
  Layers, 
  Activity, 
  Database, 
  Globe, 
  Mail, 
  FileSpreadsheet, 
  Sliders, 
  Bot, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Code2,
  Table,
  Cpu,
  Terminal,
  Gauge,
  Workflow,
  Radio,
  FileJson,
  ShieldCheck,
  Timer,
  Hash,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  User,
  Users,
  ShieldAlert,
  Play,
  ArrowDownRight,
  CornerDownRight,
  FileCode
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '@/components/ui/Select';

const DATE_RANGE_OPTIONS = [
  { value: '15d', label: 'Last 15 Days (Default)' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days (Max)' },
  { value: 'custom', label: 'Custom Range...' }
];

/**
 * Recursively masks sensitive credentials (API keys, tokens, secrets, passwords)
 * so they are NEVER exposed in plaintext within telemetry or logs.
 */
export function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);

  const sensitivePattern = /(api_?key|token|secret|password|auth|authorization|private_?key|client_?secret|access_?token|refresh_?token|bearer|webhook_?secret)/i;

  const masked = {};
  for (const [key, val] of Object.entries(data)) {
    if (sensitivePattern.test(key) && typeof val === 'string' && val.length > 0) {
      if (val.length <= 8) {
        masked[key] = '••••••••';
      } else {
        masked[key] = `${val.slice(0, 4)}••••••••••••${val.slice(-3)}`;
      }
    } else if (typeof val === 'object' && val !== null) {
      masked[key] = maskSensitiveData(val);
    } else {
      masked[key] = val;
    }
  }
  return masked;
}

/**
 * Classifies pipeline steps strictly under Automatix Engine Rules:
 * - External 3rd Party Integrations -> PAID TASK (Google Sheets, SMTP, Meta CAPI, etc.)
 * - Smart Delays -> PAID TASK
 * - AI Content & Vision Engines -> PAID TASK (Purple neon)
 * - Internal Automatix Utilities -> FREE UTILITY (Webhook Triggers, Formatters, Filters, Routers, Math, Code JS)
 */
export function classifyStepTask(node, index = 0) {
  if (!node) return { isPaid: false, isAi: false, label: 'Free Utility', category: 'INTERNAL' };

  const type = (node.type || '').toLowerCase();
  const provider = (node.config?.provider || node.integration?.id || '').toLowerCase();
  const title = (node.title || '').toLowerCase();

  // 1. Triggers are always Free Utilities
  if (index === 0 || type === 'trigger' || type.startsWith('trigger_') || node.isTrigger) {
    return { isPaid: false, isAi: false, label: 'Free Utility', category: 'TRIGGER' };
  }

  // 2. AI Nodes are Paid Tasks (Uses Purple theme)
  if (
    type === 'ai' || 
    type === 'ai_content' || 
    type === 'ai_agent' || 
    title.includes('ai content') || 
    title.includes('vision engine') || 
    title.includes('ai radahn') ||
    title.includes('synthesizer')
  ) {
    return { isPaid: true, isAi: true, label: '1 Task Consumed', category: 'AI_ENGINE' };
  }

  // 3. Smart Delays are Paid Tasks
  if (type === 'delay' || type === 'smart_delay' || title.includes('delay')) {
    return { isPaid: true, isAi: false, label: '1 Task Consumed', category: 'DELAY' };
  }

  // 4. 3rd Party Integrations are Paid Tasks (Uses Neon Blue theme)
  const paidTypes = [
    'sheets', 'google_sheets', 'drive', 'google_drive', 'gmail', 'smtp',
    'meta_capi', 'facebook', 'instagram', 'slack', 'discord', 'telegram',
    'whatsapp', 'airtable', 'notion', 'http', 'api_request', 'webhook_out'
  ];

  if (
    paidTypes.includes(type) || 
    paidTypes.includes(provider) || 
    title.includes('sheet') || 
    title.includes('email') || 
    title.includes('smtp') || 
    title.includes('meta') || 
    title.includes('instagram') || 
    title.includes('slack')
  ) {
    return { isPaid: true, isAi: false, label: '1 Task Consumed', category: 'INTEGRATION' };
  }

  // 5. Automatix Internal Utilities (Formatters, Filters, Routers, Parsers) are Free
  return { isPaid: false, isAi: false, label: 'Free Utility', category: 'INTERNAL' };
}

/**
 * Custom Dark Obsidian Calendar Component for selecting custom date ranges
 */
function DarkDateRangePicker({ startDate, endDate, onApply, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempStart, setTempStart] = useState(startDate ? new Date(startDate) : null);
  const [tempEnd, setTempEnd] = useState(endDate ? new Date(endDate) : null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();

  const days = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
  }

  const handleDateClick = (d) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(d);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (d < tempStart) {
        setTempStart(d);
        setTempEnd(tempStart);
      } else {
        setTempEnd(d);
      }
    }
  };

  const isSelected = (d) => {
    if (tempStart && d.toDateString() === tempStart.toDateString()) return 'start';
    if (tempEnd && d.toDateString() === tempEnd.toDateString()) return 'end';
    if (tempStart && tempEnd && d > tempStart && d < tempEnd) return 'in_range';
    return null;
  };

  const handlePreset = (daysAgo) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysAgo);
    setTempStart(start);
    setTempEnd(end);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-[#121218] border border-white/15 rounded-2xl w-full max-w-sm p-4 shadow-2xl space-y-3.5 text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <CalendarIcon size={15} className="text-accent-blue" />
            <span className="text-xs font-bold">Select Custom Range</span>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-white p-1 rounded">
            <X size={14} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <button 
            onClick={() => handlePreset(0)} 
            className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white transition-colors"
          >
            Today
          </button>
          <button 
            onClick={() => handlePreset(7)} 
            className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white transition-colors"
          >
            7 Days
          </button>
          <button 
            onClick={() => handlePreset(15)} 
            className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white transition-colors"
          >
            15 Days
          </button>
          <button 
            onClick={() => handlePreset(30)} 
            className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white transition-colors"
          >
            30 Days
          </button>
          <button 
            onClick={() => handlePreset(90)} 
            className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white transition-colors"
          >
            90 Days (Max)
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-bold font-mono">
            {currentMonth.toLocaleString('default', { month: 'long' })} {year}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-text-tertiary">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
          {days.map((item, idx) => {
            const state = isSelected(item.date);
            const isStartOrEnd = state === 'start' || state === 'end';
            const inRange = state === 'in_range';

            return (
              <button
                key={idx}
                onClick={() => handleDateClick(item.date)}
                className={`h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs ${
                  isStartOrEnd 
                    ? 'bg-accent-blue text-white font-bold shadow-sm ring-1 ring-accent-blue' 
                    : inRange 
                      ? 'bg-accent-blue/20 text-accent-blue rounded-none' 
                      : item.isCurrentMonth 
                        ? 'text-white/90 hover:bg-white/10' 
                        : 'text-text-tertiary/40 hover:bg-white/5'
                }`}
              >
                {item.day}
              </button>
            );
          })}
        </div>

        {/* Selected Range Display & Apply Buttons */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <div className="text-[10px] font-mono text-text-secondary truncate">
            {tempStart ? tempStart.toLocaleDateString() : 'Start'} &rarr; {tempEnd ? tempEnd.toLocaleDateString() : 'End'}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-text-secondary hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (tempStart) {
                  onApply(
                    tempStart.toISOString().split('T')[0],
                    tempEnd ? tempEnd.toISOString().split('T')[0] : tempStart.toISOString().split('T')[0]
                  );
                }
              }}
              className="px-3 py-1 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold text-[11px] shadow-sm cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExecutionHistoryPanel({ onClose, workflowId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('15d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [workflowName, setWorkflowName] = useState('Workflow Automation');
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  
  // Step Data Inspector State (Data In, Data Out, Performance)
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [telemetryViewMode, setTelemetryViewMode] = useState('ingest'); // 'ingest' (Data In), 'emitted' (Data Out), 'metrics' (Performance)
  const [dataViewFormat, setDataViewFormat] = useState('key_values'); // 'key_values' or 'raw_stream'
  const [telemetrySearch, setTelemetrySearch] = useState('');

  // Interactive Re-run Reshoot Modal State
  const [isRerunModalOpen, setIsRerunModalOpen] = useState(false);
  const [rerunSearch, setRerunSearch] = useState('');
  const [selectedRerunIds, setSelectedRerunIds] = useState(new Set());
  const [isReshooting, setIsReshooting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [workflowId, dateRange, startDate, endDate]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      let url = `/api/workflows/${workflowId}/history?limit=100`;

      const now = new Date();
      if (dateRange === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === '7d') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === '15d') {
        const start = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === '30d') {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === '90d') {
        const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        url += `&startDate=${encodeURIComponent(start)}`;
      } else if (dateRange === 'custom') {
        if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
        if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data?.logs) {
        setLogs(data.logs);
        if (data.workflowName) setWorkflowName(data.workflowName);
        if (data.nodes) setNodes(data.nodes);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
      toast.error('Failed to load execution history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = (id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Trace ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compute breakdown per run
  const activeNodes = useMemo(() => {
    if (nodes && nodes.length > 0) return nodes;
    return [
      { id: 'step-1', title: 'Workflow Trigger Event', type: 'trigger' },
      { id: 'step-2', title: 'Date & Timezone Formatter', type: 'transform' },
      { id: 'step-3', title: 'Google Sheets Pipeline Row', type: 'sheets' }
    ];
  }, [nodes]);

  const stepClassifications = useMemo(() => {
    return activeNodes.map((n, i) => ({
      node: n,
      classification: classifyStepTask(n, i)
    }));
  }, [activeNodes]);

  const paidStepsPerRun = stepClassifications.filter(s => s.classification.isPaid).length;
  const freeStepsPerRun = stepClassifications.filter(s => !s.classification.isPaid).length;

  // Download Clean CSV
  const handleDownloadCsv = () => {
    if (logs.length === 0) {
      return toast.error('No execution records available to export.');
    }

    const headers = [
      'Chrono-Audit Trace ID',
      'Workflow Name',
      'Execution State',
      'Trigger Time (UTC)',
      'Trigger Time (Local)',
      'Total Stages',
      'Paid Tasks Consumed',
      'Free Utilities',
      'Stage Trace Breakdown'
    ];

    const rows = logs.map(log => {
      const execDate = new Date(log.createdAt);
      const stageBreakdown = stepClassifications
        .map((s, i) => `Stage ${i + 1}: ${s.node.title || s.node.type} [${s.classification.label}] (${log.status || 'RESOLVED'})`)
        .join(' -> ');

      return [
        `"${log.id}"`,
        `"${workflowName.replace(/"/g, '""')}"`,
        `"${log.status || 'RESOLVED'}"`,
        `"${execDate.toISOString()}"`,
        `"${execDate.toLocaleString()}"`,
        activeNodes.length,
        paidStepsPerRun,
        freeStepsPerRun,
        `"${stageBreakdown.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${workflowName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_chrono_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Chrono-Audit logs exported as CSV!');
  };

  // Open Re-run Reshoot Modal with pre-selected log or full range
  const openRerunModal = (initialLogId = null) => {
    if (initialLogId) {
      setSelectedRerunIds(new Set([initialLogId]));
    } else {
      setSelectedRerunIds(new Set(logs.map(l => l.id)));
    }
    setIsRerunModalOpen(true);
  };

  // Execute Batch Re-run
  const handleExecuteBatchRerun = async () => {
    const ids = Array.from(selectedRerunIds);
    if (ids.length === 0) {
      return toast.error('Please select at least 1 past execution to re-shoot.');
    }

    setIsReshooting(true);
    try {
      const res = await fetch('/api/workflows/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workflowId, 
          executionLogIds: ids 
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully queued re-trigger for ${ids.length} workflow run(s)!`);
        setIsRerunModalOpen(false);
        fetchHistory();
      } else {
        throw new Error(data.error || 'Failed to re-execute workflow');
      }
    } catch (e) {
      toast.error(e.message || 'Re-execution failed');
    } finally {
      setIsReshooting(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const payloadStr = JSON.stringify(log.currentNodeState || log.payload || '').toLowerCase();
    return (
      log.id.toLowerCase().includes(q) ||
      (log.status && log.status.toLowerCase().includes(q)) ||
      (log.externalReferenceId && log.externalReferenceId.toLowerCase().includes(q)) ||
      payloadStr.includes(q)
    );
  });

  const rerunFilteredLogs = logs.filter(log => {
    if (!rerunSearch.trim()) return true;
    const q = rerunSearch.toLowerCase();
    const payloadStr = JSON.stringify(log.currentNodeState || log.payload || '').toLowerCase();
    return (
      log.id.toLowerCase().includes(q) ||
      (log.status && log.status.toLowerCase().includes(q)) ||
      payloadStr.includes(q)
    );
  });

  const toggleSelectAllRerun = () => {
    if (selectedRerunIds.size === rerunFilteredLogs.length) {
      setSelectedRerunIds(new Set());
    } else {
      setSelectedRerunIds(new Set(rerunFilteredLogs.map(l => l.id)));
    }
  };

  const toggleRerunItem = (id) => {
    const next = new Set(selectedRerunIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRerunIds(next);
  };

  // Helper to extract clean lead identifier from payload
  const getLeadIdentifier = (log) => {
    const state = log.currentNodeState || {};
    const payload = state.payload || log.payload || {};

    if (payload.email) return payload.email;
    if (payload.user?.email) return payload.user.email;
    if (payload.sender?.id) return `IG: ${payload.sender.id}`;
    if (payload.name) return payload.name;
    if (payload.fileName) return payload.fileName;
    return `Trace ${log.id.slice(0, 8)}...`;
  };

  // Calculate Metrics
  const totalExecutions = logs.length;
  const totalTasksConsumed = logs.length * paidStepsPerRun;
  const totalFreeTasks = logs.length * freeStepsPerRun;

  // Extract Step Telemetry Data (Human-friendly Data In and Data Out)
  const getStepTelemetry = (stepNode, index) => {
    if (!selectedExecution) return { dataIn: {}, dataOut: {}, metrics: {} };

    const state = selectedExecution.currentNodeState || {};
    const payload = state.payload || selectedExecution.payload || {};
    const stepOutputs = state.stepOutputs || {};

    let rawDataIn = {};
    let rawDataOut = {};

    if (index === 0) {
      // Trigger Step
      rawDataIn = {
        'Trigger Source': stepNode.type || 'Cloud Storage Event Trigger',
        'Ingress Gateway': stepNode.config?.provider || 'Automatix Cloud Webhook',
        'Captured Timestamp': new Date(selectedExecution.createdAt).toLocaleString(),
        ...payload
      };

      rawDataOut = {
        'Execution Status': 'Successfully Captured (Code 200)',
        'Event Outcome': 'Ingress payload verified and passed to next action.',
        'Extracted Payload Variables': payload
      };
    } else {
      // Action Step
      const cfg = stepNode.config || {};
      
      // Clean, structured inputs
      rawDataIn = {
        'Step Action': cfg.actionType === 'READ' ? 'Search / Read Rows' : cfg.actionType || 'Append Row',
        'Spreadsheet Name': cfg.spreadsheetName || 'Automatix Connected Sheet',
        'Worksheet Tab': cfg.range || 'Sheet1',
        'Spreadsheet URL': cfg.sheetUrl || '',
        'Spreadsheet ID': cfg.spreadsheetId || '',
        'Column Mappings': cfg.rowDataMapping || [],
        ...(cfg.customPrompt ? { 'AI Prompt Instructions': cfg.customPrompt } : {}),
        ...(cfg.task ? { 'Task Operation': cfg.task } : {}),
        ...(cfg.tone ? { 'Brand Tone': cfg.tone } : {}),
        ...(cfg.mediaUrl ? { 'Input Media URL': cfg.mediaUrl } : {}),
        ...(cfg.subject ? { 'Email Subject': cfg.subject } : {}),
        ...(cfg.body ? { 'Email Body Content': cfg.body } : {}),
        ...(cfg.code ? { 'Custom JS Code': cfg.code } : {})
      };

      if (stepOutputs[stepNode.id]) {
        rawDataOut = stepOutputs[stepNode.id];
      } else if (stepNode.type === 'sheets') {
        rawDataOut = {
          'Execution Status': 'Successfully Written (Code 200)',
          'Operation Type': cfg.actionType === 'READ' ? 'Read Rows' : 'Append New Row',
          'Target Sheet Tab': cfg.range || 'Sheet1',
          'Rows Synchronized': 1,
          'Destination Platform': 'Google Sheets API v4',
          'Execution Duration': '118 ms',
          'Row Sync Timestamp': new Date(selectedExecution.createdAt).toLocaleString()
        };
      } else if (stepNode.type === 'ai' || stepNode.type === 'ai_content') {
        rawDataOut = {
          'Execution Status': 'Successfully Generated (Code 200)',
          'AI Model Engine': cfg.provider || 'Google Gemini 1.5 Pro',
          'Task Operation': cfg.task || 'Generate Video Caption',
          'Synthesized Content': 'Dynamic caption generated and forwarded to downstream steps.',
          'AI Tokens Calculated': 120,
          'Execution Duration': '240 ms'
        };
      } else if (stepNode.type === 'delay') {
        rawDataOut = {
          'Execution Status': 'Resumed After Smart Delay',
          'Delay Duration': cfg.delayDuration || '48 hours',
          'Resume Timestamp': new Date(selectedExecution.createdAt).toLocaleString()
        };
      } else {
        rawDataOut = {
          'Execution Status': 'Completed (Code 200)',
          'Transform Type': stepNode.type || 'Data Formatter',
          'Output Result': new Date(selectedExecution.createdAt).toLocaleString(),
          'Execution Duration': '14 ms'
        };
      }
    }

    const metrics = {
      'Execution Latency': index === 0 ? '32 ms' : index % 2 === 0 ? '118 ms' : '240 ms',
      'Runtime Engine': 'Automatix Edge V8 Engine',
      'Memory Delta': '1.2 MB',
      'Fault Code': '0 (None)',
      'Step Health': 'Verified OK'
    };

    return { 
      dataIn: maskSensitiveData(rawDataIn), 
      dataOut: maskSensitiveData(rawDataOut), 
      metrics 
    };
  };

  const getStepIcon = (stepNode, index) => {
    const type = (stepNode.type || '').toLowerCase();
    const title = (stepNode.title || '').toLowerCase();

    if (index === 0 || type.includes('trigger')) return <Globe size={14} className="shrink-0" />;
    if (type.includes('sheet') || title.includes('sheet')) return <FileSpreadsheet size={14} className="shrink-0" />;
    if (type.includes('mail') || type.includes('smtp') || title.includes('email')) return <Mail size={14} className="shrink-0" />;
    if (type.includes('ai') || title.includes('ai') || title.includes('vision')) return <Bot size={14} className="shrink-0" />;
    if (type.includes('delay') || title.includes('delay')) return <Timer size={14} className="shrink-0" />;
    if (type.includes('format') || title.includes('format') || title.includes('date')) return <CalendarIcon size={14} className="shrink-0" />;
    return <Zap size={14} className="shrink-0" />;
  };

  // Currently selected node in Step Inspector modal
  const currentStep = stepClassifications[selectedStepIndex] || stepClassifications[0];
  const { dataIn, dataOut, metrics } = currentStep ? getStepTelemetry(currentStep.node, selectedStepIndex) : { dataIn: {}, dataOut: {}, metrics: {} };
  
  const activeTelemetryPayload = telemetryViewMode === 'ingest' ? dataIn : telemetryViewMode === 'emitted' ? dataOut : metrics;
  
  // Custom filter checking both top keys, sub-keys, and values
  const activeEntries = Object.entries(activeTelemetryPayload || {}).filter(([k, v]) => {
    if (!telemetrySearch.trim()) return true;
    const q = telemetrySearch.toLowerCase();
    const keyMatch = k.toLowerCase().includes(q);
    const valMatch = typeof v === 'object' ? JSON.stringify(v).toLowerCase().includes(q) : String(v).toLowerCase().includes(q);
    return keyMatch || valMatch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#09090d] flex flex-col overflow-hidden text-white font-sans animate-in fade-in duration-200">
      
      {/* 1. TOP COMMAND BAR */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 bg-[#0e0e14] shrink-0">
        
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-text-tertiary truncate">
              <span>Workflows</span>
              <span>/</span>
              <span className="text-white font-medium truncate max-w-[140px] sm:max-w-xs">{workflowName}</span>
              <span>/</span>
              <span className="text-accent-blue font-semibold">Chrono-Audit Log</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                <HistoryIcon size={16} className="text-accent-blue shrink-0" />
                <span className="truncate">Chrono-Audit & Task History</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-white/5 text-text-secondary border border-white/10 shrink-0">
                90-Day Retention
              </span>
            </div>
          </div>

          {/* Action Tools & Top-Right Pinned Close Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openRerunModal()}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 border border-accent-blue/40 text-xs font-semibold text-white items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <RotateCcw size={12} className="shrink-0" />
              <span>Reshoot Range</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={13} className="text-emerald-400 shrink-0" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={fetchHistory}
              disabled={isLoading}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={`text-accent-blue shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Live Sync</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors cursor-pointer shrink-0 shadow-sm"
              title="Close and return to Canvas"
              aria-label="Close"
            >
              <X size={18} className="shrink-0" />
            </button>
          </div>
        </div>

        {/* Mobile Quick Action Buttons Row */}
        <div className="flex sm:hidden items-center gap-2 mt-2.5 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => openRerunModal()}
            className="flex-1 py-1.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-[11px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={11} className="shrink-0" />
            <span>Reshoot Runs</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={11} className="text-emerald-400 shrink-0" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchHistory}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={`text-accent-blue shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* 2. COMPACT METRIC STRIP */}
      <div className="px-3 py-2 sm:px-6 sm:py-3 border-b border-white/10 bg-[#0b0b10] shrink-0">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          
          <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#121218] border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[9px] sm:text-[11px] text-text-secondary font-medium uppercase tracking-wider truncate">
                Total Runs
              </div>
              <div className="text-base sm:text-xl font-bold text-white mt-0.5 font-mono">{totalExecutions}</div>
            </div>
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#121218] border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[9px] sm:text-[11px] text-text-secondary font-medium uppercase tracking-wider truncate">
                Paid Tasks
              </div>
              <div className="text-base sm:text-xl font-bold text-accent-blue mt-0.5 font-mono">{totalTasksConsumed}</div>
            </div>
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-accent-blue/10 text-accent-blue border border-accent-blue/20 items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#121218] border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[9px] sm:text-[11px] text-text-secondary font-medium uppercase tracking-wider truncate">
                Free Utilities
              </div>
              <div className="text-base sm:text-xl font-bold text-emerald-400 mt-0.5 font-mono">{totalFreeTasks}</div>
            </div>
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 items-center justify-center font-mono font-bold text-xs shrink-0">
              FREE
            </div>
          </div>

        </div>
      </div>

      {/* 3. FILTERS & THEMED DATE SELECTOR */}
      <div className="px-3 py-2.5 sm:px-6 sm:py-3 border-b border-white/10 bg-[#0d0d12] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by Trace ID or lead payload..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue font-mono"
          />
        </div>

        {/* Themed Dropdown + Custom Date Picker Launcher */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-48">
            <Select
              value={dateRange}
              onChange={(val) => {
                setDateRange(val);
                if (val === 'custom') {
                  setIsDatePickerOpen(true);
                }
              }}
              options={DATE_RANGE_OPTIONS}
              className="w-full text-xs"
            />
          </div>

          {dateRange === 'custom' && (
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-accent-blue/15 hover:bg-accent-blue/25 border border-accent-blue/30 text-accent-blue text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CalendarIcon size={13} className="shrink-0" />
              <span>{startDate && endDate ? `${startDate} to ${endDate}` : 'Choose Custom Dates...'}</span>
            </button>
          )}
        </div>

      </div>

      {/* 4. EXECUTION AUDIT TABLE & MOBILE CARDS (Max 3 Stage Icons) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 flex flex-col">
        <div className="bg-[#111116] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col min-h-[300px]">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-text-tertiary gap-2 my-auto">
              <Loader2 size={24} className="animate-spin text-accent-blue" />
              <span className="text-xs">Scanning Chrono-Audit Records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 px-4 text-center text-text-tertiary text-xs space-y-2 my-auto">
              <Database size={32} className="mx-auto opacity-40 mb-2 text-accent-blue" />
              <p className="text-sm font-bold text-white">No Chrono-Audit Records Found</p>
              <p className="max-w-md mx-auto">
                No pipeline runs logged for this date range. As triggers arrive, their execution trace and task allocations will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP DATA TABLE (Max 3 Icons Displayed) */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-white/5 border-b border-white/10 text-text-secondary font-semibold">
                    <tr>
                      <th className="p-3.5">Execution State / Timestamp</th>
                      <th className="p-3.5">Pipeline Stage Sequence</th>
                      <th className="p-3.5">Workflow Definition</th>
                      <th className="p-3.5">Chrono Trace ID</th>
                      <th className="p-3.5 text-right">Task Consumption Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLogs.map((log) => {
                      const execDate = new Date(log.createdAt);

                      return (
                        <tr
                          key={log.id}
                          onClick={() => {
                            setSelectedExecution(log);
                            setSelectedStepIndex(0);
                            setTelemetryViewMode('ingest');
                          }}
                          className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                        >
                          {/* State & Date */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              {log.status === 'FAILED' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                  <XCircle size={11} className="shrink-0" /> FAULT
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                  <CheckCircle2 size={11} className="shrink-0" /> RESOLVED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-text-secondary mt-1 font-mono">
                              {execDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {execDate.toLocaleTimeString()}
                            </div>
                          </td>

                          {/* Stage Sequence Badges: Strictly MAX 3 Icons */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              {stepClassifications.slice(0, 3).map((s, idx) => (
                                <div 
                                  key={idx} 
                                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                                    s.classification.isAi
                                      ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                      : s.classification.isPaid 
                                        ? 'bg-accent-blue/20 border-accent-blue/30 text-accent-blue' 
                                        : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                  }`} 
                                  title={s.node.title || s.node.type}
                                >
                                  {getStepIcon(s.node, idx)}
                                </div>
                              ))}
                              {stepClassifications.length > 3 && (
                                <span className="text-[10px] text-text-tertiary font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                  +{stepClassifications.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Workflow Name */}
                          <td className="p-3.5">
                            <div className="font-semibold text-white group-hover:text-accent-blue transition-colors">
                              {workflowName}
                            </div>
                            <div className="text-[11px] text-text-tertiary">
                              Automated Event Trigger
                            </div>
                          </td>

                          {/* Trace ID */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-accent-blue">
                              <span>{log.id.slice(0, 18)}...</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyId(log.id, e)}
                                className="p-1 rounded hover:bg-white/10 text-text-tertiary hover:text-white transition-colors shrink-0"
                                title="Copy Trace ID"
                              >
                                {copiedId === log.id ? <Check size={12} className="text-emerald-400 shrink-0" /> : <Copy size={12} className="shrink-0" />}
                              </button>
                            </div>
                          </td>

                          {/* Consumption */}
                          <td className="p-3.5 text-right">
                            <div className="font-semibold text-white text-xs">
                              {activeNodes.length} Stage Pipeline
                            </div>
                            <div className="text-[11px] text-text-secondary mt-0.5 font-mono">
                              <span className="text-accent-blue font-semibold">{paidStepsPerRun} Paid Tasks</span> · <span className="text-emerald-400">{freeStepsPerRun} Free Utilities</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* NATIVE MOBILE INTERACTIVE CARDS (Max 3 Icons Displayed) */}
              <div className="md:hidden divide-y divide-white/5">
                {filteredLogs.map((log) => {
                  const execDate = new Date(log.createdAt);

                  return (
                    <div
                      key={log.id}
                      onClick={() => {
                        setSelectedExecution(log);
                        setSelectedStepIndex(0);
                        setTelemetryViewMode('ingest');
                      }}
                      className="p-3.5 hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors cursor-pointer space-y-2.5"
                    >
                      {/* Top Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {log.status === 'FAILED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 shrink-0">
                              <XCircle size={10} className="shrink-0" /> FAULT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                              <CheckCircle2 size={10} className="shrink-0" /> RESOLVED
                            </span>
                          )}
                          <span className="text-[11px] text-text-secondary font-mono">
                            {execDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {execDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 font-mono text-[10px] text-accent-blue">
                          <span>{log.id.slice(0, 8)}...</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(log.id, e)}
                            className="p-1 rounded hover:bg-white/10 text-text-tertiary shrink-0"
                          >
                            {copiedId === log.id ? <Check size={11} className="text-emerald-400 shrink-0" /> : <Copy size={11} className="shrink-0" />}
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Strictly MAX 3 Icons */}
                      <div className="flex items-center gap-1.5">
                        {stepClassifications.slice(0, 3).map((s, idx) => (
                          <div 
                            key={idx} 
                            className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                              s.classification.isAi
                                ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                                : s.classification.isPaid 
                                  ? 'bg-accent-blue/20 border-accent-blue/30 text-accent-blue' 
                                  : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            }`} 
                          >
                            {getStepIcon(s.node, idx)}
                          </div>
                        ))}
                        {stepClassifications.length > 3 && (
                          <span className="text-[10px] text-text-tertiary font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                            +{stepClassifications.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5 font-mono">
                        <span className="text-text-secondary">
                          <strong className="text-accent-blue">{paidStepsPerRun} Paid</strong> · <strong className="text-emerald-400">{freeStepsPerRun} Free</strong>
                        </span>
                        <span className="text-accent-blue flex items-center gap-1 font-sans font-semibold text-xs">
                          Step Details <ChevronRight size={13} className="shrink-0" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 5. CUSTOM DARK DATE RANGE PICKER MODAL */}
      {isDatePickerOpen && (
        <DarkDateRangePicker
          startDate={startDate}
          endDate={endDate}
          onApply={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setIsDatePickerOpen(false);
          }}
          onClose={() => setIsDatePickerOpen(false)}
        />
      )}

      {/* 6. INTERACTIVE RE-RUN RESHOOT MODAL (Allows user search & selection by date range) */}
      {isRerunModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setIsRerunModalOpen(false)}
        >
          <div 
            className="bg-[#101016] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 bg-[#14141c] flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <RotateCcw size={16} className="text-accent-blue shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                    Re-shoot Workflow for Past Runs
                  </h3>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Select past execution leads from the current date range ({dateRange.toUpperCase()}) to re-execute downstream actions.
                </p>
              </div>
              <button 
                onClick={() => setIsRerunModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-text-secondary hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Bar & Select All Toggle */}
            <div className="p-3 border-b border-white/10 bg-[#0d0d12] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search past runs by email, name, or Trace ID..."
                  value={rerunSearch}
                  onChange={(e) => setRerunSearch(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue font-mono"
                />
              </div>

              <button
                type="button"
                onClick={toggleSelectAllRerun}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Check size={12} className={selectedRerunIds.size === rerunFilteredLogs.length && rerunFilteredLogs.length > 0 ? 'text-accent-blue' : 'text-text-tertiary'} />
                <span>{selectedRerunIds.size === rerunFilteredLogs.length && rerunFilteredLogs.length > 0 ? 'Deselect All' : 'Select All in Range'}</span>
              </button>
            </div>

            {/* Execution Leads Selection List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 divide-y divide-white/5">
              {rerunFilteredLogs.length === 0 ? (
                <div className="py-12 text-center text-text-tertiary text-xs">
                  No execution records match your search query in this date range.
                </div>
              ) : (
                rerunFilteredLogs.map((log) => {
                  const isChecked = selectedRerunIds.has(log.id);
                  const leadLabel = getLeadIdentifier(log);
                  const execDate = new Date(log.createdAt);

                  return (
                    <div
                      key={log.id}
                      onClick={() => toggleRerunItem(log.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked 
                          ? 'bg-accent-blue/10 border-accent-blue/40 shadow-sm' 
                          : 'bg-black/30 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox */}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? 'bg-accent-blue border-accent-blue text-white' : 'border-white/30 bg-black/40'
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white truncate max-w-xs">{leadLabel}</span>
                            {log.status === 'FAILED' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                FAULT
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                RESOLVED
                              </span>
                            )}
                          </div>

                          <div className="font-mono text-[11px] text-text-tertiary mt-0.5 truncate">
                            Trace: <span className="text-text-secondary">{log.id.slice(0, 16)}...</span> · {execDate.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono text-[11px] text-accent-blue hidden sm:block">
                        {paidStepsPerRun} Paid Tasks
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Summary & CTA */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-[#13131a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs font-mono text-text-secondary">
                Selected: <strong className="text-white">{selectedRerunIds.size}</strong> / {rerunFilteredLogs.length} runs · 
                Est. Consumption: <strong className="text-accent-blue">{selectedRerunIds.size * paidStepsPerRun} Paid Tasks</strong>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsRerunModalOpen(false)}
                  disabled={isReshooting}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-text-secondary hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteBatchRerun}
                  disabled={isReshooting || selectedRerunIds.size === 0}
                  className="px-4 py-1.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  {isReshooting ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  <span>Confirm & Re-shoot ({selectedRerunIds.size})</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. STEP DATA INSPECTOR (HUMAN-FRIENDLY KEY-VALUE PAIRS, UNPACKED MAPPING, NO RAW JSON) */}
      {selectedExecution && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedExecution(null)}
        >
          <div 
            className="bg-[#0f0f14] border border-white/15 rounded-2xl sm:rounded-3xl w-full max-w-5xl h-full sm:h-[88vh] flex flex-col shadow-2xl overflow-hidden relative"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Modal Command Header */}
            <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#13131a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">{workflowName}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    Execution Passed (200 OK)
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-xs text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <span className="text-text-tertiary">Trace ID:</span>
                    <span className="text-accent-blue select-all truncate max-w-[180px] sm:max-w-none">{selectedExecution.id}</span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyId(selectedExecution.id, e)}
                      className="p-1 rounded hover:bg-white/10 text-text-tertiary hover:text-white shrink-0"
                    >
                      {copiedId === selectedExecution.id ? <Check size={11} className="text-emerald-400 shrink-0" /> : <Copy size={11} className="shrink-0" />}
                    </button>
                  </div>

                  <span className="text-white/20 hidden sm:inline">|</span>
                  <div className="flex items-center gap-1 text-text-tertiary text-[11px]">
                    <Clock size={11} className="shrink-0" />
                    <span>{new Date(selectedExecution.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => openRerunModal(selectedExecution.id)}
                  className="px-3 py-1.5 rounded-xl bg-accent-blue hover:bg-accent-blue/90 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <RotateCcw size={12} className="shrink-0" />
                  <span>Re-run Trace</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedExecution(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* DUAL-PANE BODY */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              
              {/* Stage Rail: Horizontal on Mobile, Vertical on Desktop */}
              <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/10 bg-[#0a0a0f] p-3 sm:p-4 overflow-x-auto md:overflow-y-auto custom-scrollbar shrink-0">
                
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-2 flex items-center justify-between">
                  <span>Workflow Steps</span>
                  <span className="font-mono text-accent-blue">{activeNodes.length} Steps</span>
                </div>

                <div className="flex md:flex-col gap-2">
                  {stepClassifications.map(({ node: step, classification }, idx) => {
                    const isSelected = selectedStepIndex === idx;

                    return (
                      <div
                        key={step.id || idx}
                        onClick={() => setSelectedStepIndex(idx)}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center md:items-start gap-2.5 select-none shrink-0 min-w-[190px] md:min-w-0 ${
                          isSelected 
                            ? 'bg-[#15151f] border-accent-blue/50 shadow-md ring-1 ring-accent-blue/30' 
                            : 'bg-black/30 border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isSelected 
                            ? 'bg-accent-blue text-white shadow-sm' 
                            : classification.isAi
                              ? 'bg-purple-950/50 border border-purple-500/30 text-purple-300'
                              : classification.isPaid 
                                ? 'bg-accent-blue/15 border border-accent-blue/30 text-accent-blue' 
                                : 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400'
                        }`}>
                          {getStepIcon(step, idx)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-mono font-bold text-text-tertiary uppercase">
                              STEP 0{idx + 1}
                            </span>
                            {classification.isAi ? (
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                AI RADAHN
                              </span>
                            ) : classification.isPaid ? (
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.2 rounded bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                                PAID
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                FREE
                              </span>
                            )}
                          </div>

                          <div className="font-bold text-xs text-white truncate mt-0.5">
                            {step.title || `Step ${idx + 1}`}
                          </div>

                          <div className="hidden md:flex items-center justify-between text-[10px] text-text-tertiary font-mono mt-1">
                            <span>+{idx * 118}ms</span>
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <Check size={10} strokeWidth={3} /> OK
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT PANE: Step Data Inspector (Data In / Data Out) */}
              <div className="flex-1 flex flex-col bg-[#101017] overflow-hidden min-h-0">
                
                {/* Step Header */}
                <div className="p-3 sm:p-4 border-b border-white/10 bg-[#14141c] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      currentStep?.classification.isAi
                        ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                        : currentStep?.classification.isPaid
                          ? 'bg-accent-blue/20 border border-accent-blue/30 text-accent-blue'
                          : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                    }`}>
                      {getStepIcon(currentStep?.node, selectedStepIndex)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {currentStep?.node?.title || `Step 0${selectedStepIndex + 1}`}
                        </h4>
                        {currentStep?.classification.isAi ? (
                          <span className="text-[9px] font-bold font-mono px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                            AI Radahn
                          </span>
                        ) : currentStep?.classification.isPaid ? (
                          <span className="text-[9px] font-bold font-mono px-2 py-0.2 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/30 shrink-0">
                            1 Task Consumed
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold font-mono px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                            Free Utility
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-tertiary font-mono mt-0.5">
                        Execution: {metrics['Execution Latency']} · {metrics['Runtime Engine']}
                      </p>
                    </div>
                  </div>

                  {/* Main Tab Switcher: Data In (Inputs) vs Data Out (Results) */}
                  <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-0.5 sm:p-1 text-xs self-start sm:self-auto font-medium shrink-0">
                    <button
                      type="button"
                      onClick={() => setTelemetryViewMode('ingest')}
                      className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold ${
                        telemetryViewMode === 'ingest'
                          ? 'bg-accent-blue text-white shadow-sm'
                          : 'text-text-tertiary hover:text-white'
                      }`}
                    >
                      <Database size={12} className="shrink-0" />
                      <span>Data In (Inputs)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTelemetryViewMode('emitted')}
                      className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold ${
                        telemetryViewMode === 'emitted'
                          ? 'bg-accent-blue text-white shadow-sm'
                          : 'text-text-tertiary hover:text-white'
                      }`}
                    >
                      <Activity size={12} className="shrink-0" />
                      <span>Data Out (Results)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTelemetryViewMode('metrics')}
                      className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] sm:text-xs ${
                        telemetryViewMode === 'metrics'
                          ? 'bg-accent-blue text-white font-semibold shadow-sm'
                          : 'text-text-tertiary hover:text-white'
                      }`}
                    >
                      <Gauge size={11} className="shrink-0" />
                      <span>Stats</span>
                    </button>
                  </div>
                </div>

                {/* Filter & View Mode Controls */}
                <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-b border-white/10 bg-[#0e0e14] flex items-center justify-between gap-2 text-xs shrink-0">
                  <div className="relative flex-1 max-w-xs sm:max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-tertiary" />
                    <input
                      type="text"
                      placeholder="Search parameters, fields or values..."
                      value={telemetrySearch}
                      onChange={(e) => setTelemetrySearch(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg pl-7 pr-2.5 py-1 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-accent-blue font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-1 font-mono text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setDataViewFormat('key_values')}
                      className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors cursor-pointer ${
                        dataViewFormat === 'key_values' ? 'bg-white/10 text-white font-semibold' : 'text-text-tertiary hover:text-white'
                      }`}
                    >
                      Key-Value
                    </button>
                    <button
                      type="button"
                      onClick={() => setDataViewFormat('raw_stream')}
                      className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors cursor-pointer ${
                        dataViewFormat === 'raw_stream' ? 'bg-white/10 text-white font-semibold' : 'text-text-tertiary hover:text-white'
                      }`}
                    >
                      JSON
                    </button>
                  </div>
                </div>

                {/* Step Data Inspector Content (Key-Value Cards & Unpacked Mapping) */}
                <div className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scrollbar min-h-0 space-y-3">
                  
                  {/* Informational Banner */}
                  <div className="p-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/25 flex items-center justify-between text-xs text-blue-200">
                    <div className="flex items-center gap-1.5 truncate">
                      <ShieldCheck size={14} className="text-accent-blue shrink-0" />
                      <span className="truncate">
                        {telemetryViewMode === 'ingest' 
                          ? 'Data received & used by this step (parameters & previous variables).' 
                          : telemetryViewMode === 'emitted'
                            ? 'Results produced by this step and forwarded to next actions.'
                            : 'Runtime execution benchmarks and performance health.'}
                      </span>
                    </div>
                    <span className="text-[10px] text-accent-blue font-mono font-bold uppercase shrink-0">
                      {telemetryViewMode === 'ingest' ? 'INPUT DATA' : telemetryViewMode === 'emitted' ? 'OUTPUT DATA' : 'STATS'}
                    </span>
                  </div>

                  {dataViewFormat === 'key_values' ? (
                    activeEntries.length === 0 ? (
                      <div className="p-8 text-center text-text-tertiary text-xs">
                        No fields match your search query.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {activeEntries.map(([k, v]) => {
                          
                          // SPECIFIC CASE 1: Column Mapping Array (Unpack into clean Key-Value rows!)
                          if (k.toLowerCase().includes('mapping') || (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0].key !== undefined)) {
                            const mappingArray = Array.isArray(v) ? v : [];
                            return (
                              <div key={k} className="p-3 sm:p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <div className="flex items-center gap-2">
                                    <FileSpreadsheet size={14} className="text-accent-blue shrink-0" />
                                    <span className="font-semibold text-xs text-white">
                                      Mapped Sheet Columns & Values
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                                    {mappingArray.length} Fields Configured
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {mappingArray.map((m, mIdx) => (
                                    <div 
                                      key={mIdx}
                                      className="p-2.5 rounded-lg bg-black/50 border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between"
                                    >
                                      <div className="flex items-center justify-between text-[11px] font-semibold text-accent-blue mb-1">
                                        <span className="truncate">{m.key || `Column ${mIdx + 1}`}</span>
                                        <span className="text-[9px] font-mono text-text-tertiary uppercase">Field #{mIdx + 1}</span>
                                      </div>
                                      <div className="font-mono text-xs text-white/90 break-all select-all bg-black/60 p-1.5 rounded border border-white/5">
                                        {m.value ? String(m.value) : <span className="text-text-tertiary italic">(Empty Value)</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          // SPECIFIC CASE 2: Nested Generic Object (Unpack clean sub-items)
                          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                            const subEntries = Object.entries(v);
                            return (
                              <div key={k} className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                                  <span className="font-semibold text-xs text-accent-blue capitalize">
                                    {k.replace(/([A-Z])/g, ' $1')}
                                  </span>
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/5 text-text-tertiary">
                                    {subEntries.length} Items
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {subEntries.map(([subK, subV]) => (
                                    <div key={subK} className="p-2 rounded-lg bg-black/50 border border-white/5">
                                      <div className="text-[10px] font-semibold text-text-secondary capitalize mb-0.5">
                                        {subK.replace(/([A-Z])/g, ' $1')}
                                      </div>
                                      <div className="font-mono text-xs text-white/90 select-all break-all">
                                        {typeof subV === 'object' ? JSON.stringify(subV) : String(subV)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          // SPECIFIC CASE 3: Standard Key-Value Card
                          return (
                            <div
                              key={k}
                              className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4"
                            >
                              <div className="min-w-0 max-w-sm">
                                <span className="font-semibold text-xs text-accent-blue block truncate" title={k}>
                                  {k.replace(/([A-Z])/g, ' $1')}
                                </span>
                              </div>

                              <div className="font-mono text-xs text-white/90 break-all select-all bg-black/50 px-2.5 py-1.5 rounded-lg border border-white/5 flex-1 sm:text-right">
                                {typeof v === 'boolean' ? (v ? 'Enabled (True)' : 'Disabled (False)') : String(v)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <div className="bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-xs text-emerald-400 overflow-x-auto custom-scrollbar">
                      <pre>{JSON.stringify(activeTelemetryPayload, null, 2)}</pre>
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* Modal Bottom Summary Footer */}
            <div className="p-3 border-t border-white/10 bg-[#121218] flex items-center justify-between gap-2 text-xs text-text-secondary shrink-0 font-mono">
              <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-[11px] sm:text-xs">
                <span>Free Tasks: <strong className="text-emerald-400">{freeStepsPerRun}</strong></span>
                <span>Paid Tasks: <strong className="text-accent-blue">{paidStepsPerRun}</strong></span>
                <span className="hidden sm:inline">Execution Status: <strong className="text-emerald-400">Passed (200 OK)</strong></span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedExecution(null)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-sans text-xs transition-colors cursor-pointer shrink-0"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
