'use client';

import { X, Network } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PlaceholderModal({ isOpen, onClose, providerName }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-card border border-border-subtle rounded-xl w-full max-w-md shadow-2xl flex flex-col text-center">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div>
            <h2 className="text-lg font-medium text-foreground">Connect {providerName}</h2>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue mb-4">
            <Network size={32} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Under Construction</h3>
          <p className="text-sm text-text-secondary">
            The internal connection flow for {providerName} is currently being mapped. Please stand by for updates!
          </p>
        </div>

        <div className="p-6 border-t border-border-subtle bg-card rounded-b-xl text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-accent-blue rounded-md hover:opacity-90 transition-opacity"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
