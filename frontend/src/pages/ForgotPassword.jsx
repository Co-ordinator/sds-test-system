import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { GOV, TYPO, LOGO, MINISTRY_NAME, KINGDOM, LOGO_ALT } from '../theme/government';

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
      setError(err.response?.data?.message || 'Request failed');
      setSuccess(false);
    }
  };

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
            className="w-full bg-white rounded-lg border overflow-hidden"
            style={{ borderColor: GOV.border }}
          >
            <div className="px-6 pt-6 pb-1">
              <h1 className={`${TYPO.pageTitle} text-center`} style={{ color: GOV.text }}>
                Reset your password
              </h1>
              <p className={`${TYPO.bodySmall} text-center mt-1`} style={{ color: GOV.textMuted }}>
                Enter your email or National ID to receive a reset link
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
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form className="px-6 pt-4 pb-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="forgot-identifier" className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                    Email or National ID
                  </label>
                  <input
                    id="forgot-identifier"
                    {...register('identifier', { required: 'Required' })}
                    className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                    style={{ borderColor: errors.identifier ? GOV.error : GOV.border, color: GOV.text }}
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
                  className={`w-full py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white transition-opacity hover:opacity-95 disabled:opacity-60`}
                  style={{ backgroundColor: GOV.blue }}
                >
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}

            <div className="px-6 pb-6 pt-0 text-center border-t" style={{ borderColor: GOV.borderLight }}>
              <Link to="/login" className={`${TYPO.hint} font-medium`} style={{ color: GOV.blue }}>
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
