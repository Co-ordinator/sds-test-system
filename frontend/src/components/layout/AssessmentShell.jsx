import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Home, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GOV, TYPO } from '../../theme/government';

export default function AssessmentShell({ title, subtitle, contextLabel, actions, children, contentClassName = 'max-w-5xl mx-auto px-6 py-6 space-y-6' }) {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const role = user?.role || 'Test Taker';
  const isAdminLike = role === 'System Administrator' || role === 'Test Administrator';
  const roleLabel = role === 'System Administrator' ? 'System Administrator' : role === 'Test Administrator' ? 'Test Administrator' : 'Test Taker';
  const roleColor = role === 'System Administrator'
    ? { bg: '#ede9fe', text: '#6d28d9' }
    : role === 'Test Administrator'
      ? { bg: '#dbeafe', text: '#1d4ed8' }
      : { bg: '#f0fdf4', text: '#15803d' };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div
        className="flex-shrink-0 py-0.5 border-b"
        style={{ backgroundColor: '#f8fafc', borderColor: GOV.borderLight }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className={TYPO.ministryBanner} style={{ color: GOV.blue }}>
            Ministry of Labour &amp; Social Security · Kingdom of Eswatini
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b bg-white" style={{ borderColor: GOV.borderLight }}>
        <div className="relative py-2">
          <div className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-10">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <img src="/siyinqaba.png" alt="Siyinqaba" className="h-8 w-auto object-contain" />
            </Link>
          </div>

          <div className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setUserMenuOpen((open) => !open)}
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
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
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
        <div className="border-b" style={{ borderColor: GOV.borderLight }}>
          <div className="max-w-5xl mx-auto px-6 py-1.5">
            <span className="text-xs font-medium" style={{ color: GOV.textMuted }}>
              {contextLabel}
            </span>
          </div>
        </div>
      ) : null}

      <main className="flex-1">
        <div className={contentClassName}>{children}</div>
      </main>

      <footer
        className="border-t py-3"
        style={{ borderColor: GOV.border, backgroundColor: GOV.blueLightAlt }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[11px]" style={{ color: GOV.textMuted }}>
            © {new Date().getFullYear()} Kingdom of Eswatini · Skills Development System · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
