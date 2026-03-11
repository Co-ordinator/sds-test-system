import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import ResendVerification from '../components/auth/ResendVerification';
import { GOV, TYPO, LOGO, MINISTRY_NAME, KINGDOM, LOGO_ALT } from '../theme/government';

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showResendModal, setShowResendModal] = useState(false);
  const email = location.state?.email || '';

  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      {showResendModal && (
        <ResendVerification onClose={() => setShowResendModal(false)} defaultEmail={email} />
      )}

      <div
        className="flex-shrink-0 px-6 py-1.5 border-b text-center"
        style={{ borderColor: GOV.border, backgroundColor: GOV.blueLightAlt }}
      >
        <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
          {MINISTRY_NAME} · {KINGDOM}
        </p>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          <Link to="/" className={`${LOGO.marginBottom} flex-shrink-0`} aria-label="Home">
            <img src="/siyinqaba.png" alt={LOGO_ALT} className={LOGO.className} />
          </Link>

          <div
            className="w-full bg-white rounded-lg border py-6 px-6 text-center"
            style={{ borderColor: GOV.border }}
          >
            <div
              className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-3"
              style={{ backgroundColor: GOV.blueLight }}
            >
              <svg className="h-6 w-6" style={{ color: GOV.blue }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className={`${TYPO.pageTitle} mb-1`} style={{ color: GOV.text }}>
              Check your email
            </h2>
            <p className={`${TYPO.bodySmall} mb-4`} style={{ color: GOV.textMuted }}>
              We sent a verification link to <span className="font-medium" style={{ color: GOV.text }}>{email || 'your email'}</span>.
              Click the link, then complete your profile.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowResendModal(true)}
                className={`w-full py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2`}
                style={{ backgroundColor: GOV.blue }}
              >
                Resend verification link
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`w-full py-2.5 rounded-md font-medium ${TYPO.bodySmall} border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2`}
                style={{ borderColor: GOV.border, color: GOV.text }}
              >
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
