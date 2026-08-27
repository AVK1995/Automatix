'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ExternalLink,
  Sparkles,
  Megaphone,
  CreditCard,
  ShieldAlert,
  Wrench,
  CheckCheck
} from 'lucide-react';
import { getNotifications, resolveNotification, ignoreNotification, markAllNotificationsAsRead } from '@/actions/notifications';
import { useRouter } from 'next/navigation';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeModalNotification, setActiveModalNotification] = useState(null);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    const interval = setInterval(fetchNotifications, 8000); // Fast 8s poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeModalNotification) setActiveModalNotification(null);
        else if (isOpen) setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModalNotification, isOpen]);

  const cleanHtmlPreview = (text) => {
    if (!text) return '';
    return text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleAction = async (notification) => {
    try {
      const hasHtml = !!notification.metadata?.htmlContent || 
                      (notification.message && (notification.message.includes('<html') || notification.message.includes('<!DOCTYPE')));
      
      const { workflowId, nodeId, ticketId, targetUrl } = notification.metadata || {};

      // 1. Support Reply -> Trigger live chatbot
      if (notification.type === 'SUPPORT_REPLY' || ticketId) {
        await resolveNotification(notification.id);
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
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

      // 2. Rich Announcement / Patch Notes -> Open detailed view modal
      if (hasHtml || notification.type === 'ANNOUNCEMENT' || notification.type === 'ADMIN_BROADCAST') {
        setActiveModalNotification(notification);
        setIsOpen(false);
        return;
      }

      // 3. Direct URL / Workflow action
      await resolveNotification(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));

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

  const handleMarkAllRead = async () => {
    try {
      setNotifications([]);
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseModalAndResolve = async () => {
    if (activeModalNotification) {
      await resolveNotification(activeModalNotification.id);
      setNotifications(prev => prev.filter(n => n.id !== activeModalNotification.id));
      setActiveModalNotification(null);
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
      case 'ANNOUNCEMENT':
      case 'ADMIN_BROADCAST':
        return (
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Megaphone size={16} />
          </div>
        );
      case 'BILLING':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CreditCard size={16} />
          </div>
        );
      case 'LEGAL':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert size={16} />
          </div>
        );
      case 'SYSTEM':
        return (
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0">
            <Wrench size={16} />
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
    <>
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
          <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[440px] bg-[#111] border border-border-subtle rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[calc(100vh-80px)] sm:max-h-[32rem]">
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/5 bg-white/[0.02] gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-white truncate whitespace-nowrap">
                  Notifications & Alerts
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-accent-blue/15 text-accent-blue text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border border-accent-blue/20 shrink-0 whitespace-nowrap">
                    {unreadCount} pending
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="text-[10px] sm:text-[11px] font-medium text-text-secondary hover:text-accent-blue flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-white/5 shrink-0 whitespace-nowrap"
                  >
                    <CheckCheck size={13} className="shrink-0" />
                    <span className="hidden xs:inline sm:inline">Mark all read</span>
                    <span className="xs:hidden sm:hidden">Read all</span>
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1 rounded-md text-text-tertiary hover:text-white hover:bg-white/5 transition-colors shrink-0"
                  aria-label="Close notifications"
                >
                  <X size={15} className="shrink-0" />
                </button>
              </div>
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
                notifications.map((notification) => {
                  const cleanedText = cleanHtmlPreview(notification.message);
                  const isAnnouncement = !!notification.metadata?.htmlContent || 
                                         notification.type === 'ANNOUNCEMENT' || 
                                         notification.type === 'ADMIN_BROADCAST';

                  return (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-white/[0.03] transition-colors group ${
                        notification.status === 'IGNORED' ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          {/* Subject / Title Header */}
                          {notification.metadata?.subject ? (
                            <div>
                              <h4 className="text-xs sm:text-sm font-semibold text-white mb-0.5 truncate">
                                {notification.metadata.subject}
                              </h4>
                              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                                {cleanHtmlPreview(notification.metadata?.htmlContent) || cleanedText}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm font-medium text-white mb-1 leading-snug line-clamp-3">
                              {cleanedText}
                            </p>
                          )}

                          {notification.metadata?.note && (
                            <p className="text-xs text-text-tertiary italic my-1.5 bg-black/40 p-2 rounded border border-white/5">
                              "{notification.metadata.note}"
                            </p>
                          )}

                          {notification.metadata?.isTriggerIssue && (
                            <p className="text-xs text-red-400 mb-2">Workflow deactivated due to trigger issue.</p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-1.5">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-3 flex-wrap sm:flex-nowrap">
                            <button 
                              onClick={() => handleAction(notification)}
                              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap ${
                                notification.type === 'SUPPORT_REPLY'
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                                  : isAnnouncement
                                  ? 'bg-accent-blue hover:bg-accent-blue/90 text-white shadow-sm shadow-accent-blue/20'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              {notification.type === 'SUPPORT_REPLY' ? (
                                <>
                                  <MessageSquare size={12} className="shrink-0" />
                                  <span>Respond in Chat</span>
                                </>
                              ) : isAnnouncement ? (
                                <>
                                  <Sparkles size={12} className="shrink-0" />
                                  <span>Read Full Notice &rarr;</span>
                                </>
                              ) : (
                                <>
                                  <span>View & Action</span>
                                  <ArrowRight size={12} className="shrink-0" />
                                </>
                              )}
                            </button>
                            <button 
                              onClick={(e) => handleDismiss(e, notification.id)}
                              className="text-xs border border-white/10 text-text-secondary px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 font-medium flex items-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rich Patch Notes & Announcement Detail Modal */}
      {activeModalNotification && mounted && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModalNotification(null);
          }}
        >
          <div 
            className="bg-[#0d0d0d] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-accent-blue/10 text-accent-blue shrink-0">
                  <Megaphone size={20} className="shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-blue/10 text-accent-blue border border-accent-blue/20 shrink-0">
                      {activeModalNotification.metadata?.category || activeModalNotification.type || 'Announcement'}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      {new Date(activeModalNotification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight mt-1 truncate">
                    {activeModalNotification.metadata?.subject || (activeModalNotification.message?.includes(':') ? activeModalNotification.message.split(':')[0] : activeModalNotification.message) || 'System Notice'}
                  </h3>
                </div>
              </div>

              <button 
                onClick={() => setActiveModalNotification(null)}
                className="text-text-tertiary hover:text-white p-1.5 rounded-lg hover:bg-white/5 shrink-0 transition-colors"
                title="Close"
              >
                <X size={18} className="shrink-0" />
              </button>
            </div>

            {/* Modal Body: Rich Rendered HTML (Styled like Patch Notes) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm text-text-secondary leading-relaxed custom-scrollbar">
              {activeModalNotification.metadata?.htmlContent ? (
                <div 
                  className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-3 
                    [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-4 [&_h1]:mb-2 
                    [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-4 [&_h2]:mb-2 
                    [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-white [&_h3]:mt-3 [&_h3]:mb-1.5 
                    [&_p]:text-text-secondary [&_p]:leading-relaxed [&_p]:mb-2.5
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-text-secondary 
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:text-text-secondary 
                    [&_li]:text-text-secondary 
                    [&_strong]:text-white [&_strong]:font-semibold 
                    [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:bg-white/10 [&_code]:rounded [&_code]:text-accent-blue [&_code]:font-mono [&_code]:text-xs
                    [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-white/10 [&_table]:rounded-lg
                    [&_td]:p-3 [&_td]:border [&_td]:border-white/5
                    [&_a]:text-accent-blue [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: activeModalNotification.metadata.htmlContent }}
                />
              ) : (
                <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                  {activeModalNotification.metadata?.content || activeModalNotification.metadata?.note || (
                    activeModalNotification.message?.includes(':') 
                      ? activeModalNotification.message.substring(activeModalNotification.message.indexOf(':') + 1).trim()
                      : cleanHtmlPreview(activeModalNotification.message)
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-text-tertiary flex items-center gap-1.5 shrink-0">
                <Clock size={13} className="shrink-0" /> Published {new Date(activeModalNotification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                {activeModalNotification.metadata?.targetUrl && (
                  <button
                    onClick={() => {
                      const url = activeModalNotification.metadata.targetUrl;
                      handleCloseModalAndResolve();
                      router.push(url);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    Open Page <ExternalLink size={13} className="shrink-0" />
                  </button>
                )}
                <button
                  onClick={handleCloseModalAndResolve}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-accent-blue hover:bg-accent-blue/90 text-white transition-colors shadow-lg shadow-accent-blue/20 flex items-center gap-1.5 shrink-0"
                >
                  <Check size={13} className="shrink-0" />
                  Mark as Read & Close
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}

