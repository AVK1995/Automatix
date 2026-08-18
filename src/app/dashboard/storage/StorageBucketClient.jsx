'use client';

import { useState } from 'react';
import { Database, Image as ImageIcon, Film, Trash2, Loader2, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function StorageBucketClient({ user, mediaFiles, isAdminView }) {
  const [files, setFiles] = useState(mediaFiles);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  const videoCount = files.filter(f => f.type === 'VIDEO').length;
  const imageCount = files.filter(f => f.type === 'IMAGE').length;
  
  const videoUsedMB = files.filter(f => f.type === 'VIDEO').reduce((sum, f) => sum + f.sizeMB, 0);
  const imageUsedMB = files.filter(f => f.type === 'IMAGE').reduce((sum, f) => sum + f.sizeMB, 0);
  const totalUsedMB = videoUsedMB + imageUsedMB;

  const storagePercentage = Math.min((totalUsedMB / user.maxStorageMB) * 100, 100);

  const handleDelete = async (file) => {
    if (!confirm('Are you sure you want to delete this file? This will break any workflows using it.')) return;
    
    setDeletingId(file.id);
    try {
      const res = await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: file.id })
      });
      if (!res.ok) throw new Error('Failed to delete');
      
      setFiles(files.filter(f => f.id !== file.id));
      toast.success('File deleted');
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {!isAdminView && (
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Storage Bucket</h1>
          <p className="text-sm text-text-secondary">Manage your uploaded media files.</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Files List */}
        <div className="flex-1 bg-[#111] border border-border-subtle rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">All Files</h2>
            <div className="text-xs text-text-secondary">
              {files.length} items
            </div>
          </div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-xl">
              <Database size={32} className="text-text-tertiary mb-3" />
              <p className="text-sm text-text-secondary">Your bucket is empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Name</th>
                    <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Size</th>
                    <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary">Uploaded</th>
                    <th className="py-3 px-4 text-[10px] uppercase font-semibold text-text-secondary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(file => {
                    const filename = file.url.split('/').pop() || 'Unknown File';
                    return (
                      <tr key={file.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02]">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0">
                              {file.type === 'VIDEO' ? <Film size={14} className="text-accent-blue" /> : <ImageIcon size={14} className="text-emerald-400" />}
                            </div>
                            <a href={file.url} target="_blank" rel="noreferrer" className="text-sm text-white font-medium hover:underline hover:text-accent-blue max-w-[200px] sm:max-w-xs truncate block">
                              {decodeURIComponent(filename)}
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {file.sizeMB < 1 ? (file.sizeMB * 1024).toFixed(0) + ' KB' : file.sizeMB.toFixed(1) + ' MB'}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => handleDelete(file)}
                            disabled={deletingId === file.id}
                            className="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                          >
                            {deletingId === file.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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

        {/* Right Side: Storage Usage & Upgrade */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          
          <div className="bg-[#111] border border-border-subtle rounded-xl p-6 relative overflow-hidden">
            <h3 className="text-sm font-semibold text-white mb-6">Storage Usage</h3>
            
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
                  <span className="text-[10px] font-medium text-white">{totalUsedMB > 1000 ? (totalUsedMB/1024).toFixed(1) + ' GB' : totalUsedMB.toFixed(1) + ' MB'}</span>
                  <span className="text-[9px] text-text-tertiary">of {user.maxStorageMB > 1000 ? (user.maxStorageMB/1024).toFixed(1) + ' GB' : user.maxStorageMB + ' MB'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-accent-blue/20 text-accent-blue"><Film size={14} /></div>
                  <div>
                    <div className="text-xs font-medium text-white">Videos</div>
                    <div className="text-[10px] text-text-tertiary">{videoCount} of {user.maxVideos} Limit</div>
                  </div>
                </div>
                <div className="text-xs text-text-secondary font-medium">{videoUsedMB.toFixed(1)} MB</div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400"><ImageIcon size={14} /></div>
                  <div>
                    <div className="text-xs font-medium text-white">Images</div>
                    <div className="text-[10px] text-text-tertiary">{imageCount} of {user.maxImages} Limit</div>
                  </div>
                </div>
                <div className="text-xs text-text-secondary font-medium">{imageUsedMB.toFixed(1)} MB</div>
              </div>
            </div>
          </div>

          {!isAdminView && (
            <div className="bg-gradient-to-br from-accent-blue/20 via-black to-accent-violet/20 border border-white/10 rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                 <Database size={80} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 relative z-10">Get more space</h3>
              <p className="text-xs text-text-secondary mb-5 relative z-10">Upgrade your bucket to instantly unlock more storage and higher upload limits.</p>
              
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-quota-modal'))}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors relative z-10 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                Upgrade to Pro <ArrowUpRight size={16} />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
