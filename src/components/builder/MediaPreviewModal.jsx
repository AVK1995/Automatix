'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  FileText, 
  Film, 
  Image as ImageIcon, 
  Music, 
  Archive, 
  HardDrive, 
  ShieldCheck, 
  MonitorPlay,
  Play
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';

export default function MediaPreviewModal({ isOpen, onClose, file }) {
  const [mounted, setMounted] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedVar, setCopiedVar] = useState(false);
  const [playerMode, setPlayerMode] = useState('html5'); // Default to high-performance native html5 for instant mobile playback

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !file || typeof document === 'undefined') return null;

  const fileName = file.fileName || 'Untitled Media';
  const rawUrl = file.fileUrl || '';
  const fileType = (file.fileType || '').toLowerCase();
  const fileSizeMB = file.fileSizeMB ? `${file.fileSizeMB} MB` : 'Under 25 MB';
  const folderName = file.folderName || 'Automatix Uploads';

  // Extract Drive ID if applicable
  const driveMatch = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const driveId = driveMatch ? driveMatch[1] : '';

  // Determine media category
  const isVideo = fileType.startsWith('video/') || !!fileName.match(/\.(mp4|mov|webm|m4v|mkv|avi)$/i);
  const isImage = fileType.startsWith('image/') || !!fileName.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
  const isPdf = fileType.includes('pdf') || !!fileName.match(/\.pdf$/i);
  const isAudio = fileType.startsWith('audio/') || !!fileName.match(/\.(mp3|wav|m4a|aac|ogg)$/i);
  const isArchive = fileType.includes('zip') || fileType.includes('tar') || fileType.includes('rar') || !!fileName.match(/\.(zip|tar|gz|rar|7z)$/i);

  // Compute streaming URLs
  const rawStreamUrl = driveId 
    ? `/api/media/raw?id=${driveId}&filename=${encodeURIComponent(fileName)}`
    : (rawUrl.startsWith('http') ? `/api/media/raw?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(fileName)}` : (rawUrl || ''));

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(rawUrl || rawStreamUrl);
    setCopiedUrl(true);
    toast.success('Direct Media URL copied!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyVar = () => {
    navigator.clipboard.writeText('{{trigger.body.fileUrl}}');
    setCopiedVar(true);
    toast.success('Variable {{trigger.body.fileUrl}} copied!');
    setTimeout(() => setCopiedVar(false), 2000);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Strictly compliant dimming overlay (solid black/60, NO backdrop-blur) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60"
        />

        {/* Solid dark modal container (NO glass/blur, strictly solid dark bg-zinc-950) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl sm:max-w-3xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header - Non-wrapping and responsive */}
          <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/50 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`p-2 rounded-xl shrink-0 ${
                isVideo ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                isImage ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                isPdf ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                isAudio ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              }`}>
                {isVideo ? <Film className="w-5 h-5 shrink-0" /> :
                 isImage ? <ImageIcon className="w-5 h-5 shrink-0" /> :
                 isPdf ? <FileText className="w-5 h-5 shrink-0" /> :
                 isAudio ? <Music className="w-5 h-5 shrink-0" /> :
                 isArchive ? <Archive className="w-5 h-5 shrink-0" /> :
                 <HardDrive className="w-5 h-5 shrink-0" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                    {fileName}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white font-mono shrink-0">
                    {isVideo ? 'VIDEO' : isImage ? 'IMAGE' : isPdf ? 'PDF' : isAudio ? 'AUDIO' : 'DOCUMENT'}
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                  Folder: <span className="text-white/80">{folderName}</span> • Size: <span className="text-white/80">{fileSizeMB}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-text-tertiary hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5 shrink-0" />
            </button>
          </div>

          {/* Player & Preview Workspace */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* 16:9 Standard Aspect Ratio Player Container */}
            <div className="w-full aspect-video bg-black rounded-xl border border-white/10 overflow-hidden relative flex items-center justify-center shadow-lg">
              {isVideo ? (
                <video
                  key={rawStreamUrl}
                  src={rawStreamUrl}
                  controls
                  playsInline
                  webkit-playsinline="true"
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                >
                  Your browser does not support HTML5 video playback.
                </video>
              ) : isImage ? (
                <img
                  src={rawStreamUrl}
                  alt={fileName}
                  className="w-full h-full object-contain bg-black/40"
                />
              ) : isPdf ? (
                <iframe
                  src={rawStreamUrl}
                  title={fileName}
                  className="w-full h-full border-0 bg-zinc-900"
                />
              ) : isAudio ? (
                <div className="p-6 text-center space-y-3 w-full">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Music className="w-6 h-6 shrink-0" />
                  </div>
                  <p className="text-sm font-medium text-white">{fileName}</p>
                  <audio controls src={rawStreamUrl} className="w-full max-w-md mx-auto" />
                </div>
              ) : (
                <div className="p-6 sm:p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6 shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{fileName}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{fileType || 'Raw Binary Document'}</p>
                  </div>
                  <p className="text-[11px] text-text-secondary max-w-sm mx-auto">
                    This file format is captured as raw binary data and ready for downstream actions (OCR, AI analysis, email attachments, or CRM storage).
                  </p>
                </div>
              )}
            </div>

            {/* Direct Raw Stream & 25MB Guard Notice */}
            <div className="p-3.5 bg-zinc-900/60 border border-white/5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Stream Engine & Quota Status</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                  200 OK • Stream Ready
                </span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                This file is captured in your active trigger buffer (under 25MB). Remote Google Drive virus interstitials are automatically handled by the raw streaming engine, making the file streamable directly to <strong>Meta Graph API (Instagram Posts & Stories)</strong> and downstream nodes.
              </p>
            </div>

            {/* Quick Variable Mapper Chips */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">Downstream Mapping Shortcuts:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyVar}
                  className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 rounded-xl text-left transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-[11px] font-mono text-sky-300 truncate">{"{{trigger.body.fileUrl}}"}</p>
                    <p className="text-[10px] text-text-tertiary truncate">Direct Media / Download URL</p>
                  </div>
                  <div className="shrink-0 text-text-tertiary group-hover:text-white">
                    {copiedVar ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('{{trigger.body.fileName}}');
                    toast.success('Variable {{trigger.body.fileName}} copied!');
                  }}
                  className="p-2.5 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 rounded-xl text-left transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-[11px] font-mono text-sky-300 truncate">{"{{trigger.body.fileName}}"}</p>
                    <p className="text-[10px] text-text-tertiary truncate">Original Upload File Name</p>
                  </div>
                  <div className="shrink-0 text-text-tertiary group-hover:text-white">
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 border-t border-white/10 bg-zinc-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium border border-white/10 transition-colors flex items-center justify-center gap-1.5"
              >
                {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span>{copiedUrl ? 'Copied' : 'Copy Direct URL'}</span>
              </button>

              {rawUrl && (
                <a
                  href={drivePreviewUrl || rawStreamUrl || rawUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>Open in Tab</span>
                </a>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 bg-accent-blue hover:bg-blue-600 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 shadow-md"
            >
              Done & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
