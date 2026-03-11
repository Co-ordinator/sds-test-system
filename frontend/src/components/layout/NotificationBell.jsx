import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ExternalLink, Check, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import { GOV } from '../../theme/government';

const getNotificationLink = (n) => {
  const t = n.actionType || '';
  const d = n.details || {};
  if (t === 'assessment_completed' && d.assessmentId) return `/results?assessmentId=${d.assessmentId}`;
  if (t === 'assessment_completed') return '/admin/results';
  if (t === 'user_registered' || t === 'user_created') return '/admin/users';
  if (t === 'student_imported') return '/counselor?tab=students';
  if (t === 'institution_created' || t === 'institution_updated') return '/admin/institutions';
  if (t === 'audit_event') return '/admin/audit';
  return null;
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/notifications?limit=20');
      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/api/v1/admin/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, details: { ...n.details, isRead: true } } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/v1/admin/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, details: { ...n.details, isRead: true } })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleClick = async (n) => {
    if (!n.details?.isRead) await handleMarkRead(n.id);
    const link = getNotificationLink(n);
    if (link) { setOpen(false); navigate(link); }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" style={{ color: GOV.textMuted }} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-40 w-96 bg-white border rounded-lg shadow-xl flex flex-col"
            style={{ borderColor: GOV.border, maxHeight: '70vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: GOV.border }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: GOV.text }}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold rounded-full px-2 py-0.5">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button type="button" onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-semibold" style={{ color: GOV.blue }}>
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-6 h-6 mx-auto mb-2" style={{ color: GOV.textHint }} />
                  <p className="text-xs" style={{ color: GOV.textHint }}>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: GOV.borderLight }}>
                  {notifications.slice(0, 15).map(n => {
                    const isRead = n.details?.isRead === true;
                    const hasLink = !!getNotificationLink(n);
                    return (
                      <div key={n.id}
                        className={`px-4 py-3 flex items-start gap-2.5 text-left ${hasLink ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        style={{ backgroundColor: isRead ? '#fff' : GOV.blueLightAlt }}
                        onClick={() => hasLink && handleClick(n)}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: isRead ? GOV.borderLight : '#2563eb' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-snug" style={{ color: GOV.text }}>
                            {n.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px]" style={{ color: GOV.textMuted }}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                            </span>
                            {n.actionType && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-gray-100" style={{ color: GOV.textMuted }}>
                                {n.actionType.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {hasLink && <ExternalLink className="w-3 h-3" style={{ color: GOV.blue }} />}
                          {!isRead && (
                            <button type="button"
                              onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                              className="p-1 rounded hover:bg-gray-100" title="Mark read">
                              <Check className="w-3 h-3" style={{ color: GOV.blue }} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
