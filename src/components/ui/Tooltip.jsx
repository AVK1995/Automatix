'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function Tooltip({ 
  children, 
  content, 
  copyValue = null,
  delay = 100, 
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  copyable = false,
  className = '',
  maxWidth = 400
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timerRef = useRef(null);
  const leaveTimerRef = useRef(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 6;
    
    let top = 0;
    let left = 0;

    if (position === 'top') {
      top = rect.top - gap;
      left = rect.left + rect.width / 2;
      // If too close to viewport top, flip to bottom
      if (rect.top < 40) {
        top = rect.bottom + gap;
      }
    } else if (position === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2;
    } else if (position === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
    } else if (position === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
    }

    // Clamp horizontally to avoid going off-screen
    const minLeft = 20;
    const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 1000) - 20;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    if (!content) return;
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      calculatePosition();
      setIsOpen(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // 150ms hover bridge so the user can easily move mouse over to click the tooltip
    leaveTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleTooltipMouseEnter = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  };

  const handleTooltipMouseLeave = () => {
    setIsOpen(false);
  };

  const handleCopy = (e) => {
    if (!copyable) return;
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const textToCopy = copyValue != null ? String(copyValue) : (typeof content === 'string' ? content : String(content));
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      const handleScroll = () => calculatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  if (!content) return children;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={copyable ? handleCopy : undefined}
        className={`inline-flex items-center min-w-0 max-w-full ${copyable ? 'cursor-pointer' : ''} ${className}`}
      >
        {children}
      </span>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 2 : -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: position === 'top' && coords.top > 40
                ? 'translate(-50%, -100%)' 
                : 'translate(-50%, 0)',
              maxWidth: `${maxWidth}px`,
              zIndex: 99999
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            onClick={handleCopy}
            className={`px-2 py-0.5 text-xs text-white bg-[#111] border rounded-sm shadow-2xl select-none pointer-events-auto transition-colors ${
              copied
                ? 'border-emerald-500 bg-emerald-950/80 text-emerald-200'
                : copyable 
                  ? 'border-white/60 hover:border-white cursor-pointer' 
                  : 'border-white/60 cursor-default'
            }`}
          >
            <div className="flex items-center gap-1.5 leading-snug">
              <span className="font-mono text-xs break-all">{content}</span>
              {copyable && (
                <span className={`text-[10px] font-sans font-semibold shrink-0 transition-colors ${
                  copied ? 'text-emerald-400 font-bold' : 'text-accent-blue hover:underline'
                }`}>
                  {copied ? '✓ Copied' : '• Click to copy'}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
