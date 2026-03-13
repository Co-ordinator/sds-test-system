import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, TYPO } from '../theme/government';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await api.post(`/api/v1/auth/reset-password/${token}`, {
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
        password: data.password
      });
      setSuccess(true);
      setError('');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
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
              Set new password
            </h1>
            <p className={`${TYPO.bodySmall} text-center mt-1`} style={{ color: GOV.textMuted }}>
              Choose a new password for your account
            </p>
          </div>

          {success ? (
            <div className="px-6 py-6 text-center">
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                Password updated successfully. Redirecting to Login…
              </p>
              <Link
                to="/login"
                className={`inline-block mt-4 ${TYPO.hint} font-medium`}
                style={{ color: GOV.blue }}
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form className="px-6 pt-4 pb-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="reset-password" className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>New password</label>
                <input
                  id="reset-password"
                  type="password"
                  {...register('password', {
                    required: 'Required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                    pattern: {
                      value: /^(?=.*[a-zA-Z])(?=.*[0-9])/,
                      message: 'Use letters and numbers'
                    }
                  })}
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: errors.password ? GOV.error : GOV.border, color: GOV.text }}
                />
                {errors.password && (
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="reset-confirm" className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Confirm new password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Required',
                    validate: (value) => value === password || 'Passwords must match'
                  })}
                  className={`form-control ${TYPO.body}`}
                  style={{ borderBottomColor: errors.confirmPassword ? GOV.error : GOV.border, color: GOV.text }}
                />
                {errors.confirmPassword && (
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.confirmPassword.message}</p>
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
                {isSubmitting ? 'Updating…' : 'Update password'}
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
