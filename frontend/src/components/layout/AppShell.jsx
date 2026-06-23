import React, { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  User, LogOut, ChevronDown, ChevronRight, Home,
  Settings, Menu, X, Bell, Award, FileText,
  BookOpen, ClipboardList, Accessibility,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { GOV, LOGO_ALT } from '../../theme/government';
import { useNotificationCount } from '../../hooks/useNotificationCount';
import TestTakerSideNav from './TestTakerSideNav';
import PoweredFooter from './PoweredFooter';

/** Match OnboardingLayout wide header — text links, no icons. */
const widePublicNavClass =
  'text-sm font-medium transition-colors hover:opacity-90';

// All possible admin nav links with required permissions
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
  { to: '/results', label: 'Results', Icon: Award },
  { to: '/glossary', label: 'Glossary', Icon: BookOpen },
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
  const useTestTakerSideLayout = isTestTaker && !hideBreadcrumbs;

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

  // Close mobile nav on route change
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!isTestTaker || !mobileNavOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isTestTaker, mobileNavOpen]);

  const closeMobileNav = () => setMobileNavOpen(false);

  const userMenuButton = (
    <div className="relative shrink-0">
      <button
        type="button"
        className={isTestTaker ? 'flex max-w-[180px] items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors hover:bg-gray-50' : 'flex max-w-[170px] items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors'}
        onClick={() => setUserMenuOpen((o) => !o)}
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
        <ChevronDown className="h-3.5 w-3.5" style={{ color: GOV.textMuted }} />
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
              <User className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} /> {isTestTaker ? 'Edit Profile' : 'My Profile'}
            </Link>

            {isTestTaker && (
              <Link
                to="/accessibility"
                className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50"
                style={{ color: GOV.text }}
                onClick={() => setUserMenuOpen(false)}
              >
                <Accessibility className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} /> Accessibility
              </Link>
            )}

            {isAdminLike && (
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50"
                style={{ color: GOV.text }}
                onClick={() => setUserMenuOpen(false)}
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
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`${useTestTakerSideLayout ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col bg-white`}>
      {/* Ministry strip — OnboardingLayout (wide): thin bar; admin: bar + caption */}
      <div
        className="flex-shrink-0 border-b py-1.5"
        style={{ borderColor: GOV.border, backgroundColor: GOV.ministryBarBg }}
        aria-hidden={isTestTaker ? 'true' : undefined}
      >
        {!isTestTaker && (
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-[11px] font-medium tracking-normal" style={{ color: GOV.ministryBarText }}>
              Ministry of Labour &amp; Social Security · Kingdom of Eswatini
            </p>
          </div>
        )}
      </div>

      {isTestTaker ? (
        <>
          <header className="sticky top-0 z-30 flex-shrink-0 border-b bg-white" style={{ borderColor: GOV.border }}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between gap-4">
                <Link to={dashboardPath} className="flex min-w-0 items-center gap-2" aria-label="Go to dashboard">
                  <img src="/letterhead.png" alt={LOGO_ALT} className="h-12 w-auto object-contain" />
                </Link>

                <div className="hidden items-center gap-6 lg:flex">
                  {!useTestTakerSideLayout && (
                    <nav className="flex items-center gap-6" aria-label="Primary">
                      {navLinks.map(({ to, label, badge }) => {
                        const active = isActive(to);
                        return (
                          <Link
                            key={`${to}-${label}`}
                            to={to}
                            className={`relative ${widePublicNavClass}`}
                            style={{ color: active ? GOV.text : GOV.textMuted, fontWeight: active ? 700 : 500 }}
                            onClick={closeMobileNav}
                          >
                            {label}
                            {badge && notificationCount > 0 && (
                              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                                {notificationCount > 99 ? '99+' : notificationCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </nav>
                  )}
                  {userMenuButton}
                </div>

                <button
                  type="button"
                  className="rounded-md border p-2 lg:hidden"
                  style={{ borderColor: GOV.border }}
                  aria-expanded={mobileNavOpen}
                  aria-controls="test-taker-wide-nav-mobile"
                  aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                  onClick={() => setMobileNavOpen((o) => !o)}
                >
                  {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>

              {mobileNavOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    role="presentation"
                    aria-hidden="true"
                    onClick={closeMobileNav}
                  />
                  <div
                    id="test-taker-wide-nav-mobile"
                    className="absolute left-0 right-0 top-full z-50 border-b bg-white px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] sm:px-6 lg:hidden"
                    style={{ borderColor: GOV.border, backgroundColor: '#fff' }}
                  >
                    <nav className="flex flex-col gap-3" aria-label="Primary mobile">
                      {navLinks.map(({ to, label, Icon, badge }) => {
                        const active = isActive(to);
                        return (
                          <Link
                            key={`m-${to}-${label}`}
                            to={to}
                            className="flex items-center gap-2 py-1 text-base font-medium transition-colors"
                            style={{ color: active ? GOV.blue : GOV.textMuted, fontWeight: active ? 700 : 500 }}
                            onClick={closeMobileNav}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                            {badge && notificationCount > 0 && (
                              <span className="ml-auto flex h-4 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {notificationCount > 99 ? '99+' : notificationCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 py-1 text-base font-medium transition-colors"
                        style={{ color: GOV.textMuted }}
                        onClick={closeMobileNav}
                      >
                        <Settings className="h-4 w-4 shrink-0" />
                        Edit Profile
                      </Link>
                      <Link
                        to="/accessibility"
                        className="flex items-center gap-2 py-1 text-base font-medium transition-colors"
                        style={{ color: GOV.textMuted }}
                        onClick={closeMobileNav}
                      >
                        <Accessibility className="h-4 w-4 shrink-0" />
                        Accessibility
                      </Link>
                      <button
                        type="button"
                        className="flex items-center gap-2 py-1 text-left text-base font-medium text-red-600"
                        onClick={() => { closeMobileNav(); logout(); }}
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        Sign Out
                      </button>
                    </nav>
                  </div>
                </>
              )}
            </div>
          </header>
        </>
      ) : (
        <>
          <header
            className="sticky top-0 z-20 border-b h-14"
            style={{ borderColor: GOV.border, backgroundColor: '#ffffff' }}
          >
            <div className="relative h-full px-4 lg:px-6">
              <div className="absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-2 sm:gap-3 left-3 sm:left-4 lg:left-6">
                <button
                  type="button"
                  className="lg:hidden p-1.5 rounded-md hover:bg-gray-100"
                  onClick={() => setMobileNavOpen((o) => !o)}
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

              <div className="max-w-7xl mx-auto px-6 lg:pl-[210px] lg:pr-[180px] h-full flex items-center">
                <nav className="hidden lg:flex w-full items-center gap-0.5 min-w-0 overflow-x-auto custom-scrollbar">
                  {navLinks.map(({ to, label, Icon, badge }) => {
                    const active = isActive(to);
                    return (
                      <Link
                        key={`${to}-${label}`}
                        to={to}
                        className="relative flex shrink-0 items-center gap-2 px-2.5 py-1.5 text-sm transition-colors whitespace-nowrap"
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

              <div className="absolute top-1/2 z-10 -translate-y-1/2 right-3 sm:right-4 lg:right-6">
                {userMenuButton}
              </div>
            </div>
          </header>

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
        </>
      )}

      {!hideBreadcrumbs && !useTestTakerSideLayout && breadcrumbs.length > 0 && (
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

      {useTestTakerSideLayout ? (
        <div className="flex min-h-0 flex-1 overflow-hidden bg-white">
          <TestTakerSideNav />
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden" id="main-content" role="main">
            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
              <div id="glossary-section" className="sr-only">
                <h2>Glossary Navigation</h2>
                <p>Open the glossary page from navigation for complete SDS term explanations.</p>
              </div>
              {children}
            </div>
            <PoweredFooter compact />
          </main>
        </div>
      ) : (
        <main className="flex-1 overflow-auto custom-scrollbar" id="main-content" role="main">
          <div id="glossary-section" className="sr-only">
            <h2>Glossary Navigation</h2>
            <p>Open the glossary page from navigation for complete SDS term explanations.</p>
          </div>
          {children}
          {isTestTaker && <PoweredFooter />}
        </main>
      )}
    </div>
  );
}
