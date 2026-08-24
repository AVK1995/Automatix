'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import WorkflowCanvas from '@/components/WorkflowCanvas';
import NodeLibrary from '@/components/builder/NodeLibrary';
import PropertiesPanel from '@/components/builder/PropertiesPanel';
import TestFlowModal from '@/components/builder/TestFlowModal';
import ExecutionHistoryPanel from '@/components/builder/ExecutionHistoryPanel';
import WaitingLeadsModal from '@/components/builder/WaitingLeadsModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { PlayIcon, CheckIcon } from '@/components/Icons';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Loader2, Edit2, PlayCircle, Undo2, Redo2, Globe, History as HistoryIcon, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { NODE_TYPES } from '@/constants';
import { updateWorkflow, toggleWorkflowPublish, clearSimulations, getWaitingCounts } from '@/actions/workflows';
import { INTEGRATIONS } from '@/components/builder/NodeLibrary';

export default function WorkflowBuilder({ workflow }) {
  let initialNodes = [];
  try {
    if (Array.isArray(workflow.nodesJson)) {
      initialNodes = workflow.nodesJson;
    } else if (typeof workflow.nodesJson === 'string') {
      initialNodes = JSON.parse(workflow.nodesJson);
    }
    if (!Array.isArray(initialNodes)) initialNodes = [];

    // Rehydrate integration objects (add back React component icons that can't be stored in DB)
    initialNodes = initialNodes.map(node => {
      let fullIntegration = node.integration;
      if (fullIntegration && fullIntegration.id) {
         const typeIntegrations = INTEGRATIONS[node.type] || [];
         const found = typeIntegrations.find(i => i.id === fullIntegration.id);
         if (found) fullIntegration = found;
      }
      return { ...node, integration: fullIntegration };
    });
  } catch (e) {
    initialNodes = [];
  }

  const [nodes, setNodes] = useState(initialNodes);
  const [pastNodes, setPastNodes] = useState([]);
  const [futureNodes, setFutureNodes] = useState([]);
  
  const updateNodesWithHistory = (newNodesUpdater) => {
    setNodes(prevNodes => {
      const nextNodes = typeof newNodesUpdater === 'function' ? newNodesUpdater(prevNodes) : newNodesUpdater;
      setPastNodes(past => {
        const newPast = [...past, prevNodes];
        if (newPast.length > 50) newPast.shift();
        return newPast;
      });
      setFutureNodes([]);
      setIsSaved(false);
      return nextNodes;
    });
  };

  const undo = () => {
    if (pastNodes.length === 0) return;
    const previous = pastNodes[pastNodes.length - 1];
    setPastNodes(past => past.slice(0, past.length - 1));
    setFutureNodes(future => [nodes, ...future]);
    setNodes(previous);
    setIsSaved(false);
  };

  const redo = () => {
    if (futureNodes.length === 0) return;
    const next = futureNodes[0];
    setFutureNodes(future => future.slice(1));
    setPastNodes(past => [...past, nodes]);
    setNodes(next);
    setIsSaved(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pastNodes, futureNodes, nodes]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  const [isSaved, setIsSaved] = useState(true);
  const [isPublishing, startTransition] = useTransition();
  const [isPublished, setIsPublished] = useState(workflow.isActive || false);
  
  const [workflowName, setWorkflowName] = useState(workflow.name || 'New Automation');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [waitingNode, setWaitingNode] = useState(null);
  
  // Mobile tap-to-add states
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [mobileInsertionTarget, setMobileInsertionTarget] = useState(null);

  const [copiedNodes, setCopiedNodes] = useState(null);
  const [movingNodeId, setMovingNodeId] = useState(null);
  const [pendingRouterInsertion, setPendingRouterInsertion] = useState(null);
  const [insertionPoint, setInsertionPoint] = useState(null);
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const targetNodeId = searchParams.get('issueNodeId') || searchParams.get('nodeId');
    if (targetNodeId && nodes.some(n => n.id === targetNodeId)) {
      setSelectedNodeId(targetNodeId);
    }
  }, [searchParams, nodes]);

  useEffect(() => {
    // Clear simulation users on refresh
    clearSimulations(workflow.id).catch(console.error);
  }, [workflow.id]);

  const [waitingCounts, setWaitingCounts] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchWaiting = async () => {
      try {
        const counts = await getWaitingCounts(workflow.id);
        if (isMounted && counts) {
          setWaitingCounts(counts);
        }
      } catch (err) {
        console.error("Failed to load waiting counts", err);
      }
    };
    fetchWaiting();
    const interval = setInterval(fetchWaiting, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [workflow.id]);
  const [simulationTime, setSimulationTime] = useState(0);
  const [simulationPath, setSimulationPath] = useState(null);

  useEffect(() => {
    if (simulationPath && simulationPath.currentIndex < simulationPath.path.length) {
      const timer = setTimeout(() => {
        setSimulationPath(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (simulationPath && simulationPath.currentIndex >= simulationPath.path.length) {
      const timer = setTimeout(() => setSimulationPath(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [simulationPath]);

  const startVisualSimulation = (res) => {
    setSimulationTime(Date.now());
    
    let startNode = null;
    let isResume = res?.resumed;

    if (isResume && res?.nodeId) {
      // Find the child of the node we are resuming from!
      startNode = nodes.find(n => n.parentId === res.nodeId);
    } else {
      startNode = nodes.find(n => n.type === 'TRIGGER');
    }

    if (!startNode) {
       // if we resumed on the last node, there is no child, just finish
       toast.success("Simulation finished!");
       return;
    }

    const path = [];
    let current = startNode;
    while (current) {
      path.push(current.id);
      if (current.integration?.id === 'delay') break; 
      if (current.integration?.id === 'reminder_sequence') break; // stop at delays/reminders
      current = nodes.find(n => n.parentId === current.id);
    }
    
    setSimulationPath({ path, currentIndex: 0 });
    toast.success(isResume ? "Simulation resumed!" : "Simulation started!");
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const { getWaitingCounts } = await import('@/actions/workflows');
        const counts = await getWaitingCounts(workflow.id);
        if (isMounted) setWaitingCounts(counts || {});
      } catch (err) {
        console.error('Failed to fetch waiting counts', err);
      }
    };
    
    fetchCounts();
    const isFastPolling = Date.now() - simulationTime < 10000;
    const interval = setInterval(fetchCounts, isFastPolling ? 1000 : 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [workflow.id, simulationTime]);

  // Autosave
  useEffect(() => {
    if (!isSaved) {
      const timer = setTimeout(async () => {
        try {
          // Strip React components (icons) before sending to server action
          let safeNodes = nodes.map(n => ({
            ...n,
            integration: n.integration ? { 
              id: n.integration.id,
              name: n.integration.name,
              color: n.integration.color,
              description: n.integration.description
            } : null
          }));

          // Bulletproof serialization to ensure no React elements or non-plain objects leak in
          safeNodes = JSON.parse(JSON.stringify(safeNodes));

          await updateWorkflow(workflow.id, {
            name: workflowName,
            nodesJson: safeNodes
          });
          setIsSaved(true);
        } catch (error) {
          console.error('Failed to save workflow', error);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSaved, nodes, workflowName, workflow.id]);

  const handleAddNode = (type, integrationOrId, explicitParentId = null, explicitPathId = null) => {
    let integration = integrationOrId;
    if (typeof integrationOrId === 'string') {
      const typeIntegrations = INTEGRATIONS[type] || [];
      integration = typeIntegrations.find(i => i.id === integrationOrId);
      if (!integration) {
        for (const cat of Object.values(INTEGRATIONS)) {
          const found = cat.find(i => i.id === integrationOrId);
          if (found) {
            integration = found;
            break;
          }
        }
      }
      integration = integration || {};
    }

    let parentId = explicitParentId || null;
    let pathId = explicitPathId || null;
    
    if (type === 'TRIGGER' || type === 'trigger') {
      parentId = null;
      pathId = null;
    } else if (!explicitParentId && insertionPoint) {
      parentId = insertionPoint.parentId;
      pathId = insertionPoint.pathId;
    } else if (!explicitParentId && nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      parentId = lastNode.id;
    }

    const newNode = {
      id: `node-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type: type,
      title: `${integration.name || 'Unknown'}`,
      integration: integration,
      config: {},
      parentId,
      pathId,
    };

    const isExisting = nodes.some(n => 
      n.parentId === parentId && 
      (n.pathId || null) === (pathId || null)
    );

    if (isExisting && type === 'CONDITION') {
      setPendingRouterInsertion({ action: 'add', newNode, existingChildIndex: 1 });
      setInsertionPoint(null);
      setSelectedNodeId(newNode.id);
      return;
    }

    executeAddNode(newNode);
  };

  const executeAddNode = (newNode) => {
    updateNodesWithHistory(prevNodes => {
      if (insertionPoint) {
        // Insert node at specific point
        const { parentId: targetParentId, pathId: targetPathId } = insertionPoint;
        
        // 1. Update newNode's parent
        newNode.parentId = targetParentId;
        newNode.pathId = targetPathId;

        const newNodesList = [...prevNodes];
        
        // 2. Find any existing child at this position
        const existingChildIndex = newNodesList.findIndex(n => 
          n.parentId === targetParentId && 
          (n.pathId || null) === (targetPathId || null) &&
          n.type !== 'TRIGGER' && n.type !== 'trigger'
        );

        if (existingChildIndex !== -1) {
          // Shift existing child to be under our new node
          newNodesList[existingChildIndex] = {
            ...newNodesList[existingChildIndex],
            parentId: newNode.id,
            pathId: null // Since it's now under a linear node, path is null
          };
        }

        // Add the new node
        newNodesList.push(newNode);
        return newNodesList;
      }
      
      if (newNode.type === 'TRIGGER' || newNode.type === 'trigger') {
        // If there is an orphaned node (like after a trigger was deleted), adopt it
        const orphanedIndex = prevNodes.findIndex(n => n.parentId === null);
        if (orphanedIndex !== -1) {
          const updatedPrevNodes = [...prevNodes];
          updatedPrevNodes[orphanedIndex] = {
            ...updatedPrevNodes[orphanedIndex],
            parentId: newNode.id
          };
          return [newNode, ...updatedPrevNodes];
        }
        return [newNode, ...prevNodes];
      }

      return [...prevNodes, newNode];
    });
    
    setSelectedNodeId(newNode.id);
    setInsertionPoint(null);
  };

  const handleConfigureReminderStep = (parentId, pathId) => {
    const firstChild = prevNodes => {
      // Find the latest state directly from nodes (we are in a render or callback using nodes from closure, but better to use nodes directly if it's up to date)
      return nodes.find(n => n.parentId === parentId && n.pathId === pathId);
    };
    const child = firstChild();
    
    if (child && child.integration?.id === 'delay') {
      setSelectedNodeId(child.id);
      return;
    }

    const newNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'ACTION',
      integration: { id: 'delay', category: 'logic', name: 'Smart Delay' },
      title: 'Smart Delay',
      config: { delayType: 'event_based' },
      parentId: parentId,
      pathId: pathId
    };

    executeAddNode(newNode, null, parentId, pathId);
  };

  const handleDeleteBranch = (parentId, pathId) => {
    updateNodesWithHistory(prevNodes => {
      const idsToDelete = new Set();
      const immediateChildren = prevNodes.filter(n => n.parentId === parentId && n.pathId === pathId);
      immediateChildren.forEach(c => idsToDelete.add(c.id));
      
      let prevSize = 0;
      while (idsToDelete.size > prevSize) {
        prevSize = idsToDelete.size;
        for (const node of prevNodes) {
          if (idsToDelete.has(node.parentId)) {
            idsToDelete.add(node.id);
          }
        }
      }
      return prevNodes.filter(n => !idsToDelete.has(n.id));
    });
  };

  const handleDeleteNode = (id) => {
    updateNodesWithHistory(prevNodes => {
      const nodeToDelete = prevNodes.find(n => n.id === id);
      if (!nodeToDelete) return prevNodes;

      // Prevent deletion of the constant first step (Smart Delay) of a reminder branch
      if (nodeToDelete.parentId) {
        const parentNode = prevNodes.find(n => n.id === nodeToDelete.parentId);
        if (parentNode && parentNode.integration?.id === 'reminder_sequence') {
          toast.error("The first step of a reminder branch cannot be deleted.");
          return prevNodes;
        }
      }


      // 1. If deleting the trigger, completely remove it and clear parent references for its children
      if (nodeToDelete.type === 'TRIGGER' || nodeToDelete.type === 'trigger') {
        return prevNodes
          .filter(n => n.id !== id)
          .map(n => n.parentId === id ? { ...n, parentId: null } : n);
      }

      // 2. If deleting a linear ACTION (not a ROUTER), re-link its direct children to its parent
      if (nodeToDelete.type !== 'CONDITION') {
        const children = prevNodes.filter(n => n.parentId === id);
        
        // Re-link children to the deleted node's parent and path
        const updatedNodes = prevNodes.map(node => {
          if (node.parentId === id) {
            return {
              ...node,
              parentId: nodeToDelete.parentId,
              pathId: nodeToDelete.pathId // Inherit the path if the deleted node was inside a branch
            };
          }
          return node;
        });
        
        return updatedNodes.filter(n => n.id !== id);
      }

      // 3. If deleting a ROUTER (CONDITION), it's complex to merge multiple branches back into a linear flow. 
      // So we cascade delete for routers.
      const idsToDelete = new Set([id]);
      let prevSize = 0;
      while (idsToDelete.size > prevSize) {
        prevSize = idsToDelete.size;
        prevNodes.forEach(n => {
          if (idsToDelete.has(n.parentId)) idsToDelete.add(n.id);
        });
      }
      return prevNodes.filter(node => !idsToDelete.has(node.id));
    });
    
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const handleUpdateNode = (id, updatedNode) => {
    updateNodesWithHistory(prevNodes => prevNodes.map(node => node.id === id ? updatedNode : node));
  };

  const handlePublishToggle = () => {
    if (!isPublished && (!triggerNode || triggerNode.issue || invalidNodes.has(triggerNode.id))) {
      alert("Cannot publish workflow: Trigger is missing or requires reconfiguration.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await toggleWorkflowPublish(workflow.id, !isPublished);
        if (result.success) {
          setIsPublished(result.isActive);
        }
      } catch (error) {
        console.error('Failed to toggle publish status', error);
      }
    });
  };
  const handleCopyNode = (id) => {
    const node = nodes.find(n => n.id === id);
    if (node && node.type !== 'TRIGGER') {
      if (node.type === 'CONDITION') {
        const getDescendants = (parentId) => {
          const children = nodes.filter(n => n.parentId === parentId);
          return children.flatMap(c => [c, ...getDescendants(c.id)]);
        };
        setCopiedNodes([node, ...getDescendants(node.id)]);
      } else {
        setCopiedNodes([node]);
      }
      setMovingNodeId(null);
    }
  };

  const handleStartMoveNode = (id) => {
    setMovingNodeId(id);
    setCopiedNodes(null);
  };

  const handlePasteNode = (parentId, pathId) => {
    if (!copiedNodes || copiedNodes.length === 0) return;


    const rootCopiedNode = copiedNodes[0];
    const isRouter = rootCopiedNode.type === 'CONDITION';
    
    if (isRouter) {
      // Find index within current nodes just for the isRouter check (safe enough for UI prompt)
      const isExisting = nodes.some(n => n.parentId === parentId && (n.pathId || null) === (pathId || null));
      if (isExisting) {
        // existingChildIndex is passed as a generic flag or we can just calculate it in the execute
        setPendingRouterInsertion({ action: 'paste', parentId, pathId, existingChildIndex: 1 });
        return;
      }
    }
    
    executePasteNode(parentId, pathId);
  };

  const executePasteNode = (parentId, pathId) => {
    updateNodesWithHistory(prevNodes => {
      const existingChildIndex = prevNodes.findIndex(n => 
        n.parentId === parentId && 
        (n.pathId || null) === (pathId || null)
      );
      
      const idMap = new Map();
      const newNodesList = [...prevNodes];
      
      const pastedNodes = copiedNodes.map((n, i) => {
        const newId = `node-${Date.now()}-${i}`;
        idMap.set(n.id, newId);
        return { ...n, id: newId };
      });
      
      const mappedPastedNodes = pastedNodes.map((n, i) => {
        if (i === 0) return { ...n, parentId, pathId };
        return { ...n, parentId: idMap.get(n.parentId) };
      });
      
      if (existingChildIndex !== -1) {
         let leafId = mappedPastedNodes[0].id;
         let current = mappedPastedNodes[0];
         while (current) {
           const children = mappedPastedNodes.filter(n => n.parentId === current.id);
           if (children.length === 0) break;
           if (current.type === 'CONDITION') {
             const pathAChild = children.find(c => c.pathId === 'A');
             if (pathAChild) { current = pathAChild; leafId = current.id; }
             else break;
           } else {
             current = children[0];
             leafId = current.id;
           }
         }
         
         newNodesList[existingChildIndex] = {
           ...newNodesList[existingChildIndex],
           parentId: leafId,
           pathId: mappedPastedNodes.find(n => n.id === leafId)?.type === 'CONDITION' ? 'A' : null
         };
      }
      
      return [...newNodesList, ...mappedPastedNodes];
    });
    setInsertionPoint(null);
    setCopiedNodes(null);
  };

  const handleMoveNodeTo = (nodeId, targetParentId, targetPathId) => {
    updateNodesWithHistory(prevNodes => {
      const node = prevNodes.find(n => n.id === nodeId);
      if (!node || node.type === 'TRIGGER') return prevNodes;
      if (node.id === targetParentId) return prevNodes; // Can't move into itself

      let newNodes = [...prevNodes];

      const isBranchingNode = node.type === 'CONDITION' || node.type === 'REMINDER_SEQUENCE' || node.type === 'condition' || node.type === 'reminder_sequence';

      // 1. Extract node: node's converged children connect to node's parent
      newNodes = newNodes.map(n => {
        if (n.parentId === node.id) {
          if (isBranchingNode && n.pathId !== null) {
            // Do not extract branch children, they move with the branching node
            return n;
          }
          // Converged children (or children of regular action nodes) connect to the old parent
          return { ...n, parentId: node.parentId, pathId: node.pathId || n.pathId };
        }
        return n;
      });

      // 2. Insert node at target
      // Find the existing child at the target slot
      const existingChildIndex = newNodes.findIndex(n => 
        n.parentId === targetParentId && 
        (n.pathId || null) === (targetPathId || null) &&
        n.id !== node.id && // exclude self if it was somehow already there
        n.type !== 'TRIGGER' && n.type !== 'trigger'
      );

      if (existingChildIndex !== -1) {
        // Shift existing child to be a child of the moved node
        newNodes[existingChildIndex] = {
          ...newNodes[existingChildIndex],
          parentId: node.id,
          pathId: null // Since it's now under our action node, path is null
        };
      }

      // 3. Update node's parent and path
      const nodeIndex = newNodes.findIndex(n => n.id === node.id);
      newNodes[nodeIndex] = {
        ...newNodes[nodeIndex],
        parentId: targetParentId,
        pathId: targetPathId
      };

      return newNodes;
    });
    setMovingNodeId(null);
  };

  const handleReplaceNode = (targetNodeId) => {
    if (!copiedNodes || copiedNodes.length === 0) return;
    const copiedNode = copiedNodes[0];

    updateNodesWithHistory(prevNodes => {
      const newNodes = [...prevNodes];
      const targetIndex = newNodes.findIndex(n => n.id === targetNodeId);
      if (targetIndex === -1) return prevNodes;
      
      const targetNode = newNodes[targetIndex];
      // Must be same integration type
      if (targetNode.integration?.id !== copiedNode.integration?.id) return prevNodes;

      newNodes[targetIndex] = {
        ...targetNode,
        title: copiedNode.title,
        integration: copiedNode.integration,
        config: JSON.parse(JSON.stringify(copiedNode.config || {})),
        issue: null
      };
      
      return newNodes;
    });
    setCopiedNodes(null);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const triggerNode = nodes.find(n => n.type === NODE_TYPES.TRIGGER);
  const hasTrigger = !!(triggerNode && triggerNode.integration);

  const invalidNodes = useMemo(() => {
    const invalidSet = new Set();
    const getAncestors = (nodeId) => {
      const ancestors = new Set();
      let currentId = nodeId;
      while (currentId) {
        const currentNode = nodes.find(n => n.id === currentId);
        if (currentNode && currentNode.parentId) {
          ancestors.add(currentNode.parentId);
          currentId = currentNode.parentId;
        } else {
          break;
        }
      }
      return ancestors;
    };

    const reachableSet = new Set();
    const traverse = (nodeId) => {
      if (!nodeId || reachableSet.has(nodeId)) return;
      reachableSet.add(nodeId);
      const children = nodes.filter(n => n.parentId === nodeId);
      for (const child of children) traverse(child.id);
    };
    if (triggerNode) traverse(triggerNode.id);

    nodes.forEach(node => {
      if (node.type === 'TRIGGER' || node.type === 'trigger') {
        if (node.issue || !node.integration) {
          invalidSet.add(node.id);
        } else {
          const reqConn = ['webhook', 'calendar', 'instagram', 'sheets', 'slack', 'twilio', 'stripe'];
          if (node.integration && reqConn.includes(node.integration.id)) {
            if (node.integration.id === 'webhook') {
              // Webhooks don't need a connection
            } else if (node.integration.id === 'calendar' && node.config?.provider === 'builtin') {
              // Builtin doesn't need a connection
            } else if (!node.config?.connectionId) {
              invalidSet.add(node.id);
            }
          }
        }
        return;
      }
      if (!reachableSet.has(node.id)) return;

      const configStr = JSON.stringify(node.config || {});
      const regex = /\{\{([^}]+)\}\}/g;
      let match;
      let isInvalid = false;
      const ancestors = getAncestors(node.id);
      
      while ((match = regex.exec(configStr)) !== null) {
        const varPath = match[1];
        if (varPath.startsWith('trigger.')) {
           const trigger = nodes.find(n => n.type === 'TRIGGER' || n.type === 'trigger');
           if (!trigger || !trigger.integration || trigger.issue || invalidSet.has(trigger.id)) {
             isInvalid = true;
             break;
           }
           continue;
        }
        if (varPath.startsWith('steps.node-')) {
          const referencedNodeId = varPath.split('.')[1];
          if (!ancestors.has(referencedNodeId)) {
            isInvalid = true;
            break;
          }
        }
      }
      
      if (isInvalid) {
        invalidSet.add(node.id);
      } else {
        const conf = node.config || {};
        const id = node.integration?.id || node.type;
        
        let isInternalInvalid = false;
        if (id === 'delay') {
          const dDuration = conf.duration !== undefined ? conf.duration : 1;
          const dUnit = conf.unit || 'minutes';
          isInternalInvalid = !(conf.delayType === 'event_based' ? (conf.eventDate && dDuration && dUnit) : (dDuration && dUnit));
        } else if (id === 'date_formatter') {
          const op = conf.operation || 'format_timezone';
          if (op === 'duration') isInternalInvalid = !conf.startDate || !conf.endDate;
          else isInternalInvalid = !conf.dateString;
        } else if (id === 'formatter_extract') {
          isInternalInvalid = !conf.inputString;
        } else if (id === 'formatter_dev') {
          isInternalInvalid = !conf.code;
        } else if (id === 'custom_variable') {
          if (!conf.varName) isInternalInvalid = true;
          else if (conf.varType === 'timestamp' && conf.useCurrentTime === false && !conf.varValue) isInternalInvalid = true;
          else if (conf.varType !== 'timestamp' && !conf.varValue) isInternalInvalid = true;
        } else if (id === 'http') {
          isInternalInvalid = !conf.url || !conf.method;
        } else if (id === 'calendar_status') {
          isInternalInvalid = !conf.bookingId;
        } else if (id === 'meta_capi') {
          isInternalInvalid = !conf.pixelId || !conf.eventName;
        }

        if (isInternalInvalid) {
          invalidSet.add(node.id);
          return;
        }
        
        const integrationId = node.integration?.id;
        if (Object.keys(conf).length === 0 && node.integration) {
          invalidSet.add(node.id);
          return;
        }

        const requiredFields = node.integration?.fields?.filter(f => f.required) || [];
        let missingField = false;
        for (const field of requiredFields) {
          if (conf[field.name] === undefined || conf[field.name] === '') {
            missingField = true;
            break;
          }
        }
        if (missingField) {
          invalidSet.add(node.id);
          return;
        }

        const reqConnIds = ['slack', 'twilio', 'stripe', 'gmail', 'email', 'smtp', 'openai', 'instagram', 'instagram_action', 'calendar'];
        if (reqConnIds.includes(id)) {
          if (id !== 'calendar' || conf.provider !== 'builtin') {
            if (!conf.connectionId) {
              invalidSet.add(node.id);
            }
          }
        }
        
        if (id === 'slack' && (!conf.channel || !conf.message)) invalidSet.add(node.id);
      }
    });
    return invalidSet;
  }, [nodes]);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      
      {/* Top Navigation / Header */}
      <header className="h-14 shrink-0 bg-[#0a0a0a] border-b border-border-subtle px-4 flex items-center justify-between z-50 shadow-sm relative min-w-0">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Link href="/dashboard/workflows" className="text-text-secondary hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-border-subtle shrink-0" />
          <div className="min-w-0 flex-1 pr-2 md:pr-4">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => {
                    setWorkflowName(e.target.value);
                    setIsSaved(false);
                  }}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  autoFocus
                  className="bg-background border border-accent-blue rounded-sm px-2 py-0.5 text-sm font-semibold text-white focus:outline-none w-full max-w-[200px] md:max-w-md"
                />
              </div>
            ) : (
              <h1 
                onClick={() => setIsEditingName(true)}
                className="text-sm font-semibold text-white flex items-center gap-2 cursor-pointer group min-w-0"
              >
                <span className="truncate" title={workflowName}>{workflowName}</span>
                <Edit2 className="w-3 h-3 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </h1>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              {!isSaved && <Loader2 className="w-3 h-3 text-accent-blue animate-spin shrink-0" />}
              <p className="text-[10px] text-text-secondary truncate">
                {!isSaved ? 'Saving...' : 'All changes saved'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-1 border-r border-border-subtle pr-3 mr-1">
            <button
              onClick={undo}
              disabled={pastNodes.length === 0}
              className="p-1.5 text-text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={futureNodes.length === 0}
              className="p-1.5 text-text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsTestModalOpen(true)}
            className="hidden md:flex text-text-secondary hover:text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors items-center gap-1.5 border border-transparent hover:border-border-subtle hover:bg-card"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Test Flow
          </button>
          
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="hidden md:flex text-text-secondary hover:text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors items-center gap-1.5 border border-transparent hover:border-border-subtle hover:bg-card"
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            History
          </button>

          <div className="hidden md:block h-4 w-px bg-border-subtle mx-1" />

          {/* Mobile Menu Toggle */}
          <div className="md:hidden relative">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {isMobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border-subtle rounded-md shadow-2xl z-50 overflow-hidden flex flex-col py-1">
                <button onClick={() => { undo(); setIsMobileMenuOpen(false); }} disabled={pastNodes.length === 0} className="px-4 py-2 text-left text-sm text-text-secondary hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-2">
                  <Undo2 className="w-4 h-4" /> Undo
                </button>
                <button onClick={() => { redo(); setIsMobileMenuOpen(false); }} disabled={futureNodes.length === 0} className="px-4 py-2 text-left text-sm text-text-secondary hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-2">
                  <Redo2 className="w-4 h-4" /> Redo
                </button>
                <button onClick={() => { setIsTestModalOpen(true); setIsMobileMenuOpen(false); }} className="px-4 py-2 text-left text-sm text-text-secondary hover:text-white hover:bg-white/5 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" /> Test Flow
                </button>
                <button onClick={() => { setIsHistoryOpen(true); setIsMobileMenuOpen(false); }} className="px-4 py-2 text-left text-sm text-text-secondary hover:text-white hover:bg-white/5 flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4" /> History
                </button>
              </div>
            )}
          </div>          <button 
            disabled={isPublishing || (!isPublished && (!triggerNode || triggerNode.issue || invalidNodes.has(triggerNode.id)))}
            title={(!isPublished && (!triggerNode || triggerNode.issue || invalidNodes.has(triggerNode.id))) ? "Cannot publish: Trigger has an issue" : ""}
            onClick={handlePublishToggle}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all
              ${isPublished 
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                : (!triggerNode || triggerNode.issue || invalidNodes.has(triggerNode.id))
                  ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
                  : 'bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.3)]'}`}
          >
            {isPublishing ? (
               <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPublished ? (
              <>Unpublish</>
            ) : (
              <><Globe className="w-3.5 h-3.5" /> Publish</>
            )}
          </button>
        </div>
      </header>

      {/* Main Builder Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Pane: Node Library */}
        <NodeLibrary 
          onAddNode={handleAddNode} 
          hasTrigger={hasTrigger} 
          isMobileOpen={mobileLibraryOpen}
          setIsMobileOpen={setMobileLibraryOpen}
          mobileInsertionTarget={mobileInsertionTarget}
          setMobileInsertionTarget={setMobileInsertionTarget}
          insertionPoint={insertionPoint}
        />

        {/* Center Pane: Interactive Canvas */}
        <main className="flex-1 overflow-y-auto bg-[url('/grid-pattern.svg')] bg-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
          
          <WorkflowCanvas 
            nodes={nodes} 
            invalidNodes={invalidNodes}
            waitingCounts={waitingCounts}
            activeSimulationNodeId={simulationPath && simulationPath.currentIndex < simulationPath.path.length ? simulationPath.path[simulationPath.currentIndex] : null}
            selectedNodeId={selectedNodeId} 
            onSelectNode={(id) => setTimeout(() => setSelectedNodeId(id), 0)} 
            onDeleteNode={handleDeleteNode} 
            onDeleteBranch={handleDeleteBranch}
            insertionPoint={insertionPoint}
            onSetInsertionPoint={(pt) => setInsertionPoint(pt)}
            onAddNode={handleAddNode}
            onUpdateNode={handleUpdateNode}
            onMoveNodeTo={handleMoveNodeTo}
            onCopyNode={handleCopyNode}
            onPasteNode={handlePasteNode}
            hasCopiedNode={!!copiedNodes && copiedNodes.length > 0}
            copiedNode={copiedNodes && copiedNodes.length > 0 ? copiedNodes[0] : null}
            movingNodeId={movingNodeId}
            onStartMoveNode={handleStartMoveNode}
            onReplaceNode={handleReplaceNode}
            onOpenMobileLibrary={(target) => {
              setMobileInsertionTarget(target);
              setMobileLibraryOpen(true);
            }}
            onViewWaitingLeads={(nodeId) => {
              const node = nodes.find(n => n.id === nodeId);
              if (node) setWaitingNode({ id: node.id, title: node.title });
            }}
          />
        </main>

        {/* Right Pane: Properties Panel (Animated slide in) */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 z-20 w-full md:w-auto"
            >
              <PropertiesPanel 
                selectedNode={selectedNode} 
                nodes={nodes}
                onClose={() => setSelectedNodeId(null)}
                onUpdateNode={handleUpdateNode}
                onSelectNode={setSelectedNodeId}
                onConfigureReminderStep={handleConfigureReminderStep}
                onSimulate={startVisualSimulation}
                workflowId={workflow.id}
                isPublished={isPublished}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Pane: Execution History (Animated slide in) */}
        <AnimatePresence>
          {isHistoryOpen && (
            <div className="absolute inset-y-0 right-0 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
              <ExecutionHistoryPanel onClose={() => setIsHistoryOpen(false)} workflowId={workflow.id} />
            </div>
          )}
        </AnimatePresence>

      </div>

      <TestFlowModal 
        isOpen={isTestModalOpen} 
        onClose={() => setIsTestModalOpen(false)} 
        triggerNode={triggerNode}
        workflowId={workflow.id}
        onRunTest={async (data) => {
          const res = await fetch('/api/workflows/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflowId: workflow.id,
              testPayload: data
            })
          });
          if (!res.ok) {
            const err = await res.json();
            toast.error(err.error || 'Failed to start test execution');
            throw new Error(err.error);
          }
          toast.success('Test execution started!');
        }}
      />
      <ConfirmModal
        isOpen={!!pendingRouterInsertion}
        onClose={() => setPendingRouterInsertion(null)}
        onConfirm={() => {
          if (!pendingRouterInsertion) return;
          if (pendingRouterInsertion.action === 'add') {
            executeAddNode(pendingRouterInsertion.newNode, null, pendingRouterInsertion.existingChildIndex);
          } else if (pendingRouterInsertion.action === 'paste') {
            executePasteNode(pendingRouterInsertion.parentId, pendingRouterInsertion.pathId, pendingRouterInsertion.existingChildIndex);
          }
          setPendingRouterInsertion(null);
        }}
        title="Insert Router?"
        message="Are you sure you want to insert a Router here? All subsequent steps below this point will be moved into PATH A."
        confirmText="Insert Router"
        cancelText="Cancel"
        isDestructive={false}
      />
      <WaitingLeadsModal
        isOpen={!!waitingNode}
        onClose={() => setWaitingNode(null)}
        workflowId={workflow.id}
        nodeId={waitingNode?.id}
        nodeTitle={waitingNode?.title}
      />
    </div>
  );
}
