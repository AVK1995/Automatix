'use client';

import { useState } from 'react';
import Tooltip from './Tooltip';
import toast from 'react-hot-toast';
import { Copy, Check } from 'lucide-react';

export default function TruncatedText({ 
  text, 
  maxChars = 8, 
  prefix = '', 
  suffix = '...', 
  className = '', 
  copyable = true,
  showIcon = false
}) {
  const [justCopied, setJustCopied] = useState(false);

  if (!text && text !== 0) return null;
  const str = String(text);
  const isCropped = str.length > maxChars;
  const displayText = isCropped ? `${str.slice(0, maxChars)}${suffix}` : str;

  const handleCopy = (e) => {
    if (!copyable) return;
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    navigator.clipboard.writeText(str);
    setJustCopied(true);
    toast.success(`Copied to clipboard: ${str.slice(0, 16)}${str.length > 16 ? '...' : ''}`);
    setTimeout(() => setJustCopied(false), 2000);
  };

  const body = (
    <span 
      onClick={copyable ? handleCopy : undefined}
      className={`inline-flex items-center gap-1 group transition-colors ${
        copyable 
          ? 'cursor-pointer hover:text-accent-blue' 
          : ''
      } ${className}`}
      title={copyable ? 'Click to copy' : undefined}
    >
      <span>{prefix}{displayText}</span>
      {showIcon && copyable && (
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary group-hover:text-accent-blue">
          {justCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
        </span>
      )}
    </span>
  );

  return (
    <Tooltip 
      content={`${prefix}${str}`} 
      copyValue={str} 
      copyable={copyable}
    >
      {body}
    </Tooltip>
  );
}
