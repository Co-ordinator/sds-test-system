import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, TYPO } from '../theme/government';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export default function Register() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    const payload = {
      nationalId: data.nationalId.trim(),
      email: data.email.trim(),
      password: data.password,
      consent: true
    };
    try {
      const response = await api.post('/api/v1/auth/register', payload);
      const { token, data } = response.data;
      // Hydrate auth context so onboarding can access user
      if (token) setSession(token, data?.user);
      navigate('/registration-success', {
        state: { email: payload.email, fromRegistration: true }
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(msg);
    }
  };

  const inputClass = (hasError) =>
    `form-control ${hasError ? '' : ''}`;

  return (
    <OnboardingLayout>
      <div className="w-full max-w-[440px] mx-auto">
        <div className="w-full bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
          <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-2">
              <h1 className={`${TYPO.pageTitle} text-center mb-1`} style={{ color: GOV.text }}>Create your account</h1>
              <p className="text-xs text-center" style={{ color: GOV.textMuted }}>
                Complete your profile after registration.
              </p>
            </div>

            {/* National ID */}
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>National ID *</label>
              <input
                {...register('nationalId', {
                  required: 'National ID is required',
                  pattern: {
                    value: /^\d{13}$/,
                    message: 'National ID must be exactly 13 digits'
                  }
                })}
                type="text"
                inputMode="numeric"
                maxLength={13}
                placeholder="13-digit ID number"
                className={inputClass(!!errors.nationalId)}
                style={{ borderBottomColor: errors.nationalId ? GOV.error : GOV.border, color: GOV.text }}
              />
              {errors.nationalId && <p className="mt-1 text-xs" style={{ color: GOV.error }}>{errors.nationalId.message}</p>}
              {!errors.nationalId && (
                <p className="mt-1 text-xs" style={{ color: GOV.textHint }}>
                  Used to prevent duplicate accounts and link your profile across life stages.
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Email *</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: EMAIL_REGEX,
                    message: 'Enter a valid email address'
                  }
                })}
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                className={inputClass(!!errors.email)}
                style={{ borderBottomColor: errors.email ? GOV.error : GOV.border, color: GOV.text }}
              />
              {errors.email && <p className="mt-1 text-xs" style={{ color: GOV.error }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                    pattern: { value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, message: 'Use letters and numbers' }
                  })}
                  autoComplete="new-password"
                  className={inputClass(!!errors.password)}
                  style={{ borderBottomColor: errors.password ? GOV.error : GOV.border, color: GOV.text, paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                  style={{ color: GOV.textMuted }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs" style={{ color: GOV.error }}>{errors.password.message}</p>}
            </div>

            {/* Consent */}
            <div className="flex items-start gap-2.5 pt-2">
              <input
                id="reg-consent"
                type="checkbox"
                {...register('consent', { required: 'You must accept the terms' })}
                className="h-4 w-4 mt-0.5 rounded shrink-0"
                style={{ accentColor: GOV.blue }}
              />
              <label htmlFor="reg-consent" className="text-xs" style={{ color: GOV.text }}>
                I consent to the processing of my data under the Eswatini Data Protection Act 2022
              </label>
            </div>
            {errors.consent && <p className="text-xs" style={{ color: GOV.error }}>{errors.consent.message}</p>}

            {serverError && (
              <div className="rounded-md px-3 py-2 text-xs" style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder}` }}>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
              style={{ backgroundColor: GOV.blue }}
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-xs text-center" style={{ color: GOV.textMuted }}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium hover:underline" style={{ color: GOV.blue }}>Login</Link>
            </p>
          </form>
        </div>
      </div>
    </OnboardingLayout>
  );
}
