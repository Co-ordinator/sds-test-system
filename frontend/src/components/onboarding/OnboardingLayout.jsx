import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GOV, LOGO, LOGO_ALT } from '../../theme/government';
import { useAuth } from '../../context/AuthContext';

const navLinkClass =
  'text-sm font-medium transition-colors hover:opacity-90';

const ctaClassName =
  'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95 sm:px-4';

function WideHeaderCta({ isRegister, isLogin, onNavigate }) {
  if (isRegister) {
    return (
      <Link to="/login" className={ctaClassName} style={{ backgroundColor: GOV.blue }} onClick={onNavigate}>
        Login
      </Link>
    );
  }
  if (isLogin) {
    return (
      <Link to="/register" className={ctaClassName} style={{ backgroundColor: GOV.blue }} onClick={onNavigate}>
        Register
      </Link>
    );
  }
  return (
    <Link to="/login" className={ctaClassName} style={{ backgroundColor: GOV.blue }} onClick={onNavigate}>
      Login
    </Link>
  );
}

function WideNavLinks({ className, onNavigate, linkClassName = navLinkClass }) {
  return (
    <nav className={className} aria-label="Primary">
      <Link to="/" className={linkClassName} style={{ color: GOV.textMuted }} onClick={onNavigate}>
        Home
      </Link>
      <Link to="/about" className={linkClassName} style={{ color: GOV.textMuted }} onClick={onNavigate}>
        About
      </Link>
      <Link to="/help" className={linkClassName} style={{ color: GOV.textMuted }} onClick={onNavigate}>
        FAQ
      </Link>
    </nav>
  );
}

export default function OnboardingLayout({ children, wide = false }) {
  const innerMax = wide ? 'max-w-5xl' : 'max-w-xl';
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isRegister = pathname === '/register';
  const isLogin = pathname === '/login';
  /** Lock shell to viewport on login/register so header + padding cannot exceed dvh and force a body scrollbar. */
  const pinAuthViewport = wide && (isLogin || isRegister);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen || !wide) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen, wide]);

  const closeMenu = () => setMenuOpen(false);
  const logoTarget = user?.role === 'System Administrator'
    ? '/admin/dashboard'
    : user?.role === 'Test Administrator'
      ? '/test-administrator'
      : user?.role === 'Test Taker'
        ? '/dashboard'
        : '/';

  return (
    <div
      className={
        pinAuthViewport
          ? 'relative flex h-dvh max-h-dvh w-full max-w-full flex-col overflow-hidden bg-white'
          : 'relative flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-white'
      }
    >
      <div
        className="flex-shrink-0 border-b py-1.5"
        style={{ borderColor: GOV.border, backgroundColor: GOV.ministryBarBg }}
        aria-hidden="true"
      />

      {!wide && (
        <Link
          to="/help"
          className="absolute top-3 right-6 z-10 flex h-8 w-8 items-center justify-center rounded-md border"
          style={{ backgroundColor: '#ffffff', borderColor: GOV.border }}
          aria-label="Help and FAQ"
        >
          <span className="text-sm font-semibold" style={{ color: GOV.blue }}>?</span>
        </Link>
      )}

      {wide && (
        <header className="relative z-30 flex-shrink-0 bg-white">
          <div className={`${innerMax} relative mx-auto`}>
            <div className="relative z-50 flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-3 bg-white px-3 py-4 sm:px-4 sm:py-5">
              <Link to={logoTarget} className="min-w-0 shrink" aria-label={user ? 'Go to dashboard' : 'Home'}>
                <img
                  src="/letterhead.png"
                  alt={LOGO_ALT}
                  className="h-14 w-auto max-w-[16rem] object-contain sm:h-16 sm:max-w-[18rem] md:h-[4.5rem] md:max-w-[21rem]"
                />
              </Link>

              <div className="hidden min-w-0 shrink-0 items-center justify-end gap-3 sm:gap-4 md:gap-5 lg:flex">
                <WideNavLinks className="flex items-center gap-3 sm:gap-5" />
                <WideHeaderCta isRegister={isRegister} isLogin={isLogin} />
              </div>

              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border lg:hidden"
                style={{ borderColor: GOV.border, backgroundColor: '#fff' }}
                aria-expanded={menuOpen}
                aria-controls="wide-nav-mobile"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOV.text} strokeWidth="2" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOV.text} strokeWidth="2" aria-hidden="true">
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                  role="presentation"
                  aria-hidden="true"
                  onClick={closeMenu}
                />
                <div
                  id="wide-nav-mobile"
                  className="absolute left-0 right-0 top-full z-50 border-b px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] lg:hidden sm:px-6"
                  style={{ borderColor: GOV.border, backgroundColor: '#fff' }}
                >
                  <WideNavLinks
                    className="flex flex-col gap-4"
                    onNavigate={closeMenu}
                    linkClassName="text-base font-medium py-1 transition-colors hover:opacity-90"
                  />
                  <div className="mt-5 border-t pt-4" style={{ borderColor: GOV.border }}>
                    <WideHeaderCta isRegister={isRegister} isLogin={isLogin} onNavigate={closeMenu} />
                  </div>
                </div>
              </>
            )}
          </div>
        </header>
      )}

      <main
        className={
          wide
            ? pinAuthViewport
              ? 'flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[#eef4f8] px-4 py-4 sm:px-4 sm:py-8 lg:bg-white'
              : 'flex min-h-0 w-full min-w-0 flex-1 flex-col bg-white px-3 py-6 sm:px-4 sm:py-8'
            : 'flex min-h-0 w-full min-w-0 flex-1 flex-col px-4 py-8 sm:px-6'
        }
      >
        <div className={`${innerMax} mx-auto flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col`}>
          {!wide && (
            <Link to={logoTarget} className={`self-center ${LOGO.marginBottom}`} aria-label={user ? 'Go to dashboard' : 'Home'}>
              <img src="/letterhead.png" alt={LOGO_ALT} className={LOGO.className} />
            </Link>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
