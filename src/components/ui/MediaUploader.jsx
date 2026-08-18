'use client';

import { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Film } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MediaUploader({ value, onChange, nodeId, accept = "image/*,video/*" }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast client-side check
    const isVideo = file.type.startsWith('video/');
    const sizeMB = file.size / (1024 * 1024);
    
    // Default hard limits to prevent massive uploads before hitting the server
    if (isVideo && sizeMB > 150) {
      toast.error('Video is too large. Max allowed is 150MB.');
      return;
    }
    if (!isVideo && sizeMB > 20) {
      toast.error('Image is too large. Max allowed is 20MB.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (nodeId) formData.append('nodeId', nodeId);

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          // Quota error
          toast.error(data.error || 'Storage limit reached', { duration: 5000 });
          // We can dispatch an event or call a prop here to open the Upgrade Modal
          window.dispatchEvent(new CustomEvent('open-quota-modal'));
        } else {
          toast.error(data.error || 'Failed to upload media');
        }
      } else {
        toast.success('Media uploaded successfully');
        onChange(data.url);
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error during upload');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group rounded-md border border-white/10 bg-black/30 p-2 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 truncate max-w-[85%]">
            {value.includes('.mp4') || value.includes('.mov') ? (
               <Film size={14} className="text-accent-blue shrink-0" />
            ) : (
               <ImageIcon size={14} className="text-emerald-400 shrink-0" />
            )}
            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-white/80 hover:text-white hover:underline truncate">
              {value.split('/').pop()}
            </a>
          </div>
          <button 
            onClick={handleClear}
            className="p-1 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear media"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className={`relative flex flex-col items-center justify-center w-full h-24 rounded-md border-2 border-dashed transition-colors cursor-pointer
          ${isUploading ? 'border-accent-blue/30 bg-accent-blue/5' : 'border-white/10 bg-black/20 hover:bg-white/5 hover:border-white/20'}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={20} className="text-accent-blue animate-spin" />
              <span className="text-[10px] font-medium text-accent-blue">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-text-tertiary">
              <Upload size={18} />
              <div className="text-center">
                <span className="text-[10px] font-medium block">Click to upload media</span>
                <span className="text-[9px] opacity-70">JPG, PNG, MP4</span>
              </div>
            </div>
          )}
          <input 
            type="file" 
            className="hidden" 
            accept={accept} 
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      )}
      
      <div className="flex items-start justify-between">
        <p className="text-[9px] text-text-tertiary leading-tight">
          Uploading a new file will overwrite the existing one for this step to save space.
        </p>
      </div>
    </div>
  );
}
