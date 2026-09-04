'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function GlobalTooltipProvider({ children }) {
  const [tooltip, setTooltip] = useState(null); // { text, top, left, isBottom, copyable }
  const timerRef = useRef(null);

  useEffect(() => {
    const handleMouseOver = (e) => {
      // Look for explicit data-tooltip, title, or truncated element
      const target = e.target.closest('[data-tooltip], [data-truncate], [data-copyable], [title], .truncate, .line-clamp-1, .line-clamp-2');
      if (!target) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setTooltip(null);
        return;
      }

      let text = target.getAttribute('data-tooltip');
      const isCopyable = target.getAttribute('data-copyable') === 'true';

      // If no data-tooltip, check title attribute
      if (!text) {
        const title = target.getAttribute('title');
        if (title && title.trim()) {
          text = title.trim();
          // Remove native browser title to prevent duplicate OS tooltip
          target.setAttribute('data-original-title', title);
          target.removeAttribute('title');
        }
      }

      // If still no text, check if text is actually cropped (scrollWidth > clientWidth)
      if (!text) {
        const isCropped = target.scrollWidth > (target.clientWidth + 1);
        if (isCropped && target.textContent?.trim()) {
          text = target.textContent.trim();
        }
      }

      if (!text || text.length === 0) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const gap = 6;
        const isBottom = rect.top < 38;
        let top = isBottom ? rect.bottom + gap : rect.top - gap;
        let left = rect.left + rect.width / 2;

        const minLeft = 20;
        const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 1000) - 20;
        left = Math.max(minLeft, Math.min(left, maxLeft));

        setTooltip({
          text,
          top,
          left,
          isBottom,
          copyable: isCopyable
        });
      }, 100);
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest('[data-tooltip], [data-truncate], [data-original-title], .truncate');
      if (target) {
        const originalTitle = target.getAttribute('data-original-title');
        if (originalTitle) {
          target.setAttribute('title', originalTitle);
          target.removeAttribute('data-original-title');
        }
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      setTooltip(null);
    };

    const handleScroll = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTooltip(null);
    };

    const handleClick = (e) => {
      const copyEl = e.target.closest('[data-copyable="true"]');
      if (copyEl) {
        const text = copyEl.getAttribute('data-copy-text') || copyEl.getAttribute('data-tooltip') || copyEl.textContent?.trim();
        if (text) {
          navigator.clipboard.writeText(text);
          toast.success(`Copied to clipboard: ${text.slice(0, 16)}${text.length > 16 ? '...' : ''}`);
        }
      }
    };

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('scroll', handleScroll, true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      {children}
      {tooltip && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              top: tooltip.top,
              left: tooltip.left,
              transform: tooltip.isBottom ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
              maxWidth: '380px',
              zIndex: 99999
            }}
            className="px-2 py-0.5 text-xs text-white bg-[#111] border border-white/60 rounded-sm shadow-2xl pointer-events-none select-none flex items-center gap-1.5"
          >
            <span className="font-mono text-xs break-all leading-snug">{tooltip.text}</span>
            {tooltip.copyable && (
              <span className="text-[10px] text-accent-blue font-sans font-semibold shrink-0">
                • Click to copy
              </span>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
