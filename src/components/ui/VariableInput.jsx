'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Variable, Search } from 'lucide-react';

export default function VariableInput({ 
  value = '', 
  onChange, 
  placeholder, 
  className = '', 
  variables = [], 
  multiline = false,
  rows = 3
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [extraMargin, setExtraMargin] = useState(0);
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const lastEmittedValue = useRef(value);
  const savedRangeRef = useRef(null);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && editorRef.current && editorRef.current.contains(selection.anchorNode)) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Auto-expand the first group when menu opens if nothing is expanded yet
    if (isMenuOpen && Object.keys(expandedGroups).length === 0 && variables.length > 0) {
      setExpandedGroups({ [variables[0].stepId]: true });
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, variables]);

  // Handle dynamic bottom margin to prevent dropdown clipping
  useEffect(() => {
    if (isMenuOpen && containerRef.current) {
      setTimeout(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const requiredSpace = 340; // max-h-80 (320px) + 20px buffer
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

  const toggleGroup = (stepId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  // Helper to generate the HTML for a single pill
  const generatePillHtml = (varId) => {
    let exampleValue = varId;
    let label = varId;
    let isMapped = false;
    
    if (variables) {
      for (const group of variables) {
        const v = group.variables?.find(v => v.id === varId);
        if (v) {
          label = v.label;
          if (v.example !== undefined) {
            exampleValue = String(v.example);
          }
          isMapped = true;
          break;
        }
      }
    }
    
    const colorClass = isMapped 
      ? "text-accent-blue bg-accent-blue/10 border-accent-blue/20" 
      : "text-orange-400 bg-orange-400/10 border-orange-400/20";
      
    // Using zero-width space (\u200B) so cursor can move past contenteditable=false
    // Adding title attribute so hovering shows the full text
    return `<span class="pill inline-flex items-center max-w-[200px] overflow-hidden ${colorClass} px-1.5 py-0.5 rounded border mx-[2px] align-middle select-all" contenteditable="false" data-var="${varId}" title="{{${varId}}}\nExample: ${exampleValue}"><span class="font-semibold text-[9px] uppercase tracking-wider mr-1.5 opacity-70 shrink-0">${label}:</span><span class="truncate text-xs font-mono">${exampleValue}</span></span>\u200B`;
  };

  const valueToHtml = (val) => {
    if (!val) return '';
    return val.split(/(\{\{[^}]+\}\})/g).map((part) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const varId = part.slice(2, -2);
        return generatePillHtml(varId);
      }
      return part.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }).join('');
  };

  const isInitialized = useRef(false);
  const prevVariablesStr = useRef('');

  // Sync incoming value -> innerHTML if it changed externally or on mount
  useEffect(() => {
    if (editorRef.current) {
      const currentVarsStr = JSON.stringify(variables);
      if (!isInitialized.current || value !== lastEmittedValue.current || currentVarsStr !== prevVariablesStr.current) {
        
        // Save caret if focused
        const selection = window.getSelection();
        let caretPos = null;
        if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
          // A simple saving mechanism: we just don't want to wipe it if we don't have to.
          // But since typing won't trigger this anymore (vars are the same), we are safe!
        }

        editorRef.current.innerHTML = valueToHtml(value);
        lastEmittedValue.current = value;
        isInitialized.current = true;
        prevVariablesStr.current = currentVarsStr;
      }
    }
  }, [value, variables]); // re-run if variables load so pills update

  const getRawValue = (element) => {
    let val = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        val += node.textContent.replace(/\u200B/g, ''); // strip zero-width spaces
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.classList.contains('pill')) {
          val += `{{${node.getAttribute('data-var')}}}`;
        } else if (node.nodeName === 'BR') {
          val += '\n';
        } else if (node.nodeName === 'DIV' || node.nodeName === 'P') {
          val += '\n' + getRawValue(node);
        } else {
          val += getRawValue(node);
        }
      }
    }
    return val;
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    saveSelection();
    let newValue = getRawValue(editorRef.current);
    if (newValue === '\n') newValue = ''; // fix empty div artifact
    lastEmittedValue.current = newValue;
    onChange(newValue);
  };

  const handleVariableSelect = (varId) => {
    let range = savedRangeRef.current;
    
    // If we have a valid saved range inside our editor, insert there
    if (range && editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      
      const el = document.createElement('div');
      el.innerHTML = generatePillHtml(varId);
      const frag = document.createDocumentFragment();
      let node, lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        savedRangeRef.current = range.cloneRange(); // update saved range for consecutive insertions
      }
      
      handleInput();
    } else {
      // Fallback: append to end
      const newValue = value + `{{${varId}}}`;
      lastEmittedValue.current = newValue;
      onChange(newValue);
      
      if (editorRef.current) {
        editorRef.current.innerHTML += generatePillHtml(varId);
        
        // Move cursor to end
        const newRange = document.createRange();
        newRange.selectNodeContents(editorRef.current);
        newRange.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRangeRef.current = newRange.cloneRange();
      }
    }
    
    setIsMenuOpen(false);
    setSearchQuery('');
  };

  const filteredVariables = useMemo(() => {
    if (!searchQuery.trim()) return variables;
    const q = searchQuery.toLowerCase();
    
    return variables.map(group => {
      // If group name matches, return all its variables
      if (group.stepName.toLowerCase().includes(q)) {
        return group;
      }
      
      // Otherwise, filter its variables
      const matchedVars = (group.variables || []).filter(v => 
        v.label.toLowerCase().includes(q) || 
        v.id.toLowerCase().includes(q) || 
        (v.example && String(v.example).toLowerCase().includes(q))
      );
      
      if (matchedVars.length > 0) {
        return { ...group, variables: matchedVars };
      }
      return null;
    }).filter(Boolean);
  }, [variables, searchQuery]);

  return (
    <div 
      className="relative w-full transition-[margin] duration-200 ease-in-out" 
      ref={containerRef}
      style={{ marginBottom: extraMargin > 0 ? `${extraMargin}px` : undefined }}
    >
      <div className={`relative flex items-center w-full bg-black/50 border border-white/10 rounded-md focus-within:border-accent-blue transition-colors ${className}`}>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={(e) => {
            saveSelection();
            if (['}', ']', ')'].includes(e.key)) {
              const selection = window.getSelection();
              if (!selection.rangeCount) return;
              const range = selection.getRangeAt(0);
              if (range.startContainer.nodeType === Node.TEXT_NODE) {
                const text = range.startContainer.textContent;
                const offset = range.startOffset;
                const textBeforeCursor = text.slice(0, offset);
                
                const match = textBeforeCursor.match(/(?:\{\{([^{}]+)\}\}|(?<!\{)\{([^{}]+)\}|\[\[([^\[\]]+)\]\]|(?<!\[)\[([^\[\]]+)\]|\(\(([^()]+)\)\))$/);
                
                if (match) {
                  const fullMatch = match[0];
                  const varId = match[1] || match[2] || match[3] || match[4] || match[5];
                  
                  // Remove the typed pattern from the text node
                  const newText = textBeforeCursor.slice(0, -fullMatch.length) + text.slice(offset);
                  range.startContainer.textContent = newText;
                  
                  // Create the pill
                  const el = document.createElement('div');
                  el.innerHTML = generatePillHtml(varId);
                  const frag = document.createDocumentFragment();
                  let node, lastNode;
                  while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                  }
                  
                  // Insert the pill where the pattern was
                  const insertRange = document.createRange();
                  insertRange.setStart(range.startContainer, offset - fullMatch.length);
                  insertRange.collapse(true);
                  insertRange.insertNode(frag);
                  
                  if (lastNode) {
                    const newRange = document.createRange();
                    newRange.setStartAfter(lastNode);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    savedRangeRef.current = newRange.cloneRange();
                  }
                  
                  handleInput();
                }
              }
            }
          }}
          onMouseUp={saveSelection}
          onBlur={(e) => {
            // Intentionally not saving selection here as focus has already moved,
            // which can cause the selection to reset to the start of the editor.
            // We also don't rewrite innerHTML because it destroys the DOM nodes 
            // that savedRangeRef is pointing to.

            // Fix placeholder vanishing issue:
            // Browsers often leave a <br> or whitespace when a contentEditable is emptied.
            // If the actual content is empty, clear the innerHTML so the :empty pseudo-class applies.
            const textContent = editorRef.current.textContent.replace(/\u200B/g, '').trim();
            const hasPills = editorRef.current.querySelector('.pill') !== null;
            
            if (!textContent && !hasPills) {
              editorRef.current.innerHTML = '';
              if (lastEmittedValue.current !== '') {
                lastEmittedValue.current = '';
                onChange('');
              }
            }
          }}
          onKeyDown={(e) => {
            saveSelection();
            if (!multiline && e.key === 'Enter') {
              e.preventDefault();
            }
            if (e.key === 'Backspace') {
              const selection = window.getSelection();
              if (selection.rangeCount > 0 && selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                const node = range.startContainer;
                const offset = range.startOffset;
                
                let pillToDelete = null;
                let textNodeToClean = null;
                let cleanOffset = -1;

                if (node.nodeType === Node.TEXT_NODE) {
                  if (offset > 0 && node.textContent[offset - 1] === '\u200B') {
                    const prev = node.previousSibling;
                    if (prev && prev.nodeType === Node.ELEMENT_NODE && prev.classList.contains('pill')) {
                      pillToDelete = prev;
                      textNodeToClean = node;
                      cleanOffset = offset - 1;
                    }
                  } else if (offset === 0) {
                    const prev = node.previousSibling;
                    if (prev && prev.nodeType === Node.ELEMENT_NODE && prev.classList.contains('pill')) {
                      pillToDelete = prev;
                    }
                  }
                } else if (node === editorRef.current) {
                  if (offset > 0) {
                    const prev = node.childNodes[offset - 1];
                    if (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent.endsWith('\u200B')) {
                      const prevPrev = prev.previousSibling;
                      if (prevPrev && prevPrev.nodeType === Node.ELEMENT_NODE && prevPrev.classList.contains('pill')) {
                        pillToDelete = prevPrev;
                        textNodeToClean = prev;
                        cleanOffset = prev.textContent.length - 1;
                      }
                    } else if (prev && prev.nodeType === Node.ELEMENT_NODE && prev.classList.contains('pill')) {
                      pillToDelete = prev;
                    }
                  }
                }

                if (pillToDelete) {
                  e.preventDefault();
                  pillToDelete.remove();
                  if (textNodeToClean) {
                    const text = textNodeToClean.textContent;
                    textNodeToClean.textContent = text.slice(0, cleanOffset) + text.slice(cleanOffset + 1);
                    const newRange = document.createRange();
                    newRange.setStart(textNodeToClean, cleanOffset);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    savedRangeRef.current = newRange.cloneRange();
                  }
                  handleInput();
                }
              }
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
          // Empty placeholder support via css hack
          data-placeholder={placeholder}
          className={`flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-white focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-white/30 whitespace-pre-wrap break-words [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${!multiline && 'overflow-x-auto whitespace-nowrap'}`}
          style={{ minHeight: multiline ? `${rows * 1.5 + 1}rem` : '2.5rem' }}
        />

        {variables.length > 0 && (
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="shrink-0 mr-2 px-1.5 py-0.5 text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 border border-accent-blue/30 rounded text-xs font-mono font-bold transition-colors flex items-center gap-0.5 shadow-sm"
            title="Insert Variable ({x})"
          >
            <span>{`{x}`}</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[100] left-0 right-0 w-full mt-1 bg-[#111] border border-border-subtle rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden max-h-80 flex flex-col"
          >
            <div className="px-3 py-2 border-b border-border-subtle bg-white/5 shrink-0 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Available Variables</span>
            </div>
            
            {(!variables || variables.length === 0 || !variables.some(g => g.variables?.length > 0)) ? null : (
              <div className="p-2 border-b border-white/5 shrink-0 bg-black/20">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search variables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 pl-8 py-1.5 text-xs text-white focus:outline-none focus:border-accent-blue placeholder:text-white/30"
                  />
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {(!variables || variables.length === 0 || !variables.some(g => g.variables?.length > 0)) ? (
                <div className="px-3 py-6 text-xs text-text-tertiary text-center flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Variable className="w-4 h-4 opacity-50" />
                  </div>
                  <p>No data available.<br/>Please test this step first.</p>
                </div>
              ) : filteredVariables.length === 0 ? (
                <div className="px-3 py-6 text-xs text-text-tertiary text-center">
                  No matching variables found.
                </div>
              ) : (
                <div className="py-1 pb-4">
                  {filteredVariables.map((group) => {
                    if (!group.variables || group.variables.length === 0) return null;
                    const isExpanded = !!searchQuery.trim() || expandedGroups[group.stepId];
                    
                    return (
                      <div key={group.stepId} className="border-b border-white/5 last:border-0">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.stepId)}
                          className="w-full text-left px-3 py-2 flex items-center justify-between bg-[#1a1a1a] hover:bg-[#222] transition-colors sticky top-0 z-10 border-y border-white/5 first:border-t-0 shadow-sm"
                        >
                          <span className="text-[11px] font-bold text-accent-blue uppercase tracking-wider truncate mr-2">
                            {group.stepName}
                          </span>
                          <span className="text-[10px] text-text-tertiary shrink-0">
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </span>
                        </button>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-1 bg-black/20">
                                {group.variables.map((variable) => (
                                  <button
                                    key={variable.id}
                                    type="button"
                                    onClick={() => handleVariableSelect(variable.id)}
                                    className="w-full text-left px-4 py-2 hover:bg-white/10 flex flex-col transition-colors group/item"
                                  >
                                    <div className="flex items-center justify-between w-full mb-0.5 gap-2">
                                      <span className="text-[11px] font-medium text-white/90 group-hover/item:text-accent-blue transition-colors truncate">
                                        {variable.label}
                                      </span>
                                      {variable.example !== undefined && (
                                        <span className="text-[10px] text-text-tertiary truncate max-w-[50%] shrink-0">
                                          {String(variable.example)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-text-secondary/70 font-mono truncate w-full">
                                      {`{{${variable.id}}}`}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
