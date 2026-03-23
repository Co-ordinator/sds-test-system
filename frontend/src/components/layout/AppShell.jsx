import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User, LogOut, ChevronDown, ChevronRight, Home,
  BarChart2, Settings, Menu, X, Bell, Award, FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { GOV, TYPO } from '../../theme/government';
import { useNotificationCount } from '../../hooks/useNotificationCount';

// All possible admin nav links with required permissions
const ADMIN_NAV_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: Home, permission: null },
  { to: '/admin/results', label: 'Results', Icon: Award, permission: 'results.view' },
  { to: '/admin/analytics', label: 'Analytics', Icon: BarChart2, permission: 'analytics.view' },
  { to: '/admin/reports', label: 'Report', Icon: FileText, permission: 'analytics.view' },
  { to: '/admin/notifications', label: 'Notifications', Icon: Bell, badge: true, permission: 'notifications.view' },
  { to: '/admin/settings', label: 'Settings', Icon: Settings, permission: null },
];

const TEST_TAKER_NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: Home },
  { to: '/profile', label: 'Profile', Icon: User },
];

const ROLE_LABELS = {
  'System Administrator': 'System Administrator',
  'Test Administrator': 'Test Administrator',
  'Test Taker': 'Test Taker',
};

const ROLE_COLORS = {
  'System Administrator': { bg: '#ede9fe', text: '#6d28d9' },
  'Test Administrator': { bg: '#dbeafe', text: '#1d4ed8' },
  'Test Taker': { bg: '#f0fdf4', text: '#15803d' },
};

const BREADCRUMB_MAP = {
  '/admin/dashboard': [{ label: 'Admin' }],
  '/admin/users': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Users' }],
  '/admin/users/:userId': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Users', to: '/admin/settings?tab=users' }, { label: 'User Details' }],
  '/admin/institutions': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Institutions' }],
  '/admin/occupations': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Occupations' }],
  '/admin/results': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Results' }],
  '/admin/reports': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Report' }],
  '/admin/audit': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Audit Log' }],
  '/admin/analytics': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Analytics' }],
  '/admin/notifications': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Notifications' }],
  '/admin/settings': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings' }],
  '/admin/courses': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Courses' }],
  '/admin/education-levels': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Education Levels' }],
  '/admin/certificates': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Certificates' }],
  '/test-administrator': [{ label: 'Test Administrator' }],
  '/counselor': [{ label: 'Test Administrator' }],
  '/dashboard': [{ label: 'Dashboard' }],
  '/profile': [{ label: 'Profile' }],
  '/results': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Results' }],
};

export default function AppShell({ children, breadcrumbs: customBreadcrumbs }) {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const role = user?.role || 'Test Taker';
  const isAdminLike = role === 'System Administrator' || role === 'Test Administrator';
  const navLinks = useMemo(() => {
    if (isAdminLike) {
      return ADMIN_NAV_LINKS.filter(link => !link.permission || hasPermission(link.permission));
    }
    return TEST_TAKER_NAV;
  }, [isAdminLike, hasPermission]);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const notificationCount = useNotificationCount(isAdminLike);
  const roleLabel = ROLE_LABELS[role] || 'Test Taker';
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS['Test Taker'];

  const breadcrumbs = customBreadcrumbs || BREADCRUMB_MAP[location.pathname] || [];

  // Close mobile nav on route change
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  const isActive = useCallback((to) => {
    if (to === '/counselor' || to === '/counselor/dashboard') {
      return location.pathname.startsWith('/counselor');
    }
    if (to === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin';
    }
    if (to === '/admin/settings') {
      return location.pathname.startsWith('/admin/settings');
    }
    return location.pathname === to;
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div
        className="flex-shrink-0 py-0.5 border-b"
        style={{ backgroundColor: GOV.blueLightAlt, borderColor: GOV.border }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[11px] font-medium tracking-normal" style={{ color: GOV.textHint }}>
            Ministry of Labour &amp; Social Security · Kingdom of Eswatini
          </p>
        </div>
      </div>

      {/* ── Primary nav bar ── */}
      <header
        className="sticky top-0 z-20 border-b h-14"
        style={{ borderColor: GOV.border, backgroundColor: '#ffffff' }}
      >
        <div className="relative h-full px-4 lg:px-6">
          <div className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10">
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
              onClick={() => setMobileNavOpen(o => !o)}
            >
              {mobileNavOpen ? <X className="w-5 h-5" style={{ color: GOV.text }} /> : <Menu className="w-5 h-5" style={{ color: GOV.text }} />}
            </button>

            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <img src="/siyinqaba.png" alt="Siyinqaba" className="h-10 w-auto object-contain" />
            </Link>
          </div>

          <div className="max-w-7xl mx-auto px-6 h-full flex items-center">
            <nav className="hidden lg:flex items-center gap-0.5 min-w-0 -ml-2 xl:-ml-3">
              {navLinks.map(({ to, label, Icon, badge }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={`${to}-${label}`}
                    to={to}
                    className="relative flex items-center gap-2 px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap"
                    style={
                      active
                        ? { color: GOV.blue, fontWeight: 700 }
                        : { color: GOV.textMuted, fontWeight: 500 }
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {badge && notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setUserMenuOpen(o => !o)}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: GOV.blueLightAlt }}
                >
                  <User className="w-4 h-4" style={{ color: GOV.blue }} />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-none" style={{ color: GOV.text }}>{displayName}</p>
                  <p className="text-[10px] mt-0.5 leading-none" style={{ color: GOV.textMuted }}>{roleLabel}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-20 w-52 bg-white border rounded-md shadow-lg py-1"
                    style={{ borderColor: GOV.border }}
                  >
                    <div className="px-3 py-2 border-b" style={{ borderColor: GOV.borderLight }}>
                      <p className="text-xs font-semibold" style={{ color: GOV.text }}>{displayName}</p>
                      <span
                        className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
                      >
                        {roleLabel}
                      </span>
                      {user?.institution?.name && (
                        <p className="text-[10px] mt-1" style={{ color: GOV.textMuted }}>{user.institution.name}</p>
                      )}
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50"
                      style={{ color: GOV.text }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} /> My Profile
                    </Link>

                    {isAdminLike && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50"
                        style={{ color: GOV.text }}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} /> Admin Dashboard
                      </Link>
                    )}

                    <div className="border-t my-1" style={{ borderColor: GOV.borderLight }} />
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-left"
                      style={{ color: '#dc2626' }}
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile nav drawer ── */}
      {mobileNavOpen && (
        <div className="lg:hidden border-b bg-white" style={{ borderColor: GOV.border }}>
          <div className="max-w-7xl mx-auto px-6 py-2 space-y-1">
            {navLinks.map(({ to, label, Icon, badge }) => {
              const active = isActive(to);
              return (
                <Link
                  key={`m-${to}-${label}`}
                  to={to}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold"
                  style={active ? { backgroundColor: GOV.blueLightAlt, color: GOV.blue } : { color: GOV.textMuted }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge && notificationCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ml-auto">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Breadcrumbs ── */}
      {breadcrumbs.length > 0 && (
        <div className="border-b" style={{ backgroundColor: '#fafafa', borderColor: GOV.borderLight }}>
          <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center gap-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3" style={{ color: GOV.textHint }} />}
                {crumb.to ? (
                  <Link to={crumb.to} className="text-[11px] font-medium hover:underline" style={{ color: GOV.blue }}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[11px] font-semibold" style={{ color: GOV.textMuted }}>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 overflow-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
