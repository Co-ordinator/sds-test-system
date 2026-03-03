import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResendVerification from '../components/auth/ResendVerification';
import { GOV, TYPO, LOGO, MINISTRY_NAME, KINGDOM, LOGO_ALT } from '../theme/government';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showResendModal, setShowResendModal] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const result = await login({ identifier: data.email, email: data.email, password: data.password });

      if (result?.success) {
        const userRole = result.data.user.role;
        switch (userRole) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'counselor':
            navigate('/counselor/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } else if (result?.requiresVerification || result?.status === 403) {
        setShowResendModal(true);
      } else {
        setServerError(result?.message || 'Login failed');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        setShowResendModal(true);
      } else {
        setServerError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      {showResendModal && (
        <ResendVerification onClose={() => setShowResendModal(false)} />
      )}

      {/* Government bar */}
      <div
        className="flex-shrink-0 px-6 py-1.5 border-b text-center"
        style={{ borderColor: GOV.border, backgroundColor: GOV.blueLightAlt }}
      >
        <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
          {MINISTRY_NAME} · {KINGDOM}
        </p>
      </div>

      {/* Help – top right */}
      <button
        type="button"
        className="absolute top-4 right-6 w-9 h-9 rounded-full flex items-center justify-center z-10"
        style={{ backgroundColor: GOV.blueLight }}
        aria-label="Help"
      >
        <span className="text-base font-semibold" style={{ color: GOV.blue }}>?</span>
      </button>

      {/* Main: centered login card */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          <Link to="/" className={`${LOGO.marginBottom} flex-shrink-0`} aria-label="Home">
            <img src="/siyinqaba.png" alt={LOGO_ALT} className="h-20 w-auto object-contain" />
          </Link>

          <div
            className="w-full bg-white rounded-lg border overflow-hidden"
            style={{ borderColor: GOV.border }}
          >
            <div className="px-6 pt-6 pb-1">
              <h1 className={`${TYPO.pageTitle} text-center`} style={{ color: GOV.text }}>
                Sign in
              </h1>
              <p className={`${TYPO.bodySmall} text-center mt-1`} style={{ color: GOV.textMuted }}>
                Enter your credentials to access your account
              </p>
            </div>

            <form className="px-6 pt-4 pb-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="login-email" className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                  Email
                </label>
                <input
                  id="login-email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                  style={{ borderColor: errors.email ? GOV.error : GOV.border, color: GOV.text }}
                />
                {errors.email && (
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className={`block ${TYPO.label}`} style={{ color: GOV.text }}>
                    Password
                  </label>
                  <Link to="/forgot-password" className={`${TYPO.hint} font-medium`} style={{ color: GOV.blue }}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="login-password"
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  autoComplete="current-password"
                  className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                  style={{ borderColor: errors.password ? GOV.error : GOV.border, color: GOV.text }}
                />
                {errors.password && (
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <div
                  className={`rounded-md px-3 py-2 ${TYPO.hint}`}
                  style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder}` }}
                >
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-md font-medium ${TYPO.bodySmall} text-white transition-opacity hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed`}
                style={{ backgroundColor: GOV.blue }}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="px-6 pb-6 pt-0 text-center border-t" style={{ borderColor: GOV.borderLight }}>
              <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-medium hover:underline" style={{ color: GOV.blue }}>
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
