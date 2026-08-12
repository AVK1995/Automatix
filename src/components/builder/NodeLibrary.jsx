import { motion } from 'framer-motion';
import { NODE_TYPES } from '@/constants';
import { 
  Zap, Clock, Globe, Mail, MessageSquare, 
  Database, Calendar, FileText, Smartphone, Camera,
  Lock, Type, Calculator, Code, Search, CalendarDays,
  Blocks, Pin, PinOff, Filter
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export const INTEGRATIONS = {
  [NODE_TYPES.TRIGGER]: [
    { id: 'webhook', name: 'Catch Webhook', icon: Globe, color: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20', description: 'Trigger from an external HTTP request' },
    { id: 'sheets_trigger', name: 'Google Sheets', icon: Database, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', description: 'Trigger on new rows in a Google Sheet' },
    { id: 'schedule', name: 'Schedule', icon: Clock, color: 'bg-green-500/10 text-green-500 border-green-500/20', description: 'Run at a specific time or recurring interval' },
    { id: 'stripe', name: 'Stripe Event', icon: Database, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', description: 'Trigger on payment or subscription updates' },
    { id: 'calendar', name: 'Calendar Event', icon: Calendar, color: 'bg-blue-400/10 text-blue-400 border-blue-400/20', description: 'Trigger when a new meeting is scheduled' },
    { id: 'instagram', name: 'Instagram DM', icon: Camera, color: 'bg-pink-600/10 text-pink-600 border-pink-600/20', description: 'Trigger when you receive a DM' }
  ],
  [NODE_TYPES.ACTION]: [
    { id: 'formatter_text', name: 'Data Modification & Formatting', icon: Type, color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', description: 'Modify, format, or capitalize text' },
    { id: 'formatter_math', name: 'Mathematical & Developer Operations', icon: Calculator, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', description: 'Add, subtract, or format numbers' },
    { id: 'formatter_extract', name: 'Data Extraction & Parsing', icon: Search, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', description: 'Extract emails, phones, or Regex' },
    { id: 'formatter_dev', name: 'Custom JS Code Snippets', icon: Code, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', description: 'Run custom JavaScript code snippets' },
    { id: 'date_formatter', name: 'Date & Time Formatter', icon: CalendarDays, color: 'bg-teal-500/10 text-teal-500 border-teal-500/20', description: 'Modify and format dates and times' },
    { id: 'custom_variable', name: 'Custom Variable', icon: Blocks, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', description: 'Create a reusable timestamp, date, text, or number' },
    { id: 'calendar_status', name: 'Check Calendar Status', icon: Calendar, color: 'bg-blue-400/10 text-blue-400 border-blue-400/20', description: 'Halt workflow if calendar event is cancelled/rescheduled' },
    { id: 'http', name: 'API by Automatix', icon: Globe, color: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20', description: 'Send data hits to specific webhooks' },
    { id: 'email', name: 'Send Email', icon: Mail, color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', description: 'Send an email via Resend or SMTP' },
    { id: 'slack', name: 'Slack Message', icon: MessageSquare, color: 'bg-pink-500/10 text-pink-500 border-pink-500/20', description: 'Send a message to a Slack channel' },
    { id: 'instagram_action', name: 'Instagram DM', icon: Camera, color: 'bg-pink-600/10 text-pink-600 border-pink-600/20', description: 'Send a direct message on Instagram' },
    { id: 'meta_capi', name: 'Meta Conversions API', icon: Database, color: 'bg-blue-600/10 text-blue-600 border-blue-600/20', description: 'Send server-side events to FB Ads' },
    { id: 'twilio', name: 'Send SMS', icon: Smartphone, color: 'bg-red-500/10 text-red-500 border-red-500/20', description: 'Send a text message via Twilio' },
    { id: 'sheets', name: 'Google Sheets', icon: FileText, color: 'bg-green-600/10 text-green-600 border-green-600/20', description: 'Add or update a row in Sheets' },
  ],
  [NODE_TYPES.CONDITION]: [
    { id: 'condition', name: 'Router / IF-ELSE', icon: Zap, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', description: 'Split your workflow into multiple conditional paths' },
    { id: 'filter', type: NODE_TYPES.ACTION, name: 'Filter', icon: Filter, color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', description: 'Only allow workflow to continue if conditions are met' }
  ],
  [NODE_TYPES.REMINDER_SEQUENCE]: [
    { id: 'reminder_sequence', name: 'Reminder Sequence', icon: Clock, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', description: 'Create a timeline of sequential reminders' },
    { id: 'delay', type: NODE_TYPES.ACTION, name: 'Smart Delay', icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', description: 'Pause execution for a set duration' }
  ]
};

import { X } from 'lucide-react';

export default function NodeLibrary({ onAddNode, hasTrigger, isMobileOpen, setIsMobileOpen, mobileInsertionTarget, setMobileInsertionTarget, insertionPoint }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const hoverTimeout = useRef(null);
  
  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    hoverTimeout.current = setTimeout(() => {
      setIsExpanded(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (insertionPoint) {
      setIsExpanded(true);
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    }
  }, [insertionPoint]);

  const filterIntegrations = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q)
    );
  };

  const filteredTriggers = filterIntegrations(INTEGRATIONS[NODE_TYPES.TRIGGER]);
  const filteredActions = filterIntegrations(INTEGRATIONS[NODE_TYPES.ACTION]);
  const filteredConditions = filterIntegrations(INTEGRATIONS[NODE_TYPES.CONDITION]);
  const filteredReminders = filterIntegrations(INTEGRATIONS[NODE_TYPES.REMINDER_SEQUENCE] || []);


  const handleNodeSelect = (type, integration) => {
    if (isMobileOpen && setIsMobileOpen) {
      // In mobile tap-to-add mode, use the target if we have one
      if (mobileInsertionTarget) {
        onAddNode(type, integration, mobileInsertionTarget.parentId, mobileInsertionTarget.pathId);
        setMobileInsertionTarget(null);
      } else {
        onAddNode(type, integration);
      }
      setIsMobileOpen(false);
    } else {
      // Desktop click-to-add
      onAddNode(type, integration);
    }
  };

  const NodeLibraryContent = () => (
    <>
      <div className="p-4 border-b border-border-subtle sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-medium text-foreground">Integration Library</h2>
            <p className="text-xs text-text-secondary mt-1 mb-3">Select blocks to build your flow</p>
          </div>
          <button 
            onClick={() => setIsPinned(!isPinned)}
            className={`p-1.5 rounded-md transition-colors ${isPinned ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary hover:text-white hover:bg-white/10'}`}
            title={isPinned ? "Unpin panel" : "Pin panel open"}
          >
            {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search triggers & actions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="p-4 flex-1">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-violet" />
              <h3 className="text-sm font-medium text-foreground uppercase tracking-widest">Triggers</h3>
            </div>
            {hasTrigger && (
              <span className="text-[10px] text-accent-violet bg-accent-violet/10 px-2 py-0.5 rounded-full border border-accent-violet/20 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> 1 Max
              </span>
            )}
          </div>
          <div className="space-y-2">
            {filteredTriggers.map(integration => {
              const isDisabled = hasTrigger;
              return (
                <motion.div
                  key={integration.id}
                  draggable={!isDisabled}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: NODE_TYPES.TRIGGER, integrationId: integration.id }));
                  }}
                  whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                  whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                  onClick={() => !isDisabled && handleNodeSelect(NODE_TYPES.TRIGGER, integration)}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isDisabled 
                      ? 'border-transparent bg-background/50 opacity-40 cursor-not-allowed' 
                      : 'border-border-subtle bg-card cursor-pointer hover:border-accent-violet/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${integration.color} ${isDisabled ? 'grayscale' : ''}`}>
                    <integration.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{integration.name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5 leading-snug">{integration.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-accent-blue" />
            <h3 className="text-sm font-medium text-foreground uppercase tracking-widest">Actions</h3>
          </div>
          <div className="space-y-2">
            {filteredActions.map(integration => {
              const isDisabled = !hasTrigger;
              return (
              <motion.div
                key={integration.id}
                draggable={!isDisabled}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: NODE_TYPES.ACTION, integrationId: integration.id }));
                }}
                whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                onClick={() => !isDisabled && handleNodeSelect(NODE_TYPES.ACTION, integration)}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  isDisabled 
                    ? 'border-transparent bg-background/50 opacity-40 cursor-not-allowed' 
                    : 'border-border-subtle bg-card cursor-pointer hover:border-accent-blue/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                }`}
              >
                <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${integration.color} ${isDisabled ? 'grayscale' : ''}`}>
                  <integration.icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{integration.name}</h4>
                  <p className="text-xs text-text-secondary mt-0.5 leading-snug">{integration.description}</p>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3 mt-6">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <h3 className="text-sm font-medium text-foreground uppercase tracking-widest">Logic & Routing</h3>
          </div>
          <div className="space-y-2">
            {filteredConditions.map(integration => {
              const isDisabled = !hasTrigger;
              return (
              <motion.div
                key={integration.id}
                draggable={!isDisabled}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: integration.type || NODE_TYPES.CONDITION, integrationId: integration.id }));
                }}
                whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                onClick={() => !isDisabled && handleNodeSelect(integration.type || NODE_TYPES.CONDITION, integration)}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  isDisabled 
                    ? 'border-transparent bg-background/50 opacity-40 cursor-not-allowed' 
                    : 'border-border-subtle bg-card cursor-pointer hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                }`}
              >
                <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${integration.color} ${isDisabled ? 'grayscale' : ''}`}>
                  <integration.icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{integration.name}</h4>
                  <p className="text-xs text-text-secondary mt-0.5 leading-snug">{integration.description}</p>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 mt-6">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <h3 className="text-sm font-medium text-foreground uppercase tracking-widest">Time & Delays</h3>
          </div>
          <div className="space-y-2">
            {filteredReminders.map(integration => {
              const isDisabled = !hasTrigger;
              return (
              <motion.div
                key={integration.id}
                draggable={!isDisabled}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: integration.type || NODE_TYPES.REMINDER_SEQUENCE, integrationId: integration.id }));
                }}
                whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                onClick={() => !isDisabled && handleNodeSelect(integration.type || NODE_TYPES.REMINDER_SEQUENCE, integration)}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  isDisabled 
                    ? 'border-transparent bg-background/50 opacity-40 cursor-not-allowed' 
                    : 'border-border-subtle bg-card cursor-pointer hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                }`}
              >
                <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${integration.color} ${isDisabled ? 'grayscale' : ''}`}>
                  <integration.icon size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{integration.name}</h4>
                  <p className="text-xs text-text-secondary mt-0.5 leading-snug">{integration.description}</p>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Full-Screen Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-card shrink-0">
            <h2 className="font-semibold text-white">Add Step</h2>
            <button 
              onClick={() => {
                setIsMobileOpen(false);
                setMobileInsertionTarget?.(null);
              }} 
              className="p-2 text-text-secondary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {NodeLibraryContent()}
          </div>
        </div>
      )}

      {/* Desktop Panel */}
      <motion.div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={false}
        animate={{ width: isExpanded ? panelWidth : 48 }}
        transition={{ type: isResizing ? "tween" : "spring", duration: isResizing ? 0 : undefined, stiffness: 300, damping: 30 }}
        className={`h-full bg-[#0a0a0a] hidden md:flex shrink-0 relative z-40 overflow-visible group ${isExpanded ? 'border-r border-border-subtle' : ''}`}
      >
        <div 
          className={`h-full flex flex-col overflow-y-auto overflow-x-hidden absolute left-0 top-0 transition-opacity duration-200 ${isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{ width: panelWidth }}
        >
          {NodeLibraryContent()}
        </div>
        
        {!isExpanded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity bg-[#111] border-r border-border-subtle cursor-pointer" onClick={() => setIsExpanded(true)}>
          <Blocks className="w-5 h-5 text-accent-blue mb-4" />
          <div className="w-1 h-12 bg-white/20 rounded-full" />
        </div>
      )}

      {isExpanded && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-accent-blue/30 z-50 transition-colors flex items-center justify-center -mr-1"
          onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
        >
          <div className="h-8 w-1 bg-border-subtle rounded-full group-hover:bg-accent-blue/50" />
        </div>
      )}
    </motion.div>
    </>
  );
}
