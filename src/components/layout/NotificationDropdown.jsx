'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { getNotifications, resolveNotification, ignoreNotification } from '@/actions/notifications';
import { useRouter } from 'next/navigation';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        const rawData = data || [];
        const deduped = [];
        const seen = new Set();
        for (const n of rawData) {
          const key = (n.metadata?.workflowId && n.metadata?.nodeId) ? `${n.metadata.workflowId}-${n.metadata.nodeId}` : n.message;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(n);
          } else {
            const existingIdx = deduped.findIndex(d => ((d.metadata?.workflowId && d.metadata?.nodeId) ? `${d.metadata.workflowId}-${d.metadata.nodeId}` : d.message) === key);
            if (existingIdx >= 0 && deduped[existingIdx].status === 'IGNORED' && n.status === 'UNREAD') {
               deduped[existingIdx] = n;
            }
          }
        }
        setNotifications(deduped);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResolve = async (notification) => {
    try {
      await resolveNotification(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      const { workflowId, nodeId } = notification.metadata || {};
      if (workflowId && nodeId) {
        router.push(`/workflows/${workflowId}?issueNodeId=${nodeId}`);
      }
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIgnore = async (e, id) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'IGNORED' } : n));
      await ignoreNotification(id);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0a0a0a]" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px] bg-card border border-border-subtle rounded-md shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[calc(100vh-80px)] sm:max-h-[28rem]">
          <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-background/50">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-accent-blue/20 text-accent-blue text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-white">
              <X size={16} />
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center text-text-secondary">
                <Bell size={32} className="mb-3 opacity-20" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`p-4 hover:bg-white/5 transition-colors group ${notification.status === 'IGNORED' ? 'opacity-60' : ''}`}>
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {notification.type === 'WORKFLOW_ISSUE' ? (
                          <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                            <AlertTriangle size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center">
                            <Bell size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white mb-1 leading-snug">{notification.message}</p>
                        {notification.metadata?.isTriggerIssue && (
                          <p className="text-xs text-red-400 mb-2">Workflow deactivated due to trigger issue.</p>
                        )}
                        <p className="text-[10px] text-text-secondary mb-3">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResolve(notification)}
                            className="text-xs bg-accent-blue text-white px-3 py-1.5 rounded-sm hover:opacity-90 font-medium flex items-center gap-1.5"
                          >
                            Resolve <ArrowRight size={12} />
                          </button>
                          {notification.status === 'UNREAD' && (
                            <button 
                              onClick={(e) => handleIgnore(e, notification.id)}
                              className="text-xs border border-border-subtle text-text-secondary px-3 py-1.5 rounded-sm hover:text-white hover:bg-white/5 font-medium flex items-center gap-1.5"
                            >
                              Ignore <Check size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
