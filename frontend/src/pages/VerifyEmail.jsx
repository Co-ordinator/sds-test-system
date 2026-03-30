import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, TYPO } from '../theme/government';
import ResendVerification from '../components/auth/ResendVerification';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await api.get(`/api/v1/auth/verify-email/${token}`);
        const authToken = res.data?.token;
        const userData = res.data?.data?.user;
        const message = res.data?.message;
        
        if (authToken && userData) {
          setSession(authToken, userData);
          setStatus('success');
          // Auto-navigate to onboarding after successful verification
          setTimeout(() => navigate('/onboarding'), 1500);
        } else if (message?.includes('already verified')) {
          // Email is already verified but no login token provided
          setStatus('alreadyVerified');
          // Redirect to onboarding to complete profile
          setTimeout(() => navigate('/onboarding'), 1500);
        } else {
          setStatus('success');
          setTimeout(() => navigate('/onboarding'), 1500);
        }
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.message || 'Link expired or invalid');
      }
    };
    verifyEmail();
  }, [token, navigate]);

  return (
    <OnboardingLayout>
      <div className="w-full max-w-[420px] mx-auto">
        <div
          className="w-full bg-white rounded-md border py-6 px-6 text-center"
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
                Redirecting to complete your profile...
              </p>
              <div className="flex justify-center">
                <div
                  className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent"
                  style={{ borderColor: GOV.blue }}
                />
              </div>
            </div>
          )}

          {status === 'alreadyVerified' && (
            <div className="space-y-4">
              <div
                className="mx-auto flex items-center justify-center h-12 w-12 rounded-full"
                style={{ backgroundColor: GOV.blueLight }}
              >
                <svg className="h-6 w-6" style={{ color: GOV.blue }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className={TYPO.pageTitle} style={{ color: GOV.text }}>
                Email already verified
              </h2>
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                Your email is already verified. Redirecting to complete your profile...
              </p>
              <div className="flex justify-center">
                <div
                  className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent"
                  style={{ borderColor: GOV.blue }}
                />
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              {showResend && <ResendVerification onClose={() => setShowResend(false)} />}
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
                onClick={() => setShowResend(true)}
                className={`w-full py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2`}
                style={{ backgroundColor: GOV.blue }}
              >
                Request new link
              </button>
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
