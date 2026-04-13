import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResendVerification from '../components/auth/ResendVerification';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, TYPO } from '../theme/government';

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
      const user = result?.data?.user ?? result?.user;

      if (result?.status === 'success' && user) {
        // Check if user must change password
        if (result?.mustChangePassword) {
          navigate('/change-password');
          return;
        }

        const userRole = user.role;
        switch (userRole) {
          case 'System Administrator':
            navigate('/admin/dashboard');
            break;
          case 'Test Administrator':
            navigate('/test-administrator');
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
    <OnboardingLayout>
      {showResendModal && (
        <ResendVerification onClose={() => setShowResendModal(false)} />
      )}
      <div className="w-full max-w-[420px] mx-auto">
        <div
          className="w-full bg-white rounded-md border overflow-hidden"
          style={{ borderColor: GOV.border }}
        >
          <div className="px-6 pt-6 pb-1">
            <h1 className={`${TYPO.pageTitle} text-center`} style={{ color: GOV.text }}>
              Login to the SDS Assessment System
            </h1>
            <p className={`${TYPO.bodySmall} text-center mt-1`} style={{ color: GOV.textMuted }}>
              Enter your credentials to securely access your account
            </p>
          </div>

          <form className="px-6 pt-5 pb-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="login-identifier" className={`block ${TYPO.label} mb-2`} style={{ color: GOV.text }}>Email or Code</label>
              <input
                id="login-identifier"
                {...register('email', {
                  required: 'Email or Code is required',
                })}
                type="text"
                autoComplete="username"
                placeholder="your@email.com or SDS123456"
                className={`form-control ${TYPO.body}`}
                style={{ borderBottomColor: errors.email ? GOV.error : GOV.border, color: GOV.text }}
              />
              {errors.email && (
                <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className={`block ${TYPO.label}`} style={{ color: GOV.text }}>Password</label>
                <Link to="/forgot-password" className={`${TYPO.hint} font-semibold underline hover:no-underline transition-all`} style={{ color: GOV.blue }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                {...register('password', { required: 'Password is required' })}
                autoComplete="current-password"
                className={`form-control ${TYPO.body}`}
                style={{ borderBottomColor: errors.password ? GOV.error : GOV.border, color: GOV.text }}
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
              className={`w-full py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
              style={{ backgroundColor: GOV.blue }}
            >
              {isSubmitting ? 'Logging in…' : 'Login'}
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
    </OnboardingLayout>
  );
};

export default Login;
