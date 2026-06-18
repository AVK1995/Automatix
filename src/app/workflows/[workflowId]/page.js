'use client';

import { useState } from 'react';
import WorkflowCanvas from '@/components/WorkflowCanvas';
import { MOCK_WORKFLOW_DATA, DEFAULT_NODE_PAYLOAD } from '@/constants';
import { PlayIcon } from '@/components/Icons';

export default function WorkflowPage() {
  const [nodes, setNodes] = useState(MOCK_WORKFLOW_DATA);

  // Functional, immutable state updates
  const handleAddNode = (type, index) => {
    const newNode = {
      ...DEFAULT_NODE_PAYLOAD,
      id: `node-${Date.now()}`,
      type: type,
      title: `New ${type.charAt(0) + type.slice(1).toLowerCase()}`,
    };

    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      newNodes.splice(index, 0, newNode);
      return newNodes;
    });
  };

  const handleDeleteNode = (id) => {
    setNodes(prevNodes => prevNodes.filter(node => node.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation / Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border-subtle p-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Mock Workflow</h1>
          <p className="text-xs text-text-secondary">Unsaved changes</p>
        </div>
        
        <button className="bg-accent-violet hover:opacity-90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-opacity inline-flex items-center gap-2">
          <PlayIcon className="w-4 h-4" /> Publish
        </button>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <WorkflowCanvas 
          nodes={nodes} 
          onAddNode={handleAddNode} 
          onDeleteNode={handleDeleteNode} 
        />
      </main>
    </div>
  );
}
