'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, RotateCw, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function ExecutionDetailModal({ isOpen, onClose, execution, onRetry }) {
  const [expandedStep, setExpandedStep] = useState(null);

  if (!isOpen || !execution) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#0a0a0a] border border-border-subtle rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-border-subtle">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
                Execution Details
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  execution.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 
                  (execution.status === 'ACTIVE' || execution.status === 'WAITING') ? 'bg-accent-blue/10 text-accent-blue' : 
                  'bg-red-500/10 text-red-400'
                }`}>
                  {execution.status}
                </span>
              </h2>
              <p className="text-sm text-text-secondary mt-1">ID: <span className="font-mono text-white/70">{execution.id}</span> • {execution.time}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
            {execution.error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-md">
                <h4 className="text-sm font-medium text-red-400 mb-1">Execution Error</h4>
                <p className="text-xs text-red-300/80">{execution.error}</p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Step-by-Step Breakdown</h3>
              {execution.steps?.map((step, index) => (
                <div key={index} className="bg-card border border-border-subtle rounded-md overflow-hidden">
                  <button 
                    onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {step.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-foreground">{step.name}</h4>
                        {step.error && <p className="text-xs text-red-400 mt-0.5">{step.error}</p>}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-text-secondary transition-transform ${expandedStep === index ? 'rotate-90' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {expandedStep === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border-subtle overflow-hidden"
                      >
                        <div className="p-4 grid grid-cols-2 gap-4 bg-black/50">
                          <div>
                            <span className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Input Data</span>
                            <pre className="bg-background border border-border-subtle p-3 rounded-md text-[11px] text-white/80 font-mono overflow-auto max-h-40">
                              {JSON.stringify(step.input, null, 2) || '{}'}
                            </pre>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Output Data</span>
                            <pre className="bg-background border border-border-subtle p-3 rounded-md text-[11px] text-white/80 font-mono overflow-auto max-h-40">
                              {JSON.stringify(step.output, null, 2) || '{}'}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-border-subtle bg-black/30 flex justify-end">
            {execution.status === 'FAILED' && (
              <button 
                onClick={() => {
                  onRetry(execution);
                  onClose();
                }}
                className="bg-accent-blue hover:bg-accent-blue/90 text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Retry Failed Steps Only
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
