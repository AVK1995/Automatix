import { Settings, X, Copy, Plus, Trash2, Sparkles, PlayCircle, AlertCircle, CheckCircle2, RefreshCw, ExternalLink, AlertTriangle, Variable, HelpCircle, Globe, Terminal, HardDrive, ShieldCheck, FileVideo, Image, Eye, Film, Music, FileText, Download, Zap, Lightbulb, Crown, Coins, Gauge, Clock, ChevronRight, Wand2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConnectIntegration from './ConnectIntegration';
import Select from '@/components/ui/Select';
import Toggle from '@/components/ui/Toggle';
import Radio from '@/components/ui/Radio';
import VariableInput from '@/components/ui/VariableInput';
import MediaUploader from '@/components/ui/MediaUploader';
import QuotaUpgradeModal from '@/components/ui/QuotaUpgradeModal';
import GoogleSheetsGuideModal from './GoogleSheetsGuideModal';
import GoogleDriveGuideModal from './GoogleDriveGuideModal';
import MediaPreviewModal from './MediaPreviewModal';
import ConnectionGuideModal from '@/components/ui/ConnectionGuideModal';
import WebhookGuideModal from '@/components/builder/WebhookGuideModal';
import AiLatencyBenchmarkModal from './AiLatencyBenchmarkModal';
import AiRadahnPromptModal from './AiRadahnPromptModal';
import AiRadahnReplicaModal from './AiRadahnReplicaModal';
import { testNodeAction, verifyAiKeyAction } from '@/actions/testNode';
import { getWebhookPayloadHistory, simulateInstagramDM, simulateStorageUpload } from '@/actions/workflows';
import { getRecentBookings } from '@/actions/bookings';
import ConfirmModal from '@/components/ui/ConfirmModal';
import HtmlEditor from '@/components/ui/HtmlEditor';
import HtmlPreviewModal from '@/components/ui/HtmlPreviewModal';
import VariableMenu from '@/components/ui/VariableMenu';
import ColorPicker from '@/components/ui/ColorPicker';
import QuestionBuilder from '@/components/builder/QuestionBuilder';
import { sanitizeAndInspectPrompt } from '@/lib/mediaAnalyzer';
import { detectFileCategory, TASK_OPERATIONS_BY_CATEGORY } from '@/lib/aiProvider';
import Link from 'next/link';
import { getCalendars, getCalendarById } from '@/actions/calendars';
import { NODE_TYPES } from '@/constants';

export default function PropertiesPanel({ selectedNode, nodes = [], onClose, onUpdateNode, onSelectNode, onConfigureReminderStep, onSimulate, workflowId, isPublished }) {
  const [schemaValue, setSchemaValue] = useState(selectedNode?.config?.schema || '');
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
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
  const [aiRadahnModalOpen, setAiRadahnModalOpen] = useState(false);
  const [aiRadahnModalType, setAiRadahnModalType] = useState('smtp_email');
  const [aiRadahnContext, setAiRadahnContext] = useState({});
  const [isReplicaModalOpen, setIsReplicaModalOpen] = useState(false);
  
  const prevIdRef = import('react').then(() => {}).catch(() => {}); // Hack to avoid importing if already there
  const [initialState, setInitialState] = useState(null);

  useEffect(() => {
    if (selectedNode) {
      setInitialState({
        title: selectedNode.title,
        config: JSON.parse(JSON.stringify(selectedNode.config || {}))
      });

      const isWebhookTrigger = ['webhook', 'sheets_trigger', 'storage_trigger'].includes(selectedNode?.integration?.id) || selectedNode?.type === 'trigger_instagram';
      // Auto-generate webhook token if missing
      if (isWebhookTrigger && !selectedNode?.config?.webhookToken) {
        onUpdateNode(selectedNode.id, (prevNode) => {
          if (!prevNode || prevNode.config?.webhookToken) return prevNode;
          return {
            ...prevNode,
            config: {
              ...prevNode.config,
              webhookToken: crypto.randomUUID ? crypto.randomUUID() : 'gen-' + Date.now() + Math.random().toString(36).substring(2)
            }
          };
        });
      }

      if (selectedNode?.integration?.id === 'storage_trigger') {
        onUpdateNode(selectedNode.id, (prevNode) => {
          if (!prevNode) return prevNode;
          const conf = prevNode.config || {};
          if (conf.provider && conf.folderName) return prevNode;
          return {
            ...prevNode,
            config: {
              provider: conf.provider || 'gdrive',
              folderName: conf.folderName || 'Automatix Uploads',
              fileFilter: conf.fileFilter || 'ALL',
              isListening: conf.isListening !== false,
              webhookToken: conf.webhookToken || (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : `token_${Date.now()}`)
            }
          };
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
  const [isStorageGuideOpen, setIsStorageGuideOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [storageSimData, setStorageSimData] = useState({
    fileName: 'sample_upload.mp4',
    fileUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    fileType: 'video/mp4',
    fileSizeMB: '14.2',
    folderName: 'Automatix Uploads'
  });
  const [isStorageSimulating, setIsStorageSimulating] = useState(false);
  const [payloadHistory, setPayloadHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isConnectionGuideOpen, setIsConnectionGuideOpen] = useState(false);
  const [simulatedMessage, setSimulatedMessage] = useState('');
  const [simulationError, setSimulationError] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiPreviewLoading, setAiPreviewLoading] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState(null);
  const [aiPreviewError, setAiPreviewError] = useState(null);
  const [aiCopiedField, setAiCopiedField] = useState(null);
  const [isVerifyingAiKey, setIsVerifyingAiKey] = useState(false);
  const [aiKeyStatus, setAiKeyStatus] = useState(null);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [aiElapsedTime, setAiElapsedTime] = useState(0);

  const handleVerifyAiKey = async () => {
    const nodeConfig = selectedNode?.config || {};
    if (!nodeConfig.apiKey?.trim()) {
      toast.error('Please enter an API key first');
      return;
    }
    setIsVerifyingAiKey(true);
    setAiKeyStatus(null);
    try {
      const res = await verifyAiKeyAction({
        provider: nodeConfig.provider || 'gemini',
        apiKey: nodeConfig.apiKey,
        baseUrl: nodeConfig.baseUrl
      });
      setAiKeyStatus(res);
      if (res.valid) {
        toast.success(res.message || 'API Key verified successfully!');
      } else {
        toast.error(res.error || 'Key verification failed');
      }
    } catch (err) {
      setAiKeyStatus({ valid: false, error: err.message });
      toast.error('Verification error');
    } finally {
      setIsVerifyingAiKey(false);
    }
  };

  const handleTestAiMediator = async () => {
    const nodeConfig = selectedNode?.config || {};
    const provider = nodeConfig?.provider || 'native';

    if (provider !== 'native' && provider !== 'automatix' && !nodeConfig?.apiKey?.trim()) {
      setAiPreviewError(`Please enter a valid ${(provider || 'AI').toUpperCase()} API key, or switch to the free Automatix Native Engine.`);
      return;
    }
    setAiPreviewLoading(true);
    setAiPreviewError(null);
    setAiElapsedTime(0);

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setAiElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    try {
      const storageNode = nodes.find(n => n.integration?.id === 'storage_trigger' || n.id === 'storage_trigger');
      const activeStorageFile = storageNode?.config?.capturedPayload || null;

      const res = await testNodeAction({
        type: 'ACTION',
        integration: { id: 'ai_mediator' },
        integrationId: 'ai_mediator',
        config: {
          ...nodeConfig,
          fileDetails: activeStorageFile,
          mediaUrl: nodeConfig.mediaUrl || activeStorageFile?.fileUrl || activeStorageFile?.downloadUrl || ''
        }
      });

      clearInterval(timerInterval);
      const totalElapsedSec = (Date.now() - startTime) / 1000;
      setAiElapsedTime(totalElapsedSec);

      if (res.success && res.data) {
        setAiPreviewData({
          ...res.data,
          generationTimeSec: res.data.generationTimeSec || totalElapsedSec.toFixed(2),
          generationTimeMs: res.data.generationTimeMs || Math.round(totalElapsedSec * 1000)
        });
        toast.success(`AI output generated in ${totalElapsedSec.toFixed(2)}s!`);
      } else {
        setAiPreviewError(res.error || 'Failed to generate output from AI model');
      }
    } catch (err) {
      clearInterval(timerInterval);
      setAiPreviewError(err.message || 'Execution error while testing AI node');
    } finally {
      clearInterval(timerInterval);
      setAiPreviewLoading(false);
    }
  };
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
      
      // Auto-select the most recent payload if listening or if a new event arrived
      const isActuallyListening = isPublished ? true : (selectedNode?.config?.isListening !== false);
      if (history && history.length > 0 && isActuallyListening) {
        const mostRecent = history[0];
        const clearedAt = selectedNode?.config?.clearedAt || 0;
        const payloadTime = new Date(mostRecent.createdAt).getTime();
        
        if (payloadTime > clearedAt) {
          onUpdateNode(selectedNode.id, (prevNode) => {
            if (!prevNode) return prevNode;
            const currentSelectedId = prevNode.config?.selectedEventId;
            if (!prevNode.config?.capturedPayload || (currentSelectedId && mostRecent.id !== currentSelectedId)) {
              return {
                ...prevNode,
                config: {
                  ...prevNode.config,
                  capturedPayload: mostRecent.payload,
                  selectedEventId: mostRecent.id
                }
              };
            }
            return prevNode;
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch payload history', e);
    } finally {
      if (showLoader) setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (['webhook', 'sheets_trigger', 'storage_trigger', 'calendar', 'instagram'].includes(selectedNode?.integration?.id)) {
      fetchPayloadHistory(true);
    }
  }, [selectedNode?.id, workflowId, selectedNode?.config?.connectionId]);

  useEffect(() => {
    let intervalId;
    const isActuallyListening = isPublished ? true : (selectedNode?.config?.isListening !== false);
    
    if (['webhook', 'sheets_trigger', 'storage_trigger', 'instagram'].includes(selectedNode?.integration?.id) && isActuallyListening && workflowId && workflowId !== 'new') {
      intervalId = setInterval(() => {
        fetchPayloadHistory(false);
      }, 2000);
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

  // Google Sheets Metadata Auto-Fetcher & Refetcher
  const refetchSheets = async () => {
    const spreadsheetId = selectedNode?.config?.spreadsheetId;
    if (!spreadsheetId) return;
    setLoadingSheets(true);
    try {
      const res = await fetch(`/api/integrations/google/public-sheet-meta?sheetId=${spreadsheetId}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.success && data.sheets) {
        setAvailableSheets(data.sheets.map(s => ({ value: s, label: s })));
        if (data.spreadsheetName) {
          onUpdateNode(selectedNode.id, (prevNode) => {
            if (!prevNode || prevNode.config?.spreadsheetName === data.spreadsheetName) return prevNode;
            return {
              ...prevNode,
              config: { ...prevNode.config, spreadsheetName: data.spreadsheetName }
            };
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSheets(false);
    }
  };

  useEffect(() => {
    const fetchSheets = async () => {
      const spreadsheetId = selectedNode?.config?.spreadsheetId;
      const actionType = selectedNode?.config?.actionType || 'WRITE';
      
      if (spreadsheetId && ['sheets', 'sheets_trigger', 'google_sheets'].includes(selectedNode?.integration?.id)) {
        // Don't fetch if creating a new sheet
        if (actionType === 'CREATE_SHEET') return;
        
        setLoadingSheets(true);
        try {
          const res = await fetch(`/api/integrations/google/public-sheet-meta?sheetId=${spreadsheetId}&_t=${Date.now()}`);
          const data = await res.json();
          if (data.success && data.sheets) {
            setAvailableSheets(data.sheets.map(s => ({ value: s, label: s })));
            if (data.spreadsheetName) {
              onUpdateNode(selectedNode.id, (prevNode) => {
                if (!prevNode || prevNode.config?.spreadsheetName === data.spreadsheetName) return prevNode;
                return {
                  ...prevNode,
                  config: { ...prevNode.config, spreadsheetName: data.spreadsheetName }
                };
              });
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
      
      if (spreadsheetId && sheetName && ['sheets', 'sheets_trigger', 'google_sheets'].includes(selectedNode?.integration?.id)) {
        // Only fetch headers for actions that map columns or search, and always for sheets_trigger
        if (['sheets', 'google_sheets'].includes(selectedNode?.integration?.id) && !['WRITE', 'UPDATE', 'READ', 'DELETE'].includes(actionType)) return;
        
        setLoadingHeaders(true);
        try {
          const res = await fetch(`/api/integrations/google/public-sheet-meta?sheetId=${spreadsheetId}&sheetName=${encodeURIComponent(sheetName)}&_t=${Date.now()}`);
          const data = await res.json();
          if (data.success && data.headers) {
            setAvailableHeaders(data.headers);
            
            // Auto-populate mapping if it's currently empty and action is WRITE or UPDATE
            if (['WRITE', 'UPDATE'].includes(actionType)) {
              onUpdateNode(selectedNode.id, (prevNode) => {
                if (!prevNode) return prevNode;
                const currentMapping = prevNode.config?.rowDataMapping || [];
                if (currentMapping.length === 0 && data.headers.length > 0) {
                  const autoMap = data.headers.map(h => ({ key: h, value: '' }));
                  return {
                    ...prevNode,
                    config: { ...prevNode.config, rowDataMapping: autoMap }
                  };
                }
                return prevNode;
              });
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingHeaders(false);
        }
      }
    };
    
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
      
      if (tId === 'storage_trigger') {
        if (tConfig.capturedPayload && typeof tConfig.capturedPayload === 'object') {
          try {
            group.variables.push(...flattenObject(tConfig.capturedPayload));
          } catch (e) {
            console.error(e);
          }
        } else {
          group.variables.push(
            { id: 'trigger.body.fileName', label: 'fileName', example: 'sample_upload.mp4' },
            { id: 'trigger.body.fileUrl', label: 'fileUrl (Direct Media URL)', example: 'https://automatix.storage/drive/sample-media.mp4' },
            { id: 'trigger.body.fileType', label: 'fileType', example: 'video/mp4' },
            { id: 'trigger.body.fileSizeMB', label: 'fileSizeMB', example: '14.2' },
            { id: 'trigger.body.folderName', label: 'folderName', example: 'Automatix Uploads' },
            { id: 'trigger.body.uploadedAt', label: 'uploadedAt (ISO Date)', example: '2026-08-27T12:00:00.000Z' }
          );
        }
      } else if (tId === 'sheets_trigger') {
        if (tConfig.capturedPayload && typeof tConfig.capturedPayload === 'object') {
          try {
            group.variables.push(...flattenObject(tConfig.capturedPayload));
          } catch (e) {
            console.error(e);
          }
        } else {
          group.variables.push(
            { id: 'trigger.body._row', label: '_row', example: '2' },
            { id: 'trigger.body._event', label: '_event', example: 'row_added' },
            { id: 'trigger.body._triggeredAt', label: '_triggeredAt (ISO Date & Time)', example: '2026-08-25T14:49:00.000Z' },
            { id: 'trigger.body._triggeredDate', label: '_triggeredDate (Date)', example: '2026-08-25' },
            { id: 'trigger.body._triggeredTime', label: '_triggeredTime (Time)', example: '14:49:00' }
          );
        }
      } else if (tId === 'webhook') {
        if (tConfig.capturedPayload && typeof tConfig.capturedPayload === 'object') {
          try {
            group.variables.push(...flattenObject(tConfig.capturedPayload));
          } catch (e) {
            console.error(e);
          }
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
    } else if (anc.type === 'ACTION' || anc.type === 'FORMATTER' || anc.integration?.id?.includes('formatter') || anc.integration?.id === 'ai_mediator' || anc.integration?.id === 'instagram_publish') {
      if (anc.integration?.id === 'ai_mediator') {
        group.variables.push(
          { id: `steps.${anc.id}.output`, label: 'output (Full Primary Generated Text)', example: 'Ready to level up your workflow? Check out these 3 game-changing tips!' },
          { id: `steps.${anc.id}.caption`, label: 'caption (Social Media Caption)', example: 'Ready to level up your workflow? Check out these 3 game-changing tips! #Automation #SaaS #Productivity' },
          { id: `steps.${anc.id}.title`, label: 'title / hook (Headline or Title Hook)', example: '3 Workflow Hacks You Need in 2026' },
          { id: `steps.${anc.id}.hook`, label: 'hook (Scroll-Stopping First Line)', example: 'Stop scrolling if you want to elevate your content game!' },
          { id: `steps.${anc.id}.hashtags`, label: 'hashtags (Curated Hashtags)', example: '#Automation #Growth #AI #Productivity' },
          { id: `steps.${anc.id}.summary`, label: 'summary (Document / Media Summary & Takeaways)', example: 'Key takeaways: 1. Instant cloud uploads. 2. Visual AI captioning. 3. Zero manual publishing.' },
          { id: `steps.${anc.id}.transcript`, label: 'transcript (Speech-to-Text Transcript)', example: '[00:00 - 00:15] Welcome to the episode! Today we are discussing scalable automated workflows...' },
          { id: `steps.${anc.id}.actionItems`, label: 'actionItems (Extracted Tasks & Checklist)', example: '1. [High Priority] Finalize stakeholder review.\n2. [Actionable] Implement trigger validation.' },
          { id: `steps.${anc.id}.insights`, label: 'insights (Data Trends & Analysis)', example: 'Overview: +28.4% efficiency improvement across automated cycles.' },
          { id: `steps.${anc.id}.tokensUsed`, label: 'tokensUsed (Total Tokens Consumed)', example: '559' },
          { id: `steps.${anc.id}.model`, label: 'model (AI Engine / Model Name)', example: 'Google Gemini (gemini-flash-lite-latest)' },
          { id: `steps.${anc.id}.createdAt`, label: 'createdAt (Generation Timestamp ISO)', example: new Date().toISOString() },
          { id: `steps.${anc.id}.timestamp`, label: 'timestamp (Execution Timestamp)', example: new Date().toISOString() },
          { id: `steps.${anc.id}.rawOutput`, label: 'rawOutput (Raw Generated Response)', example: 'Full generated response' }
        );
      } else if (anc.integration?.id === 'instagram_publish') {
        group.variables.push(
          { id: `steps.${anc.id}.publishedPostId`, label: 'publishedPostId', example: '17923485720194857' },
          { id: `steps.${anc.id}.permalink`, label: 'permalink (Post URL)', example: 'https://www.instagram.com/p/C_abc123/' },
          { id: `steps.${anc.id}.status`, label: 'status', example: 'SUCCESS' }
        );
      } else if (anc.testResult?.data && typeof anc.testResult.data === 'object') {
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
    } else if (anc.type === 'DELAY' && anc.config?.delayType === 'wait_for_reply') {
      group.variables.push(
        { id: `steps.${anc.id}.reply_text`, label: 'reply_text', example: 'John' }
      );
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
    onUpdateNode(selectedNode.id, (prevNode) => {
      if (!prevNode) return prevNode;
      const currentConfig = prevNode.config || {};
      const newConfig = { ...currentConfig, [field]: value };
      
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

      return {
        ...prevNode,
        config: newConfig,
        issue: null
      };
    });
  };

  const handleSaveStep = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCopy = (text, key = 'default') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setCopiedKey(key);
    setTimeout(() => {
      setCopied(false);
      setCopiedKey(null);
    }, 2000);
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
        const genericLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const genericBrowserOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const genericStaleTunnel = config.customOrigin && (config.customOrigin.includes('ngrok') || config.customOrigin.includes('localtunnel') || config.customOrigin.includes('trycloudflare') || config.customOrigin.includes('localhost'));
        const activeGenericOrigin = (!genericLocalhost && genericStaleTunnel)
          ? genericBrowserOrigin
          : ((config.customOrigin && config.customOrigin.trim()) 
              ? config.customOrigin.trim().replace(/\/+$/, '') 
              : genericBrowserOrigin);
        const hookUrl = config.webhookToken ? `${activeGenericOrigin}/api/webhooks/incoming/${workflowId || 'new'}?token=${config.webhookToken}` : 'Generating link...';
        
        // Force Listening Mode ON if published
        const isListening = isPublished ? true : (config.isListening || false);

        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-text-secondary">Webhook URL</label>
                <button
                  type="button"
                  onClick={() => {
                    const liveOrigin = typeof window !== 'undefined' ? window.location.origin : '';
                    onUpdateNode(selectedNode.id, {
                      ...selectedNode,
                      config: {
                        ...selectedNode.config,
                        customOrigin: ''
                      }
                    });
                    toast.success(`Webhook URL synced to ${liveOrigin}`);
                  }}
                  className="text-[10px] text-accent-blue hover:text-white transition-colors flex items-center gap-1 bg-accent-blue/10 hover:bg-accent-blue/20 px-2 py-0.5 rounded border border-accent-blue/20 font-medium"
                  title="Sync Webhook URL with current browser domain"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Live Domain</span>
                </button>
              </div>
              <div className="flex items-center mt-1">
                <input readOnly value={hookUrl} className="w-full bg-black/50 border border-white/10 rounded-l-md px-3 py-2 text-sm text-text-secondary font-mono focus:outline-none" />
                <button 
                  disabled={!config.webhookToken}
                  onClick={() => handleCopy(hookUrl, 'generic_webhook')} 
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50 px-3 py-2 border border-l-0 border-white/10 rounded-r-md text-xs font-medium transition-colors w-16 text-center"
                >
                  {copiedKey === 'generic_webhook' ? 'Copied' : 'Copy'}
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
                <button
                  type="button"
                  onClick={() => fetchPayloadHistory(true)}
                  disabled={isLoadingHistory}
                  className="text-[10px] text-text-tertiary hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/5 disabled:opacity-50"
                  title="Check for new events"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin text-accent-blue' : ''}`} />
                  <span>{isLoadingHistory ? 'Checking...' : 'Refresh'}</span>
                </button>
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
                      onUpdateNode(selectedNode.id, (prevNode) => ({
                        ...prevNode,
                        config: {
                          ...prevNode?.config,
                          capturedPayload: selected.payload,
                          selectedEventId: selected.id
                        }
                      }));
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
                      onUpdateNode(selectedNode.id, (prevNode) => ({
                        ...prevNode,
                        config: {
                          ...prevNode?.config,
                          capturedPayload: null,
                          clearedAt: Date.now(),
                          selectedEventId: null,
                          isListening: true
                        }
                      }));
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
                onUpdateNode(selectedNode.id, (prevNode) => ({
                  ...prevNode,
                  config: {
                    ...prevNode?.config,
                    webhookToken: crypto.randomUUID().replace(/-/g, '')
                  }
                }));
              }}
              title="Regenerate Webhook Link"
              message="Are you sure? Any existing external applications sending data to the old URL will fail."
              confirmText="Regenerate"
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

    case 'storage_trigger':
        const isStorageLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const currentStorageBrowserOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const isStorageStaleTunnel = config.customOrigin && (config.customOrigin.includes('ngrok') || config.customOrigin.includes('localtunnel') || config.customOrigin.includes('trycloudflare') || config.customOrigin.includes('localhost'));
        
        const activeStorageOrigin = (!isStorageLocalhost && isStorageStaleTunnel)
          ? currentStorageBrowserOrigin
          : ((config.customOrigin && config.customOrigin.trim()) 
              ? config.customOrigin.trim().replace(/\/+$/, '') 
              : currentStorageBrowserOrigin);
        const storageHookUrl = config.webhookToken ? `${activeStorageOrigin}/api/webhooks/incoming/${workflowId || 'new'}?token=${config.webhookToken}` : 'Generating link...';
        const isStorageListening = isPublished ? true : (config.isListening !== false);
        const currentStorageSignature = `${config.provider || 'gdrive'}-${config.folderName || ''}-${config.fileFilter || 'ALL'}-${config.webhookToken || ''}`;
        const isStorageStale = Boolean(config.lastCopiedSignature && config.lastCopiedSignature !== currentStorageSignature);

        const gdriveScriptCode = `/**
 * Automatix Cloud Storage Trigger Script (Google Drive)
 * Auto-registers background time triggers and pushes new uploads to your Automatix workflow.
 */
function setupTrigger() {
  // Clear any existing triggers to prevent duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'watchFolderForNewFiles') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Create 1-minute automatic background time trigger
  ScriptApp.newTrigger('watchFolderForNewFiles')
    .timeBased()
    .everyMinutes(1)
    .create();
  
  // Run once immediately to check folder & send test verification payload
  watchFolderForNewFiles();
  Logger.log("Google Drive Trigger registered and active!");
}

function watchFolderForNewFiles() {
  var targetFolderName = "${config.folderName || 'Automatix Uploads'}".trim();
  var webhookUrl = "${storageHookUrl}";
  var fileFilter = "${config.fileFilter || 'ALL'}";
  
  var folders = DriveApp.getFoldersByName(targetFolderName);
  if (!folders.hasNext()) {
    Logger.log("Folder not found: " + targetFolderName + ". Please create this folder in Google Drive.");
    return;
  }
  
  var folder = folders.next();
  var files = folder.getFiles();
  var props = PropertiesService.getScriptProperties();
  var processed = JSON.parse(props.getProperty("PROCESSED_FILES") || "{}");
  
  while (files.hasNext()) {
    var file = files.next();
    var fileId = file.getId();
    var mimeType = file.getMimeType().toLowerCase();
    
    // Apply Media Format Filter
    if (fileFilter === 'IMAGES_ONLY' && !mimeType.startsWith('image/')) continue;
    if (fileFilter === 'VIDEOS_ONLY' && !mimeType.startsWith('video/')) continue;
    if (fileFilter === 'DOCUMENTS_ONLY' && (mimeType.startsWith('image/') || mimeType.startsWith('video/'))) continue;
    
    if (!processed[fileId]) {
      var fileSizeMB = (file.getSize() / (1024 * 1024)).toFixed(2);
      if (parseFloat(fileSizeMB) > 25) {
        Logger.log("Skipping file exceeding 25MB limit: " + file.getName());
        continue;
      }
      
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        Logger.log("Sharing permission warning: " + shareErr.message);
      }
      var downloadUrl = "https://lh3.googleusercontent.com/d/" + fileId;
      var payload = {
        fileName: file.getName(),
        fileUrl: downloadUrl,
        fileType: file.getMimeType(),
        fileSizeMB: parseFloat(fileSizeMB),
        folderName: targetFolderName,
        uploadedAt: new Date().toISOString()
      };
      
      var options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        headers: {
          "Bypass-Tunnel-Reminder": "true",
          "bypass-tunnel-reminder": "true",
          "User-Agent": "Automatix-AppsScript"
        },
        muteHttpExceptions: true
      };
      
      try {
        var response = UrlFetchApp.fetch(webhookUrl, options);
        Logger.log("Automatix Webhook Fired: " + file.getName() + " -> Status: " + response.getResponseCode());
        processed[fileId] = new Date().toISOString();
      } catch (err) {
        Logger.log("Webhook Error: " + err.message);
      }
    }
  }
  
  props.setProperty("PROCESSED_FILES", JSON.stringify(processed));
}
`;

        const oneDrivePayload = `{
  "fileName": "@{triggerOutputs()?['body/Name']}",
  "fileUrl": "@{triggerOutputs()?['body/@odata.mediaEditLink']}",
  "fileType": "@{triggerOutputs()?['body/ContentType']}",
  "fileSizeMB": "@{div(triggerOutputs()?['body/Size'], 1048576)}",
  "folderName": "${config.folderName || 'Automatix Uploads'}"
}`;

        const customCurlCode = `curl -X POST "${storageHookUrl}" -H "Content-Type: application/json" -d '{\\n  "fileName": "sample_file.mp4",\\n  "fileUrl": "https://example.com/files/sample_file.mp4",\\n  "fileType": "video/mp4",\\n  "fileSizeMB": 14.2,\\n  "folderName": "${config.folderName || 'Automatix Uploads'}"\\n}'`;

        return (
          <div className="space-y-4">

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Storage Provider</label>
              <Select 
                value={config.provider || 'gdrive'} 
                onChange={(val) => handleChange('provider', val)}
                options={[
                  { value: 'gdrive', label: 'Google Drive' },
                  { value: 'onedrive', label: 'Microsoft OneDrive' },
                  { value: 'proton', label: 'Proton Drive' },
                  { value: 'custom', label: 'Custom / Direct Webhook API' }
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Target Folder Name or Path</label>
              <input
                type="text"
                placeholder="e.g. Automatix Uploads, Invoices, Media, or Reports"
                value={config.folderName || ''}
                onChange={(e) => handleChange('folderName', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
              />
              <p className="text-[10px] text-text-tertiary mt-1">Files dropped in this folder will trigger the automation.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Media Format Filter</label>
              <Select 
                value={config.fileFilter || 'ALL'} 
                onChange={(val) => handleChange('fileFilter', val)}
                options={[
                  { value: 'ALL', label: 'All Files (Images, Videos, Docs)' },
                  { value: 'IMAGES_ONLY', label: 'Images Only (.jpg, .png, .webp)' },
                  { value: 'VIDEOS_ONLY', label: 'Videos Only (.mp4, .mov)' },
                  { value: 'DOCUMENTS_ONLY', label: 'Documents Only (.pdf, .doc, .txt)' }
                ]}
              />
              <div className="mt-1.5 p-2 bg-sky-500/10 border border-sky-500/20 rounded-md text-[11px] text-sky-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-sky-400" />
                  <span>Max File Size: <strong>25 MB</strong> per file</span>
                </span>
                <span className="text-[10px] text-white/50">Auto-enforced</span>
              </div>
            </div>

            {isStorageLocalhost && !config.customOrigin && (
              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>Localhost Webhook Notice</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Google Apps Script runs on <strong>Google Cloud servers</strong> and cannot send HTTP webhooks directly to your private <code className="text-amber-300 font-mono">localhost:3000</code>.
                </p>
                <div className="text-[11px] text-text-secondary space-y-1">
                  <p className="text-white font-medium">How to test:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-text-tertiary">
                    <li>
                      <strong className="text-white">Instant Test:</strong> Use the <strong>"Simulate File Upload"</strong> button below to test without any tunnel!
                    </li>
                    <li>
                      <strong className="text-white">Real Drive Uploads:</strong> Start a public tunnel (e.g. <code className="text-white">npx ngrok http 3000</code>) and enter your URL below.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {isStorageLocalhost && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Public Tunnel / Domain Override (Optional for local testing)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. https://xxxx.trycloudflare.com or https://xxxx.ngrok-free.app"
                    value={config.customOrigin || ''}
                    onChange={(e) => handleChange('customOrigin', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-accent-blue placeholder:text-text-tertiary"
                  />
                  <p className="text-[10px] text-text-tertiary mt-1">
                    If set, the generated Apps Script code and Webhook URL will automatically use this public endpoint.
                  </p>
                </div>
              </div>
            )}

            {/* Ingestion Webhook URL */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">Webhook Ingestion Endpoint</span>
                <span className="text-[10px] text-text-tertiary">HTTP POST</span>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={storageHookUrl}
                  className="w-full bg-black/50 border border-white/10 rounded-md pl-3 pr-20 py-2 text-xs text-white font-mono focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(storageHookUrl);
                    setCopied(true);
                    toast.success('Webhook Ingestion URL copied!');
                    onUpdateNode(selectedNode.id, (prevNode) => ({
                      ...prevNode,
                      config: {
                        ...prevNode?.config,
                        lastCopiedSignature: currentStorageSignature
                      }
                    }));
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {!isStorageLocalhost && isStorageStaleTunnel && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-300">Stale tunnel URL detected.</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('customOrigin', currentStorageBrowserOrigin);
                      toast.success('Live domain synchronized!');
                    }}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded text-[10px] font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Sync Live Domain
                  </button>
                </div>
              )}
            </div>

            {/* CONFIGURATION CHANGED WARNING */}
            {config.lastCopiedSignature && config.lastCopiedSignature !== currentStorageSignature && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-md">
                <p className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Storage Configuration Changed!
                </p>
                <p className="text-[10px] text-red-300 mt-1 leading-relaxed">
                  You have changed the target folder, provider, or media filter. You <strong>MUST</strong> copy the updated Apps Script code below, paste it into Google Apps Script, and click <strong>Run (setupTrigger)</strong> once to apply your new settings.
                </p>
              </div>
            )}

            {/* DYNAMIC PROVIDER SETUP & SCRIPT SECTION */}
            {(config.provider === 'gdrive' || !config.provider) && (
              <div className="p-3.5 bg-black/40 border border-sky-500/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Google Apps Script</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsStorageGuideOpen(true)}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                      <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" /> Guide
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(gdriveScriptCode);
                        setCopiedScript(true);
                        toast.success('Google Apps Script copied to clipboard!');
                        onUpdateNode(selectedNode.id, (prevNode) => ({
                          ...prevNode,
                          config: {
                            ...prevNode?.config,
                            lastCopiedSignature: currentStorageSignature
                          }
                        }));
                        setTimeout(() => setCopiedScript(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded text-[11px] font-semibold flex items-center gap-1.5 border border-sky-500/30 whitespace-nowrap"
                    >
                      {copiedScript ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-green-400" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-text-secondary space-y-1 bg-black/50 p-2.5 rounded border border-white/5 leading-relaxed">
                  <p><strong className="text-white">1.</strong> Open <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">script.google.com</a> & click <strong>New project</strong>.</p>
                  <p><strong className="text-white">2.</strong> Paste the script below & click <strong>Save</strong>.</p>
                  <p><strong className="text-white">3.</strong> Keep <code className="text-sky-300 font-mono">setupTrigger</code> selected at the top and click <strong>Run</strong> (authorize once & you're done!).</p>
                </div>

                <div className="relative">
                  <pre className="p-2.5 bg-black/60 border border-white/10 rounded-md text-[10px] font-mono text-white/80 overflow-x-auto max-h-[140px] select-all">
                    {gdriveScriptCode}
                  </pre>
                </div>
              </div>
            )}

            {config.provider === 'onedrive' && (
              <div className="p-3.5 bg-black/40 border border-blue-500/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Power Automate</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsStorageGuideOpen(true)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                      <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" /> Guide
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(oneDrivePayload);
                        toast.success('Power Automate JSON payload copied!');
                      }}
                      className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-[11px] font-semibold flex items-center gap-1.5 border border-blue-500/30 whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Copy JSON</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-text-secondary space-y-1 bg-black/50 p-2.5 rounded border border-white/5 leading-relaxed">
                  <p><strong className="text-white">1.</strong> Open <a href="https://make.powerautomate.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">make.powerautomate.com</a> & create an Automated Cloud Flow.</p>
                  <p><strong className="text-white">2.</strong> Trigger: <strong>When a file is created (OneDrive)</strong> in folder <strong className="text-white">{config.folderName || 'Automatix Uploads'}</strong>.</p>
                  <p><strong className="text-white">3.</strong> Action: <strong>HTTP (POST)</strong> → URL: your Webhook URL above, Body: JSON snippet below.</p>
                </div>

                <div className="relative">
                  <pre className="p-2.5 bg-black/60 border border-white/10 rounded-md text-[10px] font-mono text-white/80 overflow-x-auto max-h-[140px] select-all">
                    {oneDrivePayload}
                  </pre>
                </div>
              </div>
            )}

            {(config.provider === 'proton' || config.provider === 'custom') && (
              <div className="p-3.5 bg-black/40 border border-purple-500/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 min-w-0">
                    <Terminal className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Ingestion API</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(customCurlCode);
                      toast.success('cURL command copied!');
                    }}
                    className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded text-[11px] font-semibold flex items-center gap-1.5 border border-purple-500/30 whitespace-nowrap flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Copy cURL</span>
                  </button>
                </div>

                <p className="text-[11px] text-text-secondary">
                  Send a <strong>POST</strong> request with <code>Content-Type: application/json</code> whenever a file is uploaded to your custom storage or Proton Drive sync folder:
                </p>

                <div className="relative">
                  <pre className="p-2.5 bg-black/60 border border-white/10 rounded-md text-[10px] font-mono text-white/80 overflow-x-auto max-h-[140px] select-all">
                    {customCurlCode}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-md border border-white/5">
              <div>
                <p className="text-xs font-medium text-white">Listening for Uploads</p>
                <p className="text-[10px] text-text-tertiary mt-0.5">Captures incoming files in real time</p>
              </div>
              <Toggle
                checked={isStorageListening}
                onChange={(val) => handleChange('isListening', val)}
              />
            </div>

            <div className="p-3 bg-black/40 border border-white/10 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Simulate File Upload
                  </span>
                </div>
                <p className="text-[10px] text-text-tertiary">Send a mock file upload event to test downstream steps in your workflow.</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-text-secondary mb-0.5">File Name</label>
                    <input
                      type="text"
                      value={storageSimData.fileName}
                      onChange={(e) => setStorageSimData(prev => ({ ...prev, fileName: e.target.value }))}
                      className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-secondary mb-0.5">Media Type</label>
                    <Select
                      value={storageSimData.fileType}
                      onChange={(val) => setStorageSimData(prev => ({ ...prev, fileType: val }))}
                      buttonClassName="py-1 text-xs"
                      options={[
                        { value: 'video/mp4', label: 'Video (.mp4)' },
                        { value: 'image/jpeg', label: 'Image (.jpg / .jpeg)' },
                        { value: 'image/png', label: 'Image (.png)' },
                        { value: 'application/pdf', label: 'Document (.pdf)' }
                      ]}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isStorageSimulating}
                  onClick={async () => {
                    setIsStorageSimulating(true);
                    try {
                      const res = await simulateStorageUpload(workflowId, {
                        ...storageSimData,
                        folderName: config.folderName || 'Automatix Uploads'
                      });
                      if (res.success) {
                        toast.success('Simulated file upload event dispatched!');
                        fetchPayloadHistory(true);
                      }
                    } catch (e) {
                      toast.error(e.message || 'Simulation failed');
                    } finally {
                      setIsStorageSimulating(false);
                    }
                  }}
                  className="w-full py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold rounded text-xs transition-colors border border-sky-500/30 flex items-center justify-center gap-1.5"
                >
                  {isStorageSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                  {isStorageSimulating ? 'Dispatching...' : 'Dispatch Test File Event'}
                </button>
              </div>

              {/* ACTIVE CAPTURED TRIGGER FILE (SINGLE-SLOT OVERWRITE BUFFER) */}
              {(() => {
                const activeFile = config.capturedPayload || (payloadHistory.length > 0 ? payloadHistory[0].payload : null);
                if (!activeFile) {
                  return (
                    <div className="p-3 bg-black/20 border border-white/5 rounded-lg text-center space-y-1">
                      <p className="text-xs text-text-tertiary">No live file captured yet.</p>
                      <p className="text-[10px] text-text-tertiary">Drop a file in your Drive folder or click Dispatch Test File Event above.</p>
                    </div>
                  );
                }

                const fileType = (activeFile.fileType || '').toLowerCase();
                const isCaptVideo = fileType.startsWith('video/') || !!(activeFile.fileName || '').match(/\.(mp4|mov|webm|m4v)$/i);
                const isCaptImage = fileType.startsWith('image/') || !!(activeFile.fileName || '').match(/\.(jpg|jpeg|png|webp|gif)$/i);
                const isCaptPdf = fileType.includes('pdf') || !!(activeFile.fileName || '').match(/\.pdf$/i);

                return (
                  <div className="p-3.5 bg-black/50 border border-sky-500/30 rounded-xl space-y-3 shadow-lg shadow-sky-950/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-white">Active Trigger File (Live Buffer)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleChange('capturedPayload', null);
                          handleChange('selectedEventId', null);
                          handleChange('clearedAt', Date.now());
                          toast.success('Trigger buffer cleared');
                        }}
                        className="text-[10px] text-text-tertiary hover:text-red-400 transition-colors"
                      >
                        Clear Buffer
                      </button>
                    </div>

                    {/* File details card */}
                    <div className="p-2.5 bg-zinc-900/80 border border-white/10 rounded-lg flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isCaptVideo ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                          isCaptImage ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          isCaptPdf ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}>
                          {isCaptVideo ? <Film className="w-4 h-4" /> :
                           isCaptImage ? <ImageIcon className="w-4 h-4" /> :
                           isCaptPdf ? <FileText className="w-4 h-4" /> :
                           <HardDrive className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate max-w-[180px]" title={activeFile.fileName || 'Uploaded File'}>
                            {activeFile.fileName || 'Uploaded File'}
                          </p>
                          <p className="text-[10px] text-text-tertiary truncate" title={`${activeFile.fileSizeMB ? `${activeFile.fileSizeMB} MB` : '< 25 MB'} • ${activeFile.fileType || 'binary'}`}>
                            {activeFile.fileSizeMB ? `${activeFile.fileSizeMB} MB` : '< 25 MB'} • {activeFile.fileType || 'binary'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPreviewFile(activeFile);
                          setIsPreviewModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold rounded-md text-xs transition-all border border-sky-500/30 flex items-center gap-1.5 shrink-0 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview & Play</span>
                      </button>
                    </div>

                    {/* Storage & Variable Mapping Pill */}
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[11px] text-emerald-300 space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Single-Slot Overwrite Active</span>
                        </span>
                        <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-200 font-mono">
                          25 MB Limit OK
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                        Overwrites automatically with every new upload to prevent storage bloat. Mapped to <code className="bg-emerald-950 px-1 py-0.5 rounded text-emerald-200 font-mono select-all">{"{{trigger.body.fileUrl}}"}</code>.
                      </p>
                    </div>

                    {/* Secondary buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('{{trigger.body.fileUrl}}');
                          toast.success('Variable {{trigger.body.fileUrl}} copied!');
                        }}
                        className="flex-1 py-1 px-2 bg-white/5 hover:bg-white/10 text-white rounded text-[11px] font-medium border border-white/5 transition-colors flex items-center justify-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Variable</span>
                      </button>
                      {activeFile.fileUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activeFile.fileUrl);
                            toast.success('Direct Media URL copied!');
                          }}
                          className="py-1 px-2.5 bg-white/5 hover:bg-white/10 text-white rounded text-[11px] font-medium border border-white/5 transition-colors flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Direct URL</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
          </div>
        );

    case 'sheets_trigger':
        const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const currentBrowserOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const isStaleTunnel = config.customOrigin && (config.customOrigin.includes('ngrok') || config.customOrigin.includes('localtunnel') || config.customOrigin.includes('trycloudflare') || config.customOrigin.includes('localhost'));
        
        const activeOrigin = (!isLocalhost && isStaleTunnel)
          ? currentBrowserOrigin
          : ((config.customOrigin && config.customOrigin.trim()) 
              ? config.customOrigin.trim().replace(/\/+$/, '') 
              : currentBrowserOrigin);
        const sheetsHookUrl = config.webhookToken ? `${activeOrigin}/api/webhooks/incoming/${workflowId || 'new'}?token=${config.webhookToken}` : 'Generating link...';
        const isSheetsListening = isPublished ? true : (config.isListening !== false);
        
        const handleTriggerUrlChange = (val) => {
          handleChange('sheetUrl', val);
          const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (match && match[1]) {
             handleChange('spreadsheetId', match[1]);
          }
        };

        const targetTab = config.range || 'Sheet1';
        const currentEvent = config.triggerEvent || 'row_added';
        const targetRowRule = config.targetRowRule || 'any';
        const targetRowIndex = parseInt(config.targetRowIndex, 10);
        const triggerCol = config.triggerColumn || '';

        // Dynamic condition based on event and row rule
        let rowConditionCode = '';
        if (currentEvent === 'row_added') {
          rowConditionCode = '  // Only trigger when the newly added last row is edited\n  if (row < sheet.getLastRow()) {\n    Logger.log("Ignored: edit on row " + row + " is not the last row (" + sheet.getLastRow() + ")");\n    return;\n  }\n';
        } else if (currentEvent === 'row_updated') {
          if (targetRowRule === 'last') {
            rowConditionCode = '  // Only trigger if edit is on the last row\n  if (row < sheet.getLastRow()) return;\n';
          } else if (targetRowRule === 'specific' && !isNaN(targetRowIndex) && targetRowIndex > 1) {
            rowConditionCode = `  // Only trigger for specific row ${targetRowIndex}\n  if (row !== ${targetRowIndex}) return;\n`;
          }
        }

        let columnFilterCode = '';
        if (triggerCol) {
          columnFilterCode = `  var triggerColName = "${triggerCol}".trim().toLowerCase();\n  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];\n  var triggerColIndex = -1;\n  for (var h = 0; h < headers.length; h++) {\n    if (String(headers[h]).trim().toLowerCase() === triggerColName) {\n      triggerColIndex = h;\n      break;\n    }\n  }\n  if (triggerColIndex !== -1 && e.range.getColumn() !== (triggerColIndex + 1)) {\n    Logger.log("Ignored: edit in col " + e.range.getColumn() + ", but target col is " + (triggerColIndex + 1));\n    return;\n  }\n`;
        }

        const appsScriptCode = `function setupTrigger() {\n  // Clear any existing triggers to prevent duplicates\n  var triggers = ScriptApp.getProjectTriggers();\n  for (var i = 0; i < triggers.length; i++) {\n    if (triggers[i].getHandlerFunction() === 'onEditRow') {\n      ScriptApp.deleteTrigger(triggers[i]);\n    }\n  }\n  ScriptApp.newTrigger('onEditRow')\n    .forSpreadsheet(SpreadsheetApp.getActive())\n    .onEdit()\n    .create();\n  \n  // Automatically send the latest row as a test payload immediately\n  testSendLastRow();\n  Logger.log("Trigger setup and test payload sent successfully!");\n}\n\nfunction onEditRow(e) {\n  // If run manually from Apps Script without edit event e, fallback to sending the last row\n  if (!e || !e.source) {\n    testSendLastRow();\n    return;\n  }\n\n  var sheet = e.source.getActiveSheet();\n  if (sheet.getName().trim().toLowerCase() !== "${targetTab}".trim().toLowerCase()) {\n    Logger.log("Ignored: edit was on sheet '" + sheet.getName() + "', but target tab is '${targetTab}'");\n    return;\n  }\n  \n  var row = e.range.getRow();\n  if (row <= 1) return; // Skip header row\n${rowConditionCode}${columnFilterCode}\n  // Smart Debounce & Multi-Column Delay:\n  // If user or an automation is populating columns across this row, debounce rapid edits\n  // and wait 3.5 seconds so all remaining columns have time to settle.\n  var cache = CacheService.getScriptCache();\n  var lockKey = "edit_row_" + sheet.getName() + "_" + row;\n  if (cache.get(lockKey)) {\n    Logger.log("Debouncing rapid edit on row " + row);\n    return;\n  }\n  cache.put(lockKey, "1", 6);\n\n  // Wait 3.5 seconds to capture all populated column values\n  Utilities.sleep(3500);\n  SpreadsheetApp.flush();\n\n  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];\n  var data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];\n  var now = new Date();\n  \n  var payload = {\n    _event: "${currentEvent}",\n    _row: row,\n    _triggeredAt: now.toISOString(),\n    _triggeredDate: Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd"),\n    _triggeredTime: Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT", "HH:mm:ss")\n  };\n  for (var i = 0; i < headers.length; i++) {\n    var key = String(headers[i]).trim();\n    if (key) {\n      var cellVal = data[i];\n      if (cellVal instanceof Date) {\n        payload[key] = cellVal.toISOString();\n      } else {\n        payload[key] = (cellVal !== undefined && cellVal !== null) ? cellVal : "";\n      }\n    }\n  }\n\n  var response = UrlFetchApp.fetch("${sheetsHookUrl}", {\n    method: "post",\n    contentType: "application/json",\n    headers: {\n      "Bypass-Tunnel-Reminder": "true",\n      "bypass-tunnel-reminder": "true",\n      "ngrok-skip-browser-warning": "true",\n      "User-Agent": "Automatix-AppsScript"\n    },\n    muteHttpExceptions: true,\n    payload: JSON.stringify(payload)\n  });\n  Logger.log("Webhook fired for row " + row + " | Status: " + response.getResponseCode() + " | Body: " + response.getContentText());\n}\n\nfunction testSendLastRow() {\n  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("${targetTab}") || SpreadsheetApp.getActiveSheet();\n  var lastRow = sheet.getLastRow();\n  if (lastRow <= 1) {\n    Logger.log("No data rows found below header.");\n    return;\n  }\n  SpreadsheetApp.flush();\n  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];\n  var data = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];\n  var now = new Date();\n  \n  var payload = {\n    _event: "${currentEvent}",\n    _row: lastRow,\n    _triggeredAt: now.toISOString(),\n    _triggeredDate: Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd"),\n    _triggeredTime: Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT", "HH:mm:ss")\n  };\n  for (var i = 0; i < headers.length; i++) {\n    var key = String(headers[i]).trim();\n    if (key) {\n      var cellVal = data[i];\n      if (cellVal instanceof Date) {\n        payload[key] = cellVal.toISOString();\n      } else {\n        payload[key] = (cellVal !== undefined && cellVal !== null) ? cellVal : "";\n      }\n    }\n  }\n\n  var response = UrlFetchApp.fetch("${sheetsHookUrl}", {\n    method: "post",\n    contentType: "application/json",\n    headers: {\n      "Bypass-Tunnel-Reminder": "true",\n      "bypass-tunnel-reminder": "true",\n      "ngrok-skip-browser-warning": "true",\n      "User-Agent": "Automatix-AppsScript"\n    },\n    muteHttpExceptions: true,\n    payload: JSON.stringify(payload)\n  });\n  Logger.log("Test payload sent for row " + lastRow + " | Status: " + response.getResponseCode() + " | Body: " + response.getContentText());\n}`;
        const currentSignature = `${config.spreadsheetId || ''}-${config.range || ''}-${currentEvent}-${targetRowRule}-${config.targetRowIndex || ''}-${triggerCol}`;

        return (
          <div className="space-y-6">
            {/* 1. Google Sheet Connection */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Spreadsheet</label>
              
              {!config.spreadsheetId && pseudoConnections.length > 0 && (
                <div className="mb-3">
                  <Select 
                    value=""
                    onChange={(val) => {
                      if (val) {
                        const sheet = pseudoConnections.find(s => s.id === val);
                        if (sheet) {
                          onUpdateNode(selectedNode.id, (prevNode) => ({
                            ...prevNode,
                            config: {
                              ...prevNode?.config,
                              sheetUrl: `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`,
                              spreadsheetId: sheet.id,
                              spreadsheetName: sheet.name
                            }
                          }));
                        }
                      }
                    }}
                    options={[
                      { value: '', label: 'Select a previously connected sheet...' },
                      ...pseudoConnections.map(c => ({ value: c.id, label: c.name }))
                    ]}
                  />
                  <p className="text-[10px] text-text-tertiary mt-1">Or paste a new Google Sheet URL below.</p>
                </div>
              )}

              {config.spreadsheetId ? (
                <div className="bg-black/50 border border-white/10 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 mb-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> Connected Spreadsheet
                      </span>
                      {config.spreadsheetName && <p className="text-sm font-medium text-white truncate max-w-[200px]" title={config.spreadsheetName}>{config.spreadsheetName}</p>}
                      <p className="text-[10px] text-text-tertiary truncate max-w-[200px]" title={config.spreadsheetId}>ID: {config.spreadsheetId}</p>
                    </div>
                    <button 
                      onClick={() => setSheetToClear('trigger')}
                      className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded transition-colors whitespace-nowrap flex-shrink-0 ml-2"
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
                   className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue placeholder:text-text-tertiary"
                />
              )}
            </div>

            {/* 2. Worksheet Tab */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-text-secondary">Worksheet Tab</label>
                {config.spreadsheetId && (
                  <button
                    type="button"
                    onClick={refetchSheets}
                    disabled={loadingSheets}
                    className="text-[10px] text-text-tertiary hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/5 disabled:opacity-50"
                    title="Refresh worksheet tabs"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingSheets ? 'animate-spin text-accent-blue' : ''}`} />
                    <span>{loadingSheets ? 'Loading...' : 'Refresh Tabs'}</span>
                  </button>
                )}
              </div>
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
              {loadingSheets && <p className="text-[10px] text-text-tertiary mt-1 animate-pulse">Loading worksheet tabs...</p>}
            </div>

            {/* 3. Trigger Event */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Trigger Event</label>
              <Select 
                value={currentEvent} 
                onChange={(val) => handleChange('triggerEvent', val)}
                options={[
                  { value: 'row_added', label: 'New Row Added (Last Row Only)' },
                  { value: 'row_updated', label: 'Row Updated / Cell Modified' }
                ]}
              />
              <p className="text-[10px] text-text-tertiary mt-1">
                {currentEvent === 'row_added' 
                  ? 'Fires exclusively when a new row is added at the end of the sheet. Historical row edits are ignored.' 
                  : 'Fires when existing cells or rows are edited based on your row/column rules below.'}
              </p>
            </div>

            {/* 4. Row Updated Specific Settings */}
            {currentEvent === 'row_updated' && (
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Target Row Scope</label>
                  <Select 
                    value={targetRowRule} 
                    onChange={(val) => handleChange('targetRowRule', val)}
                    options={[
                      { value: 'any', label: 'Any Row in Worksheet' },
                      { value: 'last', label: 'Only the Last (Latest) Row' },
                      { value: 'specific', label: 'Specific Row Number' }
                    ]}
                  />
                </div>

                {targetRowRule === 'specific' && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Row Number (Row 2 or higher)</label>
                    <input 
                      type="number"
                      min={2}
                      placeholder="e.g. 2"
                      value={config.targetRowIndex || ''}
                      onChange={(e) => handleChange('targetRowIndex', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue font-mono"
                    />
                    <p className="text-[10px] text-text-tertiary mt-1">Row 1 is reserved for column headers.</p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Trigger Column Filter */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Trigger Column {currentEvent === 'row_added' ? '(Optional Filter)' : ''}
              </label>
              <p className="text-[10px] text-text-tertiary mb-1.5">
                {currentEvent === 'row_added'
                  ? 'Optionally fire only if a specific column is populated in the new row.'
                  : 'Only trigger when a cell inside this specific column is modified.'}
              </p>
              {availableHeaders.length > 0 ? (
                <Select 
                  value={triggerCol} 
                  onChange={(val) => handleChange('triggerColumn', val)}
                  options={[{ value: '', label: 'Any Column (Trigger on all edits)' }, ...availableHeaders.map(h => ({ value: h, label: h }))]}
                />
              ) : (
                <input 
                   type="text" 
                   placeholder={loadingHeaders ? "Fetching columns..." : "e.g. Email or Status (leave blank for Any Column)"}
                   value={triggerCol} 
                   onChange={(e) => handleChange('triggerColumn', e.target.value)}
                   className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono"
                   disabled={loadingHeaders}
                />
              )}
              {loadingHeaders && <p className="text-[10px] text-text-tertiary mt-1 animate-pulse">Loading column headers...</p>}
            </div>

            {/* 6. Real-Time Webhook & Apps Script Card */}
            <div className="bg-black/20 p-4 rounded-md border border-white/5 space-y-4">
              <Toggle 
                label="Listening Mode (Catching for the first time)"
                checked={isSheetsListening}
                disabled={isPublished}
                onChange={(checked) => handleChange('isListening', checked)}
                description={isPublished ? "Listening mode is permanently active while workflow is published." : "Keep the webhook in listening mode to test and catch incoming row data."}
              />

              {isLocalhost && !config.customOrigin && (
                <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>Localhost Webhook Notice</span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Google Sheets runs on <strong>Google Cloud servers</strong> and cannot send HTTP webhooks directly to your private <code className="text-amber-300 font-mono">localhost:3000</code>.
                  </p>
                  <div className="text-[11px] text-text-secondary space-y-1">
                    <p className="text-white font-medium">To test this trigger locally:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-text-tertiary">
                      <li>
                        <strong className="text-white">Public Tunnel:</strong> Start a tunnel (e.g. <code className="text-white">npx untun@latest tunnel --port 3000</code> or <code className="text-white">ngrok http 3000</code>) and enter your URL below.
                      </li>
                      <li>
                        <strong className="text-white">Live Production:</strong> Open and test your workflow on your deployed domain.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {isLocalhost && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Public Tunnel / Domain Override (Optional for local testing)
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. https://xxxx.trycloudflare.com or https://automatix-sepia.vercel.app"
                      value={config.customOrigin || ''}
                      onChange={(e) => handleChange('customOrigin', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-accent-blue placeholder:text-text-tertiary"
                    />
                    <p className="text-[10px] text-text-tertiary mt-1">
                      If set, the generated Apps Script code and Webhook URL will automatically use this public endpoint.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-md p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-accent-blue" />
                        <span>Start Terminal Tunnel (ngrok / localtunnel)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('npx ngrok http 3000', 'tunnel')}
                        className="text-[10px] text-accent-blue hover:text-white transition-colors flex items-center gap-1 font-medium"
                      >
                        <Copy className="w-3 h-3" /> {copiedKey === 'tunnel' ? 'Copied' : 'Copy ngrok Command'}
                      </button>
                    </div>
                    <div className="bg-black/60 rounded px-2.5 py-1.5 border border-white/5 flex items-center justify-between">
                      <code className="text-[11px] text-emerald-400 font-mono select-all">
                        npx ngrok http 3000
                      </code>
                    </div>
                    <p className="text-[10px] text-text-tertiary leading-relaxed">
                      Run this in your terminal to get a super-fast, reliable public URL, then paste the generated <code className="text-white">https://xxxx.ngrok-free.app</code> into the field above.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Webhook URL</label>
                  <button
                    type="button"
                    onClick={() => {
                      const liveOrigin = typeof window !== 'undefined' ? window.location.origin : '';
                      onUpdateNode(selectedNode.id, {
                        ...selectedNode,
                        config: {
                          ...selectedNode.config,
                          customOrigin: '',
                          lastCopiedSignature: currentSignature
                        }
                      });
                      toast.success(`Webhook URL synced & locked to ${liveOrigin}`);
                    }}
                    className="text-[10px] text-accent-blue hover:text-white transition-colors flex items-center gap-1 bg-accent-blue/10 hover:bg-accent-blue/20 px-2 py-0.5 rounded border border-accent-blue/20 font-medium"
                    title="Sync Webhook URL with current browser domain"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Live Domain</span>
                  </button>
                </div>
                <div className="flex items-center">
                  <input readOnly value={sheetsHookUrl} className="w-full bg-black/50 border border-white/10 rounded-l-md px-3 py-2 text-xs text-text-secondary font-mono focus:outline-none" />
                  <button 
                    disabled={!config.webhookToken}
                    onClick={() => {
                      handleCopy(sheetsHookUrl, 'sheets_webhook');
                      if (!isLocalhost && isStaleTunnel) {
                        onUpdateNode(selectedNode.id, {
                          ...selectedNode,
                          config: {
                            ...selectedNode.config,
                            customOrigin: '',
                            lastCopiedSignature: currentSignature
                          }
                        });
                      }
                    }} 
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 px-3 py-2 border border-l-0 border-white/10 rounded-r-md text-xs font-medium transition-colors w-16 text-center text-white"
                  >
                    {copiedKey === 'sheets_webhook' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {config.lastCopiedSignature && config.lastCopiedSignature !== currentSignature && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-md">
                  <p className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Sheet Configuration Changed!
                  </p>
                  <p className="text-[10px] text-red-300 mt-1">
                    You have changed the spreadsheet, worksheet tab, trigger event, target row, or column. You <strong>MUST</strong> copy the updated Apps Script code below and paste it into the Apps Script editor of your sheet.
                  </p>
                </div>
              )}
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-text-secondary">Apps Script Code</label>
                    <button 
                      type="button"
                      onClick={() => setIsCodeCollapsed(!isCodeCollapsed)}
                      className="text-[10px] text-text-tertiary hover:text-white transition-colors"
                    >
                      {isCodeCollapsed ? '(Expand)' : '(Collapse)'}
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsGuideModalOpen(true)}
                    className="text-[11px] text-accent-blue hover:text-white transition-colors flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" /> Learn How?
                  </button>
                </div>
                
                {!isCodeCollapsed && (
                  <div className="relative">
                    <textarea 
                      readOnly 
                      rows={8} 
                      className="w-full bg-black/50 border border-white/10 rounded-md p-3 text-[10px] text-accent-blue font-mono focus:outline-none resize-none custom-scrollbar pb-11"
                      value={appsScriptCode}
                    />
                    <div className="absolute right-2 bottom-2.5">
                      <button 
                        type="button"
                        onClick={() => {
                          handleCopy(appsScriptCode, 'sheets_code');
                          onUpdateNode(selectedNode.id, (prevNode) => ({
                            ...prevNode,
                            config: {
                              ...prevNode?.config,
                              customOrigin: !isLocalhost && isStaleTunnel ? '' : (prevNode?.config?.customOrigin || ''),
                              lastCopiedSignature: currentSignature
                            }
                          }));
                        }}
                        className="flex items-center gap-1.5 text-xs bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue hover:text-white border border-accent-blue/30 px-3 py-1.5 rounded transition-all font-medium backdrop-blur-sm"
                      >
                        <Copy className="w-3.5 h-3.5 shrink-0" /> {copiedKey === 'sheets_code' ? 'Copied' : 'Copy Code'}
                      </button>
                    </div>
                  </div>
                )}

                {isCodeCollapsed && (
                  <button 
                    type="button"
                    onClick={() => {
                      handleCopy(appsScriptCode, 'sheets_code');
                      onUpdateNode(selectedNode.id, (prevNode) => ({
                        ...prevNode,
                        config: {
                          ...prevNode?.config,
                          customOrigin: !isLocalhost && isStaleTunnel ? '' : (prevNode?.config?.customOrigin || ''),
                          lastCopiedSignature: currentSignature
                        }
                      }));
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded transition-colors font-medium"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copiedKey === 'sheets_code' ? 'Copied to Clipboard' : 'Copy Apps Script Code'}
                  </button>
                )}
              </div>
              
              {/* 7. Recent Webhook Events & Variable Schema Selection */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-text-secondary">Recent Webhook Events</label>
                  <button
                    type="button"
                    onClick={() => fetchPayloadHistory(true)}
                    disabled={isLoadingHistory}
                    className="text-[10px] text-text-tertiary hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/5 disabled:opacity-50"
                    title="Check for new events"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin text-accent-blue' : ''}`} />
                    <span>{isLoadingHistory ? 'Checking...' : 'Refresh'}</span>
                  </button>
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
                        onUpdateNode(selectedNode.id, (prevNode) => ({
                          ...prevNode,
                          config: {
                            ...prevNode?.config,
                            capturedPayload: selected.payload,
                            selectedEventId: selected.id
                          }
                        }));
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
                    <label className="block text-[11px] font-medium text-brand-primary">Selected Payload Schema (Variables)</label>
                    <button
                      onClick={() => {
                        onUpdateNode(selectedNode.id, (prevNode) => ({
                          ...prevNode,
                          config: {
                            ...prevNode?.config,
                            capturedPayload: null,
                            clearedAt: Date.now(),
                            selectedEventId: null,
                            isListening: true
                          }
                        }));
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
                      <button
                        type="button"
                        onClick={() => fetchPayloadHistory(true)}
                        disabled={isLoadingHistory}
                        className="text-[10px] text-text-tertiary hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/5 disabled:opacity-50"
                        title="Check for new bookings"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin text-accent-blue' : ''}`} />
                        <span>{isLoadingHistory ? 'Checking...' : 'Refresh'}</span>
                      </button>
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
                            onUpdateNode(selectedNode.id, (prevNode) => ({
                              ...prevNode,
                              config: {
                                ...prevNode?.config,
                                capturedPayload: selected.payload,
                                selectedEventId: selected.id
                              }
                            }));
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
                          onUpdateNode(selectedNode.id, (prevNode) => ({
                            ...prevNode,
                            config: {
                              ...prevNode?.config,
                              capturedPayload: null,
                              clearedAt: Date.now(),
                              selectedEventId: null
                            }
                          }));
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
                  <button
                    type="button"
                    onClick={() => fetchPayloadHistory(true)}
                    disabled={isLoadingHistory}
                    className="text-[10px] text-text-tertiary hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/5 disabled:opacity-50"
                    title="Check for new events"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin text-accent-blue' : ''}`} />
                    <span>{isLoadingHistory ? 'Checking...' : 'Refresh'}</span>
                  </button>
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
                        onUpdateNode(selectedNode.id, (prevNode) => ({
                          ...prevNode,
                          config: {
                            ...prevNode?.config,
                            capturedPayload: selected.payload,
                            selectedEventId: selected.id
                          }
                        }));
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
                      onUpdateNode(selectedNode.id, (prevNode) => ({
                        ...prevNode,
                        config: {
                          ...prevNode?.config,
                          capturedPayload: null,
                          clearedAt: Date.now(),
                          selectedEventId: null,
                          isListening: true
                        }
                      }));
                    }}
                    className="text-[10px] text-text-tertiary hover:text-white transition-colors"
                  >
                    Clear Data
                  </button>
                </div>
                <div className="max-h-[200px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                  <pre className="text-[10px] text-text-secondary font-mono whitespace-pre-wrap break-all">
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
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-2">Upload File</label>
                      <MediaUploader 
                        value={config.mediaUrl || ''} 
                        onChange={(val) => handleChange('mediaUrl', val)} 
                        nodeId={selectedNode.id} 
                      />
                      <div className="mt-2 text-[10px] text-red-400 px-1 border-l-2 border-red-500/30 pl-2">
                        <span className="font-semibold">META LIMITS:</span> Instagram DMs only support attachments up to <span className="font-bold">25MB for Videos</span> and <span className="font-bold">8MB for Images</span>. Exceeding this will cause a Meta upload failure.
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">OR</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Paste Link or Variable</label>
                      <VariableInput 
                        placeholder="https://example.com/image.jpg" 
                        value={config.mediaUrl || ''} 
                        onChange={(val) => handleChange('mediaUrl', val)} 
                        variables={variableGroups} 
                      />

                      {(() => {
                        const dmStorageNode = nodes.find(n => n.integration?.id === 'storage_trigger' || n.id === 'storage_trigger');
                        const dmActiveStorageFile = dmStorageNode?.config?.capturedPayload || null;
                        if (!dmActiveStorageFile) return null;
                        return (
                          <div className="mt-2 p-2.5 rounded-lg bg-zinc-900/90 border border-blue-500/20 flex items-center justify-between gap-2.5 shadow-inner">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0" title="Cloud Storage Trigger Payload">
                                <HardDrive className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-medium text-white truncate max-w-[180px] sm:max-w-[240px]" title={dmActiveStorageFile.fileName || 'Captured File'}>
                                    {dmActiveStorageFile.fileName || 'Captured File'}
                                  </span>
                                  <span className="text-[10px] text-text-tertiary flex-shrink-0" title={`Size: ${dmActiveStorageFile.fileSizeMB ? `${dmActiveStorageFile.fileSizeMB} MB` : 'Trigger File'}`}>
                                    • {dmActiveStorageFile.fileSizeMB ? `${dmActiveStorageFile.fileSizeMB} MB` : 'Trigger File'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-text-tertiary truncate" title="Active Drive File • Single-slot auto-overwritten buffer">
                                  Active Drive File • Single-slot auto-overwritten
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  handleChange('mediaUrl', '{{trigger.body.fileUrl}}');
                                  toast.success(`Mapped to ${dmActiveStorageFile.fileName || 'captured file'}`);
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                                  config.mediaUrl === '{{trigger.body.fileUrl}}'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-inner'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                                }`}
                              >
                                <Sparkles className="w-3 h-3 text-blue-300 flex-shrink-0" />
                                <span>{config.mediaUrl === '{{trigger.body.fileUrl}}' ? 'Mapped' : 'Auto-Fill'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewFile(dmActiveStorageFile);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="p-1.5 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-md border border-sky-500/20 transition-all flex items-center justify-center flex-shrink-0"
                                title="Preview captured file"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      <p className="text-[10px] text-text-tertiary mt-1">If you upload a file, the URL will automatically appear here.</p>
                    </div>
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

      case 'ai_mediator':
        return (
          <div className="space-y-4">
            {/* Premium Credit Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>AI Content Synthesizer</span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 flex items-center gap-1">
                <Coins className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                <span>1 Credit / Run</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">AI Provider</label>
              <Select 
                value={config.provider || 'native'} 
                onChange={(val) => {
                  handleChange('provider', val);
                  setAiKeyStatus(null);
                }}
                options={[
                  { value: 'native', label: 'Automatix AI Engine (Built-in • Default)' },
                  { value: 'gemini', label: 'Google Gemini (BYOK)' },
                  { value: 'openai', label: 'OpenAI ChatGPT (BYOK)' },
                  { value: 'claude', label: 'Anthropic Claude (BYOK)' },
                  { value: 'custom', label: 'Custom OpenAI-Compatible (BYOK)' }
                ]}
              />
            </div>

            {(!config.provider || config.provider === 'native') ? (
              <div className="p-3 bg-gradient-to-r from-accent-blue/15 to-purple-500/10 border border-accent-blue/30 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-blue">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Automatix AI Engine Active</span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Built-in • No API Key Needed
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Automated multimodal analysis and social copy synthesis built directly into Automatix. Test generations and preview steps are free and unlimited.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-text-secondary">API Key (Bring Your Own Key)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleVerifyAiKey}
                      disabled={isVerifyingAiKey || !config.apiKey}
                      className="text-[10px] text-accent-blue hover:text-accent-blue/80 font-medium disabled:opacity-40 flex items-center gap-1"
                    >
                      {isVerifyingAiKey ? (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verify Key</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[10px] text-text-tertiary hover:text-white"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  name="ai_byok_api_key_field"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  style={{ WebkitTextSecurity: showApiKey ? 'none' : 'disc' }}
                  placeholder={config.provider === 'gemini' ? 'AIzaSy...' : (config.provider === 'claude' ? 'sk-ant-...' : 'sk-...')}
                  value={config.apiKey || ''}
                  onChange={(e) => {
                    handleChange('apiKey', e.target.value);
                    setAiKeyStatus(null);
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent-blue"
                />

                {aiKeyStatus && (
                  <div className={`mt-2 p-2 rounded text-[11px] border flex items-start gap-1.5 ${
                    aiKeyStatus.valid 
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                      : 'bg-red-950/40 border-red-500/30 text-red-300'
                  }`}>
                    {aiKeyStatus.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-400" />
                    )}
                    <div className="flex-1 leading-tight">
                      <div>{aiKeyStatus.valid ? aiKeyStatus.message : aiKeyStatus.error}</div>
                      {!aiKeyStatus.valid && (
                        <div className="mt-1.5">
                          <button
                            type="button"
                            onClick={() => handleChange('provider', 'native')}
                            className="text-[10px] font-semibold text-accent-blue hover:underline"
                          >
                            Switch to built-in Automatix AI Engine ➔
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-text-tertiary mt-1">
                  {config.provider === 'gemini' 
                    ? 'Free tier keys from aistudio.google.com are supported with dynamic model discovery.' 
                    : (config.provider === 'claude' 
                        ? 'Get your Claude key at console.anthropic.com' 
                        : 'Your key is securely used to process your workflow tasks.')}
                </p>
              </div>
            )}

            {config.provider === 'custom' && (
              <div className="p-3 bg-black/30 rounded-lg border border-white/5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">API Base URL</label>
                  <input
                    type="text"
                    placeholder="https://api.groq.com/openai/v1 or http://localhost:11434/v1"
                    value={config.baseUrl || ''}
                    onChange={(e) => handleChange('baseUrl', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Model Name</label>
                  <input
                    type="text"
                    placeholder="e.g. llama-3.3-70b-versatile, deepseek-chat, mistral"
                    value={config.customModel || ''}
                    onChange={(e) => handleChange('customModel', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue"
                  />
                </div>
              </div>
            )}

            {(() => {
              const storageNode = nodes.find(n => n.integration?.id === 'storage_trigger' || n.id === 'storage_trigger');
              const activeStorageFile = storageNode?.config?.capturedPayload || null;
              const detectedCategory = detectFileCategory(config.mediaUrl || '', activeStorageFile);

              const categoryMetaMap = {
                video: { label: 'Video Asset (Reels / MP4)', icon: Film, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
                audio: { label: 'Audio Track / Voice Memo', icon: Music, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                image: { label: 'Visual Graphic / Photo', icon: Image, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
                document: { label: 'Document / PDF File', icon: FileText, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
                data: { label: 'Data & Spreadsheet (CSV)', icon: Terminal, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
                text: { label: 'Prompt & Text Engine', icon: Sparkles, color: 'text-zinc-400 bg-zinc-800 border-zinc-700' }
              };

              const currentCategoryMeta = categoryMetaMap[detectedCategory] || categoryMetaMap.video;
              const CategoryIcon = currentCategoryMeta.icon;

              const categoryTaskOptions = TASK_OPERATIONS_BY_CATEGORY[detectedCategory] || TASK_OPERATIONS_BY_CATEGORY.video;
              
              // Also assemble all other operations so user has full freedom
              const allOtherOptions = Object.entries(TASK_OPERATIONS_BY_CATEGORY)
                .filter(([cat]) => cat !== detectedCategory)
                .flatMap(([, items]) => items)
                .filter((item, index, self) => self.findIndex(t => t.value === item.value) === index);

              const taskOptions = [
                ...categoryTaskOptions,
                ...allOtherOptions.filter(o => !categoryTaskOptions.some(c => c.value === o.value))
              ];

              return (
                <>
                  {/* Media File URL Section with Real-Time File Type Classification */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-text-secondary">
                        Media / Document File URL
                      </label>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${currentCategoryMeta.color}`}>
                        <CategoryIcon className="w-3 h-3 shrink-0" />
                        <span>{currentCategoryMeta.label}</span>
                      </span>
                    </div>

                    <VariableInput 
                      placeholder="e.g. {{trigger.body.fileUrl}} or paste file link" 
                      value={config.mediaUrl || ''} 
                      onChange={(val) => handleChange('mediaUrl', val)} 
                      variables={variableGroups} 
                    />

                    {activeStorageFile && (
                      <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-purple-500/20 flex items-center justify-between gap-2.5 shadow-inner">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0" title="Cloud Storage Trigger Payload">
                            <HardDrive className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-medium text-white truncate max-w-[180px] sm:max-w-[240px]" title={activeStorageFile.fileName || 'Captured File'}>
                                {activeStorageFile.fileName || 'Captured File'}
                              </span>
                              <span className="text-[10px] text-text-tertiary flex-shrink-0" title={`Size: ${activeStorageFile.fileSizeMB ? `${activeStorageFile.fileSizeMB} MB` : 'Trigger File'}`}>
                                • {activeStorageFile.fileSizeMB ? `${activeStorageFile.fileSizeMB} MB` : 'Trigger File'}
                              </span>
                            </div>
                            <p className="text-[10px] text-text-tertiary truncate" title="Active Trigger File • Auto-mapped to pipeline">
                              Active Trigger File • Auto-mapped to pipeline
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              handleChange('mediaUrl', '{{trigger.body.fileUrl}}');
                              toast.success(`Mapped to ${activeStorageFile.fileName || 'captured file'}`);
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                              config.mediaUrl === '{{trigger.body.fileUrl}}'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-inner'
                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                            }`}
                            title="Auto-fill with variable {{trigger.body.fileUrl}}"
                          >
                            <Sparkles className="w-3 h-3 text-purple-300 flex-shrink-0" />
                            <span>{config.mediaUrl === '{{trigger.body.fileUrl}}' ? 'Mapped' : 'Auto-Fill'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewFile(activeStorageFile);
                              setIsPreviewModalOpen(true);
                            }}
                            className="p-1.5 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-md border border-sky-500/20 transition-all flex items-center justify-center flex-shrink-0"
                            title="Preview captured media file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-text-tertiary" title="Accepts Videos, Audios, Images, PDFs, Documents, and CSV Spreadsheets for multimodal AI processing.">
                      Accepts Videos, Audios, Images, PDFs, Documents, and CSV Spreadsheets for multimodal AI processing.
                    </p>
                  </div>

                  {/* Context-Aware Task Operation Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-text-secondary">Task Operation</label>
                      <span className="text-[10px] text-purple-400 font-medium">Tailored for {detectedCategory.toUpperCase()}</span>
                    </div>
                    <Select 
                      value={config.task || taskOptions[0]?.value || 'generate_caption'} 
                      onChange={(val) => handleChange('task', val)}
                      options={taskOptions}
                    />
                  </div>
                </>
              );
            })()}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Brand Tone & Persona</label>
              <Select 
                value={config.tone || 'engaging'} 
                onChange={(val) => handleChange('tone', val)} 
                options={[
                  { value: 'engaging', label: 'Engaging & High Energy (Viral Social Hook)' },
                  { value: 'professional', label: 'Professional & Informative' },
                  { value: 'casual', label: 'Casual & Conversational' },
                  { value: 'storytelling', label: 'Storytelling & Inspiring' },
                  { value: 'minimalist', label: 'Minimalist & Punchy' }
                ]}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-text-secondary">Custom Instructions & Prompt Additions</label>
                <button
                  type="button"
                  onClick={() => {
                    setAiRadahnModalType('ai_prompt');
                    setAiRadahnContext({ task: config.task || '', tone: config.tone || '' });
                    setAiRadahnModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 hover:from-amber-500/30 hover:to-purple-500/30 hover:border-amber-400 shadow-sm transition-all group"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>AI Radahn Prompt Architect</span>
                </button>
              </div>
              <VariableInput 
                multiline 
                rows={4} 
                placeholder="e.g. Highlight key action items or draft a viral caption for our upcoming product launch." 
                value={config.customPrompt || ''} 
                onChange={(val) => handleChange('customPrompt', sanitizeAndInspectPrompt(val))} 
                variables={variableGroups} 
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-text-tertiary gap-2" title="Provide any custom goals, campaign guidelines, or audience focus for the AI">
                <span className="truncate pr-2 flex items-center gap-1.5 min-w-0" title="Provide any custom goals, campaign guidelines, or audience focus for the AI">
                  <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">Provide any custom goals, campaign guidelines, or audience focus</span>
                </span>
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0" title="Model accepts plain English text instructions and variables">
                  <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0 text-emerald-400" /> Plain Text Ready
                </span>
              </div>
            </div>

            {/* Interactive Live AI Preview & Test Generator */}
            <div className="pt-2 border-t border-white/5 space-y-2.5">
              {/* Average Generation Times & Benchmark Calculator Trigger */}
              <button
                type="button"
                onClick={() => setIsBenchmarkModalOpen(true)}
                title="View AI Generation Latency Benchmarks & Speed Matrix (5–25 MB)"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-purple-500/20 hover:border-purple-500/40 text-xs text-purple-300 transition-all group shadow-sm gap-2"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 group-hover:rotate-12 transition-transform" />
                  <span className="font-medium text-white/90 truncate text-left" title="AI Generation Benchmarks & Payload Latency Matrix">
                    AI Latency & Speed Matrix
                  </span>
                </div>
                <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 flex items-center gap-1 font-mono shrink-0 whitespace-nowrap" title="Payload size up to 25 MB">
                  <span>5–25 MB</span>
                  <ChevronRight className="w-3 h-3 text-purple-400 shrink-0" />
                </span>
              </button>

              <button
                type="button"
                onClick={handleTestAiMediator}
                disabled={aiPreviewLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiPreviewLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-200" />
                    <span>Generating with {config.provider ? config.provider.toUpperCase() : 'AI'}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Generate & Preview AI Output</span>
                  </>
                )}
              </button>

              {/* Live Elapsed Time Counter during Generation */}
              {aiPreviewLoading && (
                <div className="flex items-center justify-between px-3 py-2 bg-purple-500/10 border border-purple-500/25 rounded-lg text-xs animate-pulse shadow-sm">
                  <div className="flex items-center gap-2 text-purple-300">
                    <Clock className="w-3.5 h-3.5 animate-spin text-purple-400 flex-shrink-0" />
                    <span className="font-medium">Synthesizing output with {config.provider ? config.provider.toUpperCase() : 'AI'}...</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-purple-200 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                    <span className="text-xs">{aiElapsedTime.toFixed(1)}s</span>
                  </div>
                </div>
              )}

              {(() => {
                const triggerNode = nodes?.find(n => n.type === NODE_TYPES.TRIGGER);
                const triggerFile = triggerNode?.config?.simulatedPayload || triggerNode?.config?.latestUploadedFile || null;
                return (
                  <AiLatencyBenchmarkModal
                    isOpen={isBenchmarkModalOpen}
                    onClose={() => setIsBenchmarkModalOpen(false)}
                    defaultFileSize={triggerFile?.sizeMB || 5}
                    defaultFileType={triggerFile?.fileType?.includes('video') ? 'video' : (triggerFile?.fileType?.includes('image') ? 'image' : 'video')}
                  />
                );
              })()}

              {/* Token & Credit Lifecycle Notice */}
              <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-white/5 space-y-1.5">
                <div className="flex items-start gap-2">
                  <Coins className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    <span className="font-semibold text-text-primary">Testing & Previews</span> consume API tokens directly from your connected AI provider account.
                  </p>
                </div>
                <div className="flex items-start gap-2 pt-1.5 border-t border-white/5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-text-tertiary leading-relaxed">
                    <span className="font-semibold text-purple-300">Live Workflows</span> use Automatix AI Workflow Credits (1 credit/run). Included with Pro plans & available via add-on packs.
                  </p>
                </div>
              </div>

              {aiPreviewError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Generation Failed</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{aiPreviewError}</p>
                </div>
              )}

              {aiPreviewData && (
                <div className="p-3.5 bg-zinc-900/90 border border-purple-500/30 rounded-xl space-y-3 shadow-xl">
                  {/* Clean 2-Row Header with Tokens and Generation Latency */}
                  <div className="border-b border-white/5 pb-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                          AI Output Preview
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(aiPreviewData.generationTimeSec || aiPreviewData.generationTimeMs) && (
                          <span 
                            className="text-[10px] font-mono font-medium text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 shadow-sm"
                            title="Total time taken to inspect media, send prompt, and generate structured output"
                          >
                            <Clock className="w-2.5 h-2.5 flex-shrink-0 text-purple-400" />
                            <span>{aiPreviewData.generationTimeSec || ((aiPreviewData.generationTimeMs || 0) / 1000).toFixed(2)}s</span>
                          </span>
                        )}
                        {aiPreviewData.tokens && (
                          <span 
                            className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 shadow-sm" 
                            title={`${aiPreviewData.tokens.prompt} prompt / in + ${aiPreviewData.tokens.completion} completion / out`}
                          >
                            <Zap className="w-2.5 h-2.5 flex-shrink-0 text-amber-400" />
                            <span>{aiPreviewData.tokens.total} tokens</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-text-tertiary pt-1 border-t border-white/5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-text-tertiary">Engine:</span>
                        <span className="font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded truncate max-w-[110px]" title={aiPreviewData.provider || config.provider || 'Gemini'}>
                          {aiPreviewData.provider || config.provider || 'Gemini'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-text-tertiary">Time Taken:</span>
                        <span className="font-mono font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
                          <span>{aiPreviewData.generationTimeSec || ((aiPreviewData.generationTimeMs || 0) / 1000).toFixed(2)}s</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Speech-to-Text Transcript (if present) */}
                  {aiPreviewData.transcript && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-secondary font-medium flex items-center gap-1">
                          <Music className="w-3 h-3 text-amber-400" /> Speech-to-Text Transcript:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(aiPreviewData.transcript);
                            setAiCopiedField('transcript');
                            toast.success('Transcript copied!');
                            setTimeout(() => setAiCopiedField(null), 2000);
                          }}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded transition-all"
                        >
                          {aiCopiedField === 'transcript' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          <span>{aiCopiedField === 'transcript' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg text-xs text-amber-200/90 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto font-sans">
                        {aiPreviewData.transcript}
                      </div>
                    </div>
                  )}

                  {/* Document Summary / Executive Recap (if present) */}
                  {aiPreviewData.summary && !aiPreviewData.transcript && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-secondary font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-400" /> Summary & Key Takeaways:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(aiPreviewData.summary);
                            setAiCopiedField('summary');
                            toast.success('Summary copied!');
                            setTimeout(() => setAiCopiedField(null), 2000);
                          }}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded transition-all"
                        >
                          {aiCopiedField === 'summary' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          <span>{aiCopiedField === 'summary' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg text-xs text-blue-200/90 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto font-sans">
                        {aiPreviewData.summary}
                      </div>
                    </div>
                  )}

                  {/* Action Items / Deliverables (if present) */}
                  {aiPreviewData.actionItems && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-secondary font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Action Items & Checklist:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(aiPreviewData.actionItems);
                            setAiCopiedField('actionItems');
                            toast.success('Action items copied!');
                            setTimeout(() => setAiCopiedField(null), 2000);
                          }}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded transition-all"
                        >
                          {aiCopiedField === 'actionItems' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          <span>{aiCopiedField === 'actionItems' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg text-xs text-emerald-200/90 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto font-sans">
                        {aiPreviewData.actionItems}
                      </div>
                    </div>
                  )}

                  {/* Data Insights (if present) */}
                  {aiPreviewData.insights && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-secondary font-medium flex items-center gap-1">
                          <Terminal className="w-3 h-3 text-cyan-400" /> Key Data Insights & Metrics:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(aiPreviewData.insights);
                            setAiCopiedField('insights');
                            toast.success('Insights copied!');
                            setTimeout(() => setAiCopiedField(null), 2000);
                          }}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded transition-all"
                        >
                          {aiCopiedField === 'insights' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          <span>{aiCopiedField === 'insights' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg text-xs text-cyan-200/90 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto font-sans">
                        {aiPreviewData.insights}
                      </div>
                    </div>
                  )}

                  {/* Generated Caption (if present and not duplicated with summary) */}
                  {aiPreviewData.caption && !aiPreviewData.transcript && !aiPreviewData.summary && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-secondary font-medium">Generated Social Caption:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(aiPreviewData.caption);
                            setAiCopiedField('caption');
                            toast.success('Caption copied!');
                            setTimeout(() => setAiCopiedField(null), 2000);
                          }}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded transition-all"
                        >
                          {aiCopiedField === 'caption' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          <span>{aiCopiedField === 'caption' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-black/60 border border-white/5 rounded-lg text-xs text-white/90 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto font-sans">
                        {aiPreviewData.caption}
                      </div>
                    </div>
                  )}

                  {/* Title & Hook */}
                  {aiPreviewData.title && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-secondary font-medium">Hook / Headline:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(aiPreviewData.title);
                            setAiCopiedField('title');
                            toast.success('Hook copied!');
                            setTimeout(() => setAiCopiedField(null), 2000);
                          }}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded transition-all"
                        >
                          {aiCopiedField === 'title' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          <span>{aiCopiedField === 'title' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2 bg-black/60 border border-white/5 rounded-lg text-xs font-semibold text-white font-sans">
                        {aiPreviewData.title}
                      </div>
                    </div>
                  )}

                  {/* Hashtags (if present) */}
                  {aiPreviewData.hashtags && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-secondary font-medium">Targeted Hashtags:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(aiPreviewData.hashtags);
                            setAiCopiedField('hashtags');
                            toast.success('Hashtags copied!');
                            setTimeout(() => setAiCopiedField(null), 2000);
                          }}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-1.5 py-0.5 rounded transition-all"
                        >
                          {aiCopiedField === 'hashtags' ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          <span>{aiCopiedField === 'hashtags' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2 bg-black/60 border border-white/5 rounded-lg text-xs font-mono text-purple-300">
                        {aiPreviewData.hashtags}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'instagram_publish':
        const igStorageNode = nodes.find(n => n.integration?.id === 'storage_trigger' || n.id === 'storage_trigger');
        const igActiveStorageFile = igStorageNode?.config?.capturedPayload || null;

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Instagram Account</label>
              <ConnectIntegration 
                integrationId="instagram" 
                providerName="Instagram"
                value={config.connectionId} 
                onChange={(val) => handleChange('connectionId', val)} 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Publish Format</label>
              <Select 
                value={config.publishType || 'FEED_POST'} 
                onChange={(val) => handleChange('publishType', val)}
                options={[
                  { value: 'FEED_POST', label: 'Feed Post (Image or Video)' },
                  { value: 'REEL', label: 'Instagram Reel (Vertical 9:16 Video)' },
                  { value: 'STORY', label: 'Instagram Story (Image or Vertical 9:16 Video)' }
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Media Source URL</label>
              <VariableInput 
                placeholder="e.g. {{trigger.body.fileUrl}}" 
                value={config.mediaUrl || ''} 
                onChange={(val) => handleChange('mediaUrl', val)} 
                variables={variableGroups} 
              />

              {igActiveStorageFile && (
                <div className="mt-2 p-2.5 rounded-lg bg-zinc-900/90 border border-pink-500/20 flex items-center justify-between gap-2.5 shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0" title="Cloud Storage Trigger Payload">
                      <HardDrive className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-medium text-white truncate max-w-[180px] sm:max-w-[240px]" title={igActiveStorageFile.fileName || 'Captured File'}>
                          {igActiveStorageFile.fileName || 'Captured File'}
                        </span>
                        <span className="text-[10px] text-text-tertiary flex-shrink-0" title={`Size: ${igActiveStorageFile.fileSizeMB ? `${igActiveStorageFile.fileSizeMB} MB` : 'Trigger File'}`}>
                          • {igActiveStorageFile.fileSizeMB ? `${igActiveStorageFile.fileSizeMB} MB` : 'Trigger File'}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-tertiary truncate" title="Active Drive File • Single-slot auto-overwritten buffer">
                        Active Drive File • Single-slot auto-overwritten
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('mediaUrl', '{{trigger.body.fileUrl}}');
                        toast.success(`Mapped to ${igActiveStorageFile.fileName || 'captured file'}`);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                        config.mediaUrl === '{{trigger.body.fileUrl}}'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30 shadow-inner'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-sm'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-pink-300 flex-shrink-0" />
                      <span>{config.mediaUrl === '{{trigger.body.fileUrl}}' ? 'Mapped' : 'Auto-Fill'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewFile(igActiveStorageFile);
                        setIsPreviewModalOpen(true);
                      }}
                      className="p-1.5 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded-md border border-sky-500/20 transition-all flex items-center justify-center flex-shrink-0"
                      title="Preview captured media"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-2 p-2 bg-pink-500/10 border border-pink-500/20 rounded-md text-[11px] text-pink-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 flex-shrink-0 text-pink-400" />
                  <span>Formats: JPG, PNG, WEBP, MP4, MOV</span>
                </span>
                <span>Max 25MB</span>
              </div>
            </div>

            {config.publishType !== 'STORY' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Post Caption</label>
                <VariableInput 
                  multiline 
                  rows={5} 
                  placeholder="e.g. {{steps.step_2.caption}} or Type custom caption with #hashtags" 
                  value={config.caption || ''} 
                  onChange={(val) => handleChange('caption', val)} 
                  variables={variableGroups} 
                />
                <p className="text-[10px] text-text-tertiary mt-1">Map the AI-generated caption or write custom copy.</p>
              </div>
            )}

            {(config.publishType === 'REEL' || config.publishType === 'FEED_POST') && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Video Thumbnail Offset (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000 (ms from start)"
                  value={config.thumbOffset || ''}
                  onChange={(e) => handleChange('thumbOffset', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
                />
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
                  { value: 'truncate', label: 'Truncate Text' },
                  { value: 'extract_data', label: 'Extract Data (Email, Phone, Name)' }
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
                  <input type="number" value={config.maxLength || 50} onChange={(e) => handleChange('maxLength', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue font-mono" />
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
            {config.operation === 'extract_data' && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-text-secondary mb-1">Data to Extract</label>
                <Select 
                  value={config.extractType || 'email'} 
                  onChange={(val) => handleChange('extractType', val)}
                  options={[
                    { value: 'email', label: 'Email Address' },
                    { value: 'phone', label: 'Phone Number' },
                    { value: 'name', label: 'Name (Smart Match)' },
                    { value: 'url', label: 'URL / Link' },
                    { value: 'number', label: 'Any Number' }
                  ]}
                />
                <p className="text-[10px] text-text-tertiary mt-2">
                  {config.extractType === 'name' && "Attempts to find a name following common phrases like 'I am', 'My name is', etc. If it fails, it returns the original text."}
                  {config.extractType === 'email' && "Finds the first valid email address in the text."}
                  {config.extractType === 'phone' && "Finds the first valid phone number format in the text."}
                </p>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-text-secondary">Custom JavaScript code</label>
                <button
                  type="button"
                  onClick={() => {
                    setAiRadahnModalType('code_js');
                    setAiRadahnContext({ inputData: config.inputData || '' });
                    setAiRadahnModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 hover:from-amber-500/30 hover:to-purple-500/30 hover:border-amber-400 shadow-sm transition-all group"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>AI Radahn JS Generator</span>
                </button>
              </div>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-text-secondary">Body (JSON)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAiRadahnModalType('http_payload');
                      setAiRadahnContext({ url: config.url || '', method: config.method || 'POST' });
                      setAiRadahnModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 hover:from-amber-500/30 hover:to-purple-500/30 hover:border-amber-400 shadow-sm transition-all group"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                    <span>AI Radahn JSON Architect</span>
                  </button>
                </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-text-secondary">Message</label>
                <button
                  type="button"
                  onClick={() => {
                    setAiRadahnModalType('slack_message');
                    setAiRadahnContext({ channel: config.channel || '' });
                    setAiRadahnModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 hover:from-amber-500/30 hover:to-purple-500/30 hover:border-amber-400 shadow-sm transition-all group"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>AI Radahn Message Drafter</span>
                </button>
              </div>
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
                        onUpdateNode(selectedNode.id, (prevNode) => ({
                          ...prevNode,
                          config: {
                            ...prevNode?.config,
                            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheet.id}/edit`,
                            spreadsheetId: sheet.id,
                            spreadsheetName: sheet.name
                          }
                        }));
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-text-secondary">
                    {config.actionType === 'DUPLICATE_SHEET' ? 'Source Sheet Name to Duplicate' : 'Worksheet Tab'}
                  </label>
                  {config.spreadsheetId && (
                    <button
                      type="button"
                      onClick={refetchSheets}
                      disabled={loadingSheets}
                      className="text-[10px] text-text-tertiary hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/5 disabled:opacity-50"
                      title="Refresh worksheet tabs"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingSheets ? 'animate-spin text-accent-blue' : ''}`} />
                      <span>{loadingSheets ? 'Loading...' : 'Refresh Tabs'}</span>
                    </button>
                  )}
                </div>
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
                      <div className="w-full">
                        <VariableInput 
                          placeholder="Value to write"
                          value={map.value}
                          onChange={(val) => handleUpdateMapping(idx, 'value', val)}
                          variables={variableGroups}
                        />
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

            {/* AI Radahn Replica Watcher Box for Dynamic Date/Time Re-evaluation */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">AI Radahn Replica Watcher</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">PRO</span>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      Watches dynamic date/time cells and reshoots downstream reminder flows.
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={Boolean(config.aiRadahnReplicaEnabled)}
                  onChange={(checked) => {
                    handleChange('aiRadahnReplicaEnabled', checked);
                    if (checked) {
                      setIsReplicaModalOpen(true);
                    }
                  }}
                />
              </div>

              {config.aiRadahnReplicaEnabled && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs">
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Replica Active
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsReplicaModalOpen(true)}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Configure Replica &rarr;
                  </button>
                </div>
              )}
            </div>

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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Message Content</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAiRadahnModalType('smtp_email');
                      setAiRadahnContext({ subject: config.subject || '', to: config.to || '' });
                      setAiRadahnModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 hover:from-amber-500/30 hover:to-purple-500/30 hover:border-amber-400 shadow-sm transition-all group"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                    <span>AI Radahn Writer</span>
                  </button>
                </div>
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
                            <div className="w-[140px] shrink-0 px-2.5 py-1.5 bg-black/40 border border-white/5 rounded-md font-mono text-[11px] text-[#eab308] truncate" title={unmappedVar}>
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
                            <div className="w-[140px] shrink-0 px-2.5 py-1.5 bg-black/20 border border-white/5 rounded-md font-mono text-[11px] text-[#eab308] truncate opacity-70" title={`{{${getVariableLabel(mappedVar).toLowerCase().replace(/[^a-z0-9]/g, '')}}}`}>
                              {`{{${getVariableLabel(mappedVar).toLowerCase().replace(/[^a-z0-9]/g, '')}}}`}
                            </div>
                            <span className="text-text-tertiary/40 font-mono text-xs">=</span>
                            <div className="flex-1 min-w-0 relative">
                              <div className="w-full px-2.5 py-1.5 bg-accent-blue/5 border border-accent-blue/20 rounded-md font-mono text-[11px] text-accent-blue truncate pr-7" title={mappedVar}>
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
                 <div className="space-y-3 p-3 bg-black/30 border border-white/5 rounded-md">
                   <div>
                     <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Variable</label>
                     <VariableInput 
                       placeholder="e.g. {{trigger.email}}" 
                       value={config[`path${branch.id}Var`] || ''} 
                       onChange={(val) => handleChange(`path${branch.id}Var`, val)} 
                       variables={variableGroups}
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Operator</label>
                     <Select 
                        value={config[`path${branch.id}Op`] || 'contains'} 
                        onChange={(val) => handleChange(`path${branch.id}Op`, val)}
                        options={[
                          { value: 'contains', label: 'Contains' },
                          { value: 'not_contains', label: 'Does Not Contain' },
                          { value: 'equals', label: 'Equals Exactly' },
                          { value: 'not_equals', label: 'Does Not Equal' },
                          { value: 'greater_than', label: 'Greater Than' },
                          { value: 'less_than', label: 'Less Than' },
                          { value: 'starts_with', label: 'Starts With' },
                          { value: 'ends_with', label: 'Ends With' },
                          { value: 'exists', label: 'Exists' },
                          { value: 'not_exists', label: 'Does Not Exist' }
                        ]}
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">Value</label>
                     <VariableInput 
                       placeholder="e.g. Yes, Sure, Alright" 
                       value={config[`path${branch.id}Val`] || ''} 
                       onChange={(val) => handleChange(`path${branch.id}Val`, val)} 
                       variables={variableGroups}
                     />
                     <p className="text-[10px] text-text-tertiary mt-1 leading-snug">
                       Use commas for OR (e.g. "Yes, Sure") and && for AND (e.g. "Yes && Sure").
                     </p>
                     
                     <div className="mt-3 pt-3 border-t border-white/5">
                        <Toggle 
                           label="Case Sensitive Matching"
                           checked={config[`path${branch.id}Case`] || false}
                           onChange={(val) => handleChange(`path${branch.id}Case`, val)}
                        />
                     </div>
                   </div>
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

      <div className="p-4 border-b border-border-subtle flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2" title={`Properties: ${selectedNode?.title || selectedNode?.integration?.name || 'Step'}`}>
          <Settings className="w-4 h-4 text-text-secondary flex-shrink-0" />
          <h2 className="font-medium text-foreground truncate">Properties • {selectedNode?.title || selectedNode?.integration?.name || 'Step'}</h2>
        </div>
        <button 
          onClick={onClose} 
          className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-border-subtle rounded-md text-xs font-medium text-text-secondary hover:text-white transition-colors flex-shrink-0"
          title="Close Properties Panel"
        >
          <X className="w-3.5 h-3.5" /> Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-2">
            {selectedNode?.type === 'TRIGGER' || selectedNode?.type === 'trigger' ? 'Trigger Name' : 'Step Name'}
          </label>
          <input 
            type="text" 
            value={selectedNode.title}
            onChange={(e) => {
              const val = e.target.value;
              onUpdateNode(selectedNode.id, (prevNode) => ({
                ...prevNode,
                title: val
              }));
            }}
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
                    onUpdateNode(selectedNode.id, (prevNode) => ({ ...prevNode, testResult: null }));
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
                        onUpdateNode(selectedNode.id, (prevNode) => ({ 
                          ...prevNode, 
                          testResult: { success: false, error: 'Invalid Date Format', fix: 'Format must be exactly YYYY-MM-DD HH:mm:ss. The delay will not work otherwise.' } 
                        }));
                        setIsTesting(false);
                        return;
                      }
                    }

                    const res = await testNodeAction({
                      type: selectedNode.type,
                      integrationId: selectedNode.integration?.id || selectedNode.integrationId,
                      config: resolvedConfig
                    });
                    
                    onUpdateNode(selectedNode.id, (prevNode) => ({ ...prevNode, testResult: res }));
                  } catch (e) {
                    onUpdateNode(selectedNode.id, (prevNode) => ({ 
                      ...prevNode, 
                      testResult: { success: false, error: e.message, fix: 'Check your network connection.' } 
                    }));
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
                Save Trigger
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
                    Trigger saved successfully
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
      <ConfirmModal
        isOpen={!!sheetToClear}
        onClose={() => setSheetToClear(null)}
        onConfirm={() => {
          if (sheetToClear === 'trigger') {
            onUpdateNode(selectedNode.id, (prevNode) => ({
              ...prevNode,
              config: {
                ...prevNode?.config,
                sheetUrl: '',
                spreadsheetId: '',
                spreadsheetName: '',
                range: ''
              }
            }));
          } else if (sheetToClear === 'action') {
            onUpdateNode(selectedNode.id, (prevNode) => ({
              ...prevNode,
              config: {
                ...prevNode?.config,
                sheetUrl: '',
                spreadsheetId: '',
                spreadsheetName: '',
                range: '',
                rowDataMapping: [],
                newSheetName: '',
                searchQuery: ''
              }
            }));
          }
          setSheetToClear(null);
        }}
        title="Change Connected Sheet"
        message="Are you sure you want to change the connected sheet? This will clear your current configuration for this step."
        confirmText="Change Sheet"
        isDestructive={true}
      />
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
      <GoogleDriveGuideModal
        isOpen={isStorageGuideOpen}
        onClose={() => setIsStorageGuideOpen(false)}
        webhookUrl={selectedNode?.config?.webhookToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/incoming/${workflowId || 'new'}?token=${selectedNode.config.webhookToken}` : ''}
        folderName={selectedNode?.config?.folderName}
        provider={selectedNode?.config?.provider || 'gdrive'}
      />
      <MediaPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        file={previewFile}
      />
      <AiRadahnPromptModal
        isOpen={aiRadahnModalOpen}
        onClose={() => setAiRadahnModalOpen(false)}
        type={aiRadahnModalType}
        context={aiRadahnContext}
        availableVariables={variableGroups}
        onApply={(result) => {
          onUpdateNode(selectedNode.id, (prevNode) => {
            if (!prevNode) return prevNode;
            const currentConfig = prevNode.config || {};
            const updates = {};
            if (result.subject && (!currentConfig.subject || currentConfig.subject.trim() === '')) {
              updates.subject = result.subject;
            }
            if (aiRadahnModalType === 'smtp_email') {
              if (result.subject) updates.subject = result.subject;
              updates.body = result.body || result.htmlBody || '';
              if (result.htmlBody || (result.body && (result.body.includes('<div') || result.body.includes('<p>')))) {
                updates.bodyType = 'html';
              }
            } else if (aiRadahnModalType === 'ai_prompt') {
              updates.customPrompt = result.customPrompt || result.prompt || result.body || '';
            } else if (aiRadahnModalType === 'code_js') {
              updates.code = result.code || result.body || '';
              if (result.inputData && !currentConfig.inputData) updates.inputData = result.inputData;
            } else if (aiRadahnModalType === 'slack_message' || aiRadahnModalType === 'whatsapp_message') {
              updates.message = result.message || result.body || '';
            } else if (aiRadahnModalType === 'http_payload') {
              updates.body = result.payload || result.body || '';
            } else {
              if (result.body) updates.body = result.body;
              if (result.message) updates.message = result.message;
            }

            return {
              ...prevNode,
              config: {
                ...currentConfig,
                ...updates
              }
            };
          });
          toast.success('AI Radahn generation applied to step config!');
        }}
      />
      <AiRadahnReplicaModal
        isOpen={isReplicaModalOpen}
        onClose={() => setIsReplicaModalOpen(false)}
        workflowId={workflowId}
        workflowName={selectedNode?.title || 'Workflow Automation'}
        nodeData={selectedNode}
        onReplicaConfigured={(replicaCfg) => {
          onUpdateNode(selectedNode.id, (prevNode) => ({
            ...prevNode,
            config: {
              ...prevNode?.config,
              aiRadahnReplicaEnabled: true,
              aiRadahnReplicaConfig: replicaCfg
            }
          }));
        }}
      />
      <QuotaUpgradeModal />
    </div>
  );
}
