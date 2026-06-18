import NodeCard from './NodeCard';
import { PlusIcon } from './Icons';
import { NODE_TYPES } from '@/constants';

export default function WorkflowCanvas({ nodes, onDeleteNode, onAddNode }) {
  return (
    <div className="w-full max-w-xl mx-auto py-12 flex flex-col items-center">
      {nodes.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-border-subtle rounded-sm w-full">
          <p className="text-text-secondary mb-4">No nodes in this workflow yet.</p>
          <button 
            onClick={() => onAddNode(NODE_TYPES.TRIGGER, 0)}
            className="bg-accent-violet hover:opacity-90 text-white px-4 py-2 rounded-sm text-sm font-medium transition-opacity inline-flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> Add Trigger
          </button>
        </div>
      ) : (
        nodes.map((node, index) => (
          <div key={node.id} className="w-full flex flex-col items-center">
            <NodeCard 
              node={node} 
              onDelete={onDeleteNode} 
            />
            
            {/* Draw connection line unless it's the last node */}
            {index < nodes.length - 1 && (
              <div className="w-px h-10 bg-border-subtle relative group flex justify-center items-center">
                 {/* Invisible wider area for hover interaction */}
                 <div className="absolute inset-y-0 w-8 cursor-pointer flex justify-center items-center" onClick={() => onAddNode(NODE_TYPES.ACTION, index + 1)}>
                   <div className="w-6 h-6 rounded-full bg-background border border-border-subtle flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-accent-blue hover:text-accent-blue z-10">
                     <PlusIcon className="w-3 h-3" />
                   </div>
                 </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Append Action Button at the bottom if nodes exist */}
      {nodes.length > 0 && (
        <div className="mt-8">
          <button 
            onClick={() => onAddNode(NODE_TYPES.ACTION, nodes.length)}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-border-subtle rounded-sm text-sm text-text-secondary hover:text-foreground hover:border-text-secondary transition-all"
          >
            <PlusIcon className="w-4 h-4" /> Add Next Step
          </button>
        </div>
      )}
    </div>
  );
}
