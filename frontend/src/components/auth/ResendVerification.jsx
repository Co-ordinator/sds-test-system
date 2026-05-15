import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { GOV, TYPO } from '../../theme/government';
import api from '../../services/api';

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export default function ResendVerification({ onClose, defaultEmail = '' }) {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState(defaultEmail || '');
  const [resendAvailableInSeconds, setResendAvailableInSeconds] = useState(120);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues
  } = useForm({
    defaultValues: {
      email: defaultEmail
    }
  });

  const onSubmit = async (data) => {
    const payload = { email: String(data.email || '').trim().toLowerCase() };
    try {
      const response = await api.post('/api/v1/auth/resend-verification', payload);
      const cooldownSeconds = toPositiveInt(response?.data?.resendAvailableInSeconds, 120);
      setResendAvailableInSeconds(cooldownSeconds);
      setSentTo(payload.email);
      setSuccess(true);
      setError('');
    } catch (err) {
      const retrySeconds = toPositiveInt(
        err?.raw?.response?.data?.resendAvailableInSeconds ?? err?.response?.data?.resendAvailableInSeconds,
        -1
      );
      if (retrySeconds >= 0) {
        setResendAvailableInSeconds(retrySeconds);
      }
      setError(err?.uiMessage || err?.raw?.response?.data?.message || 'Failed to resend verification code.');
      setSuccess(false);
    }
  };

  const openOtpPage = () => {
    const email = sentTo || String(getValues('email') || '').trim().toLowerCase();
    navigate('/registration-success', {
      state: {
        email,
        verificationEmailSent: true,
        resendAvailableInSeconds,
        message: 'A verification code was sent to your email. Enter it to continue.'
      }
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="resend-verification-title">
      <div className="w-full max-w-md rounded-md border bg-white p-6" style={{ borderColor: GOV.border }}>
        <div className="mb-4 flex items-start justify-between">
          <h3 id="resend-verification-title" className={TYPO.sectionTitle} style={{ color: GOV.text }}>Resend Verification Code</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500" aria-label="Close">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="py-3 text-center" role="status" aria-live="polite">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className={`${TYPO.body} mb-4`} style={{ color: GOV.textMuted }}>
              Verification code sent to <span className="font-semibold">{sentTo || 'your email'}</span>.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={openOtpPage}
                className="w-full rounded-md py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: GOV.blue }}
              >
                Enter code
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-md border py-2.5 text-sm font-semibold"
                style={{ borderColor: GOV.border, color: GOV.text }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={`mb-1 block ${TYPO.label}`} style={{ color: GOV.text }}>Email address</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className={`w-full rounded-md border px-3 py-2 ${TYPO.body} focus:outline-none focus:ring-2 focus:ring-offset-0`}
                style={{ borderColor: errors.email ? GOV.error : GOV.border, color: GOV.text }}
              />
              {errors.email && <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.email.message}</p>}
            </div>

            {error && (
              <div
                className={`rounded-md px-3 py-2 ${TYPO.hint}`}
                style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder}` }}
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border bg-white px-4 py-2 text-sm font-semibold"
                style={{ borderColor: GOV.border, color: GOV.text }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: GOV.blue }}
              >
                {isSubmitting ? 'Sending...' : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
