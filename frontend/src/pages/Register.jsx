import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { GOV, TYPO, LOGO, MINISTRY_NAME, KINGDOM, LOGO_ALT } from '../theme/government';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function parseEmailOrPhone(value) {
  const v = (value || '').trim();
  if (!v) return { email: null, phoneNumber: null };
  if (EMAIL_REGEX.test(v)) return { email: v, phoneNumber: undefined };
  const digits = v.replace(/\D/g, '');
  if (digits.length === 8) return { email: undefined, phoneNumber: `+268${digits}` };
  if (v.startsWith('+268') && digits.length === 11) return { email: undefined, phoneNumber: v };
  return { email: null, phoneNumber: null };
}

function validateEmailOrPhone(value) {
  const v = (value || '').trim();
  if (!v) return 'Email or phone is required';
  if (EMAIL_REGEX.test(v)) return true;
  const digits = v.replace(/\D/g, '');
  if (digits.length === 8 || (v.startsWith('+268') && digits.length === 11)) return true;
  return 'Enter a valid email or Eswatini phone (+268 followed by 8 digits)';
}

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    const { email, phoneNumber } = parseEmailOrPhone(data.emailOrPhone);
    const payload = {
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      password: data.password,
      consent: true,
    };
    try {
      await api.post('/api/v1/auth/register', payload);
      navigate('/registration-success', {
        state: { email: email || phoneNumber || data.emailOrPhone }
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(msg);
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

      <button
        type="button"
        className="absolute top-4 right-6 w-9 h-9 rounded-full flex items-center justify-center z-10"
        style={{ backgroundColor: GOV.blueLight }}
        aria-label="Help"
      >
        <span className="text-base font-semibold" style={{ color: GOV.blue }}>?</span>
      </button>

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
                Create account
              </h1>
              <p className={`${TYPO.bodySmall} text-center mt-1`} style={{ color: GOV.textMuted }}>
                Enter your details to get started
              </p>
            </div>

            <form className="px-6 pt-4 pb-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="register-email-or-phone" className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                  Email or phone
                </label>
                <input
                  id="register-email-or-phone"
                  {...register('emailOrPhone', {
                    required: 'Email or phone is required',
                    validate: validateEmailOrPhone,
                  })}
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com or +268 7612 3456"
                  className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                  style={{ borderColor: errors.emailOrPhone ? GOV.error : GOV.border, color: GOV.text }}
                />
                {errors.emailOrPhone && (
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.emailOrPhone.message}</p>
                )}
                <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.textHint }}>
                  Eswatini phone: +268 followed by 8 digits
                </p>
              </div>

              <div>
                <label htmlFor="register-password" className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                    pattern: {
                      value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
                      message: 'Use letters and numbers',
                    },
                  })}
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 rounded-md border ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                  style={{ borderColor: errors.password ? GOV.error : GOV.border, color: GOV.text }}
                />
                {errors.password && (
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="register-consent"
                    type="checkbox"
                    {...register('consent', { required: 'You must accept the terms to register' })}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: GOV.blue, borderColor: GOV.border }}
                  />
                </div>
                <div className="ml-2.5">
                  <label htmlFor="register-consent" className={TYPO.bodySmall} style={{ color: GOV.text }}>
                    I consent to the processing of my data under the Eswatini Data Protection Act 2022
                  </label>
                  {errors.consent && (
                    <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.consent.message}</p>
                  )}
                </div>
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
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <div className="px-6 pb-6 pt-0 text-center border-t" style={{ borderColor: GOV.borderLight }}>
              <p className={TYPO.hint} style={{ color: GOV.textMuted }}>
                Already have an account?{' '}
                <Link to="/login" className="font-medium hover:underline" style={{ color: GOV.blue }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
