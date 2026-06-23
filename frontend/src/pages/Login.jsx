import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LockKeyhole, LogIn, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV } from '../theme/government';
import { profileNeedsOnboarding } from '../utils/profileOnboarding';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const goToVerifyOtp = (identifier) => {
    const looksLikeEmail = typeof identifier === 'string' && EMAIL_REGEX.test(identifier.trim());
    const email = looksLikeEmail ? identifier.trim().toLowerCase() : '';
    if (email) {
      try { sessionStorage.setItem('pendingVerificationEmail', email); } catch (_) {}
    }
    navigate('/verify-otp', {
      state: email
        ? { email, fromLogin: true, message: 'Your account is not verified yet. Enter the verification code we sent you — if your previous code expired, request a new one below.' }
        : { fromLogin: true }
    });
  };

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
        goToVerifyOtp(data.email);
      } else {
        setServerError(result?.message || 'Sign-in was unsuccessful.');
      }
    } catch (err) {
      if (err.status === 403 && err.raw?.response?.data?.requiresVerification) {
        goToVerifyOtp(data.email);
      } else {
        setServerError(err.uiMessage || 'Sign-in was unsuccessful.');
      }
    }
  };

  return (
    <OnboardingLayout wide>
      <div
        className="mx-auto flex w-full min-w-0 max-w-[420px] flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_18px_45px_rgba(15,45,75,0.12)] lg:max-w-[860px] lg:min-h-[560px] lg:flex-row lg:rounded-none lg:border-0 lg:shadow-none"
        style={{ borderColor: GOV.border }}
      >
        <div
          className="relative flex h-40 shrink-0 items-center justify-center overflow-hidden bg-[#f6f9fc] px-4 sm:h-48 lg:h-auto lg:grow-0 lg:shrink-0 lg:basis-[42%] lg:bg-white lg:p-8"
        >
          <img
            src="/login_cover.png"
            alt=""
            className="relative z-10 h-[210px] w-auto max-w-none object-contain sm:h-[250px] lg:h-auto lg:w-full lg:max-w-[500px]"
            style={{ maxWidth: '500px' }}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center px-5 py-6 sm:px-7 lg:px-10 lg:py-8">
          <div style={{ marginBottom: '1rem' }}>
            <h1
              className="text-[1.7rem] font-extrabold leading-tight sm:text-[1.85rem] lg:text-[2rem]"
              style={{
                lineHeight: 1.15,
                color: GOV.text,
                margin: 0,
              }}
            >
              Sign in
            </h1>
            <p
              style={{
                fontSize: '0.85rem',
                fontWeight: 400,
                color: GOV.textMuted,
                margin: '0.15rem 0 0.5rem',
                lineHeight: 1.35,
              }}
            >
              Enter your registered email address or participant code and your password to continue.
            </p>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: GOV.text,
                margin: 0,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Account credentials
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={styles.inputWrapper(!!errors.email)}>
                <span style={styles.inputIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </span>
                <input
                  id="login-identifier"
                  {...register('email', {
                    required: 'An email address or participant code is required.',
                  })}
                  type="text"
                  autoComplete="username"
                  placeholder="Email address or participant code"
                  style={styles.input}
                />
              </div>
              {errors.email && <p style={styles.errorText}>{errors.email.message}</p>}
            </div>

            <div>
              <div style={styles.inputWrapper(!!errors.password)}>
                <span style={styles.inputIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required.' })}
                  autoComplete="current-password"
                  placeholder="Password"
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                </button>
              </div>
              {errors.password && <p style={styles.errorText}>{errors.password.message}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: '0.7rem', color: GOV.blue, fontWeight: 600, textDecoration: 'none' }}
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {serverError && (
              <div style={{ background: GOV.errorBg, border: `1px solid ${GOV.errorBorder}`, borderRadius: '6px', padding: '8px 12px', fontSize: '0.75rem', color: GOV.error }}>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:hover:opacity-100"
              style={{
                width: '100%',
                padding: '0.82rem',
                background: GOV.blue,
                color: GOV.ministryBarText,
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                marginTop: '0.25rem',
                letterSpacing: '0.02em',
                outlineColor: GOV.blue,
              }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: GOV.textMuted, margin: '0.35rem 0 0' }}>
              Not yet registered?{' '}
              <Link to="/register" style={{ color: GOV.blue, fontWeight: 600, textDecoration: 'none' }}>
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </OnboardingLayout>
  );
};

const styles = {
  inputWrapper: (hasError) => ({
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
    border: `1px solid ${hasError ? GOV.error : GOV.border}`,
    borderRadius: '10px',
    padding: '0 12px',
    height: '44px',
  }),
  inputIcon: {
    display: 'flex',
    alignItems: 'center',
    color: GOV.textHint,
    marginRight: '8px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '0.82rem',
    color: GOV.text,
    outline: 'none',
    height: '100%',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: GOV.textHint,
    display: 'flex',
    alignItems: 'center',
    padding: '0 0 0 6px',
  },
  errorText: {
    fontSize: '0.7rem',
    color: GOV.error,
    margin: '3px 0 0',
  },
};

export default Login;
