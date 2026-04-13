import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GOV, TYPO, LOGO, MINISTRY_NAME, KINGDOM, LOGO_ALT } from '../theme/government';
import ResendVerification from '../components/auth/ResendVerification';

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showResend, setShowResend] = useState(false);
  const requiresVerification = location.state?.requiresVerification === true;

  const handleBack = () => {
    if (user?.role === 'System Administrator') {
      navigate('/admin');
    } else if (user?.role === 'Test Administrator') {
      navigate('/test-administrator');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      <div
        className="flex-shrink-0 px-6 py-1.5 border-b text-center"
        style={{ borderColor: GOV.border, backgroundColor: GOV.ministryBarBg }}
      >
        <p className={TYPO.hint} style={{ color: GOV.ministryBarText }}>
          {MINISTRY_NAME} · {KINGDOM}
        </p>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          <Link to="/" className={`${LOGO.marginBottom} flex-shrink-0`} aria-label="Home">
            <img src="/siyinqaba.png" alt={LOGO_ALT} className={LOGO.className} />
          </Link>

          {showResend && <ResendVerification onClose={() => setShowResend(false)} defaultEmail={user?.email || ''} />}

          <div
            className="w-full bg-white rounded-lg border py-6 px-6 text-center"
            style={{ borderColor: GOV.border }}
          >
            <h1 className={`${TYPO.pageTitle} mb-2`} style={{ color: requiresVerification ? GOV.blue : GOV.error }}>
              {requiresVerification ? 'Email verification required' : 'Access denied'}
            </h1>
            <p className={`${TYPO.bodySmall} mb-4`} style={{ color: GOV.textMuted }}>
              {requiresVerification
                ? 'Please verify your email address to access this page. Check your inbox for a verification link.'
                : 'You do not have permission to view this page.'}
            </p>
            <div className="flex flex-col gap-2">
              {requiresVerification && (
                <button
                  type="button"
                  onClick={() => setShowResend(true)}
                  className={`py-2.5 px-4 rounded-md font-medium ${TYPO.bodySmall} text-white transition-opacity hover:opacity-95`}
                  style={{ backgroundColor: GOV.blue }}
                >
                  Resend verification email
                </button>
              )}
              <button
                type="button"
                onClick={handleBack}
                className={`py-2.5 px-4 rounded-md font-medium ${TYPO.bodySmall} transition-opacity hover:opacity-95 ${requiresVerification ? '' : 'text-white'}`}
                style={requiresVerification ? { border: `1px solid ${GOV.border}`, color: GOV.textMuted } : { backgroundColor: GOV.blue, color: 'white' }}
              >
                {requiresVerification ? 'Go back' : 'Back to dashboard'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
