import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { GOV, TYPO } from '../theme/government';
import AppShell from '../components/layout/AppShell';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    try {
      const res = await api.get('/api/v1/admin/notifications?limit=100');
      const notifs = res.data?.data?.notifications || [];
      setNotifications(notifs);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch { setNotifications([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/api/v1/admin/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, details: { ...n.details, isRead: true } } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

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

  const handleNotificationClick = async (n) => {
    if (!n.details?.isRead) await handleMarkRead(n.id);
    const link = getNotificationLink(n);
    if (link) navigate(link);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/v1/admin/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, details: { ...n.details, isRead: true } })));
      setUnreadCount(0);
      showToast('All notifications marked as read');
    } catch { showToast('Failed', 'error'); }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const actionTypes = useMemo(() => {
    const types = new Set(notifications.map(n => n.actionType).filter(Boolean));
    return Array.from(types).sort();
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    let result = notifications;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => (n.description || '').toLowerCase().includes(q));
    }
    if (typeFilter) {
      result = result.filter(n => n.actionType === typeFilter);
    }
    return result;
  }, [notifications, searchQuery, typeFilter]);

  return (
    <AppShell>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: GOV.blue }} />
            <h1 className={TYPO.pageTitle} style={{ color: GOV.text }}>Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">{unreadCount} new</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={handleMarkAllRead}
              className="text-xs font-semibold px-3 py-1.5 rounded-md border transition-all duration-150 hover:scale-[1.05] active:scale-95 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{ borderColor: GOV.border, color: GOV.blue }}>
              Mark all read
            </button>
          )}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-white flex-1 min-w-[200px]" style={{ borderColor: GOV.border }}>
            <Search className="w-4 h-4" style={{ color: GOV.textMuted }} />
            <input
              className="text-sm outline-none flex-1" style={{ color: GOV.text }}
              placeholder="Search notifications…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {actionTypes.length > 0 && (
            <select
              className="border rounded-md px-3 py-1.5 text-xs bg-white" style={{ borderColor: GOV.border, color: GOV.text }}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {actionTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
          {loading ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: GOV.textHint }}>Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Bell className="w-8 h-8 mx-auto mb-3" style={{ color: GOV.textHint }} />
              <p className="text-sm" style={{ color: GOV.textHint }}>No notifications yet. They will appear when students complete assessments.</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Bell className="w-8 h-8 mx-auto mb-3" style={{ color: GOV.textHint }} />
              <p className="text-sm" style={{ color: GOV.textHint }}>{searchQuery || typeFilter ? 'No notifications match your filters.' : 'No notifications yet.'}</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: GOV.borderLight }}>
              {filteredNotifications.map(n => {
                const isRead = n.details?.isRead === true;
                const hasLink = !!getNotificationLink(n);
                return (
                  <div key={n.id}
                    className={`px-4 py-3 flex items-start gap-3 transition-colors duration-150 ${hasLink ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    style={{ backgroundColor: isRead ? '#fff' : GOV.blueLightAlt }}
                    onClick={() => hasLink && handleNotificationClick(n)}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: isRead ? GOV.borderLight : '#2563eb' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: GOV.text }}>{n.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs" style={{ color: GOV.textMuted }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                        </p>
                        {n.actionType && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100" style={{ color: GOV.textMuted }}>
                            {n.actionType.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasLink && (
                        <ExternalLink className="w-3.5 h-3.5" style={{ color: GOV.blue }} />
                      )}
                      {!isRead && (
                        <button type="button" onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                          className="text-xs font-semibold transition-colors duration-150 hover:underline"
                          style={{ color: GOV.blue }}>
                          Mark read
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
    </AppShell>
  );
};

export default Notifications;
