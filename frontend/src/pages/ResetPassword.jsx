import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import AuthShell from '../components/auth/AuthShell';

const inputClass = (hasError) =>
  `h-11 w-full rounded-md border bg-white px-3 text-sm font-medium text-[#111827] shadow-sm outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#2d8bc4] focus:ring-2 focus:ring-[#2d8bc4]/15 ${
    hasError ? 'border-[#fecaca] bg-[#fffafa]' : 'border-[#d8e1ea]'
  }`;

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReset = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!token) {
      setFormError('Reset link is missing the security token. Please request a new reset code.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters. Any characters are allowed.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/v1/auth/reset-password', {
        token,
        newPassword,
        confirmPassword
      });
      setSuccessMessage('Password updated successfully. Redirecting to sign in...');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (error) {
      setFormError(error?.uiMessage || error?.raw?.response?.data?.message || 'Password reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Set new password"
      subtitle="Choose a new password for your SDS account."
      panelTitle="Secure password reset"
      panelText="Use the reset link from your inbox to set a new password and continue to the SDS assessment workspace."
    >
      <form onSubmit={submitReset} className="space-y-4">
        <div>
          <label htmlFor="reset-new-password" className="mb-1.5 block text-xs font-bold text-[#374151]">
            New password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
            <input
              id="reset-new-password"
              type={showNewPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 6 characters"
              className={`${inputClass(!!formError)} pl-9 pr-10`}
              aria-invalid={Boolean(formError)}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((previous) => !previous)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs font-medium text-[#6b7280]">
            Use 6 or more characters. Symbols, spaces, and passphrases are allowed.
          </p>
        </div>

        <div>
          <label htmlFor="reset-confirm-password" className="mb-1.5 block text-xs font-bold text-[#374151]">
            Confirm new password
          </label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
            <input
              id="reset-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat new password"
              className={`${inputClass(!!formError)} pl-9 pr-10`}
              aria-invalid={Boolean(formError)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((previous) => !previous)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {formError && (
          <div
            className="flex gap-2 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#b91c1c]"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {successMessage && (
          <div
            className="flex gap-2 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-xs font-medium text-[#166534]"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2d8bc4] px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#256b9a] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Updating password...' : 'Update password'}
        </button>

        <div className="rounded-md bg-[#f7fbff] px-3 py-3 text-center text-xs font-medium text-[#4b5563]">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-[#2d8bc4] hover:underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
