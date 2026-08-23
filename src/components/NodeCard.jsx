import { NODE_TYPES } from '@/constants';
import { TrashIcon, TriggerIcon, ActionIcon, DelayIcon } from './Icons';
import { motion } from 'framer-motion';
import { AlertTriangle, Copy, ArrowUpDown, CheckCircle2, Play, ClipboardPaste, User } from 'lucide-react';

export default function NodeCard({ node, nodes = [], isSelected, isInvalid, isActiveSimulation, waitingCount = 0, onClick, onDelete, onCopy, onPaste, onReplace, onStartMove, onViewWaitingLeads }) {
  const isTrigger = node.type === NODE_TYPES.TRIGGER;
  const isDelay = node.type === NODE_TYPES.DELAY || node.integration?.id === 'delay';
  const isBranching = node.type === NODE_TYPES.CONDITION || node.type === NODE_TYPES.REMINDER_SEQUENCE;
  const isReminderFirstStep = node.parentId && node.pathId && node.integration?.id === 'delay' && (() => {
    const parentNode = nodes.find(n => n.id === node.parentId);
    return parentNode?.integration?.id === 'reminder_sequence';
  })();
  
  // Use the integration's icon if available, otherwise fallback
  const Icon = node.integration?.icon || (isTrigger ? TriggerIcon : (isDelay ? DelayIcon : ActionIcon));
  const accentClass = isTrigger ? 'text-accent-violet border-accent-violet/30' : 'text-accent-blue border-accent-blue/30';
  
  const borderClass = (isInvalid || node.issue)
    ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
    : isActiveSimulation
      ? 'border-accent-blue shadow-[0_0_40px_rgba(59,130,246,0.6)] ring-2 ring-accent-blue ring-offset-2 ring-offset-[#0f0f11]'
      : isSelected 
        ? (isTrigger ? 'border-accent-violet shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-accent-blue shadow-[0_0_20px_rgba(59,130,246,0.3)]')
        : 'border-border-subtle hover:border-white/20';

  const priorityKeys = ['provider', 'calendarName', 'spreadsheetName', 'range', 'triggerColumn', 'triggerEvent', 'method', 'actionType'];
  const hiddenKeys = ['webhookToken', 'sheetUrl', 'schema', 'connectionId', 'selectedEventId', 'capturedPayload', 'lastCopiedSignature'];

  // Ensure default values are displayed for specific integrations
  const displayConfig = { ...node.config };
  if (node.integration?.id === 'delay' && displayConfig.delayType === 'event_based' && !displayConfig.eventTiming) {
    displayConfig.eventTiming = 'before';
  }
  
  // Format specific config fields based on integration
  const formatConfigField = (integrationId, key, value) => {
    let label = key.replace(/([A-Z])/g, ' $1').trim();
    label = label.charAt(0).toUpperCase() + label.slice(1);
    let displayValue = String(value);

    if (integrationId === 'calendar') {
      if (key === 'provider') {
        label = 'Provider';
        if (value === 'builtin') displayValue = 'Automatix Calendar (Premium)';
        else if (value === 'calendly') displayValue = 'Calendly';
        else if (value === 'calcom') displayValue = 'Cal.com';
      }
      if (key === 'calendarName') label = 'Selected Calendar';
      if (key === 'triggerEvent') {
        label = 'Trigger Event';
        if (value === 'invitee.created') displayValue = 'Invitee Created (New Meeting)';
        else if (value === 'invitee.canceled') displayValue = 'Invitee Canceled';
        else if (value === 'invitee.rescheduled') displayValue = 'Invitee Rescheduled';
      }
    } else if (integrationId === 'webhook') {
      if (key === 'triggerEvent') {
        label = 'HTTP Method';
        if (value === 'POST') displayValue = 'Any POST Request';
        else if (value === 'GET') displayValue = 'Any GET Request';
        else if (value === 'ALL') displayValue = 'Any HTTP Method';
      }
      if (key === 'isListening') {
        label = 'Mode';
        displayValue = value ? 'Listening for Payload' : 'Active';
      }
    } else if (integrationId === 'sheets_trigger') {
      if (key === 'spreadsheetName') label = 'Spreadsheet';
      if (key === 'range') label = 'Worksheet Tab';
      if (key === 'triggerColumn') {
        label = 'Trigger Column';
        if (!value) displayValue = 'Any Column';
      }
      if (key === 'triggerEvent') {
        label = 'Trigger Event';
        if (value === 'row_added_updated') displayValue = 'New Row Added/Updated';
      }
      if (key === 'method') {
        label = 'Method';
        if (value === 'polling') displayValue = '1-Minute Polling';
        else if (value === 'webhook') displayValue = 'Real-Time (Apps Script)';
      }
    } else if (integrationId === 'schedule') {
      if (key === 'interval') label = 'Interval';
      if (key === 'unit') label = 'Unit';
    }

    // Replace {{steps...}} in displayValue
    if (displayValue.includes('{{steps.')) {
      displayValue = displayValue.replace(/\{\{steps\.([^.]+)\.([^}]+)\}\}/g, (match, nodeId, variableKey) => {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) {
          return `{{${targetNode.title || 'Step'}: ${variableKey}}}`;
        }
        return match;
      });
    }

    return { label, displayValue };
  };

  const filteredConfig = Object.entries(displayConfig).filter(([key, value]) => {
    if (value === null || value === undefined || value === '') return false;
    if (key === 'eventLink' && !node.config?.connectionId) return false;
    if (hiddenKeys.includes(key)) return false;
    if (key === 'spreadsheetId' && node.config?.spreadsheetName) return false; // Hide ID if we have the pretty name
    if (typeof value === 'object') return false; // Hide complex mappings/arrays
    return true;
  }).sort(([keyA], [keyB]) => {
    const indexA = priorityKeys.indexOf(keyA);
    const indexB = priorityKeys.indexOf(keyB);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return keyA.localeCompare(keyB);
  });

  return (
    <motion.div 
      draggable={!isTrigger && !isReminderFirstStep}
      onDragStart={(e) => {
        if (!isTrigger && !isReminderFirstStep) {
          e.dataTransfer.setData('application/automatix-node-id', node.id);
          e.dataTransfer.effectAllowed = 'move';
        }
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative group w-full bg-[#111] backdrop-blur-xl border ${borderClass} rounded-xl shadow-lg transition-all cursor-pointer px-4 py-5 ${!isTrigger ? 'active:cursor-grabbing' : ''}`}
    >
      {waitingCount > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); if (onViewWaitingLeads) onViewWaitingLeads(); }}
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0F0F13] text-white border border-white/20 rounded-full px-3 py-1 flex items-center gap-2 text-[11px] font-semibold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:border-accent-blue/50 hover:bg-accent-blue/10 transition-all z-20 overflow-hidden"
          title="View Active Users"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/0 via-accent-blue/10 to-accent-blue/0 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
          <span className="relative flex items-center justify-center w-4 h-4 rounded-full bg-accent-blue/20 text-accent-blue">
            <User className="w-2.5 h-2.5" />
          </span>
          <span className="relative">{waitingCount} {waitingCount === 1 ? 'User' : 'Users'}</span>
        </button>
      )}
      {isActiveSimulation && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-blue text-white rounded-full px-3 py-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(59,130,246,0.8)] z-30">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Simulating...
        </div>
      )}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      {/* Node Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className={`p-2.5 sm:p-3 bg-black/50 rounded-lg border ${accentClass} shrink-0`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-1 sm:pr-2 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-white truncate" title={node.title}>{node.title}</h3>
              {(() => {
                const reqConn = ['slack', 'twilio', 'stripe', 'gmail', 'email', 'openai', 'instagram', 'instagram_action', 'interactive_prompt', 'calendly', 'calcom'];
                let isConnected = false;
                let needsConnection = false;
                
                if (node.integration && reqConn.includes(node.integration.id)) {
                  needsConnection = true;
                  if (node.config?.connectionId) isConnected = true;
                } else if (node.integration && node.integration.id === 'sheets') {
                  needsConnection = true;
                  if (node.config?.spreadsheetId) isConnected = true;
                }

                let isConfigured = !isInvalid && !node.issue;
                
                if (node.integration?.id === 'reminder_sequence') {
                  const branches = node.config?.branches || [{ id: '1', name: 'Reminder 1', color: 'purple-500' }];
                  let anyEmpty = false;
                  for (const branch of branches) {
                    const branchChild = (node.children || []).find(c => c.pathId === branch.id);
                    if (!branchChild) {
                      anyEmpty = true;
                      break;
                    }
                  }
                  isConfigured = !anyEmpty;
                } else if (node.integration?.id === 'delay') {
                  if (node.config?.delayType === 'until') {
                    isConfigured = !!node.config.untilDate && !isInvalid && !node.issue;
                  } else if (node.config?.delayType === 'event_based') {
                    isConfigured = !!node.config.eventDate && !isInvalid && !node.issue;
                  } else {
                    isConfigured = !!node.config?.delayType && !isInvalid && !node.issue;
                  }
                }
                
                if (needsConnection) {
                  return isConnected ? (
                    <div className="flex gap-1">
                      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Connected
                      </span>
                      {!isConfigured && (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Needs Config
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Missing Connection
                    </span>
                  );
                } else {
                  return isConfigured ? (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Configured
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Needs Config
                    </span>
                  );
                }
              })()}
            </div>
            <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-widest mt-0.5 truncate">{node.integration?.name || node.type}</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className={`opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0`}>
          {(isDelay || node.integration?.id === 'reminder_sequence') && onViewWaitingLeads && (
            <button 
              onClick={(e) => { e.stopPropagation(); onViewWaitingLeads(); }} 
              className="px-2 py-1 flex items-center gap-1 text-[10px] font-semibold text-accent-blue hover:text-white bg-accent-blue/10 border border-accent-blue/20 rounded hover:bg-accent-blue/50 mr-1" 
              title="View Waiting Leads to Run Now"
            >
              <Play className="w-3 h-3 fill-current" />
              RUN NOW
            </button>
          )}
          {!isTrigger && (
            <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className="p-1.5 text-text-secondary hover:text-white rounded-md hover:bg-black/50" title="Copy Step"><Copy className="w-3.5 h-3.5" /></button>
          )}
          {onReplace && !isTrigger && (
            <button onClick={(e) => { e.stopPropagation(); onReplace(); }} className="p-1.5 text-text-secondary hover:text-accent-blue rounded-md hover:bg-black/50" title="Replace with Copied Step"><ClipboardPaste className="w-3.5 h-3.5" /></button>
          )}
          {onStartMove && !isTrigger && !isReminderFirstStep && (
            <button onClick={(e) => { e.stopPropagation(); onStartMove(); }} className="md:hidden p-1.5 text-text-secondary hover:text-white rounded-md hover:bg-black/50" title="Move Step"><ArrowUpDown className="w-3.5 h-3.5" /></button>
          )}
          {!isReminderFirstStep && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              className="p-1.5 text-text-secondary hover:text-red-400 rounded-md hover:bg-black/50"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {(isInvalid || node.issue) && (
        <div 
          className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-md flex items-start gap-2 text-red-400 cursor-help"
          title={node.issue ? `Issue: ${node.issue}` : (isTrigger ? "Trigger is missing a required connection or configuration." : "This step requires configuration, or uses variables that are missing/invalid. Please re-configure.")}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs">
            {node.issue ? `Action Required: ${node.issue}` : (isTrigger ? "Warning: Missing required connection." : "Warning: Step requires configuration or has invalid variables.")}
          </p>
        </div>
      )}

      {/* Node Config / Summary */}
      <div className="mt-4 pt-3 border-t border-border-subtle/50 text-xs text-text-secondary bg-black/20 rounded-md p-3">
        {node.integration?.id === 'reminder_sequence' ? (
          <div className="space-y-1.5">
            {(node.config?.branches || [{ id: '1', name: 'Reminder 1', color: 'purple-500' }]).map(branch => {
              const countChildren = (nodesList) => {
                let count = 0;
                for (const n of nodesList) {
                  count++;
                  if (n.children && n.children.length > 0) {
                    count += countChildren(n.children);
                  }
                }
                return count;
              };
              
              const branchChild = (node.children || []).find(c => c.pathId === branch.id);
              const stepCount = branchChild ? countChildren([branchChild]) : 0;
              
              return (
                <div key={branch.id} className="flex justify-between items-center gap-2">
                  <span className={`text-${branch.color || 'purple-500'} shrink-0 font-semibold tracking-wider text-[10px] uppercase`}>{branch.name}:</span>
                  <span className={`text-right truncate px-1.5 py-0.5 rounded text-[11px] font-medium ${stepCount > 0 ? 'text-white/90 bg-white/5' : 'text-orange-400 bg-orange-500/10'}`}>
                    {stepCount} {stepCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : filteredConfig.length > 0 ? (
          <div className="space-y-1.5">
            {filteredConfig.map(([key, value]) => {
              const { label, displayValue } = formatConfigField(node.integration?.id, key, value);

              return (
                <div key={key} className="flex justify-between items-center gap-2">
                  <span className="text-white/50 shrink-0">{label}:</span>
                  <span className="text-white/90 font-mono text-right truncate bg-white/5 px-1.5 py-0.5 rounded" title={displayValue}>{displayValue}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="italic text-center text-white/40">Requires configuration</div>
        )}
      </div>
    </motion.div>
  );
}
