import { NODE_TYPES } from '@/constants';
import { TriggerIcon, ActionIcon, DelayIcon, TrashIcon } from './Icons';

export default function NodeCard({ node, onDelete, onUpdate }) {
  const isTrigger = node.type === NODE_TYPES.TRIGGER;
  const isDelay = node.type === NODE_TYPES.DELAY;
  
  const Icon = isTrigger ? TriggerIcon : (isDelay ? DelayIcon : ActionIcon);
  const accentClass = isTrigger ? 'text-accent-violet' : 'text-accent-blue';

  return (
    <div className="relative group w-full bg-card border border-border-subtle rounded-sm shadow-sm transition-all hover:border-text-secondary/50 p-4">
      
      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-background rounded-sm border border-border-subtle ${accentClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{node.title}</h3>
            <p className="text-xs text-text-secondary">{node.type}</p>
          </div>
        </div>
        
        {/* Actions */}
        <button 
          onClick={() => onDelete(node.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-text-secondary hover:text-red-400 rounded-sm hover:bg-background"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Node Config / Summary */}
      <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-text-secondary">
        {Object.entries(node.config).map(([key, value]) => (
          <div key={key} className="flex justify-between py-1">
            <span className="capitalize">{key}:</span>
            <span className="text-foreground font-mono truncate max-w-[180px]">{String(value)}</span>
          </div>
        ))}
        {Object.keys(node.config).length === 0 && (
          <span className="italic">No configuration set</span>
        )}
      </div>
    </div>
  );
}
