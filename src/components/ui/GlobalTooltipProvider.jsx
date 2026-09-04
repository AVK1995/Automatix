'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function GlobalTooltipProvider({ children }) {
  const [tooltip, setTooltip] = useState(null); // { text, top, left, copyable }
  const timerRef = useRef(null);

  useEffect(() => {
    const handleMouseOver = (e) => {
      // Look for explicit data-tooltip, title, or truncated element
      const target = e.target.closest('[data-tooltip], [data-truncate], [title], .truncate, .line-clamp-1, .line-clamp-2');
      if (!target) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setTooltip(null);
        return;
      }

      let text = target.getAttribute('data-tooltip');

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
          isBottom
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

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
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
              maxWidth: '360px',
              zIndex: 99999
            }}
            className="px-2 py-0.5 text-xs text-white bg-[#111] border border-white/60 rounded-sm shadow-2xl pointer-events-none select-none"
          >
            <span className="font-mono text-xs break-all leading-snug">{tooltip.text}</span>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
