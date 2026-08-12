'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Variable, Search } from 'lucide-react';

export default function VariableMenu({ 
  isOpen, 
  onClose, 
  onSelect, 
  variables, 
  initialSearch = '' 
}) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [expandedGroups, setExpandedGroups] = useState({});
  const menuRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialSearch);
    }
  }, [isOpen, initialSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (isOpen && Object.keys(expandedGroups).length === 0 && variables?.length > 0) {
      setExpandedGroups({ [variables[0].stepId]: true });
    }
  }, [isOpen, variables]);

  const toggleGroup = (stepId) => {
    setExpandedGroups(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const filteredVariables = useMemo(() => {
    if (!searchQuery.trim()) return variables || [];
    const q = searchQuery.toLowerCase();
    
    return (variables || []).map(group => {
      if (group.stepName.toLowerCase().includes(q)) return group;
      const matchedVars = (group.variables || []).filter(v => 
        v.label.toLowerCase().includes(q) || 
        v.id.toLowerCase().includes(q) || 
        (v.example && String(v.example).toLowerCase().includes(q))
      );
      if (matchedVars.length > 0) return { ...group, variables: matchedVars };
      return null;
    }).filter(Boolean);
  }, [variables, searchQuery]);

  if (!isOpen) return null;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="absolute z-[100] right-0 mt-1 w-72 bg-[#111] backdrop-blur-xl border border-border-subtle rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden max-h-80 flex flex-col"
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
              autoFocus
            />
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                              onClick={() => {
                                onSelect(variable.id);
                                onClose();
                              }}
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
  );
}
