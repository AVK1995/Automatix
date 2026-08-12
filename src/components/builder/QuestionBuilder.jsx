'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Settings2, Link as LinkIcon, Eye, Lock, Check } from 'lucide-react';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import { v4 as uuidv4 } from 'uuid';
import { Reorder } from 'framer-motion';

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'dropdown', label: 'Dropdown Options' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'phone', label: 'Phone Number' },
];

const VISIBILITY_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'between', label: 'Between' },
];

export default function QuestionBuilder({ questions, onChange }) {
  const [expandedSettingsId, setExpandedSettingsId] = useState(null);

  const addQuestion = () => {
    onChange([
      ...questions,
      {
        id: uuidv4(),
        label: '',
        type: 'text',
        required: false,
        isHidden: false,
        urlParamMap: '',
        options: [],
        visibilityRule: null,
      }
    ]);
  };

  const updateQuestion = (id, updates) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id) => {
    onChange(questions.filter(q => q.id !== id));
  };

  const toggleSettings = (id) => {
    setExpandedSettingsId(prev => prev === id ? null : id);
  };

  const addOption = (questionId, currentOptions) => {
    updateQuestion(questionId, { options: [...(currentOptions || []), `Option ${(currentOptions?.length || 0) + 1}`] });
  };

  const updateOption = (questionId, currentOptions, index, newValue) => {
    const newOptions = [...currentOptions];
    newOptions[index] = newValue;
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId, currentOptions, index) => {
    const newOptions = [...currentOptions];
    newOptions.splice(index, 1);
    updateQuestion(questionId, { options: newOptions });
  };

  const toggleVisibilityRule = (q) => {
    if (q.visibilityRule) {
      updateQuestion(q.id, { visibilityRule: null });
    } else {
      updateQuestion(q.id, { 
        visibilityRule: { dependsOnId: '', operator: 'equals', value: '' } 
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Fixed Fields Block */}
      <div className="bg-black/40 border border-white/5 rounded-lg p-3 space-y-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue/50" />
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-accent-blue">
          <Lock size={12} /> Default Fixed Fields
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-md">
          <div className="flex-1 text-sm text-white">Full Name</div>
          <div className="text-xs text-text-secondary bg-black/50 px-2 py-1 rounded">Always Required</div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-md">
          <div className="flex-1 text-sm text-white">Email Address</div>
          <div className="text-xs text-text-secondary bg-black/50 px-2 py-1 rounded">Always Required</div>
        </div>
      </div>

      <Reorder.Group axis="y" values={questions} onReorder={onChange} className="space-y-3">
        {questions.map((q, index) => (
          <Reorder.Item key={q.id} value={q} className="bg-[#1a1a1a] border border-white/10 rounded-lg flex flex-col transition-all relative" style={{ zIndex: questions.length - index }}>
            {/* Main Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="cursor-grab active:cursor-grabbing hover:bg-white/5 p-1.5 rounded text-text-tertiary shrink-0" style={{ touchAction: 'none' }}>
                  <GripVertical size={16} />
                </div>
                <input
                  type="text"
                  placeholder={`Question ${index + 1} (e.g. Company Name)`}
                  value={q.label}
                  onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                  className="w-full bg-transparent border-0 text-sm text-white placeholder-text-tertiary focus:outline-none focus:ring-0 px-1"
                />
                
                {/* Mobile Actions */}
                <div className="flex sm:hidden items-center gap-1 shrink-0 ml-auto">
                  <button
                    onClick={() => toggleSettings(q.id)}
                    className={`p-2 rounded-md transition-colors shrink-0 ${expandedSettingsId === q.id ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
                  >
                    <Settings2 size={16} />
                  </button>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="p-2 text-text-tertiary hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-8 sm:pl-0 w-full sm:w-auto pr-3 sm:pr-0">
                <div className="flex-1 sm:w-48 sm:flex-none">
                  <Select
                    value={q.type}
                    onChange={(val) => updateQuestion(q.id, { type: val })}
                    options={QUESTION_TYPES}
                  />
                </div>
                
                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => toggleSettings(q.id)}
                    className={`p-2 rounded-md transition-colors shrink-0 ${expandedSettingsId === q.id ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}
                    title="Advanced Settings"
                  >
                    <Settings2 size={16} />
                  </button>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="p-2 text-text-tertiary hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Settings Panel */}
            {expandedSettingsId === q.id && (
              <div className="px-4 sm:px-10 pb-5 pt-5 bg-black/20 border-t border-white/5 space-y-5 rounded-b-lg">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <Checkbox 
                    checked={q.required}
                    onChange={(checked) => updateQuestion(q.id, { required: checked })}
                    label={<span className="text-xs text-text-secondary">Required Field</span>}
                  />

                  <Checkbox 
                    checked={q.isHidden}
                    onChange={(checked) => updateQuestion(q.id, { isHidden: checked })}
                    label={<span className="text-xs text-text-secondary">Hide from Form (Auto-capture only)</span>}
                  />

                  <div className="sm:ml-auto">
                    <Checkbox 
                      checked={!!q.visibilityRule}
                      onChange={() => toggleVisibilityRule(q)}
                      label={<span className="text-xs font-medium text-purple-400 group-hover:text-purple-300 transition-colors">Conditional Visibility</span>}
                      className="[&>div]:border-purple-500 [&>div]:bg-purple-500/20"
                    />
                  </div>
                </div>

                {/* Conditional Visibility Builder */}
                {q.visibilityRule && (
                  <div className="bg-purple-900/10 border border-purple-500/30 rounded-md p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-purple-400 mb-1 font-medium">
                      <Eye size={14} /> Show this question if:
                    </div>
                    <div className="flex flex-wrap items-center gap-2 relative z-20">
                      <div className="flex-1 min-w-[140px]">
                        <Select
                          value={q.visibilityRule.dependsOnId}
                          onChange={(val) => updateQuestion(q.id, { visibilityRule: { ...q.visibilityRule, dependsOnId: val } })}
                          options={[
                            { value: '', label: 'Select a previous question...' },
                            ...questions.slice(0, index).map(prevQ => ({ value: prevQ.id, label: prevQ.label || 'Untitled Question' }))
                          ]}
                        />
                      </div>
                      <div className="w-36 shrink-0 relative z-10">
                        <Select
                          value={q.visibilityRule.operator}
                          onChange={(val) => updateQuestion(q.id, { visibilityRule: { ...q.visibilityRule, operator: val } })}
                          options={VISIBILITY_OPERATORS}
                        />
                      </div>
                      <div className="flex-1 min-w-[200px] flex gap-2">
                        {(() => {
                          const parentQ = questions.find(prevQ => prevQ.id === q.visibilityRule.dependsOnId);
                          const isParentMultipleChoice = parentQ && ['radio', 'checkbox', 'dropdown'].includes(parentQ.type);
                          
                          if (isParentMultipleChoice && !q.visibilityRule.isCustomValue) {
                            return (
                              <Select
                                value={q.visibilityRule.value}
                                onChange={(val) => {
                                  if (val === '__custom__') {
                                    updateQuestion(q.id, { visibilityRule: { ...q.visibilityRule, isCustomValue: true, value: '' } });
                                  } else {
                                    updateQuestion(q.id, { visibilityRule: { ...q.visibilityRule, value: val } });
                                  }
                                }}
                                options={[
                                  { value: '', label: 'Select option...' },
                                  ...(parentQ.options || []).map(opt => ({ value: opt, label: opt })),
                                  { value: '__custom__', label: 'Custom Value...' }
                                ]}
                              />
                            );
                          }
                          
                          return (
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <input
                                type="text"
                                placeholder={q.visibilityRule.operator === 'between' ? 'e.g. 10,20' : 'Value to match'}
                                value={q.visibilityRule.value}
                                onChange={(e) => updateQuestion(q.id, { visibilityRule: { ...q.visibilityRule, value: e.target.value } })}
                                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                              />
                              {isParentMultipleChoice && (
                                <button 
                                  onClick={() => updateQuestion(q.id, { visibilityRule: { ...q.visibilityRule, isCustomValue: false, value: '' } })}
                                  className="text-xs text-purple-400 hover:text-purple-300 underline shrink-0 whitespace-nowrap"
                                >
                                  Use Options
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* URL Param Mapping */}
                <div className="flex items-center gap-3">
                  <LinkIcon size={14} className="text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="URL Parameter Map (e.g. utm_source)"
                    value={q.urlParamMap || ''}
                    onChange={(e) => updateQuestion(q.id, { urlParamMap: e.target.value })}
                    className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:border-accent-blue/50 focus:outline-none"
                  />
                </div>

                {/* Options for dropdown/radio/checkbox */}
                {['dropdown', 'radio', 'checkbox'].includes(q.type) && (
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <p className="text-xs font-medium text-text-secondary">Dynamic Options List</p>
                    
                    <div className="space-y-2">
                      {(q.options || []).map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(q.id, q.options, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:border-accent-blue/50 focus:outline-none"
                          />
                          <button
                            onClick={() => removeOption(q.id, q.options, optIndex)}
                            className="p-2 text-text-tertiary hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {['radio', 'checkbox'].includes(q.type) ? (
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${q.allowOtherOption ? 'bg-accent-blue border-accent-blue' : 'border-white/20 group-hover:border-white/40 bg-transparent'}`}>
                            {q.allowOtherOption && <Check size={10} className="text-white" />}
                          </div>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={q.allowOtherOption || false} 
                            onChange={(e) => updateQuestion(q.id, { allowOtherOption: e.target.checked })} 
                          />
                          <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">Allow "Other" option</span>
                        </label>
                      ) : <div />}
                      
                      <button
                        onClick={() => addOption(q.id, q.options)}
                        className="text-xs flex items-center gap-1 text-accent-blue hover:text-accent-blue/80 transition-colors py-1 px-2 bg-accent-blue/10 hover:bg-accent-blue/20 rounded-md"
                      >
                        <Plus size={12} /> Add Option
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div className="pt-2">
        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-lg text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-all"
        >
          <Plus size={16} />
          Add New Question
        </button>
      </div>
    </div>
  );
}
