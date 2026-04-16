import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import api from '../services/api';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, TYPO } from '../theme/government';

export default function ForgotPassword() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post('/api/v1/auth/forgot-password', data);
      setSuccess(true);
      setError('');
    } catch (err) {
      setError(err?.uiMessage || err?.response?.data?.message || 'Request failed');
      setSuccess(false);
    }
  };

  return (
    <OnboardingLayout>
      <div className="w-full max-w-[420px] mx-auto">
        <div
          className="w-full bg-white rounded-md border overflow-hidden"
          style={{ borderColor: GOV.border }}
        >
          <div className="px-6 pt-6 pb-1">
            <h1 className={`${TYPO.pageTitle} text-center`} style={{ color: GOV.text }}>
              Reset your password
            </h1>
            <p className={`${TYPO.bodySmall} text-center mt-1`} style={{ color: GOV.textMuted }}>
              Enter your Email or Code to receive a reset link
            </p>
          </div>

          {success ? (
            <div className="px-6 py-6 text-center">
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                If an account exists, a reset link has been sent.
              </p>
              <Link
                to="/login"
                className={`inline-block mt-4 ${TYPO.hint} font-medium`}
                style={{ color: GOV.blue }}
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form className="px-6 pt-4 pb-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="forgot-identifier" className={TYPO.label} style={{ color: GOV.text }}>Email or Code</label>
                <input
                  id="forgot-identifier"
                  {...register('identifier', { required: 'Required' })}
                  placeholder="your@email.com or SDS123456"
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: errors.identifier ? GOV.error : GOV.border, color: GOV.text }}
                />
                {errors.identifier && (
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.identifier.message}</p>
                )}
              </div>

              {error && (
                <div
                  className={`rounded-md px-3 py-2 ${TYPO.hint}`}
                  style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder}` }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
                style={{ backgroundColor: GOV.blue }}
              >
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <div className="px-6 pb-6 pt-0 text-center border-t" style={{ borderColor: GOV.borderLight }}>
            <Link to="/login" className={`${TYPO.hint} font-medium`} style={{ color: GOV.blue }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
