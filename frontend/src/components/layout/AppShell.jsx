import React, { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  User, LogOut, ChevronDown, ChevronRight, Home,
  Settings, Menu, X, Bell, Award, FileText,
  BookOpen, ClipboardList, Accessibility,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { GOV } from '../../theme/government';
import { useNotificationCount } from '../../hooks/useNotificationCount';

const ADMIN_NAV_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: Home, permission: null },
  { to: '/admin/results', label: 'Results', Icon: Award, permission: 'results.view' },
  { to: '/admin/reports', label: 'Report', Icon: FileText, permission: 'analytics.view' },
  { to: '/admin/audit', label: 'Audit Log', Icon: ClipboardList, permission: 'audit.view' },
  { to: '/admin/notifications', label: 'Notifications', Icon: Bell, badge: true, permission: 'notifications.view' },
  { to: '/admin/settings', label: 'Settings', Icon: Settings, permission: null },
];

const TEST_TAKER_NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: Home },
  { to: '/profile', label: 'Profile', Icon: User },
  { to: '/glossary', label: 'Glossary', Icon: BookOpen },
  { to: '/accessibility', label: 'Accessibility', Icon: Accessibility },
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
  '/admin/audit': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Audit Log' }],
  '/admin/notifications': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Notifications' }],
  '/admin/settings': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings' }],
  '/admin/courses': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Courses' }],
  '/admin/education-levels': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Education Levels' }],
  '/admin/certificates': [{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Settings', to: '/admin/settings' }, { label: 'Certificates' }],
  '/test-administrator': [{ label: 'Test Administrator' }],
  '/counselor': [{ label: 'Test Administrator' }],
  '/dashboard': [{ label: 'Dashboard' }],
  '/profile': [{ label: 'Profile' }],
  '/glossary': [{ label: 'Glossary' }],
  '/accessibility': [{ label: 'Accessibility' }],
  '/results': [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Results' }],
};

export default function AppShell({ children, breadcrumbs: customBreadcrumbs, hideBreadcrumbs = false }) {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const { getAriaLabel } = useAccessibility();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const userMenuId = useId();
  const mobileNavId = useId();

  const role = user?.role || 'Test Taker';
  const isTestTaker = role === 'Test Taker';
  const isAdminLike = role === 'System Administrator' || role === 'Test Administrator';
  const dashboardPath = role === 'System Administrator'
    ? '/admin/dashboard'
    : role === 'Test Administrator'
      ? '/test-administrator'
      : '/dashboard';

  const navLinks = useMemo(() => {
    if (isAdminLike) {
      if (role === 'Test Administrator') {
        return [{ to: '/test-administrator', label: 'Dashboard', Icon: Home, permission: null }];
      }
      const adminDashboardPath = role === 'Test Administrator' ? '/test-administrator' : '/admin/dashboard';
      return ADMIN_NAV_LINKS
        .map((link) => (link.label === 'Dashboard' ? { ...link, to: adminDashboardPath } : link))
        .filter((link) => !link.permission || hasPermission(link.permission));
    }
    return TEST_TAKER_NAV;
  }, [isAdminLike, hasPermission, role]);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const notificationCount = useNotificationCount(isAdminLike);
  const roleLabel = ROLE_LABELS[role] || 'Test Taker';
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS['Test Taker'];
  const breadcrumbs = customBreadcrumbs || BREADCRUMB_MAP[location.pathname] || [];

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const isActive = useCallback((to) => {
    if (to === '/test-administrator') {
      return location.pathname.startsWith('/test-administrator') || location.pathname.startsWith('/counselor');
    }
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
    <div className={`min-h-screen flex flex-col ${isTestTaker ? 'bg-[#fbfdff]' : 'bg-white'}`}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div
        className={isTestTaker ? 'hidden' : 'flex-shrink-0 py-0.5 border-b'}
        style={{ backgroundColor: GOV.ministryBarBg, borderColor: GOV.border }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[11px] font-medium tracking-normal" style={{ color: GOV.ministryBarText }}>
            Ministry of Labour &amp; Social Security | Kingdom of Eswatini
          </p>
        </div>
      </div>

      <header
        className="sticky top-0 z-20 border-b h-14"
        style={{ borderColor: GOV.border, backgroundColor: '#ffffff' }}
        role="banner"
      >
        <div className={`relative h-full ${isTestTaker ? 'px-3 sm:px-6' : 'px-4 lg:px-6'}`}>
          <div className={`absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 sm:gap-3 ${isTestTaker ? 'left-3 sm:left-6' : 'left-3 sm:left-4 lg:left-6'}`}>
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-expanded={mobileNavOpen}
              aria-controls={mobileNavId}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileNavOpen ? <X className="w-5 h-5" style={{ color: GOV.text }} /> : <Menu className="w-5 h-5" style={{ color: GOV.text }} />}
            </button>

            <Link
              to={dashboardPath}
              className="flex w-[150px] min-w-0 items-center sm:w-[180px] lg:w-[205px]"
              aria-label="Go to dashboard"
            >
              <img
                src="/letterhead.png"
                alt="Government of Eswatini"
                className="h-10 w-full object-contain object-left sm:h-11"
              />
            </Link>
          </div>

          <div className={isTestTaker ? 'mx-auto hidden h-full max-w-7xl items-center lg:flex lg:pl-[190px] lg:pr-[190px]' : 'max-w-7xl mx-auto px-6 lg:pl-[210px] lg:pr-[180px] h-full flex items-center'}>
            <nav
              className={isTestTaker ? 'hidden h-full w-full min-w-0 items-center gap-5 overflow-x-auto lg:flex custom-scrollbar' : 'hidden lg:flex w-full items-center gap-0.5 min-w-0 overflow-x-auto custom-scrollbar'}
              role="navigation"
              aria-label="Primary navigation"
            >
              {navLinks.map(({ to, label, Icon, badge }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={`${to}-${label}`}
                    to={to}
                    className={isTestTaker ? 'relative flex h-full shrink-0 items-center gap-2 border-b-2 px-2 text-sm font-semibold transition-colors whitespace-nowrap' : 'relative flex shrink-0 items-center gap-2 px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap'}
                    style={
                      active
                        ? { color: GOV.blue, fontWeight: 700, borderColor: isTestTaker ? GOV.blue : undefined }
                        : { color: GOV.textMuted, fontWeight: isTestTaker ? 600 : 500, borderColor: isTestTaker ? 'transparent' : undefined }
                    }
                    aria-current={active ? 'page' : undefined}
                    aria-label={getAriaLabel(`${label} page`, 'Primary navigation')}
                  >
                    <Icon className={isTestTaker ? 'h-4 w-4' : 'w-4 h-4'} />
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

          <div className={`absolute top-1/2 z-10 -translate-y-1/2 ${isTestTaker ? 'right-3 sm:right-6' : 'right-3 sm:right-4 lg:right-6'}`}>
            <div className="relative">
              <button
                type="button"
                className={isTestTaker ? 'flex max-w-[180px] items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors hover:bg-gray-50' : 'flex max-w-[170px] items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors'}
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-controls={userMenuId}
                aria-label={getAriaLabel(`User menu for ${displayName}`, 'User menu')}
              >
                <div
                  className={isTestTaker ? 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full' : 'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0'}
                  style={{ backgroundColor: GOV.blueLightAlt }}
                >
                  <User className={isTestTaker ? 'h-4 w-4' : 'w-4 h-4'} style={{ color: GOV.blue }} />
                </div>
                <div className="hidden sm:block min-w-0 text-left">
                  <p className="truncate text-xs font-semibold leading-none" style={{ color: GOV.text }}>{displayName}</p>
                  <p className="truncate text-[10px] mt-0.5 leading-none" style={{ color: GOV.textMuted }}>{roleLabel}</p>
                </div>
                <ChevronDown className={isTestTaker ? 'h-3.5 w-3.5' : 'w-3.5 h-3.5'} style={{ color: GOV.textMuted }} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                  <div
                    id={userMenuId}
                    className="absolute right-0 top-full mt-1 z-20 w-52 bg-white border rounded-md shadow-lg py-1"
                    style={{ borderColor: GOV.border }}
                    role="menu"
                    aria-label="User menu"
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
                      role="menuitem"
                    >
                      <User className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} /> My Profile
                    </Link>

                    {isAdminLike && (
                      <Link
                        to={dashboardPath}
                        className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50"
                        style={{ color: GOV.text }}
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                      >
                        <Settings className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} /> Dashboard
                      </Link>
                    )}

                    <div className="border-t my-1" style={{ borderColor: GOV.borderLight }} />
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-left"
                      style={{ color: '#dc2626' }}
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      role="menuitem"
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

      {mobileNavOpen && (
        <div
          id={mobileNavId}
          className="lg:hidden border-b bg-white"
          style={{ borderColor: GOV.border }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="max-w-7xl mx-auto px-6 py-2 space-y-1">
            {navLinks.map(({ to, label, Icon, badge }) => {
              const active = isActive(to);
              return (
                <Link
                  key={`m-${to}-${label}`}
                  to={to}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold"
                  style={active ? { backgroundColor: GOV.blueLightAlt, color: GOV.blue } : { color: GOV.textMuted }}
                  aria-current={active ? 'page' : undefined}
                  aria-label={getAriaLabel(`${label} page`, 'Mobile navigation')}
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

      {!hideBreadcrumbs && breadcrumbs.length > 0 && (
        <nav className="border-b" style={{ backgroundColor: '#fafafa', borderColor: GOV.borderLight }} aria-label="Breadcrumb">
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
        </nav>
      )}

      <main className="flex-1 overflow-auto custom-scrollbar" id="main-content" role="main">
        <div id="glossary-section" className="sr-only">
          <h2>Glossary Navigation</h2>
          <p>Open the glossary page from navigation for complete SDS term explanations.</p>
        </div>
        {children}
      </main>
    </div>
  );
}
