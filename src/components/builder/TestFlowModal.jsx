import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getWebhookPayloadHistory } from '@/actions/workflows';
import Select from '@/components/ui/Select';

const flattenObject = (obj, prefix = '') => {
  let result = [];
  Object.entries(obj).forEach(([key, value]) => {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result = result.concat(flattenObject(value, newPrefix));
    } else {
      let exampleStr = value;
      if (Array.isArray(value)) exampleStr = `[Array(${value.length})]`;
      else if (value === null) exampleStr = 'null';
      
      result.push({
        path: newPrefix,
        label: newPrefix,
        example: exampleStr,
        originalValue: value
      });
    }
  });
  return result;
};

// Helper to reconstruct nested object from flat paths
const unflattenObject = (flatData) => {
  const result = {};
  for (const [path, value] of Object.entries(flatData)) {
    const keys = path.split('.');
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  return result;
};

export default function TestFlowModal({ isOpen, onClose, triggerNode, workflowId, onRunTest }) {
  const [testData, setTestData] = useState({}); // Flat format: { 'data.email': 'foo@bar.com' }
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  
  // History payloads
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');

  // Extract schema from trigger
  const triggerSchema = triggerNode?.config?.capturedPayload 
    ? flattenObject(triggerNode.config.capturedPayload) 
    : [];

  useEffect(() => {
    if (isOpen && workflowId && triggerNode?.integration?.id === 'webhook') {
      setLoadingHistory(true);
      getWebhookPayloadHistory(workflowId)
        .then(data => {
          setHistoryItems(data || []);
          setLoadingHistory(false);
        })
        .catch(e => {
          console.error(e);
          setLoadingHistory(false);
        });
    }
  }, [isOpen, workflowId, triggerNode]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setStatus('running');
    
    // Reconstruct nested payload
    const finalPayload = unflattenObject(testData);

    try {
      if (onRunTest) await onRunTest(finalPayload);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 2000);
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const applyHistoryItem = (historyId) => {
    setSelectedHistoryId(historyId);
    if (!historyId) return;
    const item = historyItems.find(h => h.id === historyId);
    if (item && item.payload) {
      const flat = flattenObject(item.payload);
      const newTestData = {};
      flat.forEach(f => { newTestData[f.path] = f.originalValue; });
      setTestData(newTestData);
    }
  };

  const renderTriggerInputs = () => {
    if (!triggerNode) return <p className="text-sm text-text-secondary">Please add a trigger to your workflow first.</p>;

    if (triggerSchema.length === 0) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">No data structure found for this trigger. You can test with an empty payload or re-configure your trigger to capture a sample payload first.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {historyItems.length > 0 ? (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
             <label className="block text-xs font-medium text-text-secondary mb-2">Autofill from Recent Event</label>
             <Select 
               value={selectedHistoryId}
               onChange={applyHistoryItem}
               options={[
                 { value: '', label: '-- Select a recent payload --' },
                 ...historyItems.map(h => ({
                   value: h.id,
                   label: `${new Date(h.createdAt).toLocaleString()} - ${JSON.stringify(h.payload).substring(0, 40)}...`
                 }))
               ]}
             />
          </div>
        ) : (
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-xs font-medium text-text-secondary mb-2">Autofill from Recent Event</label>
            <Select 
               value=""
               onChange={() => {}}
               disabled={true}
               options={[{ value: '', label: 'No past captures available' }]}
             />
          </div>
        )}

        <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
          {triggerSchema.map((field) => (
            <div key={field.path}>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                {field.path} <span className="text-text-tertiary ml-1 font-mono text-[10px]">(e.g. {field.example})</span>
              </label>
              <input 
                type="text" 
                value={testData[field.path] !== undefined ? testData[field.path] : ''}
                placeholder={`Value for ${field.path}`} 
                className="w-full bg-background border border-border-subtle rounded-sm px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent-blue font-mono" 
                onChange={(e) => setTestData({...testData, [field.path]: e.target.value})} 
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-[#0a0a0a] border border-border-subtle rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-card">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Play className="w-4 h-4 text-accent-blue" />
                Test Flow Execution
              </h2>
              <p className="text-xs text-text-secondary mt-1">Provide mock data for your trigger to simulate a run.</p>
            </div>
            <button onClick={onClose} className="text-text-secondary hover:text-white p-1 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-background">
            {renderTriggerInputs()}
          </div>

          <div className="px-6 py-4 border-t border-border-subtle bg-card flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-white transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleTest}
              disabled={!triggerNode || status !== 'idle'}
              className="bg-accent-blue hover:opacity-90 disabled:opacity-70 text-white px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 min-w-[120px] justify-center"
            >
              {status === 'idle' && <><Play className="w-4 h-4" fill="currentColor" /> Run Test</>}
              {status === 'running' && <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>}
              {status === 'success' && <><CheckCircle2 className="w-4 h-4" /> Success!</>}
              {status === 'error' && <><X className="w-4 h-4" /> Failed</>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
