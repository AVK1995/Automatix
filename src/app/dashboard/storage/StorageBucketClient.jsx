'use client';

import { useState } from 'react';
import { Database, Image as ImageIcon, Film, FileText, Trash2, Loader2, ArrowUpRight, HardDrive, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function StorageBucketClient({ user, mediaFiles, isAdminView }) {
  const [files, setFiles] = useState(mediaFiles || []);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  const [deletingId, setDeletingId] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();

  const videoCount = files.filter(f => f.type === 'VIDEO').length;
  const imageCount = files.filter(f => f.type === 'IMAGE').length;
  const docCount = files.filter(f => f.type === 'DOCUMENT').length;
  
  const videoUsedMB = files.filter(f => f.type === 'VIDEO').reduce((sum, f) => sum + f.sizeMB, 0);
  const imageUsedMB = files.filter(f => f.type === 'IMAGE').reduce((sum, f) => sum + f.sizeMB, 0);
  const docUsedMB = files.filter(f => f.type === 'DOCUMENT').reduce((sum, f) => sum + f.sizeMB, 0);
  const totalUsedMB = videoUsedMB + imageUsedMB + docUsedMB;

  const storagePercentage = Math.min((totalUsedMB / (user?.maxStorageMB || 50)) * 100, 100);

  const filteredFiles = files.filter(f => {
    if (activeFilter === 'ALL') return true;
    return f.type === activeFilter;
  });

  const promptDelete = (file) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    const targetFile = fileToDelete;
    setIsDeleteModalOpen(false);
    setDeletingId(targetFile.id);
    
    try {
      const res = await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: targetFile.id })
      });
      if (!res.ok) throw new Error('Failed to delete file');
      
      setFiles(files.filter(f => f.id !== targetFile.id));
      toast.success('File deleted permanently');
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
      setFileToDelete(null);
    }
  };

  const getFileIcon = (type) => {
    if (type === 'VIDEO') return <Film size={14} className="text-accent-blue shrink-0" />;
    if (type === 'DOCUMENT') return <FileText size={14} className="text-amber-400 shrink-0" />;
    return <ImageIcon size={14} className="text-emerald-400 shrink-0" />;
  };

  return (
    <div className="space-y-6 w-full">
      {!isAdminView && (
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Storage Bucket</h1>
          <p className="text-sm text-text-secondary">Manage and review your uploaded images, videos, and automation documents.</p>
        </div>
      )}

      {/* Row 1: Storage Allocation & Category Cards */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-5 space-y-4 shadow-lg w-full">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database size={16} className="text-accent-blue" />
            Storage Allocation
          </h3>
          {!isAdminView && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-plan-modal', { detail: { tab: 'storage' } }))}
              className="text-xs text-accent-blue hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Expand Storage <ArrowUpRight size={13} />
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle 
                cx="50" 
                cy="50" 
                r="38" 
                fill="transparent" 
                stroke="#3B82F6" 
                strokeWidth="10"
                strokeDasharray="238.7"
                strokeDashoffset={238.7 - (238.7 * storagePercentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
              <HardDrive size={15} className="text-accent-blue mb-0.5" />
              <span className="text-[11px] font-bold text-white leading-none">
                {totalUsedMB > 1000 ? (totalUsedMB/1024).toFixed(1) + ' GB' : totalUsedMB.toFixed(1) + ' MB'}
              </span>
              <span className="text-[9px] text-text-tertiary mt-0.5">
                of {user?.maxStorageMB > 1000 ? (user.maxStorageMB/1024).toFixed(1) + ' GB' : (user?.maxStorageMB || 50) + ' MB'}
              </span>
            </div>
          </div>

          {/* 3 Horizontally Aligned Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
            {/* Images */}
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <ImageIcon size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">Images</div>
                  <div className="text-[10px] text-text-tertiary truncate">{imageCount} of {user?.maxImages || 10} ({user?.maxImageMB || 2}MB max)</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-white font-mono shrink-0">{imageUsedMB.toFixed(1)} MB</div>
            </div>

            {/* Videos */}
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-accent-blue/20 text-accent-blue shrink-0">
                  <Film size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">Videos</div>
                  <div className="text-[10px] text-text-tertiary truncate">{videoCount} of {user?.maxVideos || 1} ({user?.maxVideoMB || 25}MB max)</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-white font-mono shrink-0">{videoUsedMB.toFixed(1)} MB</div>
            </div>

            {/* Documents */}
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <FileText size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">Documents</div>
                  <div className="text-[10px] text-text-tertiary truncate">{docCount} of {user?.maxDocs || 10} ({user?.maxDocMB || 10}MB max)</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-white font-mono shrink-0">{docUsedMB.toFixed(1)} MB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Full-Width Bucket Assets Table */}
      <div className="bg-[#111] border border-border-subtle rounded-xl p-5 space-y-4 shadow-lg w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <HardDrive size={17} className="text-accent-blue" />
              Bucket Assets
            </h2>
            <span className="text-xs text-text-secondary">{files.length} Total Items</span>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5 text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                activeFilter === 'ALL' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              All ({files.length})
            </button>
            <button
              onClick={() => setActiveFilter('IMAGE')}
              className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                activeFilter === 'IMAGE' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              Images ({imageCount})
            </button>
            <button
              onClick={() => setActiveFilter('VIDEO')}
              className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                activeFilter === 'VIDEO' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              Videos ({videoCount})
            </button>
            <button
              onClick={() => setActiveFilter('DOCUMENT')}
              className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                activeFilter === 'DOCUMENT' ? 'bg-accent-blue text-white' : 'text-text-secondary hover:text-white'
              }`}
            >
              Docs ({docCount})
            </button>
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-xl text-center space-y-2">
            <Database size={32} className="text-text-tertiary opacity-40" />
            <p className="text-xs text-text-secondary">No files uploaded in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] uppercase text-text-secondary font-semibold bg-white/[0.01]">
                  <th className="py-3 px-4 w-[40%]">Asset Name</th>
                  <th className="py-3 px-4 w-[15%]">Type</th>
                  <th className="py-3 px-4 w-[15%]">Size</th>
                  <th className="py-3 px-4 w-[15%]">Uploaded</th>
                  <th className="py-3 px-4 w-[15%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFiles.map(file => {
                  const rawName = file.fileName || file.url.split('/').pop() || 'Asset File';
                  const isWorkflowLocked = !!(file.nodeId && file.nodeId.startsWith('wf_trigger_'));

                  return (
                    <tr key={file.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getFileIcon(file.type)}
                          <span className="font-medium text-white truncate max-w-[220px] sm:max-w-xs">{rawName}</span>
                          {isWorkflowLocked && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0 flex items-center gap-1">
                              <Lock size={9} /> Workflow Trigger Locked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] uppercase font-bold text-text-tertiary bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {file.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary font-mono">
                        {file.sizeMB.toFixed(2)} MB
                      </td>
                      <td className="py-3 px-4 text-text-tertiary">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => promptDelete(file)}
                          disabled={deletingId === file.id}
                          className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center"
                          title="Delete File"
                        >
                          {deletingId === file.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setFileToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Cloud File"
        message="Are you sure you want to permanently delete this file from your storage bucket? Workflows referencing this asset will no longer be able to load it."
        confirmText="Delete File"
        isDestructive={true}
      />
    </div>
  );
}
