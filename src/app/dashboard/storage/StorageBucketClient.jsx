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

  const storagePercentage = Math.min((totalUsedMB / (user.maxStorageMB || 50)) * 100, 100);

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

      <div className="flex flex-col lg:flex-row gap-6 w-full">
        
        {/* Left Side: Files List */}
        <div className="flex-1 bg-[#111] border border-border-subtle rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HardDrive size={18} className="text-accent-blue" />
                Bucket Assets
              </h2>
              <span className="text-xs text-text-secondary">{files.length} Total Items</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5 text-xs">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeFilter === 'ALL' ? 'bg-accent-blue text-white font-medium' : 'text-text-secondary hover:text-white'
                }`}
              >
                All ({files.length})
              </button>
              <button
                onClick={() => setActiveFilter('IMAGE')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeFilter === 'IMAGE' ? 'bg-accent-blue text-white font-medium' : 'text-text-secondary hover:text-white'
                }`}
              >
                Images ({imageCount})
              </button>
              <button
                onClick={() => setActiveFilter('VIDEO')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeFilter === 'VIDEO' ? 'bg-accent-blue text-white font-medium' : 'text-text-secondary hover:text-white'
                }`}
              >
                Videos ({videoCount})
              </button>
              <button
                onClick={() => setActiveFilter('DOCUMENT')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeFilter === 'DOCUMENT' ? 'bg-accent-blue text-white font-medium' : 'text-text-secondary hover:text-white'
                }`}
              >
                Docs ({docCount})
              </button>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-xl">
              <Database size={32} className="text-text-tertiary mb-3" />
              <p className="text-sm text-text-secondary">No files in this category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Asset Name</th>
                    <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Type</th>
                    <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Size</th>
                    <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Uploaded</th>
                    <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredFiles.map(file => {
                    const rawName = file.fileName || file.url.split('/').pop() || 'Asset File';
                    const isWorkflowLocked = !!(file.nodeId && file.nodeId.startsWith('wf_trigger_'));

                    return (
                      <tr key={file.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-sm text-white font-medium hover:underline hover:text-accent-blue truncate block"
                              >
                                {decodeURIComponent(rawName)}
                              </a>
                              {isWorkflowLocked && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-purple-400 font-semibold mt-0.5">
                                  <Lock size={9} className="shrink-0" />
                                  <span>Workflow Locked Trigger</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-text-secondary border border-white/10">
                              {file.type}
                            </span>
                            {isWorkflowLocked && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                <Lock size={8} /> LOCKED
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {file.sizeMB < 1 ? (file.sizeMB * 1024).toFixed(0) + ' KB' : file.sizeMB.toFixed(1) + ' MB'}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isWorkflowLocked ? (
                            <button
                              type="button"
                              disabled
                              title="Locked by active workflow trigger. Updates automatically on new uploads."
                              className="p-1.5 text-purple-400/60 bg-purple-500/10 rounded cursor-not-allowed border border-purple-500/20"
                            >
                              <Lock size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => promptDelete(file)}
                              disabled={deletingId === file.id}
                              className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {deletingId === file.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Storage Usage & Limits Breakdown */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          
          <div className="bg-[#111] border border-border-subtle rounded-xl p-6 relative overflow-hidden">
            <h3 className="text-sm font-semibold text-white mb-6">Storage Allocation</h3>
            
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="12"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * storagePercentage) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Database size={18} className="text-text-secondary mb-1" />
                  <span className="text-[10px] font-bold text-white">{totalUsedMB > 1000 ? (totalUsedMB/1024).toFixed(1) + ' GB' : totalUsedMB.toFixed(1) + ' MB'}</span>
                  <span className="text-[9px] text-text-tertiary">of {user.maxStorageMB > 1000 ? (user.maxStorageMB/1024).toFixed(1) + ' GB' : (user.maxStorageMB || 50) + ' MB'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Images */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400"><ImageIcon size={14} /></div>
                  <div>
                    <div className="text-xs font-medium text-white">Images</div>
                    <div className="text-[10px] text-text-tertiary">{imageCount} of {user.maxImages || 10} ({user.maxImageMB || 2}MB max)</div>
                  </div>
                </div>
                <div className="text-xs text-text-secondary font-medium">{imageUsedMB.toFixed(1)} MB</div>
              </div>

              {/* Videos */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue"><Film size={14} /></div>
                  <div>
                    <div className="text-xs font-medium text-white">Videos</div>
                    <div className="text-[10px] text-text-tertiary">{videoCount} of {user.maxVideos || 1} ({user.maxVideoMB || 25}MB max)</div>
                  </div>
                </div>
                <div className="text-xs text-text-secondary font-medium">{videoUsedMB.toFixed(1)} MB</div>
              </div>

              {/* Documents */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400"><FileText size={14} /></div>
                  <div>
                    <div className="text-xs font-medium text-white">Documents</div>
                    <div className="text-[10px] text-text-tertiary">{docCount} of {user.maxDocs || 10} ({user.maxDocMB || 10}MB max)</div>
                  </div>
                </div>
                <div className="text-xs text-text-secondary font-medium">{docUsedMB.toFixed(1)} MB</div>
              </div>
            </div>
          </div>

          {!isAdminView && (
            <div className="bg-gradient-to-br from-accent-blue/20 via-black to-accent-violet/20 border border-white/10 rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                 <Database size={80} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 relative z-10">Expand Storage</h3>
              <p className="text-xs text-text-secondary mb-5 relative z-10">Upgrade your bucket to instantly unlock more storage and higher upload limits.</p>
              
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-quota-modal'))}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors relative z-10"
              >
                Upgrade Storage Quota <ArrowUpRight size={14} />
              </button>
            </div>
          )}

        </div>

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
