import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, TYPO } from '../theme/government';
import api from '../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setServerError('');
    setSuccess(false);
    
    try {
      await api.post('/api/v1/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <OnboardingLayout>
      <div className="w-full max-w-[480px] mx-auto">
        <div
          className="w-full bg-white rounded-md border overflow-hidden"
          style={{ borderColor: GOV.border }}
        >
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-center mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: GOV.blueLightAlt }}
              >
                <Lock className="w-6 h-6" style={{ color: GOV.blue }} />
              </div>
            </div>
            <h1 className={`${TYPO.pageTitle} text-center`} style={{ color: GOV.text }}>
              Change Your Password
            </h1>
            <p className={`${TYPO.bodySmall} text-center mt-2`} style={{ color: GOV.textMuted }}>
              For security reasons, you must change your password before continuing.
            </p>
          </div>

          <form className="px-6 pt-2 pb-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="current-password" className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                Current Password
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  {...register('currentPassword', { required: 'Current password is required' })}
                  autoComplete="current-password"
                  className={`form-control ${TYPO.body} pr-10`}
                  style={{ borderBottomColor: errors.currentPassword ? GOV.error : GOV.border, color: GOV.text }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: GOV.textMuted }}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="new-password" className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  {...register('newPassword', {
                    required: 'New password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    pattern: {
                      value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
                      message: 'Password must contain both letters and numbers'
                    }
                  })}
                  autoComplete="new-password"
                  className={`form-control ${TYPO.body} pr-10`}
                  style={{ borderBottomColor: errors.newPassword ? GOV.error : GOV.border, color: GOV.text }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: GOV.textMuted }}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.newPassword.message}</p>
              )}
              <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.textMuted }}>
                At least 8 characters with both letters and numbers
              </p>
            </div>

            <div>
              <label htmlFor="confirm-password" className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === newPassword || 'Passwords do not match'
                  })}
                  autoComplete="new-password"
                  className={`form-control ${TYPO.body} pr-10`}
                  style={{ borderBottomColor: errors.confirmPassword ? GOV.error : GOV.border, color: GOV.text }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: GOV.textMuted }}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            {serverError && (
              <div
                className={`rounded-md px-3 py-2 ${TYPO.hint} flex items-start gap-2`}
                style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder}` }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {success && (
              <div
                className={`rounded-md px-3 py-2 ${TYPO.hint}`}
                style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
              >
                Password changed successfully! Redirecting...
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || success}
              className={`w-full py-2.5 rounded-md font-semibold ${TYPO.bodySmall} text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
              style={{ backgroundColor: GOV.blue }}
            >
              {isSubmitting ? 'Changing Password...' : success ? 'Success!' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default ChangePassword;
