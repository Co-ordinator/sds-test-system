import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { GOV, TYPO } from '../../theme/government';

export default function ResendVerification({ onClose, defaultEmail = '' }) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    defaultValues: {
      email: defaultEmail
    }
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/api/v1/auth/resend-verification', data);
      setSuccess(true);
      setError('');
    } catch (err) {
      setError(err?.uiMessage || err?.response?.data?.message || 'Failed to resend verification');
      setSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md border p-6 max-w-md w-full" style={{ borderColor: GOV.border }}>
        <div className="flex justify-between items-start mb-4">
          <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Resend Verification Link</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className={`${TYPO.body} mb-4`} style={{ color: GOV.textMuted }}>Verification link sent. Please check your inbox.</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full flex justify-center py-2.5 px-4 rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: GOV.blue }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Email Address</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className={`w-full px-3 py-2 border rounded-md ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                style={{ borderColor: errors.email ? GOV.error : GOV.border, color: GOV.text }}
              />
              {errors.email && <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.email.message}</p>}
            </div>

            {error && (
              <div className={`rounded-md px-3 py-2 ${TYPO.hint}`} style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder}` }}>
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md text-sm font-semibold bg-white"
                style={{ borderColor: GOV.border, color: GOV.text }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: GOV.blue }}
              >
                {isSubmitting ? 'Sending...' : 'Resend Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
