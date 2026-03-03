import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GOV, TYPO, LOGO, MINISTRY_NAME, KINGDOM, LOGO_ALT } from '../theme/government';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await api.get(`/api/v1/auth/verify-email/${token}`);
        const authToken = res.data?.token;
        const userData = res.data?.data?.user;
        if (authToken && userData) setSession(authToken, userData);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.message || 'Link expired or invalid');
      }
    };
    verifyEmail();
  }, [token, setSession]);

  return (
    <div className="min-h-screen flex flex-col relative bg-white">
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
            {status === 'loading' && (
              <div className="space-y-4">
                <div
                  className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent mx-auto"
                  style={{ borderColor: GOV.blue }}
                />
                <h2 className={TYPO.pageTitle} style={{ color: GOV.text }}>
                  Verifying your email…
                </h2>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div
                  className="mx-auto flex items-center justify-center h-12 w-12 rounded-full"
                  style={{ backgroundColor: GOV.blueLight }}
                >
                  <svg className="h-6 w-6" style={{ color: GOV.blue }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className={TYPO.pageTitle} style={{ color: GOV.text }}>
                  Email verified
                </h2>
                <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                  Complete your profile to continue.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/onboarding')}
                  className={`w-full py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white transition-opacity hover:opacity-95`}
                  style={{ backgroundColor: GOV.blue }}
                >
                  Continue to profile
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className={TYPO.pageTitle} style={{ color: GOV.text }}>
                  Verification failed
                </h2>
                <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>{error}</p>
                <button
                  type="button"
                  onClick={() => navigate('/registration-success')}
                  className={`w-full py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white transition-opacity hover:opacity-95`}
                  style={{ backgroundColor: GOV.blue }}
                >
                  Request new link
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
