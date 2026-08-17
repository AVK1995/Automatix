import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Copy, Plus, Trash2, Sparkles, PlayCircle, AlertCircle, CheckCircle2, RefreshCw, ExternalLink, AlertTriangle, Variable, HelpCircle, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import ConnectIntegration from './ConnectIntegration';
import Select from '@/components/ui/Select';
import Toggle from '@/components/ui/Toggle';
import Radio from '@/components/ui/Radio';
import VariableInput from '@/components/ui/VariableInput';
import GoogleSheetsGuideModal from './GoogleSheetsGuideModal';
import ConnectionGuideModal from '@/components/ui/ConnectionGuideModal';
import WebhookGuideModal from '@/components/builder/WebhookGuideModal';
import { testNodeAction } from '@/actions/testNode';
import { getWebhookPayloadHistory, simulateInstagramDM } from '@/actions/workflows';
import { getRecentBookings } from '@/actions/bookings';
import ConfirmModal from '@/components/ui/ConfirmModal';
import HtmlEditor from '@/components/ui/HtmlEditor';
import HtmlPreviewModal from '@/components/ui/HtmlPreviewModal';
import VariableMenu from '@/components/ui/VariableMenu';
import ColorPicker from '@/components/ui/ColorPicker';
import QuestionBuilder from '@/components/builder/QuestionBuilder';
import Link from 'next/link';
import { getCalendars, getCalendarById } from '@/actions/calendars';
import { NODE_TYPES } from '@/constants';

export default function PropertiesPanel({ selectedNode, nodes = [], onClose, onUpdateNode, onSelectNode, onConfigureReminderStep, onSimulate, workflowId, isPublished }) {
  const [schemaValue, setSchemaValue] = useState(selectedNode?.config?.schema || '');
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [activeChecklistVar, setActiveChecklistVar] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isCodeCollapsed, setIsCodeCollapsed] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [automatixCalendars, setAutomatixCalendars] = useState([]);
  const [selectedAutomatixCalendar, setSelectedAutomatixCalendar] = useState(null);
  
  const prevIdRef = import('react').then(() => {}).catch(() => {}); // Hack to avoid importing if already there
  const [initialState, setInitialState] = useState(null);

  useEffect(() => {
    if (selectedNode) {
      setInitialState({
        title: selectedNode.title,
        config: JSON.parse(JSON.stringify(selectedNode.config || {}))
      });

      const isWebhookTrigger = ['webhook', 'sheets_trigger'].includes(selectedNode?.integration?.id) || selectedNode?.type === 'trigger_instagram';
      // Auto-generate webhook token if missing
      if (isWebhookTrigger && !selectedNode?.config?.webhookToken) {
        onUpdateNode(selectedNode.id, {
          ...selectedNode,
          config: {
            ...selectedNode.config,
            webhookToken: crypto.randomUUID ? crypto.randomUUID() : 'gen-' + Date.now() + Math.random().toString(36).substring(2)
          }
        });
      }
    }
  }, [selectedNode?.id]);

  
  const [availableSheets, setAvailableSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [availableHeaders, setAvailableHeaders] = useState([]);
  const [loadingHeaders, setLoadingHeaders] = useState(false);

  const [panelWidth, setPanelWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [pseudoConnections, setPseudoConnections] = useState([]);
  const [sheetToClear, setSheetToClear] = useState(null);

  useEffect(() => {
    import('@/actions/connections').then(m => {
      if (m.getGoogleSheetConnections) {
        m.getGoogleSheetConnections().then(setPseudoConnections);
      }
    });
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clear testing state when selecting a different node
  useEffect(() => {
    setIsTesting(false);
  }, [selectedNode?.id]);

  useEffect(() => {
    if (selectedNode?.type === NODE_TYPES.TRIGGER && selectedNode?.config?.provider === 'builtin') {
      const fetchCalendars = () => {
        getCalendars().then(c => setAutomatixCalendars(c)).catch(console.error);
      };
      
      fetchCalendars();

      const channel = new BroadcastChannel('automatix_calendars');
      channel.onmessage = (event) => {
        if (event.data === 'updated') {
          fetchCalendars();
        }
      };

      const handleFocus = () => fetchCalendars();
      window.addEventListener('focus', handleFocus);

      return () => {
        channel.close();
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [selectedNode?.id, selectedNode?.config?.provider]);

  useEffect(() => {
    if (selectedNode?.type === NODE_TYPES.TRIGGER && selectedNode?.config?.provider === 'builtin' && selectedNode?.config?.connectionId) {
      getCalendarById(selectedNode.config.connectionId)
        .then(c => setSelectedAutomatixCalendar(c))
        .catch(console.error);
    } else {
      setSelectedAutomatixCalendar(null);
    }
  }, [selectedNode?.config?.connectionId, selectedNode?.config?.provider]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setPanelWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isWebhookGuideOpen, setIsWebhookGuideOpen] = useState(false);
  const [payloadHistory, setPayloadHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isConnectionGuideOpen, setIsConnectionGuideOpen] = useState(false);
  const [simulatedMessage, setSimulatedMessage] = useState('');
  const [simulationError, setSimulationError] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const fetchPayloadHistory = async (showLoader = false) => {
    const isCalendar = selectedNode?.integration?.id === 'calendar';
    if (!isCalendar && (!workflowId || workflowId === 'new')) return;
    if (isCalendar && !selectedNode?.config?.connectionId) return;

    if (showLoader) setIsLoadingHistory(true);
    try {
      let history = [];
      if (isCalendar) {
        history = await getRecentBookings(selectedNode.config.connectionId);
      } else {
        history = await getWebhookPayloadHistory(workflowId);
      }
      setPayloadHistory(history || []);
      
      // Auto-select the most recent payload ONLY if we haven't captured one yet
      const isActuallyListening = isPublished ? true : (selectedNode?.config?.isListening || false);
      if (history && history.length > 0 && isActuallyListening) {
        if (!selectedNode.config?.capturedPayload) {
          const mostRecent = history[0];
          const clearedAt = selectedNode.config?.clearedAt || 0;
          const payloadTime = new Date(mostRecent.createdAt).getTime();
          
          if (payloadTime > clearedAt) {
            onUpdateNode(selectedNode.id, {
              ...selectedNode,
              config: {
                ...selectedNode.config,
                capturedPayload: mostRecent.payload,
                selectedEventId: mostRecent.id
              }
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch payload history', e);
    } finally {
      if (showLoader) setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (['webhook', 'sheets_trigger', 'calendar', 'instagram'].includes(selectedNode?.integration?.id)) {
      fetchPayloadHistory(true);
    }
  }, [selectedNode?.id, workflowId, selectedNode?.config?.connectionId]);

  useEffect(() => {
    let intervalId;
    const isActuallyListening = isPublished ? true : (selectedNode?.config?.isListening || false);
    
    if (['webhook', 'sheets_trigger', 'instagram'].includes(selectedNode?.integration?.id) && isActuallyListening && workflowId && workflowId !== 'new') {
      intervalId = setInterval(() => {
        fetchPayloadHistory(false);
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedNode?.integration?.id, selectedNode?.config?.isListening, workflowId, selectedNode?.id, isPublished]);

  if (!selectedNode) return null;
  


  useEffect(() => {
    const fetchEventTypes = async () => {
      const connId = selectedNode?.config?.connectionId;
      const provider = selectedNode?.integration?.id;
      
      if (connId && provider === 'calendly') {
        setLoadingEventTypes(true);
        try {
          const { getIntegrationData } = await import('@/actions/connections');
          const res = await getIntegrationData(connId, 'events');
          if (res.success) {
            setEventTypes(res.data.map(e => ({ value: e.url, label: e.name })));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingEventTypes(false);
        }
      }
    };
    fetchEventTypes();
  }, [selectedNode?.config?.connectionId, selectedNode?.integration?.id]);

  // Google Sheets Metadata Auto-Fetcher
  useEffect(() => {
    const fetchSheets = async () => {
      const spreadsheetId = selectedNode?.config?.spreadsheetId;
      const actionType = selectedNode?.config?.actionType || 'WRITE';
      
      if (spreadsheetId && ['sheets', 'sheets_trigger'].includes(selectedNode?.integration?.id)) {
        // Don't fetch if creating a new sheet
        if (actionType === 'CREATE_SHEET') return;
        
        setLoadingSheets(true);
        try {
          const res = await fetch(`/api/integrations/google/public-sheet-meta?sheetId=${spreadsheetId}&_t=${Date.now()}`);
          const data = await res.json();
          if (data.success) {
            setAvailableSheets(data.sheets.map(s => ({ value: s, label: s })));
            if (data.spreadsheetName && data.spreadsheetName !== selectedNode?.config?.spreadsheetName) {
              onUpdateNode(selectedNode.id, { ...selectedNode, config: { ...selectedNode.config, spreadsheetName: data.spreadsheetName }});
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingSheets(false);
        }
      }
    };
    fetchSheets();
  }, [selectedNode?.config?.spreadsheetId, selectedNode?.config?.actionType, selectedNode?.integration?.id]);

  useEffect(() => {
    const fetchHeaders = async () => {
      const spreadsheetId = selectedNode?.config?.spreadsheetId;
      const sheetName = selectedNode?.config?.range;
      const actionType = selectedNode?.config?.actionType || 'WRITE';
      
      if (spreadsheetId && sheetName && ['sheets', 'sheets_trigger'].includes(selectedNode?.integration?.id)) {
        // Only fetch headers for actions that map columns or search, and always for sheets_trigger
        if (selectedNode?.integration?.id === 'sheets' && !['WRITE', 'UPDATE', 'READ', 'DELETE'].includes(actionType)) return;
        
        setLoadingHeaders(true);
        try {
          const res = await fetch(`/api/integrations/google/public-sheet-meta?sheetId=${spreadsheetId}&sheetName=${encodeURIComponent(sheetName)}&_t=${Date.now()}`);
          const data = await res.json();
          if (data.success && data.headers) {
            setAvailableHeaders(data.headers);
            
            // Auto-populate mapping if it's currently empty and action is WRITE or UPDATE
            if (['WRITE', 'UPDATE'].includes(actionType)) {
              const currentMapping = selectedNode?.config?.rowDataMapping || [];
              if (currentMapping.length === 0 && data.headers.length > 0) {
                const autoMap = data.headers.map(h => ({ key: h, value: '' }));
                onUpdateNode(selectedNode.id, { ...selectedNode, config: { ...selectedNode.config, rowDataMapping: autoMap }});
              }
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingHeaders(false);
        }
      }
    };
    
    // We only want to trigger this if the sheetName genuinely changes, but it's bound to config.range
    // Using a timeout prevents spamming if the user is typing the sheet name manually
    const timer = setTimeout(() => {
      fetchHeaders();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedNode?.config?.spreadsheetId, selectedNode?.config?.range, selectedNode?.config?.actionType, selectedNode?.integration?.id, selectedNode?.id]);

  if (!selectedNode) return null;

  const getAncestors = (nodeId) => {
    const ancestors = [];
    let currentId = nodeId;
    while (currentId) {
      const currentNode = nodes.find(n => n.id === currentId);
      if (currentNode && currentNode.parentId) {
        const parentNode = nodes.find(n => n.id === currentNode.parentId);
        if (parentNode) ancestors.unshift(parentNode);
        currentId = currentNode.parentId;
      } else {
        break;
      }
    }
    return ancestors;
  };

  const ancestors = getAncestors(selectedNode.id);
  const variableGroups = [];

  ancestors.forEach((anc, index) => {
    const stepNumber = index + 1;
    const group = {
      stepId: anc.id,
      stepName: `${stepNumber}. ${anc.title || anc.integration?.name || 'Step'}`,
      variables: []
    };

    const flattenObject = (obj, prefix = '', isAction = false, ancId = '') => {
      let result = [];
      Object.entries(obj).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result = result.concat(flattenObject(value, newPrefix, isAction, ancId));
        } else {
          let exampleStr = value;
          if (Array.isArray(value)) {
            exampleStr = `[Array(${value.length})]`;
            // Recurse into array to expose individual elements (like result.0, result.1)
            result = result.concat(flattenObject(value, newPrefix, isAction, ancId));
          } else if (value === null) {
            exampleStr = 'null';
          }
          
          result.push({
            id: isAction ? `steps.${ancId}.${newPrefix}` : `trigger.body.${newPrefix}`,
            label: newPrefix,
            example: exampleStr
          });
        }
      });
      return result;
    };

    if (anc.type === 'TRIGGER') {
      const tId = anc.integration?.id;
      const tConfig = anc.config || {};
      
      if (tId === 'webhook' && tConfig.capturedPayload) {
        try {
          group.variables.push(...flattenObject(tConfig.capturedPayload));
        } catch (e) {
          console.error(e);
        }
      } else if (tId === 'typeform' && tConfig.capturedPayload) {
        // If typeform has captured data in the future
      } else if (tId === 'calendar') {
        if (!tConfig.capturedPayload) {
          group.variables.push(
             { id: 'trigger.body.invitee_email', label: 'invitee_email', example: 'user@example.com' },
             { id: 'trigger.body.invitee_name', label: 'invitee_name', example: 'John Doe' },
             { id: 'trigger.body.start_time', label: 'start_time', example: '2026-12-01T10:00:00Z' }
          );
          
          // Dynamically fetch questions from the selected calendar schema if builtin
          let questionsSchema = [];
          if (tConfig.provider === 'builtin' && selectedAutomatixCalendar?.questions) {
            questionsSchema = selectedAutomatixCalendar.questions;
          } else if (Array.isArray(tConfig.questions)) {
            // Fallback for legacy configs
            questionsSchema = tConfig.questions;
          }

          if (Array.isArray(questionsSchema)) {
             questionsSchema.forEach(q => {
                if (q.label) {
                  group.variables.push({
                     id: `trigger.body.questions.${q.label}`,
                     label: `questions.${q.label}`,
                     example: 'User Answer'
                  });
                }
                if (q.isHidden && q.urlParamMap) {
                   group.variables.push({
                      id: `trigger.body.url_params.${q.urlParamMap}`,
                      label: `url_params.${q.urlParamMap}`,
                      example: 'Auto-captured Value'
                   });
                }
             });
          }
        }
        
        if (tConfig.capturedPayload) {
          try {
            group.variables.push(...flattenObject(tConfig.capturedPayload));
          } catch (e) {
            console.error(e);
          }
        }
      } else if (tId === 'instagram') {
        if (!tConfig.capturedPayload) {
          group.variables.push(
            { id: 'trigger.body.entry.0.messaging.0.sender.id', label: 'sender.id', example: '1234567890' },
            { id: 'trigger.body.entry.0.messaging.0.message.text', label: 'message.text', example: 'Ready' },
            { id: 'trigger.body.entry.0.messaging.0.timestamp', label: 'timestamp', example: '1786081560276' }
          );
        }
        if (tConfig.capturedPayload) {
          try {
            group.variables.push(...flattenObject(tConfig.capturedPayload));
          } catch (e) {
            console.error(e);
          }
        }
      }
    } else if (anc.type === 'ACTION' || anc.type === 'FORMATTER' || anc.integration?.id?.includes('formatter')) {
      if (anc.testResult?.data && typeof anc.testResult.data === 'object') {
        try {
          group.variables.push(...flattenObject(anc.testResult.data, '', true, anc.id));
        } catch (e) {
          console.error(e);
        }
      } else {
        let exampleStr = undefined;
        if (anc.testResult?.data) {
          exampleStr = typeof anc.testResult.data === 'object' ? JSON.stringify(anc.testResult.data) : String(anc.testResult.data);
        }
        group.variables.push({ id: `steps.${anc.id}.output`, label: 'Step Output', example: exampleStr });
      }
    }

    if (group.variables.length > 0) {
      variableGroups.push(group);
    }
  });

  const renderSimulatorWidget = (title = "Simulate Incoming DM", subtitle = "Type a test message...", hideTopBorder = false, isReply = false) => {
    return (
      <div className={`pt-4 ${!hideTopBorder ? 'border-t border-white/5' : ''}`}>
        <label className="block text-[11px] font-medium text-text-secondary mb-1">{title}</label>
        {subtitle && <p className="text-[10px] text-text-tertiary mb-3">{subtitle}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={simulatedMessage}
            onChange={(e) => {
              setSimulatedMessage(e.target.value);
              setSimulationError('');
            }}
            className="flex-1 bg-black/50 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && simulatedMessage.trim()) {
                e.preventDefault();
                const msg = simulatedMessage;
                setIsSimulating(true);
                simulateInstagramDM(workflowId, msg, isReply).then((res) => {
                  setIsSimulating(false);
                  setSimulatedMessage('');
                  fetchPayloadHistory(true);
                  if (res?.ignored) {
                    const fallbackMsg = isReply ? "Simulation blocked. Your reply did not match the expected options." : "Simulation blocked. The message did not match the trigger conditions.";
                    setSimulationError(res.message || fallbackMsg);
                    toast.error(res.message || fallbackMsg);
                  } else {
                    setSimulationError('');
                    if (onSimulate) onSimulate(res);
                  }
                });
              }
            }}
          />
          <button
            type="button"
            disabled={!simulatedMessage.trim() || isSimulating}
            onClick={() => {
              const msg = simulatedMessage;
              setIsSimulating(true);
              simulateInstagramDM(workflowId, msg, isReply).then((res) => {
                setIsSimulating(false);
                setSimulatedMessage('');
                fetchPayloadHistory(true);
                if (res?.ignored) {
                  const fallbackMsg = isReply ? "Simulation blocked. Your reply did not match the expected options." : "Simulation blocked. The message did not match the trigger conditions.";
                  setSimulationError(res.message || fallbackMsg);
                  toast.error(res.message || fallbackMsg);
                } else {
                  setSimulationError('');
                  if (onSimulate) onSimulate(res);
                }
              });
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isSimulating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />} Send
          </button>
        </div>
        {simulationError && (
          <div className="mt-2 text-[10px] text-red-400 flex items-start gap-1.5 bg-red-500/10 p-2 rounded border border-red-500/20">
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span className="leading-tight">{simulationError}</span>
          </div>
        )}
      </div>
    );
  };

  const handleChange = (field, value) => {
    const newConfig = { ...selectedNode.config, [field]: value };
    
    // Clear out irrelevant delay fields when switching types to prevent canvas UI clutter
    if (field === 'delayType') {
      if (value === 'duration') {
        delete newConfig.untilDate;
        delete newConfig.eventDate;
      } else if (value === 'until') {
        delete newConfig.duration;
        delete newConfig.unit;
        delete newConfig.eventDate;
        delete newConfig.eventTiming;
      } else if (value === 'event_based') {
        delete newConfig.untilDate;
        newConfig.eventTiming = newConfig.eventTiming || 'before';
      } else if (value === 'wait_for_reply') {
        delete newConfig.untilDate;
        delete newConfig.eventDate;
        delete newConfig.eventTiming;
      }
    }

    onUpdateNode(selectedNode.id, {
      ...selectedNode,
      config: newConfig,
      issue: null
    });
  };

  const handleSaveStep = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTokenCopy = (text) => {
    navigator.clipboard.writeText(text);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const renderConfig = () => {
    const id = selectedNode.integration?.id;
    const config = selectedNode.config || {};

    switch (id) {
      case 'webhook':
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const hookUrl = config.webhookToken ? `${origin}/api/webhooks/incoming/${workflowId || 'new'}?token=${config.webhookToken}` : 'Generating link...';
        
        // Force Listening Mode ON if published
        const isListening = isPublished ? true : (config.isListening || false);

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Webhook URL</label>
              <div className="flex items-center mt-1">
                <input readOnly value={hookUrl} className="w-full bg-black/50 border border-white/10 rounded-l-md px-3 py-2 text-sm text-text-secondary font-mono focus:outline-none" />
                <button 
                  disabled={!config.webhookToken}
                  onClick={() => handleCopy(hookUrl)} 
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50 px-3 py-2 border border-l-0 border-white/10 rounded-r-md text-xs font-medium transition-colors w-16 text-center"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[10px] text-text-secondary mt-2">Send a POST request to this URL to trigger this automation.</p>
            </div>
            
            <div className="bg-black/20 p-4 rounded-md border border-white/5 space-y-4">
              <Toggle 
                label="Listening Mode (Catching for the first time)"
                checked={isListening}
                disabled={isPublished}
                onChange={(checked) => handleChange('isListening', checked)}
                description={isPublished ? "Listening mode is permanently active while workflow is published." : "Keep the webhook in listening mode to easily test and catch incoming requests."}
              />

              <div>
                <button
                  disabled={isPublished || isListening}
                  onClick={() => setIsRegenerateModalOpen(true)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20 rounded-md text-xs font-medium transition-colors"
                >
                  Regenerate Webhook Link
                </button>
                <p className="text-[10px] text-text-secondary mt-1">
                  Cannot be regenerated while Published or in Listening Mode.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-text-secondary">Recent Webhook Events</label>
                {isLoadingHistory && <Sparkles className="w-3 h-3 text-brand-primary animate-pulse" />}
              </div>
              
              {payloadHistory.length === 0 ? (
                <div className="text-[11px] text-text-tertiary bg-black/20 rounded border border-white/5 p-3 text-center">
                  No recent payloads found. Send a test request!
                </div>
              ) : (
                <Select
                  value={config.selectedEventId || (config.capturedPayload ? payloadHistory.find(h => JSON.stringify(h.payload) === JSON.stringify(config.capturedPayload))?.id || 'custom' : '')}
                  onChange={(val) => {
                    const selected = payloadHistory.find(h => h.id === val);
                    if (selected) {
                      onUpdateNode(selectedNode.id, {
                        ...selectedNode,
                        config: {
                          ...selectedNode.config,
                          capturedPayload: selected.payload,
                          selectedEventId: selected.id
                        }
                      });
                    }
                  }}
                  options={payloadHistory.map((item) => ({
                    value: item.id,
                    label: `Request #${item.id.split('-')[0]} - ${new Date(item.createdAt).toLocaleString()}`
                  }))}
                />
              )}
            </div>

            {config.capturedPayload && (
              <div className="bg-black/20 p-4 rounded-md border border-brand-primary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-brand-primary">Selected Payload Schema</label>
                  <button
                    onClick={() => {
                      onUpdateNode(selectedNode.id, {
                        ...selectedNode,
                        config: {
                          ...selectedNode.config,
                          capturedPayload: null,
                          clearedAt: Date.now(),
                          selectedEventId: null,
                          isListening: true
                        }
                      });
                    }}
                    className="text-[10px] text-text-secondary hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Selection
                  </button>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-md p-3 overflow-auto max-h-64 custom-scrollbar">
                  <pre className="text-[11px] text-text-secondary font-mono leading-relaxed">
                    {JSON.stringify(config.capturedPayload, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <ConfirmModal
              isOpen={isRegenerateModalOpen}
              onClose={() => setIsRegenerateModalOpen(false)}
              onConfirm={() => {
                setIsRegenerateModalOpen(false);
                onUpdateNode(selectedNode.id, {
                  ...selectedNode,
                  config: {
                    ...selectedNode.config,
                    webhookToken: crypto.randomUUID().replace(/-/g, '')
                  }
                });
              }}
              title="Regenerate Webhook Link"
              message="Are you sure? Any existing external applications sending data to the old URL will fail."
              confirmText="Regenerate"
              isDestructive={true}
            />

            <ConfirmModal
              isOpen={!!sheetToClear}
              onClose={() => setSheetToClear(null)}
              onConfirm={() => {
                if (sheetToClear === 'trigger') {
                  onUpdateNode(selectedNode.id, {
                    ...selectedNode,
                    config: {
                      ...selectedNode.config,
                      sheetUrl: '',
                      spreadsheetId: '',
                      range: ''
                    }
                  });
                } else if (sheetToClear === 'action') {
                  onUpdateNode(selectedNode.id, {
                    ...selectedNode,
                    config: {
                      ...selectedNode.config,
                      sheetUrl: '',
                      spreadsheetId: '',
                      range: '',
                      rowDataMapping: [],
                      newSheetName: '',
                      searchQuery: ''
                    }
                  });
                }
                setSheetToClear(null);
              }}
              title="Change Connected Sheet"
              message="Are you sure you want to change the connected sheet? This will clear your current configuration for this step."
              confirmText="Change Sheet"
              isDestructive={true}
            />

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Trigger Event</label>
              <Select 
                value={config.triggerEvent || 'POST'} 
                onChange={(val) => handleChange('triggerEvent', val)}
                options={[
                  { value: 'POST', label: 'Any POST Request' },
                  { value: 'GET', label: 'Any GET Request' },
                  { value: 'ALL', label: 'Any HTTP Method' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Expected JSON Schema (Optional)</label>
              <textarea rows={4} placeholder="{}" value={config.schema || ''} onChange={(e) => handleChange('schema', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-accent-blue resize-none" />
            </div>
          </div>
        );

    case 'sheets_trigger':
        const method = config.method || 'polling';
        const sheetsOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const sheetsHookUrl = config.webhookToken ? `${sheetsOrigin}/api/webhooks/incoming/${workflowId || 'new'}?token=${config.webhookToken}` : 'Generating link...';
        
        const handleTriggerUrlChange = (val) => {
          handleChange('sheetUrl', val);
          const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match && match[1]) {
             handleChange('spreadsheetId', match[1]);
          }
        };

        const appsScriptCode = `function setupTrigger() {\n  ScriptApp.newTrigger('onEditRow')\n    .forSpreadsheet(SpreadsheetApp.getActive())\n    .onEdit()\n    .create();\n}\n\nfunction onEditRow(e) {\n  var sheet = e.source.getActiveSheet();\n  if (sheet.getName() !== "${config.range || 'Sheet1'}") return;\n  \n  var row = e.range.getRow();\n  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];\n${config.triggerColumn ? `  var triggerColIndex = headers.indexOf("${config.triggerColumn}");\n  if (triggerColIndex !== -1 && e.range.getColumn() !== (triggerColIndex + 1)) return;\n` : ''}  \n  var data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];\n  \n  var payload = {};\n  for (var i = 0; i < headers.length; i++) {\n    payload[headers[i]] = data[i];\n  }\n\n  UrlFetchApp.fetch("${sheetsHookUrl}", {\n    method: "post",\n    contentType: "application/json",\n    payload: JSON.stringify(payload)\n  });\n}`;
        const currentSignature = `${config.spreadsheetId}-${config.range}-${config.triggerColumn || ''}`;

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Trigger Event</label>
              <Select 
                value={config.triggerEvent || 'row_added_updated'} 
                onChange={(val) => handleChange('triggerEvent', val)}
                options={[
                  { value: 'row_added_updated', label: 'A new row is Added/Updated in a spreadsheet' }
                ]}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Trigger Method</label>
              <Select 
                value={method} 
                onChange={(val) => handleChange('method', val)}
                options={[
                  { value: 'polling', label: '1-Minute Polling (No Code)' },
                  { value: 'webhook', label: 'Real-Time (Apps Script)' }
                ]}
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md mb-2">
               <p className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
                 <AlertCircle className="w-4 h-4" />
                 Public Access Required
               </p>
               <p className="text-[10px] text-amber-400 mt-1">
                 You must set your Google Sheet sharing settings to "Anyone with the link can edit" for this to work. No Google account connection required!
               </p>
            </div>
            
            {!config.spreadsheetId && pseudoConnections.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-text-secondary mb-1">Select from Connections</label>
                <Select 
                  value=""
                  onChange={(val) => {
                    if (val) {
                      const sheet = pseudoConnections.find(s => s.id === val);
                      if (sheet) {
                        onUpdateNode(selectedNode.id, {
                          ...selectedNode,
                          config: {
                            ...selectedNode.config,
                            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`,
                            spreadsheetId: sheet.id,
                            spreadsheetName: sheet.name
                          }
                        });
                      }
                    }
                  }}
                  options={[
                    { value: '', label: 'Select a previously used sheet...' },
                    ...pseudoConnections.map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
                <p className="text-[10px] text-text-tertiary mt-1">
                  Select a previously added Google Sheet from your connections to auto-fill the URL below.
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Google Sheet URL</label>
              {config.spreadsheetId ? (
                <div className="bg-black/50 border border-white/10 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-green-400 flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>
                      {config.spreadsheetName && <p className="text-sm font-medium text-white truncate max-w-[200px]" title={config.spreadsheetName}>{config.spreadsheetName}</p>}
                      <p className="text-[10px] text-text-tertiary truncate max-w-[200px]" title={config.spreadsheetId}>ID: {config.spreadsheetId}</p>
                    </div>
                    <button 
                      onClick={() => setSheetToClear('trigger')}
                      className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded transition-colors whitespace-nowrap flex-shrink-0 ml-2"
                    >
                      Change Sheet
                    </button>
                  </div>
                </div>
              ) : (
                <input 
                   type="text" 
                   placeholder="https://docs.google.com/spreadsheets/d/..."
                   value={config.sheetUrl || ''} 
                   onChange={(e) => handleTriggerUrlChange(e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                />
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Worksheet Tab
              </label>
              {availableSheets.length > 0 ? (
                <Select 
                  value={config.range || ''} 
                  onChange={(val) => handleChange('range', val)}
                  options={availableSheets}
                />
              ) : (
                <input 
                   type="text" 
                   placeholder={loadingSheets ? "Fetching sheets..." : "e.g. Sheet1"}
                   value={config.range || ''} 
                   onChange={(e) => handleChange('range', e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
                   disabled={loadingSheets}
                />
              )}
              {loadingSheets && <p className="text-[10px] text-text-tertiary mt-1 animate-pulse">Loading sheets...</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Trigger Column (Optional)
              </label>
              <p className="text-[10px] text-text-tertiary mb-2">If selected, the trigger will only fire when a cell in this specific column is edited.</p>
              {availableHeaders.length > 0 ? (
                <Select 
                  value={config.triggerColumn || ''} 
                  onChange={(val) => handleChange('triggerColumn', val)}
                  options={[{ value: '', label: 'Any Column' }, ...availableHeaders.map(h => ({ value: h, label: h }))]}
                />
              ) : (
                <input 
                   type="text" 
                   placeholder={loadingHeaders ? "Fetching columns..." : "e.g. Email"}
                   value={config.triggerColumn || ''} 
                   onChange={(e) => handleChange('triggerColumn', e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
                   disabled={loadingHeaders}
                />
              )}
              {loadingHeaders && <p className="text-[10px] text-text-tertiary mt-1 animate-pulse">Loading columns...</p>}
            </div>

            {method === 'webhook' ? (
              <div className="bg-black/20 p-4 rounded-md border border-white/5 space-y-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Webhook URL</label>
                  <input readOnly value={sheetsHookUrl} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-xs text-text-secondary font-mono focus:outline-none" />
                </div>
                

                {config.lastCopiedSignature && config.lastCopiedSignature !== currentSignature && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-md">
                    <p className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Sheet Configuration Changed!
                    </p>
                    <p className="text-[10px] text-red-300 mt-1">
                      You have changed the spreadsheet, worksheet tab, or trigger column. You <strong>MUST</strong> copy the updated Apps Script code below and paste it into the Apps Script editor of your sheet for the trigger to work properly.
                    </p>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-text-secondary flex items-center gap-2">
                      Apps Script Code
                      <button 
                        onClick={() => setIsCodeCollapsed(!isCodeCollapsed)}
                        className="text-[10px] text-text-tertiary hover:text-white transition-colors"
                      >
                        {isCodeCollapsed ? '(Expand)' : '(Collapse)'}
                      </button>
                    </label>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsGuideModalOpen(true)}
                        className="text-[10px] text-accent-blue hover:text-white transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Learn How?
                      </button>
                      <button 
                        onClick={() => {
                          handleCopy(appsScriptCode);
                          handleChange('lastCopiedSignature', currentSignature);
                        }}
                        className="flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded transition-colors"
                      >
                        <Copy className="w-3 h-3" /> {copied ? 'Copied' : 'Copy Code'}
                      </button>
                    </div>
                  </div>
                  {!isCodeCollapsed && (
                    <textarea 
                      readOnly 
                      rows={8} 
                      className="w-full bg-black/50 border border-white/10 rounded-md p-3 text-[10px] text-accent-blue font-mono focus:outline-none resize-none custom-scrollbar"
                      value={appsScriptCode}
                    />
                  )}
                </div>
                
                {/* Webhook History UI (Shared with generic Webhook) */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-text-secondary">Recent Webhook Events</label>
                    {isLoadingHistory && <Sparkles className="w-3 h-3 text-brand-primary animate-pulse" />}
                  </div>
                  
                  {payloadHistory.length === 0 ? (
                    <div className="text-[11px] text-text-tertiary bg-black/20 rounded border border-white/5 p-3 text-center">
                      No recent payloads found. Waiting for row edits...
                    </div>
                  ) : (
                    <Select
                      value={config.selectedEventId || (config.capturedPayload ? payloadHistory.find(h => JSON.stringify(h.payload) === JSON.stringify(config.capturedPayload))?.id || 'custom' : '')}
                      onChange={(val) => {
                        const selected = payloadHistory.find(h => h.id === val);
                        if (selected) {
                          onUpdateNode(selectedNode.id, {
                            ...selectedNode,
                            config: {
                              ...selectedNode.config,
                              capturedPayload: selected.payload,
                              selectedEventId: selected.id
                            }
                          });
                        }
                      }}
                      options={payloadHistory.map((item) => ({
                        value: item.id,
                        label: `Row Edit #${item.id.split('-')[0]} - ${new Date(item.createdAt).toLocaleString()}`
                      }))}
                    />
                  )}
                </div>

                {config.capturedPayload && (
                  <div className="bg-black/20 p-4 rounded-md border border-brand-primary/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-medium text-brand-primary">Selected Payload Schema</label>
                      <button
                        onClick={() => {
                          onUpdateNode(selectedNode.id, {
                            ...selectedNode,
                            config: {
                              ...selectedNode.config,
                              capturedPayload: null,
                              clearedAt: Date.now(),
                              selectedEventId: null,
                              isListening: true
                            }
                          });
                        }}
                        className="text-[10px] text-text-secondary hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear Selection
                      </button>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-md p-3 overflow-auto max-h-64 custom-scrollbar">
                      <pre className="text-[11px] text-text-secondary font-mono leading-relaxed">
                        {JSON.stringify(config.capturedPayload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-500/10 p-3 rounded-md border border-blue-500/20">
                <p className="text-[11px] text-blue-400">
                  <strong className="font-semibold block mb-1">Polling Active</strong>
                  Automatix will check this sheet for new rows every minute in the background once published.
                </p>
              </div>
            )}
            
            <GoogleSheetsGuideModal 
              isOpen={isGuideModalOpen} 
              onClose={() => setIsGuideModalOpen(false)} 
            />
          </div>
        );

      case 'calendar':
        const provider = config.provider || 'builtin';
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Calendar Provider</label>
              <Select 
                value={provider} 
                onChange={(val) => {
                  const newConfig = { ...config, provider: val };
                  if (val !== 'builtin') {
                    // Clear stale builtin config when switching away
                    delete newConfig.meetingType;
                    delete newConfig.description;
                    delete newConfig.platform;
                    delete newConfig.questions;
                    delete newConfig.redirectUrl;
                    delete newConfig.themeColor;
                    delete newConfig.buttonStyle;
                  }
                  handleChange('provider', val);
                  // Apply cleanup
                  onUpdateNode(selectedNode.id, {
                    ...selectedNode,
                    config: newConfig
                  });
                }}
                options={[
                  { value: 'builtin', label: 'Automatix Calendar (Premium)' },
                  { value: 'calendly', label: 'Calendly' },
                  { value: 'calcom', label: 'Cal.com' }
                ]}
              />
            </div>

            {provider === 'builtin' && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Select Event</label>
                  <Select 
                    value={config.connectionId || ''}
                    onChange={(val) => {
                      handleChange('connectionId', val);
                      if (val) {
                        const selectedCal = automatixCalendars.find(c => c.id === val);
                        if (selectedCal) {
                          handleChange('calendarName', selectedCal.name);
                        }
                      } else {
                        handleChange('calendarName', null);
                      }
                    }}
                    disabled={automatixCalendars.length === 0}
                    options={[
                      { value: '', label: automatixCalendars.length === 0 ? '-- No calendars available --' : '-- Select Calendar --' },
                      ...automatixCalendars.map(c => ({ value: c.id, label: c.name }))
                    ]}
                  />
                </div>
                
                {config.connectionId && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Trigger Event</label>
                    <Select 
                      value={config.triggerEvent || ''} 
                      onChange={(val) => handleChange('triggerEvent', val)}
                      options={[
                        { value: 'invitee.created', label: 'Invitee Created (New Meeting)' },
                        { value: 'invitee.canceled', label: 'Invitee Canceled' },
                        { value: 'invitee.rescheduled', label: 'Invitee Rescheduled' }
                      ]}
                    />
                  </div>
                )}

                <div className="bg-black/50 border border-white/10 p-4 rounded-lg flex flex-col gap-3 mt-4">
                   <p className="text-[11px] text-text-secondary leading-relaxed">Automatix Calendars are created and managed entirely from your Calendars page.</p>
                   <Link href={config.connectionId ? `/dashboard/calendars?edit=${config.connectionId}` : "/dashboard/calendars"} target="_blank" className="bg-white/5 border border-white/10 py-2 rounded-md text-sm text-center font-medium hover:bg-white/10 transition-colors block w-full text-white">
                     Manage Automatix Calendars
                   </Link>
                </div>

                {config.connectionId && (
                  <div className="pt-2 border-t border-white/5 space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-text-secondary">Recent Bookings</label>
                      {isLoadingHistory && <Sparkles className="w-3 h-3 text-brand-primary animate-pulse" />}
                    </div>
                    
                    {payloadHistory.length === 0 ? (
                      <div className="text-[11px] text-text-tertiary bg-black/20 rounded border border-white/5 p-3 text-center">
                        No recent bookings found. Schedule an event first!
                      </div>
                    ) : (
                      <Select
                        value={config.selectedEventId || (config.capturedPayload ? payloadHistory.find(h => JSON.stringify(h.payload) === JSON.stringify(config.capturedPayload))?.id || 'custom' : '')}
                        onChange={(val) => {
                          const selected = payloadHistory.find(h => h.id === val);
                          if (selected) {
                            onUpdateNode(selectedNode.id, {
                              ...selectedNode,
                              config: {
                                ...selectedNode.config,
                                capturedPayload: selected.payload,
                                selectedEventId: selected.id
                              }
                            });
                          }
                        }}
                        options={payloadHistory.map((item) => ({
                          value: item.id,
                          label: `Booking - ${new Date(item.createdAt).toLocaleString()}`
                        }))}
                      />
                    )}
                  </div>
                )}
                
                {config.capturedPayload && (
                  <div className="bg-black/20 p-4 rounded-md border border-brand-primary/30 space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-medium text-brand-primary">Selected Payload Schema</label>
                      <button
                        onClick={() => {
                          onUpdateNode(selectedNode.id, {
                            ...selectedNode,
                            config: {
                              ...selectedNode.config,
                              capturedPayload: null,
                              clearedAt: Date.now(),
                              selectedEventId: null
                            }
                          });
                        }}
                        className="text-[10px] text-text-secondary hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear Selection
                      </button>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-md p-3 overflow-auto max-h-64 custom-scrollbar">
                      <pre className="text-[11px] text-text-secondary font-mono leading-relaxed">
                        {JSON.stringify(config.capturedPayload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
            {provider !== 'builtin' && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <ConnectIntegration 
                  provider={provider === 'calendly' ? 'Calendly' : 'Cal.com'} 
                  selectedConnectionId={config.connectionId}
                  onConnectionSelect={(id) => handleChange('connectionId', id)}
                />
                
                {config.connectionId && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Trigger Event</label>
                      <Select 
                        value={config.triggerEvent || ''} 
                        onChange={(val) => handleChange('triggerEvent', val)}
                        options={provider === 'calendly' ? [
                          { value: 'invitee.created', label: 'Invitee Created (New Meeting)' },
                          { value: 'invitee.canceled', label: 'Invitee Canceled' },
                          { value: 'routing_form_submission.created', label: 'Routing Form Submitted' }
                        ] : [
                          { value: 'booking.created', label: 'Booking Created' }
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Select Event Link</label>
                      {loadingEvents ? (
                        <div className="flex items-center gap-2 text-xs text-text-secondary bg-black/20 p-3 rounded-md border border-white/5">
                          <span className="w-3 h-3 border-2 border-white/20 border-t-accent-blue rounded-full animate-spin"></span> Fetching events...
                        </div>
                      ) : (
                        <Select 
                          value={config.eventLink || ''} 
                          onChange={(val) => handleChange('eventLink', val)}
                          options={[
                            { value: '', label: 'Select an event...' },
                            ...events.map(event => ({ value: event.url, label: event.name }))
                          ]}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'instagram':
      case 'instagram_action':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Instagram Account</label>
              <ConnectIntegration 
                provider="Instagram" 
                selectedConnectionId={config.connectionId}
                onConnectionSelect={(id) => handleChange('connectionId', id)}
              />
              <button 
                type="button" 
                onClick={() => setIsConnectionGuideOpen(true)} 
                className="mt-2 text-[10px] text-accent-blue hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" /> Need help? View setup guide
              </button>
            </div>
            
            {id === 'instagram' && (
              <div className="bg-black/20 p-4 rounded-md border border-white/5 space-y-4 mb-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Webhook URL</label>
                  <div className="flex items-center mt-1 mb-3">
                    <input 
                      readOnly 
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'https://automatix.com'}/api/webhooks/meta`} 
                      className="w-full bg-black/50 border border-white/10 rounded-l-md px-3 py-2 text-xs text-text-secondary font-mono focus:outline-none" 
                    />
                    <button 
                      onClick={() => handleCopy(`${typeof window !== 'undefined' ? window.location.origin : 'https://automatix.com'}/api/webhooks/meta`)} 
                      className="bg-white/10 hover:bg-white/20 px-3 py-2 border border-l-0 border-white/10 rounded-r-md text-xs font-medium transition-colors w-16 text-center"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <label className="block text-xs text-text-secondary mb-1">Verify Token</label>
                  <div className="flex items-center mt-1">
                    <input 
                      readOnly 
                      value={`automatix_secure_meta_token_123`} 
                      className="w-full bg-black/50 border border-white/10 rounded-l-md px-3 py-2 text-xs text-text-secondary font-mono focus:outline-none" 
                    />
                    <button 
                      onClick={() => handleTokenCopy(`automatix_secure_meta_token_123`)} 
                      className="bg-white/10 hover:bg-white/20 px-3 py-2 border border-l-0 border-white/10 rounded-r-md text-xs font-medium transition-colors w-16 text-center"
                    >
                      {tokenCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    <p className="text-[10px] text-text-tertiary">Paste this URL in your Meta App Webhook settings.</p>
                    <button 
                      onClick={() => setIsWebhookGuideOpen(true)}
                      className="text-[10px] text-accent-blue hover:underline flex items-center gap-1 w-fit"
                    >
                      <Globe className="w-3 h-3" />
                      Need help? View setup guide
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-4">
                  <Toggle 
                    label="Listening Mode (Catching for the first time)"
                    checked={isPublished ? true : (config.isListening || false)}
                    disabled={isPublished || !config.webhookToken}
                    onChange={(checked) => handleChange('isListening', checked)}
                    description={isPublished ? "Listening mode is permanently active while workflow is published." : "Keep the trigger in listening mode to easily test and catch incoming DMs."}
                  />
                  {config.isListening && !isPublished && (
                    renderSimulatorWidget("Simulate Incoming DM", "Send a test message to instantly capture fields to use as variables.", false, false)
                  )}
                </div>
              </div>
            )}
            
            {id === 'instagram' && (
              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-text-secondary">Recent Instagram Events</label>
                  {isLoadingHistory && <Sparkles className="w-3 h-3 text-brand-primary animate-pulse" />}
                </div>
                
                {payloadHistory.length === 0 ? (
                  <div className="text-[11px] text-text-tertiary bg-black/20 rounded border border-white/5 p-3 text-center">
                    No recent payloads found. Turn on Listening Mode and send a message!
                  </div>
                ) : (
                  <Select
                    value={config.selectedEventId || (config.capturedPayload ? payloadHistory.find(h => JSON.stringify(h.payload) === JSON.stringify(config.capturedPayload))?.id || 'custom' : '')}
                    onChange={(val) => {
                      const selected = payloadHistory.find(h => h.id === val);
                      if (selected) {
                        onUpdateNode(selectedNode.id, {
                          ...selectedNode,
                          config: {
                            ...selectedNode.config,
                            capturedPayload: selected.payload,
                            selectedEventId: selected.id
                          }
                        });
                      }
                    }}
                    options={payloadHistory.map((item) => ({
                      value: item.id,
                      label: `Request #${item.id.split('-')[0]} - ${new Date(item.createdAt).toLocaleString()}`
                    }))}
                  />
                )}
              </div>
            )}

            {id === 'instagram' && config.capturedPayload && (
              <div className="bg-black/20 p-4 rounded-md border border-brand-primary/30 space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-brand-primary">Selected Payload Schema</label>
                  <button
                    onClick={() => {
                      onUpdateNode(selectedNode.id, {
                        ...selectedNode,
                        config: {
                          ...selectedNode.config,
                          capturedPayload: null,
                          clearedAt: Date.now(),
                          selectedEventId: null,
                          isListening: true
                        }
                      });
                    }}
                    className="text-[10px] text-text-tertiary hover:text-white transition-colors"
                  >
                    Clear Data
                  </button>
                </div>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                  <pre className="text-[10px] text-text-secondary font-mono whitespace-pre-wrap">
                    {JSON.stringify(config.capturedPayload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {id === 'instagram_action' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Recipient Type</label>
                  <Select
                    value={config.recipientType || 'id'}
                    onChange={(val) => handleChange('recipientType', val)}
                    options={[
                      { value: 'id', label: 'Instagram Profile ID (IGSID)' },
                      { value: 'link', label: 'Instagram Profile Link' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    {config.recipientType === 'link' ? 'Recipient Profile Link or Map from previous step' : 'Recipient ID (IGSID) or Map from previous step'}
                  </label>
                  <VariableInput 
                    placeholder={config.recipientType === 'link' ? "https://instagram.com/username" : "{{trigger.sender.id}}"} 
                    value={config.recipient || ''} 
                    onChange={(val) => handleChange('recipient', val)} 
                    variables={variableGroups} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Message Type</label>
                  <Select
                    value={config.messageType || 'text'}
                    onChange={(val) => handleChange('messageType', val)}
                    options={[
                      { value: 'text', label: 'Normal Text Reply' },
                      { value: 'media', label: 'Media Reply (Image/Video)' },
                      { value: 'quiz', label: 'Quiz / Question' }
                    ]}
                  />
                </div>
                
                {config.messageType === 'media' && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Media URL (Image or Video)</label>
                    <VariableInput placeholder="https://example.com/image.jpg" value={config.mediaUrl || ''} onChange={(val) => handleChange('mediaUrl', val)} variables={variableGroups} />
                  </div>
                )}
                
                {config.messageType === 'quiz' && (
                  <div className="space-y-4 p-3 bg-black/20 rounded-md border border-white/5">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Question Type</label>
                      <Select
                        value={config.questionType || 'text_input'}
                        onChange={(val) => handleChange('questionType', val)}
                        options={[
                          { value: 'text_input', label: 'Text Input' },
                          { value: 'multiple_choice', label: 'Choices / Buttons' },
                        ]}
                      />
                    </div>
                    {config.questionType === 'multiple_choice' && (
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">Options (Comma separated)</label>
                        <VariableInput placeholder="Yes, No, Maybe" value={config.options || ''} onChange={(val) => handleChange('options', val)} variables={variableGroups} />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Message Text {config.messageType === 'quiz' && '(Your Question)'}</label>
                  <VariableInput multiline rows={4} placeholder="Hi {{trigger.name}}! Thanks for the DM..." value={config.message || ''} onChange={(val) => handleChange('message', val)} variables={variableGroups} />
                </div>
                
                {renderSimulatorWidget("Simulate User Reply", "Type a test reply to see how the workflow responds.", true, true)}
              </>
            ) : (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Trigger Condition</label>
                <Select 
                  value={config.condition || 'any'} 
                  onChange={(val) => handleChange('condition', val)}
                  options={[
                    { value: 'any', label: 'Any New Message' },
                    { value: 'keyword', label: 'Contains Keyword' },
                    { value: 'exact', label: 'Exact Match' }
                  ]}
                />
                {config.condition && config.condition !== 'any' && (
                  <div className="mt-2 space-y-2">
                    <input type="text" placeholder="Ready, Start, &quot;Lets begin&quot;..." value={config.keyword || ''} onChange={(e) => handleChange('keyword', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" />
                    <p className="text-[10px] text-text-tertiary mt-1.5 leading-tight">
                      Use commas for multiple keywords. Wrap exact phrases in double quotes (e.g. <span className="text-white/60">"Lets begin"</span>).
                    </p>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-white/90">Case Sensitive</span>
                        <Toggle 
                          checked={config.caseSensitive || false} 
                          onChange={(val) => handleChange('caseSensitive', val)} 
                        />
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        If enabled, capitalization matters. For example, if your keyword is <strong className="text-white/70">&quot;Ready&quot;</strong>, a user sending <strong className="text-white/70">&quot;ready&quot;</strong> will NOT trigger this automation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'formatter_text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Input Text</label>
              <VariableInput placeholder="{{trigger.data}}" value={config.input || ''} onChange={(val) => handleChange('input', val)} variables={variableGroups} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Operation</label>
              <Select 
                value={config.operation || 'capitalize'} 
                onChange={(val) => handleChange('operation', val)}
                options={[
                  { value: 'capitalize', label: 'Capitalize (Title Case)' },
                  { value: 'lowercase', label: 'Lowercase' },
                  { value: 'uppercase', label: 'Uppercase' },
                  { value: 'replace', label: 'Replace String' },
                  { value: 'trim', label: 'Trim Whitespace' },
                  { value: 'split', label: 'Split Text' },
                  { value: 'length', label: 'Text Length' },
                  { value: 'remove_html', label: 'Remove HTML Tags' },
                  { value: 'encode_uri', label: 'URL Encode' },
                  { value: 'decode_uri', label: 'URL Decode' },
                  { value: 'default_value', label: 'Default Value' },
                  { value: 'find', label: 'Find in Text' },
                  { value: 'html_to_markdown', label: 'HTML to Markdown' },
                  { value: 'parse', label: 'Text Parser (Match Before/After)' },
                  { value: 'truncate', label: 'Truncate Text' }
                ]}
              />
            </div>
            {config.operation === 'replace' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Find</label>
                  <VariableInput value={config.find || ''} onChange={(val) => handleChange('find', val)} variables={variableGroups} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Replace With</label>
                  <VariableInput value={config.replace || ''} onChange={(val) => handleChange('replace', val)} variables={variableGroups} />
                </div>
              </div>
            )}
            {config.operation === 'split' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Separator</label>
                  <input type="text" placeholder="e.g. , or -" value={config.separator || ''} onChange={(e) => handleChange('separator', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono" />
                  <p className="text-[10px] text-text-tertiary mt-1">For space, use {"{{space}}"}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Index (0=first, -1=last)</label>
                  <input type="number" placeholder="Optional" value={config.index || ''} onChange={(e) => handleChange('index', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono" />
                  <p className="text-[10px] text-text-tertiary mt-1">Leave empty to get array</p>
                </div>
              </div>
            )}
            {config.operation === 'default_value' && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-text-secondary mb-1">Default Value</label>
                <VariableInput placeholder="Fallback if input is empty" value={config.defaultValue || ''} onChange={(val) => handleChange('defaultValue', val)} variables={variableGroups} />
              </div>
            )}
            {config.operation === 'find' && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-text-secondary mb-1">Search String</label>
                <VariableInput value={config.find || ''} onChange={(val) => handleChange('find', val)} variables={variableGroups} />
              </div>
            )}
            {config.operation === 'parse' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Text Match: After</label>
                  <VariableInput value={config.matchAfter || ''} onChange={(val) => handleChange('matchAfter', val)} variables={variableGroups} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Text Match: Before</label>
                  <VariableInput value={config.matchBefore || ''} onChange={(val) => handleChange('matchBefore', val)} variables={variableGroups} />
                </div>
              </div>
            )}
            {config.operation === 'truncate' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Max Length</label>
                  <input type="number" placeholder="e.g. 50" value={config.maxLength || ''} onChange={(e) => handleChange('maxLength', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Append Ellipsis</label>
                  <Select 
                    value={config.appendEllipsis !== false ? 'yes' : 'no'} 
                    onChange={(val) => handleChange('appendEllipsis', val === 'yes')}
                    options={[{ value: 'yes', label: 'Yes (...)' }, { value: 'no', label: 'No' }]}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'formatter_math':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Operation</label>
              <Select 
                value={config.operation || 'add'} 
                onChange={(val) => handleChange('operation', val)}
                options={[
                  { value: 'add', label: 'Add (+)' },
                  { value: 'subtract', label: 'Subtract (-)' },
                  { value: 'multiply', label: 'Multiply (*)' },
                  { value: 'divide', label: 'Divide (/)' },
                  { value: 'format_currency', label: 'Format as Currency' },
                  { value: 'format_number', label: 'Format Number' },
                  { value: 'format_phone', label: 'Format Phone Number' },
                  { value: 'counter', label: 'Counter (Increment/Decrement)' }
                ]}
              />
            </div>
            {config.operation === 'format_currency' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Amount</label>
                  <VariableInput placeholder="{{trigger.amount}}" value={config.amount || ''} onChange={(val) => handleChange('amount', val)} variables={variableGroups} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Currency Code</label>
                  <input type="text" placeholder="USD, EUR, GBP..." value={config.currency || ''} onChange={(e) => handleChange('currency', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" />
                </div>
              </div>
            )}
            {config.operation === 'format_number' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Number</label>
                  <VariableInput placeholder="{{trigger.amount}}" value={config.amount || ''} onChange={(val) => handleChange('amount', val)} variables={variableGroups} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Decimal Places</label>
                  <input type="number" placeholder="2" value={config.decimals || ''} onChange={(e) => handleChange('decimals', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" />
                </div>
              </div>
            )}
            {config.operation === 'format_phone' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Phone Number</label>
                  <VariableInput placeholder="e.g. 5551234567" value={config.amount || ''} onChange={(val) => handleChange('amount', val)} variables={variableGroups} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Country Code</label>
                  <input type="text" placeholder="US, GB, IN..." value={config.countryCode || ''} onChange={(e) => handleChange('countryCode', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" />
                </div>
              </div>
            )}
            {config.operation === 'counter' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Base Value</label>
                  <VariableInput placeholder="0" value={config.amount || ''} onChange={(val) => handleChange('amount', val)} variables={variableGroups} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Increment By</label>
                  <input type="number" placeholder="1" value={config.step || ''} onChange={(e) => handleChange('step', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" />
                  <p className="text-[10px] text-text-tertiary mt-1">Use negative for decrement</p>
                </div>
              </div>
            )}
            {['add', 'subtract', 'multiply', 'divide'].includes(config.operation || 'add') && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Value A</label>
                  <VariableInput value={config.valA || ''} onChange={(val) => handleChange('valA', val)} variables={variableGroups} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Value B</label>
                  <VariableInput value={config.valB || ''} onChange={(val) => handleChange('valB', val)} variables={variableGroups} />
                </div>
              </div>
            )}
          </div>
        );

      case 'formatter_extract':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Source Text</label>
              <VariableInput multiline rows={3} placeholder="The raw text or {{variable}}" value={config.source || ''} onChange={(val) => handleChange('source', val)} variables={variableGroups} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Extraction Type</label>
              <Select 
                value={config.type || 'email'} 
                onChange={(val) => handleChange('type', val)}
                options={[
                  { value: 'email', label: 'Extract Email Addresses' },
                  { value: 'phone', label: 'Extract Phone Numbers' },
                  { value: 'url', label: 'Extract URLs/Links' },
                  { value: 'regex', label: 'Custom Regex Pattern' }
                ]}
              />
            </div>
            {config.type === 'regex' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Regex Pattern</label>
                <input type="text" placeholder="\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b" value={config.regex || ''} onChange={(e) => handleChange('regex', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono" />
              </div>
            )}
          </div>
        );

      case 'formatter_dev':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Input Data (JSON)</label>
              <textarea rows={3} placeholder='{"email": "{{trigger.email}}"}' value={config.inputData || ''} onChange={(e) => handleChange('inputData', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-accent-blue resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Custom JavaScript code</label>
              <div className="bg-[#1e1e1e] rounded-md border border-white/10 overflow-hidden">
                <div className="bg-black/40 px-3 py-1 border-b border-white/5 text-[10px] text-text-secondary flex justify-between">
                  <span>index.js</span>
                  <span>Node.js</span>
                </div>
                <textarea 
                  rows={6} 
                  placeholder="return { result: inputData.email.split('@')[1] };" 
                  value={config.code || ''} 
                  onChange={(e) => handleChange('code', e.target.value)} 
                  className="w-full bg-transparent px-3 py-2 text-xs text-white font-mono focus:outline-none resize-none" 
                />
              </div>
              <p className="text-[10px] text-text-secondary mt-2">Write standard JS. Use <code className="text-accent-blue bg-accent-blue/10 px-1 rounded">inputData</code> to access input variables. You must return an object.</p>
            </div>
          </div>
        );

      case 'date_formatter':
        const op = config.operation || 'format_timezone';
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Operation</label>
              <Select 
                value={op} 
                onChange={(val) => handleChange('operation', val)}
                options={[
                  { value: 'format_timezone', label: 'Format / Change Timezone' },
                  { value: 'add_subtract', label: 'Add / Subtract Time' },
                  { value: 'duration', label: 'Calculate Duration Between Times' }
                ]}
              />
            </div>

            {op === 'duration' ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Start Date/Time</label>
                    <VariableInput placeholder="e.g. {{trigger.start}}" value={config.startDate || ''} onChange={(val) => handleChange('startDate', val)} variables={variableGroups} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">End Date/Time</label>
                    <VariableInput placeholder="e.g. {{trigger.end}}" value={config.endDate || ''} onChange={(val) => handleChange('endDate', val)} variables={variableGroups} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Output Duration Unit</label>
                  <Select 
                    value={config.durationUnit || 'days'} 
                    onChange={(val) => handleChange('durationUnit', val)}
                    options={[
                      { value: 'years', label: 'Years' },
                      { value: 'months', label: 'Months' },
                      { value: 'weeks', label: 'Weeks' },
                      { value: 'days', label: 'Days' },
                      { value: 'hours', label: 'Hours' },
                      { value: 'minutes', label: 'Minutes' },
                      { value: 'seconds', label: 'Seconds' }
                    ]}
                  />
                  <p className="text-[10px] text-text-tertiary mt-1">This will output a simple number.</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Date String</label>
                  <VariableInput placeholder="{{trigger.created_at}}" value={config.dateString || ''} onChange={(val) => handleChange('dateString', val)} variables={variableGroups} />
                </div>
                
                {op === 'add_subtract' && (
                  <div className="bg-black/30 border border-white/5 rounded-md p-3">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Expression</label>
                    <VariableInput placeholder="e.g. - 5 day 15 minute or + 2 month" value={config.mathExpression || ''} onChange={(val) => handleChange('mathExpression', val)} variables={variableGroups} />
                    <p className="text-[10px] text-text-tertiary mt-1">Start with + or - followed by numbers and units (e.g., day, minute, month, year).</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Source Timezone</label>
                    <Select 
                      options={typeof Intl !== 'undefined' && Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone').map(tz => ({ value: tz, label: tz })) : [{ value: 'UTC', label: 'UTC' }]}
                      placeholder="e.g. UTC or Asia/Kolkata" 
                      value={config.sourceTz || 'UTC'} 
                      onChange={(val) => handleChange('sourceTz', val)} 
                      creatable={true}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Target Timezone</label>
                    <Select 
                      options={typeof Intl !== 'undefined' && Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone').map(tz => ({ value: tz, label: tz })) : [{ value: 'UTC', label: 'UTC' }]}
                      placeholder="e.g. UTC or Asia/Kolkata" 
                      value={config.targetTz || 'UTC'} 
                      onChange={(val) => handleChange('targetTz', val)} 
                      creatable={true}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Output Format</label>
                  <Select 
                    options={[
                      { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss (2026-06-24 14:30:00)' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-06-24)' },
                      { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (24-06-2026)' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (06/24/2026)' },
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (24/06/2026)' },
                      { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Jun 24, 2026)' },
                      { value: 'DD MMM YYYY', label: 'DD MMM YYYY (24 Jun 2026)' },
                      { value: 'YYYY-MM-DDTHH:mm:ssZ', label: 'ISO 8601 (2026-06-24T14:30:00Z)' }
                    ]}
                    placeholder="YYYY-MM-DD HH:mm:ss" 
                    value={config.outputFormat || ''} 
                    onChange={(val) => handleChange('outputFormat', val)} 
                    creatable={true}
                  />
                  <p className="text-[10px] text-text-secondary mt-1.5">Select a common format or type your own custom format string.</p>
                </div>
              </>
            )}
          </div>
        );

      case 'http':
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="block text-xs font-medium text-text-secondary mb-1">Method</label>
                <Select 
                  value={config.method || 'POST'} 
                  onChange={(val) => handleChange('method', val)}
                  options={[
                    { value: 'GET', label: 'GET' },
                    { value: 'POST', label: 'POST' },
                    { value: 'PUT', label: 'PUT' },
                    { value: 'DELETE', label: 'DELETE' }
                  ]}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-1">URL</label>
                <VariableInput placeholder="https://api.example.com/data" value={config.url || ''} onChange={(val) => handleChange('url', val)} variables={variableGroups} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Headers (JSON)</label>
              <VariableInput multiline rows={3} placeholder='{"Authorization": "Bearer token"}' value={config.headers || ''} onChange={(val) => handleChange('headers', val)} variables={variableGroups} />
            </div>
            {config.method !== 'GET' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Body (JSON)</label>
                <VariableInput multiline rows={5} placeholder='{"key": "value"}' value={config.body || ''} onChange={(val) => handleChange('body', val)} variables={variableGroups} />
              </div>
            )}
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Schedule Type</label>
              <Select 
                value={config.type || 'interval'} 
                onChange={(val) => handleChange('type', val)}
                options={[
                  { value: 'interval', label: 'Regular Interval' },
                  { value: 'cron', label: 'Custom Cron Expression' }
                ]}
              />
            </div>
            {config.type === 'cron' ? (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Cron Expression</label>
                <input type="text" placeholder="0 0 * * *" value={config.cron || ''} onChange={(e) => handleChange('cron', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-accent-blue" />
                <p className="text-[10px] text-text-secondary mt-1">Example: 0 0 * * * (runs daily at midnight)</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Every</label>
                  <input type="number" min="1" value={config.interval || 1} onChange={(e) => handleChange('interval', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Unit</label>
                  <Select 
                    value={config.unit || 'hours'} 
                    onChange={(val) => handleChange('unit', val)}
                    options={[
                      { value: 'minutes', label: 'Minutes' },
                      { value: 'hours', label: 'Hours' },
                      { value: 'days', label: 'Days' }
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'stripe':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Stripe Account</label>
              <ConnectIntegration 
                provider="Stripe" 
                selectedConnectionId={config.connectionId}
                onConnectionSelect={(id) => handleChange('connectionId', id)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Trigger Event</label>
              <Select 
                value={config.eventType || ''} 
                onChange={(val) => handleChange('eventType', val)}
                options={[
                  { value: '', label: 'Select Event...' },
                  { value: 'payment_intent.succeeded', label: 'Payment Succeeded' },
                  { value: 'payment_intent.failed', label: 'Payment Failed' },
                  { value: 'customer.subscription.created', label: 'Subscription Created' },
                  { value: 'customer.subscription.deleted', label: 'Subscription Canceled' }
                ]}
              />
            </div>
          </div>
        );

      case 'slack':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Workspace</label>
              <ConnectIntegration 
                provider="Slack" 
                selectedConnectionId={config.connectionId}
                onConnectionSelect={(id) => handleChange('connectionId', id)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Channel ID or @User</label>
              <VariableInput placeholder="#general or C123456" value={config.channel || ''} onChange={(val) => handleChange('channel', val)} variables={variableGroups} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Message</label>
              <VariableInput multiline rows={4} placeholder="Hello from Automatix! {{trigger.data}}" value={config.message || ''} onChange={(val) => handleChange('message', val)} variables={variableGroups} />
            </div>
          </div>
        );

      case 'twilio':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Twilio Account</label>
              <ConnectIntegration 
                provider="Twilio" 
                selectedConnectionId={config.connectionId}
                onConnectionSelect={(id) => handleChange('connectionId', id)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">To Phone Number</label>
              <VariableInput placeholder="+1234567890 or {{trigger.phone}}" value={config.toPhone || ''} onChange={(val) => handleChange('toPhone', val)} variables={variableGroups} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Message</label>
              <VariableInput multiline rows={3} placeholder="Your OTP is {{trigger.code}}" value={config.message || ''} onChange={(val) => handleChange('message', val)} variables={variableGroups} />
            </div>
          </div>
        );

      case 'sheets':
        const handleAddMapping = () => {
          const mapping = Array.isArray(config.rowDataMapping) ? [...config.rowDataMapping] : [];
          mapping.push({ key: '', value: '' });
          handleChange('rowDataMapping', mapping);
        };
        const handleUpdateMapping = (index, field, val) => {
          const mapping = [...(config.rowDataMapping || [])];
          mapping[index][field] = val;
          handleChange('rowDataMapping', mapping);
        };
        const handleRemoveMapping = (index) => {
          const mapping = [...(config.rowDataMapping || [])];
          mapping.splice(index, 1);
          handleChange('rowDataMapping', mapping);
        };

        const handleUrlChange = (val) => {
          handleChange('sheetUrl', val);
          const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match && match[1]) {
             handleChange('spreadsheetId', match[1]);
          }
        };

        const handleRefreshFields = async () => {
          const spreadsheetId = config.spreadsheetId;
          const sheetName = config.range;
          if (!spreadsheetId || !sheetName) return;
          
          try {
            const res = await fetch(`/api/integrations/google/public-sheet-meta?sheetId=${spreadsheetId}&sheetName=${encodeURIComponent(sheetName)}&_t=${Date.now()}`);
            const data = await res.json();
            if (data.success && data.headers) {
              const currentMapping = config.rowDataMapping || [];
              const newMapping = [];
              
              data.headers.forEach(h => {
                const existing = currentMapping.find(m => m.key === h);
                if (existing) {
                  newMapping.push(existing);
                } else {
                  newMapping.push({ key: h, value: '' });
                }
              });
              
              handleChange('rowDataMapping', newMapping);
            }
          } catch (err) {
            console.error(err);
          }
        };


        return (
          <div className="space-y-4">
            {!config.spreadsheetId && pseudoConnections.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-text-secondary mb-1">Select from Connections</label>
                <Select 
                  value=""
                  onChange={(val) => {
                    if (val) {
                      const sheet = pseudoConnections.find(s => s.id === val);
                      if (sheet) {
                        onUpdateNode(selectedNode.id, {
                          ...selectedNode,
                          config: {
                            ...selectedNode.config,
                            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`,
                            spreadsheetId: sheet.id,
                            spreadsheetName: sheet.name
                          }
                        });
                      }
                    }
                  }}
                  options={[
                    { value: '', label: 'Select a previously used sheet...' },
                    ...pseudoConnections.map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
                <p className="text-[10px] text-text-tertiary mt-1">
                  Select a previously added Google Sheet from your connections to auto-fill the URL below.
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Google Sheet URL</label>
              {config.spreadsheetId ? (
                <div className="bg-black/50 border border-white/10 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-green-400 flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>
                      {config.spreadsheetName && <p className="text-sm font-medium text-white truncate max-w-[200px]" title={config.spreadsheetName}>{config.spreadsheetName}</p>}
                      <p className="text-[10px] text-text-tertiary truncate max-w-[200px]" title={config.spreadsheetId}>ID: {config.spreadsheetId}</p>
                    </div>
                    <button 
                      onClick={() => setSheetToClear('action')}
                      className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded transition-colors whitespace-nowrap flex-shrink-0 ml-2"
                    >
                      Change Sheet
                    </button>
                  </div>
                </div>
              ) : (
                <input 
                   type="text" 
                   placeholder="https://docs.google.com/spreadsheets/d/..."
                   value={config.sheetUrl || ''} 
                   onChange={(e) => handleUrlChange(e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                />
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Action Type</label>
              <Select 
                value={config.actionType || 'WRITE'} 
                onChange={(val) => handleChange('actionType', val)}
                options={[
                  { value: 'WRITE', label: 'Append Row (Write)' },
                  { value: 'READ', label: 'Search/Read Rows' },
                  { value: 'UPDATE', label: 'Update Row(s)' },
                  { value: 'DELETE', label: 'Delete Row(s)' },
                  { value: 'CLEAR', label: 'Clear Row/Range' },
                  { value: 'CREATE_SHEET', label: 'Create New Sheet' },
                  { value: 'DUPLICATE_SHEET', label: 'Duplicate Sheet' }
                ]}
              />
            </div>

            {['CREATE_SHEET', 'DUPLICATE_SHEET'].includes(config.actionType) && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">New Sheet Name</label>
                <input 
                   type="text" 
                   placeholder="e.g. Q3 Report"
                   value={config.newSheetName || ''} 
                   onChange={(e) => handleChange('newSheetName', e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
                />
              </div>
            )}

            {!['CREATE_SHEET'].includes(config.actionType) && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {config.actionType === 'DUPLICATE_SHEET' ? 'Source Sheet Name to Duplicate' : 'Worksheet Tab'}
                </label>
                {availableSheets.length > 0 ? (
                  <Select 
                    value={config.range || ''} 
                    onChange={(val) => handleChange('range', val)}
                    options={availableSheets}
                  />
                ) : (
                  <input 
                     type="text" 
                     placeholder={loadingSheets ? "Fetching sheets..." : "e.g. Sheet1"}
                     value={config.range || ''} 
                     onChange={(e) => handleChange('range', e.target.value)}
                     className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
                     disabled={loadingSheets}
                  />
                )}
                {loadingSheets && <p className="text-[10px] text-text-tertiary mt-1 animate-pulse">Loading sheets...</p>}
              </div>
            )}
            
            {config.actionType === 'WRITE' && config.spreadsheetId && config.range && (
              <div className="space-y-4 pt-4 border-t border-white/5 mt-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Insert Position</label>
                  <Select 
                    value={config.insertPosition || 'bottom'} 
                    onChange={(val) => handleChange('insertPosition', val)}
                    options={[
                      { value: 'bottom', label: 'Append to Bottom (Default)' },
                      { value: 'top_headers', label: 'Insert Below Headers (Row 2)' },
                      { value: 'top_absolute', label: 'Insert at Top (Row 1)' }
                    ]}
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-md">
                  <p className="text-xs text-amber-500 font-medium flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4" /> Avoid Filters
                  </p>
                  <p className="text-[10px] text-amber-400">
                    If you have filters applied to this sheet, inserting rows at the top may push existing rows down incorrectly or mess up the workflow. Ensure filters are removed or applied dynamically.
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-1.5 bg-black/30 border border-white/5 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-white mb-0.5">Inherit Formatting</label>
                    <button
                      onClick={() => handleChange('inheritFormatting', config.inheritFormatting === false ? true : false)}
                      className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${config.inheritFormatting !== false ? 'bg-accent-blue' : 'bg-white/20'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.inheritFormatting !== false ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className="text-[10px] text-text-tertiary leading-relaxed">
                    If enabled, the new row will automatically copy the background color, font styles, and data formatting of the preceding or succeeding row depending on insert position.
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-1.5 bg-black/30 border border-white/5 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-white mb-0.5">Parse Values (Dates, Numbers)</label>
                    <button
                      onClick={() => handleChange('parseValues', config.parseValues === false ? true : false)}
                      className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${config.parseValues !== false ? 'bg-accent-blue' : 'bg-white/20'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.parseValues !== false ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <p className="text-[10px] text-text-tertiary leading-relaxed">
                    If enabled, Google Sheets will attempt to parse mapped variables as Dates, Numbers, or Formulas (e.g. converting a date string to a proper Sheets date). If disabled, data is inserted as pure raw text.
                  </p>
                </div>
              </div>
            )}
            
            {['READ', 'UPDATE', 'DELETE'].includes(config.actionType) && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Search Query / Condition</label>
                <input 
                   type="text" 
                   placeholder="e.g. Parameters = Main data"
                   value={config.searchQuery || ''} 
                   onChange={(e) => handleChange('searchQuery', e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
                />
                <div className="mt-2 p-2.5 bg-[#1C1C1C] rounded border border-white/5 space-y-1.5">
                  <p className="text-[10px] text-white/70 font-medium">
                    {config.actionType === 'READ' && 'Returns all rows that match this condition.'}
                    {config.actionType === 'UPDATE' && 'Finds the row to update based on this condition.'}
                    {config.actionType === 'DELETE' && 'Deletes all rows that match this condition.'}
                  </p>
                  <div className="text-[10px] text-text-tertiary space-y-1">
                    <p className="font-semibold text-white/50">Syntax Guide:</p>
                    <ul className="list-disc pl-3 space-y-0.5">
                      <li>Exact match: <code className="bg-black/30 px-1 py-0.5 rounded text-white/80">Parameters = Main data</code></li>
                      <li>Column letters: <code className="bg-black/30 px-1 py-0.5 rounded text-white/80">Column A = Main data</code></li>
                      <li>Operators: <code className="bg-black/30 px-1 py-0.5 rounded text-accent-blue">=</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-accent-blue">!=</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-accent-blue">&gt;</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-accent-blue">&lt;</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-accent-blue">IN</code></li>
                      <li>Multiple (IN): <code className="bg-black/30 px-1 py-0.5 rounded text-white/80">Emails IN abc@gmail.com, xyz@yahoo.com</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {config.actionType === 'READ' && (
              <>
                <div className="mt-4">
                  <label className="block text-xs font-medium text-text-secondary mb-1">Search Direction</label>
                  <Select 
                    value={config.searchDirection || 'top_to_bottom'} 
                    onChange={(val) => handleChange('searchDirection', val)}
                    options={[
                      { value: 'top_to_bottom', label: 'Top to Bottom (First Match)' },
                      { value: 'bottom_to_top', label: 'Bottom to Top (Last Match)' }
                    ]}
                  />
                </div>
                
                <div className="mt-4 flex items-center justify-between bg-black/30 border border-white/5 p-3 rounded-md">
                  <div>
                    <label className="block text-xs font-medium text-white mb-0.5">Return Row Data</label>
                    <p className="text-[10px] text-text-tertiary">If off, only returns row index & existence.</p>
                  </div>
                  <button
                    onClick={() => handleChange('returnRowData', config.returnRowData === false ? true : false)}
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center ${config.returnRowData !== false ? 'bg-accent-blue' : 'bg-white/20'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.returnRowData !== false ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>

                {config.returnRowData !== false && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Columns to Fetch</label>
                    <input 
                      type="text" 
                      placeholder="e.g. A,B,C,D"
                      value={config.fetchColumnsUpTo || ''} 
                      onChange={(e) => handleChange('fetchColumnsUpTo', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
                    />
                    <p className="text-[10px] text-text-tertiary mt-1">
                      Limits data fetched to save system resources. Enter comma-separated column letters. Limited by your plan's max columns. Leave blank to use default limits.
                    </p>
                  </div>
                )}
              </>
            )}

            {config.actionType === 'CLEAR' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Range to Clear</label>
                <input 
                   type="text" 
                   placeholder="e.g. A2:Z100 or C5"
                   value={config.clearRange || ''} 
                   onChange={(e) => handleChange('clearRange', e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
                />
                <p className="text-[10px] text-text-tertiary mt-1">
                  Specify the exact range you want to clear (e.g. <code className="bg-black/30 px-1 py-0.5 rounded text-white/80">A2:B5</code> or <code className="bg-black/30 px-1 py-0.5 rounded text-white/80">C3</code>).
                </p>
              </div>
            )}
            
            {['WRITE', 'UPDATE'].includes(config.actionType) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-secondary">Column Mapping</label>
                  <button onClick={handleRefreshFields} className="flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded transition-colors">
                    <RefreshCw className="w-3 h-3" /> Refresh Fields
                  </button>
                </div>
                <div className="space-y-2">
                  {(config.rowDataMapping || []).map((map, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 p-2 bg-black/20 border border-white/5 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/90 truncate max-w-[200px]" title={map.key}>
                          {map.key}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <VariableInput 
                            placeholder="Value to write"
                            value={map.value}
                            onChange={(val) => handleUpdateMapping(idx, 'value', val)}
                            variables={variableGroups}
                          />
                        </div>
                        <button 
                          onClick={() => handleUpdateMapping(idx, 'value', '')} 
                          className="p-1.5 text-text-secondary hover:text-white bg-black/50 border border-white/10 rounded"
                          title="Clear value"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!config.rowDataMapping || config.rowDataMapping.length === 0) && (
                    <div className="text-[11px] text-text-tertiary text-center p-4 border border-dashed border-white/10 rounded-md">
                      No columns loaded. Select a Worksheet Tab and click Refresh Fields.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'meta_capi':
        const handleAddCapiMapping = () => {
          const mapping = Array.isArray(config.eventDataMapping) ? [...config.eventDataMapping] : [];
          mapping.push({ key: '', value: '' });
          handleChange('eventDataMapping', mapping);
        };
        const handleUpdateCapiMapping = (index, field, val) => {
          const mapping = [...(config.eventDataMapping || [])];
          mapping[index][field] = val;
          handleChange('eventDataMapping', mapping);
        };
        const handleRemoveCapiMapping = (index) => {
          const mapping = [...(config.eventDataMapping || [])];
          mapping.splice(index, 1);
          handleChange('eventDataMapping', mapping);
        };

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Facebook / Meta Account</label>
              <ConnectIntegration 
                provider="facebook" 
                selectedConnectionId={config.connectionId}
                onConnectionSelect={(id) => handleChange('connectionId', id)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Pixel ID / Dataset ID</label>
              <VariableInput placeholder="123456789012345" value={config.pixelId || ''} onChange={(val) => handleChange('pixelId', val)} variables={variableGroups} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Event Name</label>
              <VariableInput placeholder="e.g. Purchase, Lead" value={config.eventName || ''} onChange={(val) => handleChange('eventName', val)} variables={variableGroups} />
            </div>
            
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-text-secondary">Send as Test Event?</label>
                <button 
                  onClick={() => handleChange('isTestEvent', !config.isTestEvent)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.isTestEvent ? 'bg-accent-blue' : 'bg-white/10'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${config.isTestEvent ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
              {config.isTestEvent && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Test Event Code</label>
                  <input 
                    type="text" 
                    placeholder="TEST12345" 
                    value={config.testEventCode || ''} 
                    onChange={(e) => handleChange('testEventCode', e.target.value)} 
                    className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5">
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-widest mb-3">Standard Parameters</label>
              <div className="space-y-3">
                {[
                  'email', 'phone', 'first_name', 'last_name', 'city', 'country_code', 
                  'client_ip_address', 'client_user_agent', 'fbc', 'fbp', 'fbclid', 
                  'external_id', 'lead_id', 'created_at', 'event_source_url', 'amount', 
                  'purchase_event_id', 'is_test', 'utm_source', 'utm_medium', 
                  'utm_campaign', 'utm_content', 'utm_term'
                ].map(field => (
                  <div key={field}>
                    <label className="block text-[10px] text-text-secondary mb-1">{field}</label>
                    <VariableInput placeholder={`Map ${field}...`} value={config[`capi_${field}`] || ''} onChange={(val) => handleChange(`capi_${field}`, val)} variables={variableGroups} />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-widest mb-2">Custom Parameters</label>
              <p className="text-[10px] text-text-secondary mb-3 leading-snug">Add any additional key-value pairs to send with the event payload.</p>
              <div className="space-y-2">
                {(config.eventDataMapping || []).map((map, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Param (e.g. value)" 
                      value={map.key} 
                      onChange={(e) => handleUpdateCapiMapping(idx, 'key', e.target.value)} 
                      className="w-1/3 bg-background border border-border-subtle rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue"
                    />
                    <div className="flex-1">
                      <VariableInput 
                        placeholder="Value" 
                        value={map.value} 
                        onChange={(val) => handleUpdateCapiMapping(idx, 'value', val)} 
                        variables={variableGroups} 
                      />
                    </div>
                    <button onClick={() => handleRemoveCapiMapping(idx)} className="p-1.5 text-text-secondary hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button onClick={handleAddCapiMapping} className="flex items-center justify-center gap-1 w-full p-1.5 border border-dashed border-border-subtle rounded-md text-[10px] text-text-secondary hover:text-white hover:border-white/20 transition-colors">
                  <Plus className="w-3 h-3" /> Add Event Parameter
                </button>
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">SMTP Connection</label>
              <ConnectIntegration 
                provider="SMTP" 
                selectedConnectionId={config.connectionId}
                onConnectionSelect={(id, conn, isInitialLoad) => {
                  let updates = {};
                  if (!isInitialLoad) {
                    updates.connectionId = id;
                  }
                  if (conn && conn.accountEmail) {
                    if (!config.fromEmail) updates.fromEmail = conn.accountEmail;
                    if (!config.fromName) updates.fromName = conn.name;
                  }
                  if (Object.keys(updates).length > 0) {
                    onUpdateNode(selectedNode.id, {
                      ...selectedNode,
                      config: { ...selectedNode.config, ...updates },
                      issue: null
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">From Name</label>
                <VariableInput value={config.fromName || ''} onChange={(val) => handleChange('fromName', val)} placeholder="E.g. John Doe" variables={variableGroups} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">From Email</label>
                <VariableInput value={config.fromEmail || ''} onChange={(val) => handleChange('fromEmail', val)} placeholder="E.g. john@example.com" variables={variableGroups} />
              </div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3 flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-orange-400 leading-snug">
                <strong>Important:</strong> Your From Email domain must be verified with your SMTP provider and have valid SPF, DKIM, and DMARC records configured, otherwise your emails will likely go to Spam.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Reply-To (Optional)</label>
              <VariableInput value={config.replyTo || ''} onChange={(val) => handleChange('replyTo', val)} placeholder="E.g. support@example.com" variables={variableGroups} />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
              <div>
                <label className="block text-xs font-medium text-text-secondary">Include Unsubscribe Footer</label>
                <p className="text-[10px] text-text-tertiary mt-0.5 max-w-[200px]">Appends a 1-click unsubscribe link. Required by Google/Yahoo in 2024.</p>
              </div>
              <Toggle checked={config.includeUnsubscribe !== false} onChange={(val) => handleChange('includeUnsubscribe', val)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">To Address</label>
              <VariableInput value={config.to || ''} onChange={(val) => handleChange('to', val)} placeholder="user@example.com or {{trigger.email}}" variables={variableGroups} />
              <p className="text-[10px] text-text-tertiary mt-1.5 leading-tight">
                For multiple recipients, separate emails or variables with a comma. <br/>
                Example: <span className="font-mono text-white/50">user1@a.com, user2@b.com</span>
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Subject</label>
              <VariableInput value={config.subject || ''} onChange={(val) => handleChange('subject', val)} placeholder="Welcome!" variables={variableGroups} />
            </div>
            
            <div className="pt-2 border-t border-border-subtle">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-text-secondary">Body Format</label>
                <div className="flex items-center bg-black/40 rounded border border-white/5 p-0.5">
                  <button
                    onClick={() => handleChange('bodyType', 'text')}
                    className={`px-3 py-1 text-[10px] font-medium rounded-sm transition-colors ${!config.bodyType || config.bodyType === 'text' ? 'bg-[#2a2a2d] text-white shadow-sm' : 'text-text-tertiary hover:text-white'}`}
                  >
                    Plain Text
                  </button>
                  <button
                    onClick={() => handleChange('bodyType', 'html')}
                    className={`px-3 py-1 text-[10px] font-medium rounded-sm transition-colors ${config.bodyType === 'html' ? 'bg-[#2a2a2d] text-white shadow-sm' : 'text-text-tertiary hover:text-white'}`}
                  >
                    HTML
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-xs font-medium text-text-secondary mb-1">Message Content</label>
                {!config.bodyType || config.bodyType === 'text' ? (
                  <div className="space-y-2">
                    <VariableInput multiline rows={8} value={config.body || ''} onChange={(val) => handleChange('body', val)} placeholder="Hello {{trigger.name}}..." variables={variableGroups} />
                    {config.includeUnsubscribe !== false && (
                      <div className="bg-black/30 border border-white/5 rounded-md p-3">
                        <p className="text-[10px] text-text-tertiary">
                          If you no longer wish to receive these emails, you can unsubscribe here.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <HtmlEditor 
                      value={config.body || ''} 
                      onChange={(val) => handleChange('body', val)} 
                      variables={variableGroups} 
                    />
                    <button 
                      onClick={() => setIsPreviewOpen(true)}
                      className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/20 rounded transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Preview HTML
                    </button>
                    
                    <HtmlPreviewModal 
                      isOpen={isPreviewOpen} 
                      onClose={() => setIsPreviewOpen(false)} 
                      value={config.body || ''} 
                      unsubscribeEnabled={config.includeUnsubscribe !== false}
                      onChange={(val) => handleChange('body', val)} 
                      variables={variableGroups}
                    />
                  </div>
                )}

                {(() => {
                  const unmappedVars = [];
                  const mappedVars = [];
                  if (config.body) {
                    const regex = /\{\{[^}]+\}\}|\{[a-zA-Z0-9_.\-\s]+\}|\[[a-zA-Z0-9_.\-\s]+\]/g;
                    const matches = new Set();
                    let match;
                    while ((match = regex.exec(config.body)) !== null) {
                      matches.add(match[0]);
                    }
                    
                    matches.forEach(m => {
                      if (/\{\{[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+\}\}/.test(m)) {
                        mappedVars.push(m);
                      } else {
                        unmappedVars.push(m);
                      }
                    });
                  }
                  
                  const getVariableLabel = (varText) => {
                    if (!varText.startsWith('{{') || !varText.endsWith('}}')) return varText;
                    const id = varText.slice(2, -2);
                    for (const group of variableGroups) {
                      const v = group.variables?.find(v => v.id === id);
                      if (v) return v.label;
                    }
                    return id;
                  };

                  if (unmappedVars.length === 0 && mappedVars.length === 0) return null;

                  return (
                    <div className="mt-4 bg-black/30 border border-white/5 rounded-md p-3">
                      <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-3">Variables in Message</div>
                      <div className="space-y-2">
                        {unmappedVars.map(unmappedVar => (
                          <div key={unmappedVar} className="flex items-center gap-2 w-full">
                            <div className="w-[140px] shrink-0 px-2.5 py-1.5 bg-black/40 border border-white/5 rounded-md font-mono text-[11px] text-[#eab308] truncate">
                              {unmappedVar}
                            </div>
                            <span className="text-text-tertiary/40 font-mono text-xs">=</span>
                            <div className="flex-1 min-w-0 relative">
                              <button 
                                type="button"
                                onClick={() => setActiveChecklistVar(activeChecklistVar === unmappedVar ? null : unmappedVar)}
                                className="w-full px-2.5 py-1.5 bg-black/20 border border-white/10 border-dashed rounded-md font-mono text-[11px] text-text-tertiary/60 hover:border-white/30 hover:text-text-secondary transition-all text-left flex items-center justify-between"
                              >
                                <span>Select mapping...</span>
                                <Variable className="w-3.5 h-3.5 opacity-50" />
                              </button>
                              {activeChecklistVar === unmappedVar && (
                                <VariableMenu 
                                  isOpen={true}
                                  onClose={() => setActiveChecklistVar(null)}
                                  variables={variableGroups}
                                  initialSearch={unmappedVar.replace(/[{}[\]]/g, '')}
                                  onSelect={(varId) => {
                                    const newBody = config.body.split(unmappedVar).join(`{{${varId}}}`);
                                    handleChange('body', newBody);
                                    setActiveChecklistVar(null);
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {mappedVars.map(mappedVar => (
                          <div key={mappedVar} className="flex items-center gap-2 w-full group">
                            <div className="w-[140px] shrink-0 px-2.5 py-1.5 bg-black/20 border border-white/5 rounded-md font-mono text-[11px] text-[#eab308] truncate opacity-70">
                              {`{{${getVariableLabel(mappedVar).toLowerCase().replace(/[^a-z0-9]/g, '')}}}`}
                            </div>
                            <span className="text-text-tertiary/40 font-mono text-xs">=</span>
                            <div className="flex-1 min-w-0 relative">
                              <div className="w-full px-2.5 py-1.5 bg-accent-blue/5 border border-accent-blue/20 rounded-md font-mono text-[11px] text-accent-blue truncate pr-7">
                                {mappedVar}
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  const label = getVariableLabel(mappedVar);
                                  const fallbackUnmapped = `{{${label.toLowerCase().replace(/[^a-z0-9]/g, '')}}}`;
                                  const newBody = config.body.split(mappedVar).join(fallbackUnmapped);
                                  handleChange('body', newBody);
                                }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-text-tertiary/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-[#0a0a0a] rounded-sm"
                                title="Remove Mapping"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );

      case 'delay': {
        // Inherit color from parent if it's a reminder sequence branch
        let branchColor = null;
        let branchName = null;
        if (selectedNode.parentId && selectedNode.pathId) {
          const parentNode = nodes.find(n => n.id === selectedNode.parentId);
          if (parentNode && parentNode.integration?.id === 'reminder_sequence') {
             const branch = parentNode.config?.branches?.find(b => b.id === selectedNode.pathId);
             if (branch) {
                branchColor = branch.color;
                branchName = branch.name;
             }
          }
        }
        
        return (
          <div className="space-y-4">
            {branchName && (
              <div className={`bg-${branchColor || 'purple-500'}/10 border border-${branchColor || 'purple-500'}/20 rounded-md p-3 mb-4`}>
                <h4 className={`text-xs font-semibold text-${branchColor || 'purple-500'} uppercase tracking-wider mb-1`}>{branchName} Config</h4>
                <p className={`text-[10px] text-${branchColor || 'purple-500'}/80`}>This delay acts as the trigger timing for this reminder branch.</p>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-2">Delay Type</label>
              <Select 
                value={config.delayType || 'duration'} 
                onChange={(val) => handleChange('delayType', val)}
                options={[
                  { value: 'duration', label: 'Wait a set amount of time' },
                  { value: 'until', label: 'Wait until a specific date/time' },
                  { value: 'event_based', label: 'Wait before/after an event date' },
                  ...(nodes.find(n => n.type === NODE_TYPES.TRIGGER)?.integration?.id === 'instagram' ? [{ value: 'wait_for_reply', label: 'Wait for Reply (Instagram)' }] : [])
                ]}
              />
            </div>

            {(!config.delayType || config.delayType === 'duration' || config.delayType === 'wait_for_reply') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    {config.delayType === 'wait_for_reply' ? 'Timeout Duration' : 'Duration'}
                  </label>
                  <input type="number" value={config.duration || 1} onChange={(e) => handleChange('duration', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Unit</label>
                  <Select 
                    value={config.unit || 'minutes'} 
                    onChange={(val) => handleChange('unit', val)}
                    options={[
                      { value: 'minutes', label: 'Minutes' },
                      { value: 'hours', label: 'Hours' },
                      { value: 'days', label: 'Days' }
                    ]}
                  />
                </div>
              </div>
            )}

            {config.delayType === 'wait_for_reply' && (
              <div className="mt-4 flex flex-col gap-1.5 bg-black/30 border border-white/5 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-white mb-0.5">Pass on Timeout?</label>
                  <button
                    onClick={() => handleChange('passOnTimeout', config.passOnTimeout !== false ? false : true)}
                    className={`shrink-0 w-10 h-6 rounded-full transition-colors relative flex items-center ${config.passOnTimeout === true ? 'bg-accent-blue' : 'bg-white/20'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.passOnTimeout === true ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-[10px] text-text-tertiary leading-relaxed">If enabled, the user moves to the next step when timeout expires. If disabled, they are removed from the workflow.</p>
              </div>
            )}

            {config.delayType === 'until' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Target Date/Time</label>
                <VariableInput value={config.untilDate || ''} onChange={(val) => handleChange('untilDate', val)} placeholder="e.g. 2026-06-24 12:00:00" variables={variableGroups} />
                <p className="text-[10px] text-text-tertiary mt-1">Must be an ISO 8601 date string. Format must be exactly YYYY-MM-DD HH:mm:ss (UTC).</p>
              </div>
            )}

            {config.delayType === 'event_based' && (
              <div className="space-y-4 bg-black/30 border border-white/5 rounded-md p-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Event Date/Time</label>
                  <VariableInput value={config.eventDate || ''} onChange={(val) => handleChange('eventDate', val)} placeholder="e.g. 2026-06-24 12:00:00" variables={variableGroups} />
                  <p className="text-[10px] text-text-tertiary mt-1 mb-2">Must be an ISO 8601 date string. Format must be exactly YYYY-MM-DD HH:mm:ss (UTC).</p>
                </div>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="block text-[10px] font-medium text-text-secondary mb-1">Timing</label>
                    <Select 
                      value={config.eventTiming || 'before'} 
                      onChange={(val) => handleChange('eventTiming', val)}
                      options={[
                        { value: 'before', label: 'Before' },
                        { value: 'after', label: 'After' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-text-secondary mb-1">Duration</label>
                    <input type="number" value={config.duration || 1} onChange={(e) => handleChange('duration', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-text-secondary mb-1">Unit</label>
                    <Select 
                      value={config.unit || 'minutes'} 
                      onChange={(val) => handleChange('unit', val)}
                      options={[
                        { value: 'minutes', label: 'Minutes' },
                        { value: 'hours', label: 'Hours' },
                        { value: 'days', label: 'Days' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'condition': {
        const condBranches = config.branches || [
          { id: 'A', name: 'PATH A', color: 'accent-blue' }
        ];
        
        return (
          <div className="space-y-4">
            <p className="text-xs text-text-secondary">Set the rules for routing the workflow through different paths. You can add more paths on the canvas.</p>
            
            {condBranches.map((branch, idx) => (
              <div key={branch.id}>
                 <div className={`flex items-center justify-between mb-1`}>
                   <label className={`block text-[11px] font-semibold text-${branch.color}`}>
                     Condition {idx + 1}
                   </label>
                   <input 
                     type="text" 
                     value={branch.name || `PATH ${branch.id}`} 
                     onChange={(e) => {
                       const newBranches = [...condBranches];
                       newBranches[idx] = { ...branch, name: e.target.value };
                       handleChange('branches', newBranches);
                     }}
                     placeholder="Path Name"
                     className={`bg-transparent border-b border-transparent hover:border-${branch.color}/30 focus:border-${branch.color} focus:outline-none text-[11px] font-semibold text-${branch.color} px-1 py-0.5 w-[140px] text-right transition-colors placeholder:opacity-50`}
                   />
                 </div>
                 <div className="space-y-2 p-3 bg-black/30 border border-white/5 rounded-md">
                   <input 
                     type="text" 
                     placeholder="Variable e.g. {{trigger.email}}" 
                     value={config[`path${branch.id}Var`] || ''} 
                     onChange={(e) => handleChange(`path${branch.id}Var`, e.target.value)} 
                     className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue font-mono" 
                   />
                   <Select 
                      value={config[`path${branch.id}Op`] || 'contains'} 
                      onChange={(val) => handleChange(`path${branch.id}Op`, val)}
                      options={[
                        { value: 'contains', label: 'Contains' },
                        { value: 'equals', label: 'Equals Exactly' },
                        { value: 'exists', label: 'Exists' }
                      ]}
                   />
                   <input 
                     type="text" 
                     placeholder="Value e.g. gmail.com" 
                     value={config[`path${branch.id}Val`] || ''} 
                     onChange={(e) => handleChange(`path${branch.id}Val`, e.target.value)} 
                     className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue" 
                   />
                 </div>
              </div>
            ))}

            <div className="p-3 border border-dashed border-white/10 rounded-md">
               <label className="block text-[11px] font-semibold text-text-secondary mb-1">Fallback (ELSE)</label>
               <p className="text-[10px] text-text-secondary">If no conditions match, the workflow will continue down the Else path.</p>
            </div>
          </div>
        );
      }

      case 'custom_variable':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Variable Name</label>
              <input type="text" value={config.varName || ''} onChange={(e) => handleChange('varName', e.target.value)} placeholder="e.g. MyTimestamp" className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Data Type</label>
              <Select 
                value={config.varType || 'text'} 
                onChange={(val) => {
                  handleChange('varType', val);
                  if (val === 'timestamp' && !config.varFormat) handleChange('varFormat', 'YYYY-MM-DD HH:mm:ss');
                }}
                options={[
                  { value: 'text', label: 'Text' },
                  { value: 'number', label: 'Number / Currency' },
                  { value: 'timestamp', label: 'Custom Timestamp / Date' }
                ]}
              />
            </div>

            {config.varType === 'timestamp' && (
              <div className="space-y-4 bg-black/30 border border-white/5 rounded-md p-3">
                <Toggle 
                  label="Use Current Execution Time"
                  checked={config.useCurrentTime !== false}
                  onChange={(checked) => handleChange('useCurrentTime', checked)}
                  description="Automatically generates the timestamp when the step executes."
                />
                
                {config.useCurrentTime === false && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Custom Date/Time</label>
                    <VariableInput value={config.varValue || ''} onChange={(val) => handleChange('varValue', val)} placeholder="e.g. 2026-12-31 or {{trigger.event_date}}" variables={variableGroups} />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Timezone</label>
                  <Select 
                    options={typeof Intl !== 'undefined' && Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone').map(tz => ({ value: tz, label: tz })) : [{ value: 'UTC', label: 'UTC' }]}
                    placeholder="e.g. UTC or Asia/Kolkata" 
                    value={config.varTimezone || 'UTC'} 
                    onChange={(val) => handleChange('varTimezone', val)} 
                    creatable={true}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Output Format</label>
                  <Select 
                    options={[
                      { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss (2026-06-24 14:30:00)' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-06-24)' },
                      { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (24-06-2026)' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (06/24/2026)' },
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (24/06/2026)' },
                      { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Jun 24, 2026)' },
                      { value: 'DD MMM YYYY', label: 'DD MMM YYYY (24 Jun 2026)' },
                      { value: 'YYYY-MM-DDTHH:mm:ssZ', label: 'ISO 8601 (2026-06-24T14:30:00Z)' }
                    ]}
                    placeholder="e.g. YYYY-MM-DD HH:mm:ss" 
                    value={config.varFormat || 'YYYY-MM-DD HH:mm:ss'} 
                    onChange={(val) => handleChange('varFormat', val)} 
                    creatable={true}
                  />
                  <p className="text-[10px] text-text-tertiary mt-1">Select a common format or type your own custom format string.</p>
                </div>
              </div>
            )}

            {(!config.varType || config.varType === 'text' || config.varType === 'number') && (
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Value</label>
                <VariableInput multiline={config.varType === 'text'} value={config.varValue || ''} onChange={(val) => handleChange('varValue', val)} placeholder={`Enter ${config.varType || 'text'} value...`} variables={variableGroups} />
              </div>
            )}
          </div>
        );

      case 'reminder_sequence': {
        const remBranches = config.branches || [{ id: '1', name: 'Reminder 1', color: 'purple-500' }];
        return (
          <div className="space-y-6">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-3">
              <p className="text-xs text-purple-400">
                This node executes sequentially. The workflow will pause at each reminder in order. If a reminder's time is in the past, it will be skipped automatically.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-black/20 border border-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Resume Main Flow</h4>
                  <p className="text-[10px] text-text-tertiary mt-0.5">
                    {config.resumeMainFlow ? 'Branches are locked. Users will return to the main flow after the reminder sequence completes.' : 'Branches remain separate. You can add more reminders.'}
                  </p>
                </div>
                <button
                  onClick={() => handleChange('resumeMainFlow', !config.resumeMainFlow)}
                  className={`w-10 h-6 shrink-0 rounded-full transition-colors relative flex items-center ${config.resumeMainFlow ? 'bg-accent-blue' : 'bg-white/20'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.resumeMainFlow ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            {remBranches.map((branch) => {
              const bConfig = config[`branch_${branch.id}`] || {};
              const updateBranchConfig = (key, val) => {
                handleChange(`branch_${branch.id}`, { ...bConfig, [key]: val });
              };
              
              // Find first step
              const firstChild = nodes.find(n => n.parentId === selectedNode.id && n.pathId === branch.id);
              const isSmartDelay = firstChild?.integration?.id === 'delay';
              const isConfigured = isSmartDelay && firstChild.config?.delayType && (
                firstChild.config.delayType === 'event_based' ? (firstChild.config.eventDate && firstChild.config.duration && firstChild.config.unit) : (firstChild.config.duration && firstChild.config.unit)
              );

              return (
                <div key={branch.id} className="bg-black/20 border border-white/5 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${branch.color || 'purple-500'}`} />
                      {branch.name}
                    </h4>
                    {isConfigured ? (
                      <span className="text-[10px] font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-wider border border-green-400/20">Configured</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded uppercase tracking-wider border border-red-400/20 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Needs Config
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={() => onConfigureReminderStep?.(selectedNode.id, branch.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border text-xs font-medium transition-colors ${
                        isConfigured 
                          ? `border-${branch.color || 'purple-500'}/30 bg-${branch.color || 'purple-500'}/10 text-${branch.color || 'purple-500'} hover:bg-${branch.color || 'purple-500'}/20` 
                          : 'border-accent-blue bg-accent-blue hover:bg-accent-blue-hover text-white'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Configure Reminder Delay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }

      case 'calendar_status':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Booking ID</label>
              <VariableInput 
                value={config.bookingId || ''} 
                onChange={(val) => handleChange('bookingId', val)} 
                placeholder="Enter Booking ID..." 
                workflowId={workflowId} 
                currentNodeId={node.id} 
              />
              <p className="text-[10px] text-text-tertiary mt-2">
                Provide the Booking ID from the Calendar Trigger to check its status. Execution will halt if the booking is cancelled or rescheduled.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 rounded-md bg-white/5 border border-dashed border-white/10 text-center text-sm text-text-secondary">
            Configure your settings for this {selectedNode.type.toLowerCase()} here.
          </div>
        );
    }
  };



  return (
    <div 
      style={{ width: isMobile ? '100%' : panelWidth }}
      className="absolute inset-0 z-[100] md:inset-auto md:right-0 md:top-0 md:bottom-0 md:z-20 h-full border-l border-border-subtle bg-[#0a0a0a] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
    >
      <div 
        className="hidden md:flex absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-accent-blue/30 z-30 transition-colors items-center justify-center -ml-1 group"
        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
      >
        <div className="h-8 w-1 bg-border-subtle rounded-full group-hover:bg-accent-blue/50" />
      </div>

      <div className="p-4 border-b border-border-subtle flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-text-secondary" />
          <h2 className="font-medium text-foreground">Properties</h2>
        </div>
        <button 
          onClick={onClose} 
          className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-border-subtle rounded-md text-xs font-medium text-text-secondary hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-2">Step Name</label>
          <input 
            type="text" 
            value={selectedNode.title}
            onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode, title: e.target.value })}
            className="w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-colors"
          />
        </div>

        <div className="pt-5 border-t border-border-subtle">
          <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-4">Configuration</label>
          {renderConfig()}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 mt-6 border-t border-border-subtle pb-8">
          {selectedNode.type !== 'TRIGGER' ? (
            <div className="flex flex-col gap-2 relative">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveStep}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-md transition-colors"
                >
                  Save Step
                </button>
                <button
                  onClick={async () => {
                    handleSaveStep();
                    setIsTesting(true);
                    onUpdateNode(selectedNode.id, { ...selectedNode, testResult: null });
                    try {
                      // Helper to resolve variables with their actual example values before sending to backend
                      const resolveConfigVariables = (configObj, varGroups) => {
                        if (!configObj) return configObj;
                        
                        const resolveString = (str) => {
                          if (typeof str !== 'string') return str;
                          return str.replace(/\{\{([^}]+)\}\}/g, (match, varId) => {
                          let exampleVal = match; 
                          for (const group of (varGroups || [])) {
                            const v = group.variables?.find(v => v.id === varId);
                            if (v && v.example !== undefined) {
                              exampleVal = String(v.example);
                              break;
                            }
                          }
                          return exampleVal;
                        });
                      };

                      const resolveRecursive = (obj) => {
                        if (typeof obj === 'string') return resolveString(obj);
                        if (Array.isArray(obj)) return obj.map(resolveRecursive);
                        if (obj !== null && typeof obj === 'object') {
                          const newObj = {};
                          for (const key in obj) {
                            newObj[key] = resolveRecursive(obj[key]);
                          }
                          return newObj;
                        }
                        return obj;
                      };

                      return resolveRecursive(configObj);
                    };

                    const resolvedConfig = resolveConfigVariables(selectedNode.config, variableGroups);
                    console.log("[Test Debug] selectedNode.config:", selectedNode.config);
                    console.log("[Test Debug] variableGroups:", JSON.stringify(variableGroups));
                    console.log("[Test Debug] resolvedConfig:", resolvedConfig);

                    // Validate Delay Format
                    if (selectedNode.integration?.id === 'delay' && (resolvedConfig.delayType === 'until' || resolvedConfig.delayType === 'event_based')) {
                      const targetDate = resolvedConfig.delayType === 'until' ? resolvedConfig.untilDate : resolvedConfig.eventDate;
                      const formatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
                      if (!targetDate || !formatRegex.test(String(targetDate).trim())) {
                        onUpdateNode(selectedNode.id, { 
                          ...selectedNode, 
                          testResult: { success: false, error: 'Invalid Date Format', fix: 'Format must be exactly YYYY-MM-DD HH:mm:ss. The delay will not work otherwise.' } 
                        });
                        setIsTesting(false);
                        return;
                      }
                    }

                    const res = await testNodeAction({
                      type: selectedNode.type,
                      integrationId: selectedNode.integration?.id || selectedNode.integrationId,
                      config: resolvedConfig
                    });
                    
                    onUpdateNode(selectedNode.id, { ...selectedNode, testResult: res });
                  } catch (e) {
                    onUpdateNode(selectedNode.id, { 
                      ...selectedNode, 
                      testResult: { success: false, error: e.message, fix: 'Check your network connection.' } 
                    });
                  } finally {
                    setIsTesting(false);
                  }
                }}
                disabled={isTesting}
                className="flex-[2] flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white font-medium py-2 rounded-md transition-colors"
              >
                {isTesting ? (
                   <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                {isTesting ? 'Testing...' : 'Save & Test Step'}
              </button>
            </div>
            
            <AnimatePresence>
              {isSaved && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center justify-center gap-1.5 text-xs text-green-400 mt-3 bg-green-500/10 py-1.5 rounded-md border border-green-500/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Step saved successfully
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          ) : (
            <div className="flex flex-col gap-2 relative">
              <button
                onClick={handleSaveStep}
                className="w-full flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium py-2 rounded-md transition-colors"
              >
                Save Step
              </button>
              <AnimatePresence>
                {isSaved && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center justify-center gap-1.5 text-xs text-green-400 mt-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Step saved successfully
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

            {selectedNode.testResult && (
              <div className={`mt-4 p-3 rounded-md border ${selectedNode.testResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${selectedNode.testResult.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${selectedNode.testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedNode.testResult.success ? 'Success' : 'Test Failed'}
                  </span>
                  {selectedNode.testResult.time && <span className="text-[10px] text-text-secondary ml-auto">{selectedNode.testResult.time}ms</span>}
                </div>
                
                {selectedNode.testResult.error && (
                  <p className="text-xs text-red-300 font-mono mb-2 bg-red-950/50 p-2 rounded border border-red-500/20 break-words">
                    {selectedNode.testResult.error}
                  </p>
                )}

                {selectedNode.testResult.fix && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase font-semibold tracking-wider text-text-secondary mb-1">How to fix</p>
                    <p className="text-xs text-white/90">{selectedNode.testResult.fix}</p>
                  </div>
                )}

                {selectedNode.testResult.data && (
                  <div>
                    <p className="text-[10px] uppercase font-semibold tracking-wider text-text-secondary mb-1">Response Data</p>
                    <pre className="text-[10px] font-mono bg-black/40 p-2 rounded border border-white/5 overflow-x-auto text-white/80 max-h-40 overflow-y-auto">
                      {JSON.stringify(selectedNode.testResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
      <ConnectionGuideModal
        isOpen={isConnectionGuideOpen}
        onClose={() => setIsConnectionGuideOpen(false)}
        providerName="Instagram"
      />
      <WebhookGuideModal 
        isOpen={isWebhookGuideOpen}
        onClose={() => setIsWebhookGuideOpen(false)}
        integrationId={selectedNode?.integration?.id}
      />
    </div>
  );
}
