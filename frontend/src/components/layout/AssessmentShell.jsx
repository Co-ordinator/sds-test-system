import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Home, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { GOV, TYPO } from '../../theme/government';

export default function AssessmentShell({ title, subtitle, contextLabel, actions, children, contentClassName = 'max-w-5xl mx-auto px-6 py-6 space-y-6' }) {
  const { user, logout } = useAuth();
  const { getAriaLabel, screenReaderMode } = useAccessibility();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const role = user?.role || 'Test Taker';
  const isAdminLike = role === 'System Administrator' || role === 'Test Administrator';
  const adminDashboardPath = role === 'System Administrator' ? '/admin/dashboard' : '/test-administrator';
  const dashboardPath = role === 'System Administrator'
    ? '/admin/dashboard'
    : role === 'Test Administrator'
      ? '/test-administrator'
      : '/dashboard';
  const roleLabel = role === 'System Administrator' ? 'System Administrator' : role === 'Test Administrator' ? 'Test Administrator' : 'Test Taker';
  const roleColor = role === 'System Administrator'
    ? { bg: '#ede9fe', text: '#6d28d9' }
    : role === 'Test Administrator'
      ? { bg: '#dbeafe', text: '#1d4ed8' }
      : { bg: '#f0fdf4', text: '#15803d' };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Skip to main content for screen readers */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <div
        className="flex-shrink-0 py-0.5 border-b"
        style={{ backgroundColor: GOV.ministryBarBg, borderColor: GOV.border }}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-6 py-1">
          <p className="text-[10px] font-medium text-center tracking-wide" style={{ color: GOV.ministryBarText }}>
            Ministry of Labour &amp; Social Security · Kingdom of Eswatini
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b bg-white" style={{ borderColor: GOV.borderLight }} role="navigation" aria-label="Main navigation">
        <div className="relative py-2">
          <div className="absolute left-3 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-10">
            <Link to={dashboardPath} className="flex items-center min-w-0 max-w-[40vw] sm:max-w-[180px]" aria-label="Go to dashboard">
              <img src="/siyinqaba.png" alt="Siyinqaba - Government of Eswatini" className="h-7 sm:h-8 w-auto max-w-full object-contain" />
              <span className="sr-only">Home</span>
            </Link>
          </div>

          <div className="absolute right-3 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-label={getAriaLabel(`User menu for ${displayName}`, 'User menu')}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: GOV.blueLightAlt }}
                  aria-hidden="true"
                >
                  <User className="w-4 h-4" style={{ color: GOV.blue }} />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-none" style={{ color: GOV.text }}>{displayName}</p>
                  <p className="text-[10px] mt-0.5 leading-none" style={{ color: GOV.textMuted }}>{roleLabel}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                  <div
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
                      <User className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} aria-hidden="true" /> My Profile
                    </Link>

                    {isAdminLike && (
                      <Link
                        to={adminDashboardPath}
                        className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50"
                        style={{ color: GOV.text }}
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                      >
                        <Settings className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} aria-hidden="true" /> Admin Dashboard
                      </Link>
                    )}

                    <div className="border-t my-1" style={{ borderColor: GOV.borderLight }} />
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 text-left"
                      style={{ color: '#dc2626' }}
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      role="menuitem"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 text-left">
                <h1 className="text-lg font-semibold" style={{ color: GOV.text }}>{title}</h1>
                {subtitle ? (
                  <p className={`${TYPO.body} mt-0.5`} style={{ color: GOV.textMuted }}>
                    {subtitle}
                  </p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
            </div>
          </div>
        </div>
      </header>

      {contextLabel ? (
        <div className="border-b" style={{ borderColor: GOV.borderLight }} role="status" aria-live="polite">
          <div className="max-w-5xl mx-auto px-6 py-1.5">
            <span className="text-xs font-medium" style={{ color: GOV.textMuted }}>
              {contextLabel}
            </span>
          </div>
        </div>
      ) : null}

      <main className="flex-1" id="main-content" role="main">
        <div className={contentClassName}>{children}</div>
      </main>

    </div>
  );
}
