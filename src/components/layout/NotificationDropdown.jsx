'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  HardDrive, 
  MessageSquare, 
  UserPlus, 
  Workflow, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { getNotifications, resolveNotification, ignoreNotification } from '@/actions/notifications';
import { useRouter } from 'next/navigation';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      const rawData = data || [];
      const deduped = [];
      const seen = new Set();
      for (const n of rawData) {
        const key = n.id || ((n.metadata?.workflowId && n.metadata?.nodeId) ? `${n.metadata.workflowId}-${n.metadata.nodeId}` : n.message);
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(n);
        }
      }
      setNotifications(deduped);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
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

  const handleAction = async (notification) => {
    try {
      await resolveNotification(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      const targetUrl = notification.metadata?.targetUrl;
      const { workflowId, nodeId, ticketId } = notification.metadata || {};

      if (notification.type === 'SUPPORT_REPLY' || ticketId) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('open-chatbot-support', { 
            detail: { 
              ticketId, 
              subject: notification.metadata?.ticketSubject,
              content: notification.metadata?.content 
            } 
          }));
        }
        setIsOpen(false);
        return;
      }

      if (targetUrl) {
        router.push(targetUrl);
      } else if (workflowId && nodeId) {
        router.push(`/workflows/${workflowId}?issueNodeId=${nodeId}`);
      }
      
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (e, id) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await ignoreNotification(id);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'QUOTA_REQUEST':
        return (
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0">
            <HardDrive size={16} />
          </div>
        );
      case 'SUPPORT_REPLY':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <MessageSquare size={16} />
          </div>
        );
      case 'SUPPORT_TICKET':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <MessageSquare size={16} />
          </div>
        );
      case 'GRACE_PERIOD':
        return (
          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} />
          </div>
        );
      case 'NEW_SIGNUP':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <UserPlus size={16} />
          </div>
        );
      case 'WORKFLOW_ISSUE':
        return (
          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
            <Workflow size={16} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
            <Bell size={16} />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        aria-label="Open Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent-blue rounded-full ring-2 ring-[#0a0a0a]" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[440px] bg-[#111] border border-border-subtle rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[calc(100vh-80px)] sm:max-h-[32rem]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Notifications & Alerts
              {unreadCount > 0 && (
                <span className="bg-accent-blue/15 text-accent-blue text-[11px] font-bold px-2 py-0.5 rounded-full border border-accent-blue/20">
                  {unreadCount} pending
                </span>
              )}
            </h3>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1 rounded-md text-text-tertiary hover:text-white hover:bg-white/5 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
          
          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-text-secondary">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-text-tertiary">
                  <Bell size={22} className="opacity-40" />
                </div>
                <p className="text-sm font-medium text-white">All Caught Up</p>
                <p className="text-xs text-text-tertiary mt-1">No pending notifications or urgent platform alerts right now.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-white/[0.03] transition-colors group ${
                    notification.status === 'IGNORED' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white mb-1 leading-snug">
                        {notification.message}
                      </p>

                      {notification.metadata?.note && (
                        <p className="text-xs text-text-tertiary italic mb-2 bg-black/40 p-2 rounded border border-white/5">
                          "{notification.metadata.note}"
                        </p>
                      )}

                      {notification.metadata?.isTriggerIssue && (
                        <p className="text-xs text-red-400 mb-2">Workflow deactivated due to trigger issue.</p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button 
                          onClick={() => handleAction(notification)}
                          className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                            notification.type === 'SUPPORT_REPLY'
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                              : 'bg-accent-blue hover:bg-accent-blue/90 text-white'
                          }`}
                        >
                          {notification.type === 'SUPPORT_REPLY' ? (
                            <>
                              <MessageSquare size={12} />
                              Respond in Chat
                            </>
                          ) : (
                            <>
                              View & Action <ArrowRight size={12} />
                            </>
                          )}
                        </button>
                        <button 
                          onClick={(e) => handleDismiss(e, notification.id)}
                          className="text-xs border border-white/10 text-text-secondary px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 font-medium flex items-center gap-1.5 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
