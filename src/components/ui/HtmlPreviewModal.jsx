'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

export default function HtmlPreviewModal({ isOpen, onClose, value, variables, unsubscribeEnabled }) {
  const [previewHtml, setPreviewHtml] = useState('');

  // Function to replace {{var}} with example values for the preview
  useEffect(() => {
    if (!value) {
      setPreviewHtml('');
      return;
    }

    let hydrated = value;
    const matches = value.match(/\{\{([^}]+)\}\}/g) || [];
    
    matches.forEach(match => {
      const varId = match.slice(2, -2);
      let exampleValue = match;
      
      // Find example value
      if (variables) {
        for (const group of variables) {
          const v = group.variables?.find(v => v.id === varId);
          if (v) {
            exampleValue = v.example !== undefined ? String(v.example) : v.label;
            break;
          }
        }
      }
      
      // Use split/join to replace all occurrences globally without regex escaping issues
      hydrated = hydrated.split(match).join(exampleValue);
    });

    // Also highlight unmapped variables (e.g., {name}, [name], {{name}} that weren't replaced)
    // We do this by searching for them and wrapping them in a styling span.
    const unmappedRegex = /\{\{[^}]+\}\}|\{[a-zA-Z0-9_.\-\s]+\}|\[[a-zA-Z0-9_.\-\s]+\]/g;
    let finalHtml = hydrated;
    let match2;
    // Need a unique replacement strategy to avoid infinite loops or corrupting HTML tags
    // A simple replace is okay if we are careful. Since we don't have a DOM parser, we'll just replace.
    // To be safer, we can just replace text that looks like placeholders.
    finalHtml = hydrated.replace(unmappedRegex, (m) => {
      // Don't replace if it's already a valid variable {{step.var}}
      if (/\{\{[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\}\}/.test(m)) {
        return m; // This shouldn't happen anyway since valid vars were hydrated
      }
      return `<span style="background-color: rgba(234, 179, 8, 0.2); color: #eab308; padding: 0 4px; border-radius: 3px; font-weight: bold; border: 1px dashed #eab308;">${m}</span>`;
    });
    
    if (unsubscribeEnabled) {
      finalHtml += `<br><br><div style="font-size:11px;color:#888;">If you no longer wish to receive these emails, you can <a href="#" style="color:#666;text-decoration:underline;">unsubscribe here</a>.</div>`;
    }
    
    setPreviewHtml(finalHtml);
  }, [value, variables, unsubscribeEnabled]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-6xl h-[85vh] bg-[#121214] border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start md:items-center justify-between px-4 md:px-6 py-4 border-b border-border-subtle shrink-0 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              Live HTML Preview
            </h2>
            <p className="text-xs text-text-tertiary mt-1 break-words">Simulating actual email client formatting. Close this window to return to the editor.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Preview Content */}
        <div className="flex-1 bg-[#121214] relative rounded-b-xl overflow-hidden">
          <iframe 
            title="HTML Email Preview"
            srcDoc={previewHtml || '<p style="color: #9ca3af; font-style: italic; padding: 1.5rem; font-family: sans-serif;">Preview will appear here...</p>'}
            className="w-full h-full border-none bg-white"
            sandbox="allow-same-origin"
          />
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
