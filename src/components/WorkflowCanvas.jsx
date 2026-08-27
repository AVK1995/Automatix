import NodeCard from './NodeCard';
import { PlusIcon } from './Icons';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Maximize, ArrowLeft, ChevronRight, Menu } from 'lucide-react';

function buildTree(nodes) {
  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, { ...n, children: [] }));
  
  const rootNodes = [];
  
  nodes.forEach(n => {
    if (n.parentId) {
      const parent = nodeMap.get(n.parentId);
      if (parent) {
        parent.children.push(nodeMap.get(n.id));
      } else {
        rootNodes.push(nodeMap.get(n.id)); // Fallback
      }
    } else {
      rootNodes.push(nodeMap.get(n.id));
    }
  });

  return rootNodes;
}

export default function WorkflowCanvas({ nodes, invalidNodes, waitingCounts, activeSimulationNodeId, selectedNodeId, onSelectNode, onDeleteNode, onDeleteBranch, onSetInsertionPoint, insertionPoint, onAddNode, onUpdateNode, onMoveNodeTo, onCopyNode, onPasteNode, hasCopiedNode, copiedNode, movingNodeId, onStartMoveNode, onReplaceNode, onOpenMobileLibrary, onViewWaitingLeads }) {
  
  const linkedNodes = nodes.map((n, i) => ({
    ...n,
    parentId: n.parentId || (i > 0 ? nodes[i-1].id : null)
  }));

  const tree = buildTree(linkedNodes);

  // --- Zoom & Pan State ---
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [mobileBranchStack, setMobileBranchStack] = useState([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const onWheel = (e) => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) return;
      e.preventDefault(); // Stop native scrolling
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomSensitivity = 0.005;
        const delta = -e.deltaY * zoomSensitivity;
        setScale(s => Math.min(Math.max(0.2, s + delta), 2));
      } else {
        // Pan via trackpad/wheel
        panX.set(panX.get() - e.deltaX);
        panY.set(panY.get() - e.deltaY);
      }
    };
    
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  const handlePointerDown = (e) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    if (e.target.closest('.interactive-node')) return; // Ignore if clicking on a node
    isPanningRef.current = true;
    startPanRef.current = { x: e.clientX - panX.get(), y: e.clientY - panY.get() };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isPanningRef.current) return;
    panX.set(e.clientX - startPanRef.current.x);
    panY.set(e.clientY - startPanRef.current.y);
  };

  const handlePointerUp = (e) => {
    isPanningRef.current = false;
    e.target.releasePointerCapture(e.pointerId);
  };

  const resetView = () => {
    setScale(1);
    panX.set(0);
    panY.set(0);
  };
  // -------------------------

  const [emptyDragOver, setEmptyDragOver] = useState(false);

  const handleEmptyDrop = (e) => {
    e.preventDefault();
    setEmptyDragOver(false);
    const nodeData = e.dataTransfer.getData('application/automatix-node-id');
    if (nodeData) {
      // Abort drag if an existing node is dropped on the empty canvas.
      // We only allow moving existing nodes to valid drop targets (ConnectionLines or AddButtons).
      return;
    }
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const { type, integration, integrationId } = JSON.parse(data);
      if ((type === 'TRIGGER' || type === 'trigger') && onAddNode) {
        onAddNode(type, integration || integrationId);
      }
    }
  };

  const renderNode = (node) => {
    const isCondition = node.type === 'CONDITION';
    const isReminder = node.type === 'REMINDER_SEQUENCE';
    const isBranching = isCondition || isReminder;
    
    const branches = node.config?.branches || (isCondition ? [
      { id: 'A', name: 'PATH A', color: 'accent-blue' }
    ] : [
      { id: '1', name: 'Reminder 1', color: 'purple-500' }
    ]);
    
    let elseChildren = [];
    if (isCondition) {
      elseChildren = node.children.filter(c => c.pathId === 'ELSE');
    }

    const branchColors = [
      'accent-blue', 'accent-violet', 'green-500', 
      'orange-500', 'pink-500', 'cyan-500', 'yellow-500'
    ];

    const addBranch = (e) => {
      e.stopPropagation();
      const nextColor = branchColors[branches.length % branchColors.length];
      let newId, newName;
      if (isReminder) {
        newId = String(branches.length + 1);
        newName = `REMINDER ${newId}`;
      } else {
        newId = String.fromCharCode(65 + branches.length); // e.g. C, D
        newName = `PATH ${newId}`;
      }
      const newBranches = [...branches, { id: newId, name: newName, color: nextColor }];
      onUpdateNode(node.id, { ...node, config: { ...node.config, branches: newBranches } });
      
      if (isReminder && onAddNode) {
        // Automatically add an unconfigured Smart Delay node as the first step of the new reminder branch
        setTimeout(() => {
          onAddNode('ACTION', 'delay', node.id, newId);
        }, 10);
      }
    };

    const removeBranch = (branchId, e) => {
      e.stopPropagation();
      if (branches.length <= 1) return; // Minimum 1 branch
      const newBranches = branches.filter(b => b.id !== branchId);
      onUpdateNode(node.id, { ...node, config: { ...node.config, branches: newBranches } });
      if (onDeleteBranch) {
        onDeleteBranch(node.id, branchId);
      }
    };

    const updateBranchName = (branchId, newName) => {
      const newBranches = branches.map(b => b.id === branchId ? { ...b, name: newName } : b);
      onUpdateNode(node.id, { ...node, config: { ...node.config, branches: newBranches } });
    };

    return (
      <div key={node.id} className={`${isBranching ? 'w-max' : 'w-full'} flex flex-col items-center`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl relative z-10 flex justify-center interactive-node"
        >
          <div className="w-full">
            <NodeCard 
              node={node}
              nodes={nodes}
              isSelected={node.id === selectedNodeId}
              isInvalid={invalidNodes?.has(node.id)}
              isActiveSimulation={node.id === activeSimulationNodeId}
              waitingCount={waitingCounts?.[node.id] || 0}
              onClick={() => onSelectNode(node.id)}
              onDelete={onDeleteNode} 
              onCopy={() => onCopyNode(node.id)}
              onPaste={hasCopiedNode ? () => onPasteNode(node.id) : null}
              onReplace={copiedNode && copiedNode.integration?.id === node.integration?.id && copiedNode.id !== node.id ? () => onReplaceNode(node.id) : null}
              onStartMove={onStartMoveNode ? () => onStartMoveNode(node.id) : null}
              onViewWaitingLeads={onViewWaitingLeads ? () => onViewWaitingLeads(node.id) : null}
            />
          </div>
        </motion.div>
        
        {isBranching ? (
          <>
            <div className="w-full flex justify-center md:hidden">
              <div className="w-px h-8 bg-border-subtle" />
            </div>
            
            <div className={isReminder && node.config?.resumeMainFlow ? "md:mt-8 pt-6 pb-6 px-4 md:px-8 mx-auto border-2 border-dashed border-purple-500/20 bg-purple-500/5 rounded-[2rem] relative flex flex-col items-center w-max" : "w-full"}>
              {isReminder && node.config?.resumeMainFlow && (
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/20 rounded-full shadow-sm flex items-center gap-2 whitespace-nowrap">
                 <div className="w-2 h-2 rounded-full bg-purple-500/50 animate-pulse shrink-0" />
                 Locked Sequence
               </div>
            )}
            {/* Desktop Branching (Side-by-side) */}
            <div className="hidden md:flex mt-6 px-8 justify-center gap-12 relative">
              {branches.map(branch => {
                const children = node.children.filter(c => c.pathId === branch.id);
                const parentIdForAdd = children.length > 0 ? children[children.length-1].id : node.id;
                
                return (
                  <div key={branch.id} className="min-w-[340px] max-w-[400px] shrink-0 flex flex-col items-center border-t-2 border-border-subtle pt-6 relative group">
                    <div className={`absolute -top-3 bg-background px-2 text-xs font-semibold text-${branch.color} flex items-center gap-1 group/input`}>
                      <input 
                        type="text" 
                        value={branch.name} 
                        onChange={(e) => updateBranchName(branch.id, e.target.value)}
                        style={{ width: `${Math.max(branch.name.length + 1, 8)}ch` }}
                        className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-${branch.color}/50 hover:bg-white/5 rounded px-1 text-center uppercase transition-colors`}
                      />
                      {branches.length > 1 && (isReminder || branch.id !== 'A') && (
                        <button onClick={(e) => removeBranch(branch.id, e)} className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                      )}
                    </div>
                    <div className="w-px h-8 bg-border-subtle mb-4" />
                    {children.length > 0 && !(isReminder && children[0].integration?.id === 'delay') && (
                      <ConnectionLine 
                        parentId={node.id} 
                        pathId={branch.id}
                        onDropNode={onAddNode} 
                        onMoveNodeTo={onMoveNodeTo}
                        hasCopiedNode={hasCopiedNode}
                        onPasteNode={onPasteNode}
                        movingNodeId={movingNodeId}
                        onClick={() => {
                          onSetInsertionPoint({ parentId: node.id, pathId: branch.id });
                          if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                            onOpenMobileLibrary({ parentId: node.id, pathId: branch.id });
                          }
                        }}
                      />
                    )}
                    {children.map(renderNode)}
                    {children.length === 0 && (
                      <AddButton 
                        onClick={() => {
                          onSetInsertionPoint({ parentId: parentIdForAdd, pathId: branch.id });
                          if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                            onOpenMobileLibrary({ parentId: parentIdForAdd, pathId: branch.id });
                          }
                        }} 
                        isActive={insertionPoint?.pathId === branch.id && insertionPoint?.parentId === parentIdForAdd}
                        onDropNode={onAddNode}
                        onMoveNodeTo={onMoveNodeTo}
                        parentId={parentIdForAdd}
                        pathId={branch.id}
                        hasCopiedNode={hasCopiedNode}
                        onPasteNode={onPasteNode}
                        movingNodeId={movingNodeId}
                      />
                    )}
                  </div>
                );
              })}

              {/* Else (only for Condition) */}
              {isCondition && (
                <div className="min-w-[340px] max-w-[400px] shrink-0 flex flex-col items-center border-t-2 border-border-subtle pt-6 relative group">
                <div className="absolute -top-3 bg-background px-2 text-xs font-semibold text-text-secondary">ELSE</div>
                <div className="w-px h-8 bg-border-subtle mb-4" />
                {elseChildren.length > 0 && (
                  <ConnectionLine 
                    parentId={node.id} 
                    pathId="ELSE"
                    onDropNode={onAddNode} 
                    onMoveNodeTo={onMoveNodeTo}
                    hasCopiedNode={hasCopiedNode}
                    onPasteNode={onPasteNode}
                    movingNodeId={movingNodeId}
                    onClick={() => {
                      onSetInsertionPoint({ parentId: node.id, pathId: 'ELSE' });
                      if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                        onOpenMobileLibrary({ parentId: node.id, pathId: 'ELSE' });
                      }
                    }}
                  />
                )}
                {elseChildren.map(renderNode)}
                {elseChildren.length === 0 && (
                  <AddButton 
                    onClick={() => {
                      const pid = elseChildren.length > 0 ? elseChildren[elseChildren.length-1].id : node.id;
                      onSetInsertionPoint({ parentId: pid, pathId: 'ELSE' });
                      if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                        onOpenMobileLibrary({ parentId: pid, pathId: 'ELSE' });
                      }
                    }} 
                    isActive={insertionPoint?.pathId === 'ELSE' && insertionPoint?.parentId === (elseChildren.length > 0 ? elseChildren[elseChildren.length-1].id : node.id)} 
                    onDropNode={onAddNode}
                    onMoveNodeTo={onMoveNodeTo}
                    parentId={elseChildren.length > 0 ? elseChildren[elseChildren.length-1].id : node.id}
                    pathId="ELSE"
                    hasCopiedNode={hasCopiedNode}
                    onPasteNode={onPasteNode}
                    movingNodeId={movingNodeId}
                  />
                )}
              </div>
              )}
              
              {/* Add Branch Button UI */}
              {!(isReminder && node.config?.resumeMainFlow) && (
                <div className="flex flex-col items-center border-t-2 border-transparent pt-6 relative w-[40px] shrink-0">
                   <button 
                     onClick={addBranch}
                     className="absolute -top-3 bg-card border border-border-subtle hover:border-accent-blue hover:text-accent-blue text-text-secondary px-2 text-xs font-semibold rounded-md transition-colors"
                     title={isReminder ? "Add Reminder" : "Add Branch"}
                   >
                     {isReminder ? '+ ADD REMINDER' : '+ ADD'}
                   </button>
                </div>
              )}
            </div>

            {/* Mobile Branching (Vertical List) */}
            <div className="flex md:hidden flex-col items-center gap-3 mt-6 w-full max-w-xs px-4">

               {branches.map(branch => (
                 <div key={branch.id} className="relative w-full flex items-center group">
                   <button 
                     onClick={() => setMobileBranchStack(prev => [...prev, { nodeId: node.id, branchId: branch.id, branchName: branch.name, color: branch.color }])}
                     className={`flex-1 py-4 px-5 rounded-xl border border-${branch.color}/30 bg-${branch.color}/5 text-${branch.color} font-medium flex justify-between items-center transition-transform active:scale-95 shadow-sm`}
                   >
                     <input 
                       type="text" 
                       value={branch.name} 
                       onChange={(e) => updateBranchName(branch.id, e.target.value)}
                       onClick={(e) => e.stopPropagation()}
                       className={`bg-transparent border-none outline-none focus:ring-1 focus:ring-${branch.color}/50 rounded px-1 max-w-[150px] uppercase text-sm tracking-wide mr-6 hover:bg-white/5`}
                     />
                     <ChevronRight size={18} />
                   </button>
                    {isBranching && branches.length > 1 && (isReminder || branch.id !== 'A') && (
                      <button 
                        onClick={(e) => removeBranch(branch.id, e)} 
                        className="absolute right-12 top-0 bottom-0 px-2 text-text-secondary hover:text-red-400"
                      >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                     </button>
                   )}
                 </div>
               ))}
               
               {isCondition && (
                 <button 
                   onClick={() => setMobileBranchStack(prev => [...prev, { nodeId: node.id, branchId: 'ELSE', branchName: 'ELSE', color: 'text-secondary' }])}
                   className="w-full py-4 px-5 rounded-xl border border-border-subtle bg-card text-text-secondary font-medium flex justify-between items-center transition-transform active:scale-95 shadow-sm"
                 >
                   <span className="tracking-wide uppercase text-sm">ELSE</span>
                   <ChevronRight size={18} />
                 </button>
               )}

               {!(isReminder && node.config?.resumeMainFlow) && (
                 <button 
                   onClick={addBranch}
                   className="w-full py-3 mt-2 rounded-xl border border-dashed border-border-subtle text-text-secondary font-medium flex justify-center items-center hover:bg-white/5 active:scale-95 transition-all"
                 >
                   {isReminder ? '+ Add Reminder' : '+ Add Path'}
                 </button>
               )}
            </div>
            </div>

            {/* Converged Main Flow */}
            {isReminder && node.config?.resumeMainFlow && (
              <div className="flex flex-col items-center w-full relative">
                <div className="w-px h-8 bg-border-subtle mb-4" />
                <div className="border border-purple-500/30 bg-purple-500/10 text-purple-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative z-10">
                  Main Flow Resumed
                </div>
                
                {(() => {
                  const convergedChildren = node.children.filter(c => !c.pathId);
                  const parentIdForAdd = convergedChildren.length > 0 ? convergedChildren[convergedChildren.length - 1].id : node.id;
                  
                  return (
                    <div className="w-full flex flex-col items-center">
                      {convergedChildren.length > 0 && (
                        <ConnectionLine 
                          parentId={node.id} 
                          pathId={null}
                          onDropNode={onAddNode} 
                          onMoveNodeTo={onMoveNodeTo}
                          hasCopiedNode={hasCopiedNode}
                          onPasteNode={onPasteNode}
                          movingNodeId={movingNodeId}
                          onClick={() => {
                            onSetInsertionPoint({ parentId: node.id, pathId: null });
                            if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                              onOpenMobileLibrary({ parentId: node.id, pathId: null });
                            }
                          }}
                        />
                      )}
                      {convergedChildren.map(renderNode)}
                      {convergedChildren.length === 0 && (
                        <AddButton 
                          onClick={() => {
                            onSetInsertionPoint({ parentId: parentIdForAdd, pathId: null });
                            if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                              onOpenMobileLibrary({ parentId: parentIdForAdd, pathId: null });
                            }
                          }} 
                          isActive={insertionPoint?.pathId === null && insertionPoint?.parentId === parentIdForAdd}
                          onDropNode={onAddNode}
                          onMoveNodeTo={onMoveNodeTo}
                          parentId={parentIdForAdd}
                          pathId={null}
                          hasCopiedNode={hasCopiedNode}
                          onPasteNode={onPasteNode}
                          movingNodeId={movingNodeId}
                        />
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          node.children.length > 0 ? (
            <>
              <ConnectionLine 
                parentId={node.id} 
                onDropNode={onAddNode} 
                onMoveNodeTo={onMoveNodeTo} 
                hasCopiedNode={hasCopiedNode}
                onPasteNode={onPasteNode}
                movingNodeId={movingNodeId}
                onClick={() => {
                  onSetInsertionPoint({ parentId: node.id });
                  if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                    onOpenMobileLibrary({ parentId: node.id });
                  }
                }}
              />
              {node.children.map(renderNode)}
            </>
          ) : (
            <>
              <ConnectionLine 
                parentId={node.id} 
                onDropNode={onAddNode} 
                onMoveNodeTo={onMoveNodeTo}
                hasCopiedNode={hasCopiedNode}
                onPasteNode={onPasteNode}
                movingNodeId={movingNodeId}
                onClick={() => {
                  onSetInsertionPoint({ parentId: node.id });
                  if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                    onOpenMobileLibrary({ parentId: node.id });
                  }
                }}
              />
              <AddButton 
                onClick={() => {
                  onSetInsertionPoint({ parentId: node.id });
                  if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                    onOpenMobileLibrary({ parentId: node.id });
                  }
                }} 
                isActive={insertionPoint?.parentId === node.id} 
                onDropNode={onAddNode}
                onMoveNodeTo={onMoveNodeTo}
                parentId={node.id}
                pathId={null}
                hasCopiedNode={hasCopiedNode}
                onPasteNode={onPasteNode}
                movingNodeId={movingNodeId}
              />
            </>
          )
        )}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-y-auto overflow-x-hidden md:overflow-hidden absolute inset-0 md:cursor-grab md:active:cursor-grabbing pb-32 select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDragOver={(e) => {
        e.preventDefault();
        setEmptyDragOver(true);
      }}
      onDragLeave={() => setEmptyDragOver(false)}
      onDrop={handleEmptyDrop}
    >
      <div className="absolute inset-0 z-0">
        <motion.div
          style={typeof window !== 'undefined' && window.innerWidth < 768 ? { scale: 1 } : { x: panX, y: panY }}
          animate={typeof window !== 'undefined' && window.innerWidth < 768 ? {} : { scale }}
          transition={{ scale: { type: "spring", stiffness: 300, damping: 30 } }}
          className="w-full min-h-full flex flex-col items-center py-10 md:py-20 px-4 md:px-20 transform-origin-center"
          onDragOver={(e) => { e.preventDefault(); setEmptyDragOver(true); }}
          onDragLeave={() => setEmptyDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEmptyDragOver(false);
            try {
              const dataStr = e.dataTransfer.getData('application/json');
              if (dataStr) {
                const data = JSON.parse(dataStr);
                // Allow dropping triggers anywhere on the canvas
                if ((data.type === 'TRIGGER' || data.type === 'trigger') && onAddNode) {
                  onAddNode(data.type, data.integration || data.integrationId);
                  return; // handled
                }
              }
            } catch (err) {}
            // Fallback for empty state
            if (nodes.length === 0) {
              handleEmptyDrop(e);
            }
          }}
        >
          {nodes.length === 0 ? (
            <div 
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                  onOpenMobileLibrary(null);
                }
              }}
              className={`text-center p-12 border-2 border-dashed rounded-2xl w-full max-w-2xl backdrop-blur-sm transition-all interactive-node cursor-pointer ${
                emptyDragOver ? 'border-accent-blue bg-accent-blue/10 scale-105' : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/40'
              }`}
            >
              <p className="text-text-secondary mb-6 text-sm">Your automation canvas is empty.</p>
              <p className="text-white font-medium hidden md:block">Drag and drop a Trigger from the left library to start building.</p>
              <p className="text-white font-medium md:hidden">Tap here to add a Trigger and start building.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {!nodes.some(n => n.type === 'TRIGGER' || n.type === 'trigger') && (
                <div 
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 768 && onOpenMobileLibrary) {
                      onOpenMobileLibrary(null);
                    }
                  }}
                  className="text-center p-8 border-2 border-dashed border-red-500/30 bg-red-500/5 hover:bg-red-500/10 rounded-2xl w-full max-w-2xl mb-8 flex flex-col items-center justify-center interactive-node cursor-pointer"
                >
                  <div className="text-red-400 mb-2 flex items-center gap-2 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                    Missing Trigger
                  </div>
                  <p className="text-sm text-red-400/80 hidden md:block">Every workflow must start with a trigger. Drag and drop a trigger here.</p>
                  <p className="text-sm text-red-400/80 md:hidden">Every workflow must start with a trigger. Tap here to add one.</p>
                </div>
              )}
              <div className="w-full flex justify-center">
                {tree.map(renderNode)}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      {/* Mobile Floating Action Button */}
      <div className={`md:hidden fixed bottom-6 right-6 z-40 ${selectedNodeId ? 'hidden' : ''}`}>
        <button
          onClick={() => {
            if (onOpenMobileLibrary) onOpenMobileLibrary(null);
          }}
          className="w-12 h-12 bg-accent-blue text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(59,130,246,0.4)] hover:bg-blue-600 transition-colors active:scale-95"
        >
          <Menu size={22} />
        </button>
      </div>

      <div className="hidden md:flex absolute bottom-6 left-6 z-50 flex-col gap-2">
        <div className="flex items-center gap-1 bg-[#0a0a0a]/90 backdrop-blur-md border border-border-subtle rounded-lg p-1 shadow-xl interactive-node">
          <button 
            onClick={() => setScale(s => Math.max(0.25, s - 0.25))}
            className="p-1.5 text-text-secondary hover:text-white hover:bg-white/5 rounded transition-colors"
            title="Zoom Out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path></svg>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
              className="bg-transparent text-xs font-medium text-center text-text-secondary hover:text-white px-2 py-1 outline-none w-[60px] flex items-center justify-center transition-colors"
            >
              {Math.round(scale * 100)}%
            </button>

            <AnimatePresence>
              {isZoomMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#111] backdrop-blur-xl border border-border-subtle rounded-md shadow-2xl overflow-hidden py-1 flex flex-col z-50 w-[70px]"
                >
                  {[200, 150, 125, 100, 75, 50, 25].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setScale(val / 100);
                        setIsZoomMenuOpen(false);
                      }}
                      className={`text-xs text-center py-1.5 transition-colors ${
                        Math.round(scale * 100) === val 
                          ? 'bg-accent-blue/10 text-accent-blue font-semibold' 
                          : 'text-text-secondary hover:text-white hover:bg-white/5 font-medium'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => setScale(s => Math.min(2, s + 0.25))}
            className="p-1.5 text-text-secondary hover:text-white hover:bg-white/5 rounded transition-colors"
            title="Zoom In"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
          </button>
        </div>

        <button 
          onClick={resetView}
          className="flex items-center justify-center gap-2 bg-[#0a0a0a]/90 backdrop-blur-md border border-border-subtle hover:bg-white/5 text-text-secondary hover:text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-xl interactive-node"
        >
          <Maximize className="w-4 h-4" />
          Reset to fit
        </button>
      </div>

      {/* Mobile Branch Navigation Modal */}
      <AnimatePresence>
        {mobileBranchStack.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed inset-0 z-[150] bg-[#0a0a0a] flex flex-col overflow-hidden"
          >
            {(() => {
              const currentBranch = mobileBranchStack[mobileBranchStack.length - 1];
              
              // Find the target node in the tree to render its children
              let targetNode = null;
              const findNode = (nodesList) => {
                for (let n of nodesList) {
                  if (n.id === currentBranch.nodeId) targetNode = n;
                  if (!targetNode && n.children) findNode(n.children);
                }
              };
              findNode(tree);

              if (!targetNode) return null;

              const children = targetNode.children.filter(c => c.pathId === currentBranch.branchId);
              const parentIdForAdd = children.length > 0 ? children[children.length-1].id : targetNode.id;

              return (
                <>
                  <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-card shrink-0">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setMobileBranchStack(prev => prev.slice(0, -1))} 
                        className="p-1 text-text-secondary hover:text-white transition-colors -ml-1"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div>
                        <h2 className={`font-semibold text-${currentBranch.color} tracking-wide uppercase text-sm`}>
                          {currentBranch.branchName}
                        </h2>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
                    <div className="w-full flex flex-col items-center py-8 px-4">
                      {children.length > 0 && !(targetNode.integration?.id === 'reminder_sequence' && children[0].integration?.id === 'delay') && (
                        <ConnectionLine 
                          parentId={targetNode.id} 
                          pathId={currentBranch.branchId}
                          onDropNode={onAddNode} 
                          onMoveNodeTo={onMoveNodeTo}
                          hasCopiedNode={hasCopiedNode}
                          onPasteNode={onPasteNode}
                          movingNodeId={movingNodeId}
                          onClick={() => {
                            onSetInsertionPoint({ parentId: targetNode.id, pathId: currentBranch.branchId });
                            if (onOpenMobileLibrary) {
                              onOpenMobileLibrary({ parentId: targetNode.id, pathId: currentBranch.branchId });
                            }
                          }}
                        />
                      )}
                      {children.map(renderNode)}
                      {children.length === 0 && (
                        <AddButton 
                          onClick={() => {
                            onSetInsertionPoint({ parentId: parentIdForAdd, pathId: currentBranch.branchId });
                            if (onOpenMobileLibrary) {
                              onOpenMobileLibrary({ parentId: parentIdForAdd, pathId: currentBranch.branchId });
                            }
                          }} 
                          isActive={insertionPoint?.pathId === currentBranch.branchId && insertionPoint?.parentId === parentIdForAdd}
                          onDropNode={onAddNode}
                          onMoveNodeTo={onMoveNodeTo}
                          parentId={parentIdForAdd}
                          pathId={currentBranch.branchId}
                          hasCopiedNode={hasCopiedNode}
                          onPasteNode={onPasteNode}
                          movingNodeId={movingNodeId}
                        />
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnectionLine({ parentId, pathId, onDropNode, onMoveNodeTo, hasCopiedNode, onPasteNode, movingNodeId, onClick }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`w-full max-w-2xl relative flex justify-center items-center cursor-pointer group z-10 transition-all duration-150 ${isDragOver ? 'h-28' : 'h-12'}`}
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const nodeId = e.dataTransfer.getData('application/automatix-node-id');
        if (nodeId && onMoveNodeTo) {
          onMoveNodeTo(nodeId, parentId, pathId);
          return;
        }
        const data = e.dataTransfer.getData('application/json');
        if (data && onDropNode) {
          const { type, integration, integrationId } = JSON.parse(data);
          onDropNode(type, integration || integrationId, parentId, pathId);
        }
      }}
    >
      {/* Background capture area for easier hovering/dropping */}
      <div className={`absolute inset-x-0 inset-y-1 transition-all ${isDragOver ? 'bg-accent-blue/5 border-2 border-dashed border-accent-blue/40 rounded-xl' : ''}`} />
      
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <span className="text-accent-blue/60 text-sm font-medium">Drop to insert step here</span>
        </div>
      )}

      {/* The actual line */}
      <div className={`absolute inset-y-0 w-px flex justify-center items-center pointer-events-none ${isDragOver ? 'opacity-0' : 'opacity-100'}`}>
        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
           <line x1="0" y1="0" x2="0" y2="100%" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeDasharray="4 4" />
           <line x1="0" y1="0" x2="0" y2="100%" stroke="rgba(59,130,246,0.7)" strokeWidth="2" strokeDasharray="4 4" className="stroke-dash-pulse" />
        </svg>
      </div>

      {/* Hover/Drag + Icon */}
      <div className={`absolute flex items-center gap-2 transition-all duration-150 ${
        isHovered && !isDragOver ? 'scale-100 opacity-100' : 'scale-100 opacity-100 md:scale-50 md:opacity-0'
      }`}>
        <div className="w-6 h-6 rounded-full bg-accent-blue flex items-center justify-center shadow-lg">
          <PlusIcon className="w-3 h-3 text-white" />
        </div>
        {hasCopiedNode && (
          <button 
            onClick={(e) => { e.stopPropagation(); if (onPasteNode) onPasteNode(parentId, pathId); }}
            className="w-6 h-6 rounded-full bg-[#111] hover:bg-white/10 border border-border-subtle flex items-center justify-center shadow-lg text-text-secondary hover:text-white transition-colors"
            title="Paste Copied Step"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
          </button>
        )}
        {movingNodeId && (
          <button 
            onClick={(e) => { e.stopPropagation(); if (onMoveNodeTo) onMoveNodeTo(movingNodeId, parentId, pathId); }}
            className="md:hidden w-6 h-6 rounded-full bg-accent-violet/20 hover:bg-accent-violet/40 border border-accent-violet/50 flex items-center justify-center shadow-lg text-accent-violet transition-colors"
            title="Move Step Here"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="10 15 15 20 20 15"/><path d="M4 4h7a4 4 0 0 1 4 4v12"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

function AddButton({ onClick, isActive, onDropNode, onMoveNodeTo, parentId, pathId, hasCopiedNode, onPasteNode, movingNodeId }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="relative group">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          const nodeId = e.dataTransfer.getData('application/automatix-node-id');
          if (nodeId && onMoveNodeTo) {
            onMoveNodeTo(nodeId, parentId, pathId);
            return;
          }
          const data = e.dataTransfer.getData('application/json');
          if (data && onDropNode) {
            const { type, integration, integrationId } = JSON.parse(data);
            onDropNode(type, integration || integrationId, parentId, pathId);
          }
        }}
        onClick={onClick} 
        className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all cursor-pointer relative z-10 
          ${isActive || isDragOver
            ? 'border-accent-blue bg-accent-blue/10 text-accent-blue shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
            : 'border-border-subtle bg-card text-text-secondary hover:border-white/20 hover:text-white hover:bg-white/5 shadow-sm'
          }`}
      >
        <PlusIcon className="w-5 h-5" />
      </div>
      
      {hasCopiedNode && (
        <button 
          onClick={(e) => { e.stopPropagation(); if (onPasteNode) onPasteNode(parentId, pathId); }}
          className="absolute -right-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#111] hover:bg-white/10 border border-border-subtle flex items-center justify-center shadow-lg text-text-secondary hover:text-white transition-colors opacity-100 md:opacity-0 group-hover:opacity-100"
          title="Paste Copied Step"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
        </button>
      )}
      {movingNodeId && (
        <button 
          onClick={(e) => { e.stopPropagation(); if (onMoveNodeTo) onMoveNodeTo(movingNodeId, parentId, pathId); }}
          className="md:hidden absolute -right-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-accent-violet/20 hover:bg-accent-violet/40 border border-accent-violet/50 flex items-center justify-center shadow-lg text-accent-violet transition-colors"
          title="Move Step Here"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="10 15 15 20 20 15"/><path d="M4 4h7a4 4 0 0 1 4 4v12"/></svg>
        </button>
      )}
    </div>
  );
}
