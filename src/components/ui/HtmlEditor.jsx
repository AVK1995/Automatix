'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup'; // HTML support
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme
import { Variable } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VariableMenu from './VariableMenu';

// Add custom token for {{variables}} to Prism's markup language
Prism.languages.markup.variable = /\{\{[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\}\}/;
Prism.languages.markup.unmapped = /\{\{[^}]+\}\}|\{[a-zA-Z0-9_.\-\s]+\}|\[[a-zA-Z0-9_.\-\s]+\]/;

export default function HtmlEditor({ 
  value = '', 
  onChange, 
  variables = [], 
  className = '',
  fullHeight = false
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [extraMargin, setExtraMargin] = useState(0);
  const containerRef = useRef(null);
  
  // Custom cursor tracking since react-simple-code-editor abstracts the textarea
  const [cursorPos, setCursorPos] = useState(null);
  const [replacementRange, setReplacementRange] = useState(null);
  
  useEffect(() => {
    // Only handle external clicks to close if needed, but VariableMenu handles its own clicks
    // We just need to make sure the toggle button works
  }, [isMenuOpen, variables]);

  useEffect(() => {
    if (isMenuOpen && containerRef.current) {
      setTimeout(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const requiredSpace = 340; 
        const distanceToBottom = window.innerHeight - rect.bottom;
        
        if (distanceToBottom < requiredSpace) {
          setExtraMargin(requiredSpace - distanceToBottom);
        } else {
          setExtraMargin(0);
        }
      }, 10);
    } else {
      setExtraMargin(0);
    }
  }, [isMenuOpen]);

  const handleCursorMove = (pos) => {
    setCursorPos(pos);
    
    // Check if inside an unmapped placeholder
    const regex = /\{\{[^}]+\}\}|\{[a-zA-Z0-9_.\-\s]+\}|\[[a-zA-Z0-9_.\-\s]+\]/g;
    let match;
    let found = false;
    while ((match = regex.exec(value || '')) !== null) {
      // Don't trigger if it matches our exact valid variable format {{step.var}}
      if (/\{\{[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\}\}/.test(match[0])) {
        continue;
      }
      
      if (pos >= match.index && pos <= match.index + match[0].length) {
        setReplacementRange([match.index, match.index + match[0].length]);
        setIsMenuOpen(true);
        // Pre-fill search query with the inner word (e.g. from {name} get name)
        const innerWord = match[0].replace(/[{}[\]]/g, '');
        setSearchQuery(innerWord);
        found = true;
        break;
      }
    }
    if (!found) {
      setReplacementRange(null);
    }
  };

  const handleVariableSelect = (varId) => {
    const insertText = `{{${varId}}}`;
    
    if (replacementRange) {
      // Replace the active placeholder
      const before = value.substring(0, replacementRange[0]);
      const after = value.substring(replacementRange[1]);
      onChange(before + insertText + after);
      setReplacementRange(null);
    } else if (cursorPos !== null) {
      const before = value.substring(0, cursorPos);
      const after = value.substring(cursorPos);
      onChange(before + insertText + after);
    } else {
      onChange(value + insertText);
    }
    
    setIsMenuOpen(false);
    setSearchQuery('');
  };

  return (
    <div 
      className={`relative w-full transition-[margin] duration-200 ease-in-out ${fullHeight ? 'h-full flex flex-col' : ''} ${className}`}
      ref={containerRef}
      style={{ marginBottom: extraMargin > 0 ? `${extraMargin}px` : undefined }}
    >
      <div className="absolute -top-6 right-0 z-10">
        {variables.length > 0 && (
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center p-1 text-text-tertiary hover:text-accent-blue hover:bg-accent-blue/10 rounded transition-colors"
            title="Insert Variable"
          >
            <Variable className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div 
        className={`w-full bg-black/50 border border-white/10 rounded-md focus-within:border-accent-blue transition-colors overflow-y-auto custom-scrollbar ${fullHeight ? 'flex-1' : 'max-h-[300px]'}`}
        onKeyUp={(e) => {
          if (e.target.tagName === 'TEXTAREA') {
            handleCursorMove(e.target.selectionStart);
          }
        }}
        onClick={(e) => {
          if (e.target.tagName === 'TEXTAREA') {
            handleCursorMove(e.target.selectionStart);
          }
        }}
      >
        <style jsx global>{`
          .token.variable {
            color: #60a5fa;
            font-weight: bold;
            background: rgba(59, 130, 246, 0.15);
            border-radius: 2px;
            outline: 1px solid rgba(59, 130, 246, 0.3);
          }
          .token.unmapped {
            color: #fb923c; /* orange-400 */
            font-weight: bold;
            background: rgba(251, 146, 60, 0.15);
            border-radius: 2px;
            outline: 1px solid rgba(251, 146, 60, 0.4);
          }
          .npm__react-simple-code-editor__textarea {
             outline: none !important;
          }
        `}</style>
        
        <Editor
          value={value || ''}
          onValueChange={onChange}
          highlight={code => Prism.highlight(code, Prism.languages.markup, 'markup')}
          padding={12}
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 12,
            minHeight: '150px',
            backgroundColor: 'transparent',
            color: '#e2e8f0',
          }}
          className="custom-scrollbar"
        />
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <VariableMenu 
            isOpen={isMenuOpen} 
            onClose={() => setIsMenuOpen(false)} 
            onSelect={handleVariableSelect} 
            variables={variables} 
            initialSearch={searchQuery}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
