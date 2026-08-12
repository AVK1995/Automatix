'use client';

import { Trash2 } from 'lucide-react';
import { useTransition, useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function DeleteButton({ id, type, confirmMessage }) {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const performDelete = () => {
    startTransition(async () => {
      try {
        if (type === 'connection') {
          const { deleteGlobalConnection } = await import('@/actions/connections');
          await deleteGlobalConnection(id);
        } else {
          const { adminDeleteUser, adminDeleteWorkflow } = await import('@/actions/workflows');
          if (type === 'user') {
            await adminDeleteUser(id);
          } else if (type === 'workflow') {
            await adminDeleteWorkflow(id);
          }
        }
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsConfirmOpen(true)}
        disabled={isPending}
        className="group inline-flex items-center justify-center p-1.5 rounded-md hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition-colors ml-2 disabled:opacity-50"
        title={`Delete ${type}`}
      >
        {isPending ? (
          <div className="w-3.5 h-3.5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={performDelete}
        title={`Delete ${type}`}
        message={confirmMessage || 'Are you sure you want to delete this? This action cannot be undone.'}
        confirmText="Delete"
        isDestructive={true}
      />
    </>
  );
}
