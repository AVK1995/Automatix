'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Link from 'next/link';

export default function ExecutionDrilldownModal({ isOpen, onClose, title, data, isAdmin = false }) {
  if (!isOpen) return null;

  const basePath = isAdmin ? '/admin/workflows' : '/dashboard/workflows';

  const columns = [
    { header: 'Log ID', accessor: (row) => row.id.substring(0, 8) + '...' },
    { 
      header: 'Workflow Name', 
      accessor: (row) => row.workflow ? (
        <Link href={`${basePath}/${row.workflow.id}`} className="font-medium text-foreground hover:text-accent-blue transition-colors block">
          {row.workflow.name}
        </Link>
      ) : 'Unknown'
    },
    { header: 'Status', accessor: (row) => row.status, isStatus: true },
    { header: 'Started At', accessor: (row) => new Date(row.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#0a0a0a] border border-border-subtle rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-border-subtle">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-text-secondary mt-1">Detailed view of execution logs for the selected metric.</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-background/80 text-text-secondary hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <DataTable data={data} columns={columns} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
