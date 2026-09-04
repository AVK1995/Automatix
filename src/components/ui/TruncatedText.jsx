'use client';

import Tooltip from './Tooltip';

export default function TruncatedText({ 
  text, 
  maxChars = 8, 
  prefix = '', 
  suffix = '...', 
  className = '', 
  copyable = true 
}) {
  if (!text && text !== 0) return null;
  const str = String(text);
  const isCropped = str.length > maxChars;
  const displayText = isCropped ? `${str.slice(0, maxChars)}${suffix}` : str;

  if (!isCropped) {
    return <span className={className}>{prefix}{displayText}</span>;
  }

  return (
    <Tooltip content={`${prefix}${str}`} copyable={copyable}>
      <span className={`cursor-pointer hover:text-accent-blue transition-colors ${className}`}>
        {prefix}{displayText}
      </span>
    </Tooltip>
  );
}
