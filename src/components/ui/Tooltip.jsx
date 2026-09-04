'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function Tooltip({ 
  children, 
  content, 
  delay = 120, 
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  copyable = false,
  className = '',
  maxWidth = 360
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timerRef = useRef(null);

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
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      calculatePosition();
      setIsOpen(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const handleCopy = (e) => {
    if (!copyable || !content) return;
    e.stopPropagation();
    e.preventDefault();
    const textToCopy = typeof content === 'string' ? content : String(content);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
    };
  }, []);

  if (!content) return children;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center min-w-0 max-w-full ${className}`}
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
            onClick={handleCopy}
            className={`px-2 py-0.5 text-xs text-white bg-[#111] border border-white/60 rounded-sm shadow-2xl select-none pointer-events-auto ${
              copyable ? 'cursor-pointer hover:border-white' : 'cursor-default'
            }`}
          >
            <div className="flex items-center gap-1.5 leading-snug">
              <span className="font-mono text-xs break-all">{content}</span>
              {copyable && (
                <span className="text-[10px] text-accent-blue font-sans font-semibold shrink-0">
                  {copied ? '✓ Copied' : '• Copy'}
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
