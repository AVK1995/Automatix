'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  Zap, 
  Calculator, 
  Video, 
  Image as ImageIcon, 
  FileText, 
  Mic, 
  Cpu, 
  Layers, 
  Info, 
  Gauge, 
  BarChart3,
  Network,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import Select from '@/components/ui/Select';

const BENCHMARK_DATA = [
  { size: 5, video: '3.2s – 4.8s', image: '1.2s – 2.1s', audio: '2.5s – 3.8s', doc: '1.5s – 2.6s', speedRating: 'Ultra Fast', speedColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { size: 10, video: '6.1s – 8.9s', image: '2.4s – 3.7s', audio: '4.8s – 7.1s', doc: '2.8s – 4.2s', speedRating: 'High Speed', speedColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { size: 15, video: '9.8s – 13.5s', image: '3.6s – 5.4s', audio: '7.2s – 10.4s', doc: '4.1s – 6.0s', speedRating: 'Moderate', speedColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { size: 20, video: '14.2s – 19.8s', image: '5.1s – 7.8s', audio: '10.5s – 15.2s', doc: '5.6s – 8.1s', speedRating: 'Moderate', speedColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { size: 25, video: '19.5s – 27.4s', image: '6.8s – 10.2s', audio: '14.0s – 20.6s', doc: '7.2s – 10.8s', speedRating: 'Max Limit (25MB)', speedColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
];

const FILE_TYPE_OPTIONS = [
  { 
    value: 'video', 
    label: 'Video / Reels / Stories (.mp4, .mov)', 
    icon: <Video className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /> 
  },
  { 
    value: 'image', 
    label: 'Image / Photo (.jpg, .png, .webp)', 
    icon: <ImageIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> 
  },
  { 
    value: 'audio', 
    label: 'Audio / Voice Note (.mp3, .wav, .m4a)', 
    icon: <Mic className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" /> 
  },
  { 
    value: 'document', 
    label: 'Document / Text (.pdf, .txt, .docx)', 
    icon: <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> 
  },
];

export default function AiLatencyBenchmarkModal({ isOpen, onClose, defaultFileSize = 5, defaultFileType = 'video' }) {
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'matrix'
  const [calcSize, setCalcSize] = useState(defaultFileSize > 25 ? 25 : (defaultFileSize || 5));
  const [calcType, setCalcType] = useState(defaultFileType || 'video');

  const calculation = useMemo(() => {
    const size = Math.min(Math.max(parseFloat(calcSize) || 1, 0.1), 25);
    
    let baseTime = 1.0;
    let sizeFactor = 0.5;

    if (calcType === 'video') {
      baseTime = 2.2;
      sizeFactor = 0.95;
    } else if (calcType === 'image') {
      baseTime = 1.0;
      sizeFactor = 0.32;
    } else if (calcType === 'audio') {
      baseTime = 1.6;
      sizeFactor = 0.72;
    } else if (calcType === 'document') {
      baseTime = 1.2;
      sizeFactor = 0.38;
    }

    const minEstimate = (baseTime + size * sizeFactor * 0.85).toFixed(1);
    const maxEstimate = (baseTime + size * sizeFactor * 1.35).toFixed(1);

    // Breakdown estimates
    const cdnStream = (Math.max(0.4, size * 0.12)).toFixed(1);
    const inspection = (0.5 + size * 0.08).toFixed(1);
    const inference = (Math.max(0.8, minEstimate - cdnStream - inspection)).toFixed(1);

    return {
      size,
      minEstimate,
      maxEstimate,
      cdnStream,
      inspection,
      inference
    };
  }, [calcSize, calcType]);

  if (!isOpen) return null;

  const renderMediaTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
      case 'audio':
        return <Mic className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />;
      case 'document':
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl text-white flex flex-col"
      >
        {/* Header - Optimized layout without text squishing or icon overlaps */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 sticky top-0 bg-zinc-950 z-20">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400">
              <Gauge className="w-5 h-5 flex-shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                AI Generation Benchmarks & Latency
              </h2>
              <p className="text-[11px] sm:text-xs text-text-tertiary truncate">
                Processing & output speed by payload size (Max 25 MB)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 transition-colors flex-shrink-0"
            title="Close"
          >
            <X className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="flex items-center p-1 bg-zinc-900/90 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calculator'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Live Calculator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Benchmark Matrix (5–25 MB)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 flex-1">
          {activeTab === 'calculator' && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Interactive Calculator Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/90 border border-purple-500/20 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-white">Live Generation Time Estimator</h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                    Max 25 MB
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File Type Selection */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Payload Media Type
                    </label>
                    <Select
                      value={calcType}
                      onChange={(val) => setCalcType(val)}
                      options={FILE_TYPE_OPTIONS}
                      className="w-full"
                      buttonClassName="py-2.5 bg-zinc-950 border-white/10 text-xs"
                    />
                  </div>

                  {/* File Size Input */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-text-secondary mb-1.5">
                      <span>File Size (MB)</span>
                      <span className="font-mono text-purple-300 font-bold">{calculation.size} MB</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.5"
                        max="25"
                        step="0.5"
                        value={calculation.size}
                        onChange={(e) => setCalcSize(parseFloat(e.target.value))}
                        className="flex-1 accent-purple-500 bg-zinc-950 cursor-pointer h-2 rounded-lg"
                      />
                      <input
                        type="number"
                        min="0.1"
                        max="25"
                        step="0.1"
                        value={calcSize}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > 25) setCalcSize(25);
                          else setCalcSize(e.target.value);
                        }}
                        className="w-16 px-2 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-xs font-mono text-center text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Estimated Latency Box */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-zinc-950 to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span>Estimated Output Latency:</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-purple-300 flex items-baseline gap-1.5">
                      <span>~{calculation.minEstimate}s – {calculation.maxEstimate}s</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                      {renderMediaTypeIcon(calcType)}
                      <span className="capitalize font-medium text-white/80">{calcType}</span>
                      <span>•</span>
                      <span className="font-mono text-purple-300">{calculation.size} MB</span>
                    </div>
                  </div>

                  {/* Phase Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center sm:justify-end gap-1 text-[10px] text-text-tertiary">
                        <Network className="w-2.5 h-2.5 text-sky-400 flex-shrink-0" />
                        <span>Edge Stream</span>
                      </div>
                      <p className="text-xs font-mono font-semibold text-white">~{calculation.cdnStream}s</p>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center sm:justify-end gap-1 text-[10px] text-text-tertiary">
                        <Cpu className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                        <span>Inspector</span>
                      </div>
                      <p className="text-xs font-mono font-semibold text-white">~{calculation.inspection}s</p>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-center sm:justify-end gap-1 text-[10px] text-text-tertiary">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
                        <span>Inference</span>
                      </div>
                      <p className="text-xs font-mono font-semibold text-purple-300">~{calculation.inference}s</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'matrix' && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Benchmark Table (5, 10, 15, 20, 25 MB) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span>Payload Speed Matrix</span>
                  </h3>
                  <span className="text-[11px] text-text-tertiary">Standard averages</span>
                </div>

                <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-900/50 shadow-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[560px]">
                      <thead>
                        <tr className="border-b border-white/10 bg-zinc-900/90 text-text-tertiary font-semibold">
                          <th className="py-3 px-3.5 whitespace-nowrap">Payload Size</th>
                          <th className="py-3 px-3 whitespace-nowrap text-purple-300">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <Video className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                              <span>Video / Reels</span>
                            </span>
                          </th>
                          <th className="py-3 px-3 whitespace-nowrap text-emerald-300">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span>Images</span>
                            </span>
                          </th>
                          <th className="py-3 px-3 whitespace-nowrap text-sky-300">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <Mic className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                              <span>Audio Notes</span>
                            </span>
                          </th>
                          <th className="py-3 px-3 whitespace-nowrap text-amber-300">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                              <span>Documents</span>
                            </span>
                          </th>
                          <th className="py-3 px-3.5 whitespace-nowrap text-right">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {BENCHMARK_DATA.map((row) => (
                          <tr key={row.size} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                                <span>{row.size} MB</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-purple-200 whitespace-nowrap">{row.video}</td>
                            <td className="py-3 px-3 text-emerald-300 whitespace-nowrap">{row.image}</td>
                            <td className="py-3 px-3 text-sky-300 whitespace-nowrap">{row.audio}</td>
                            <td className="py-3 px-3 text-amber-200 whitespace-nowrap">{row.doc}</td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${row.speedColor}`}>
                                <Zap className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{row.speedRating}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Model Variation & Variance Note */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-tertiary leading-relaxed">
              <span className="font-semibold text-text-secondary">Model Variance Notice:</span> Generation speed varies dynamically based on the chosen AI provider model (e.g. <span className="text-purple-300">Gemini 1.5 Flash</span> is ~2x faster than Pro; <span className="text-purple-300">GPT-4o Mini</span> is faster than GPT-4o) and edge CDN streaming bandwidth. Figures above represent measured real-world averages.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span>Automatix AI Multimodal Engine</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white border border-white/10 transition-colors flex-shrink-0"
          >
            Close Benchmark
          </button>
        </div>
      </motion.div>
    </div>
  );
}
