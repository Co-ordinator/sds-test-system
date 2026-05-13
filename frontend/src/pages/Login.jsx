import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LockKeyhole, LogIn, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ResendVerification from '../components/auth/ResendVerification';
import AuthShell from '../components/auth/AuthShell';
import { profileNeedsOnboarding } from '../utils/profileOnboarding';

const inputClass = (hasError) =>
  `h-11 w-full rounded-md border bg-white px-3 text-sm font-medium text-[#111827] shadow-sm outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#2d8bc4] focus:ring-2 focus:ring-[#2d8bc4]/15 ${
    hasError ? 'border-[#fecaca] bg-[#fffafa]' : 'border-[#d8e1ea]'
  }`;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showResendModal, setShowResendModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const result = await login({ identifier: data.email, email: data.email, password: data.password });
      const user = result?.data?.user ?? result?.user;

      if (result?.status === 'success' && user) {
        if (result?.mustChangePassword) {
          navigate('/change-password');
          return;
        }

        const userRole = user.role;
        if (userRole === 'Test Taker' && profileNeedsOnboarding(user)) {
          navigate('/onboarding');
          return;
        }

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
        setVerificationEmail(String(data.email || '').trim());
        setShowResendModal(true);
      } else {
        setServerError(result?.message || 'Login failed');
      }
    } catch (err) {
      if (err.status === 403 && err.raw?.response?.data?.requiresVerification) {
        setVerificationEmail(String(data.email || '').trim());
        setShowResendModal(true);
      } else {
        setServerError(err.uiMessage || 'Login failed');
      }
    }
  };

  return (
    <AuthShell
      eyebrow="Secure sign in"
      title="Welcome back"
      subtitle="Access your SDS dashboard, continue your assessment, or review your results."
      panelTitle="Continue your career assessment"
      panelText="Sign in to resume your questionnaire, view your Holland Code profile, and download your career guidance report."
    >
      {showResendModal && (
        <ResendVerification onClose={() => setShowResendModal(false)} defaultEmail={verificationEmail} />
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="login-identifier" className="mb-1.5 block text-xs font-bold text-[#374151]">
            Email or SDS code
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
            <input
              id="login-identifier"
              {...register('email', {
                required: 'Email or SDS code is required',
              })}
              type="text"
              autoComplete="username"
              placeholder="your@email.com or SDS123456"
              className={`${inputClass(!!errors.email)} pl-9`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs font-medium text-[#b91c1c]">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor="login-password" className="block text-xs font-bold text-[#374151]">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-bold text-[#2d8bc4] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', { required: 'Password is required' })}
              autoComplete="current-password"
              className={`${inputClass(!!errors.password)} pl-9 pr-10`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs font-medium text-[#b91c1c]">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <div className="flex gap-2 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#b91c1c]">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2d8bc4] px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#256b9a] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>

        <div className="rounded-md bg-[#f7fbff] px-3 py-3 text-center text-xs font-medium text-[#4b5563]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-bold text-[#2d8bc4] hover:underline">
            Create one
          </Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default Login;
