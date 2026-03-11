import React from 'react';
import { Loader2, AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';

/**
 * Enterprise-grade shared status components.
 * Use across all pages for consistent loading, error, and empty states.
 */

export const LoadingState = ({ message = 'Loading…', className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
    <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: GOV.blue }} />
    <p className="text-sm" style={{ color: GOV.textMuted }}>{message}</p>
  </div>
);

export const EmptyState = ({ icon: Icon = Inbox, title = 'No data', message = '', action, actionLabel = 'Refresh' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-3 rounded-full mb-3" style={{ backgroundColor: GOV.blueLightAlt }}>
      <Icon className="w-6 h-6" style={{ color: GOV.textHint }} />
    </div>
    <p className="text-sm font-semibold mb-1" style={{ color: GOV.text }}>{title}</p>
    {message && <p className="text-xs max-w-xs" style={{ color: GOV.textMuted }}>{message}</p>}
    {action && (
      <button
        type="button"
        onClick={action}
        className="mt-4 flex items-center gap-1.5 px-4 py-1.5 border rounded-md text-xs font-semibold"
        style={{ borderColor: GOV.border, color: GOV.blue }}
      >
        <RefreshCw className="w-3 h-3" /> {actionLabel}
      </button>
    )}
  </div>
);

export const ErrorBanner = ({ message = 'Something went wrong.', onRetry, onDismiss }) => (
  <div
    className="flex items-center gap-3 px-4 py-3 rounded-md border"
    style={{ backgroundColor: GOV.errorBg, borderColor: GOV.errorBorder }}
  >
    <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: GOV.error }} />
    <p className="flex-1 text-sm" style={{ color: GOV.error }}>{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold border"
        style={{ borderColor: GOV.errorBorder, color: GOV.error }}
      >
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    )}
    {onDismiss && (
      <button type="button" onClick={onDismiss} className="text-xs font-semibold" style={{ color: GOV.error }}>
        Dismiss
      </button>
    )}
  </div>
);

export const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold text-white ${
        toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
      }`}
    >
      {toast.msg}
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = React.useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, showToast, Toast };
};

export const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    counselor: 'bg-blue-50 text-blue-700 border-blue-200',
    user: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${styles[role] || styles.user}`}>
      {role === 'user' ? 'student' : role}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-green-50 text-green-700 border-green-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    expired: 'bg-gray-50 text-gray-500 border-gray-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    inactive: 'bg-red-50 text-red-600 border-red-200',
  };
  if (!status) return <span className="text-xs" style={{ color: GOV.textHint }}>—</span>;
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${styles[status] || styles.in_progress}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export const LastRefreshIndicator = ({ timestamp }) => {
  if (!timestamp) return null;
  return (
    <span className="text-[10px] italic" style={{ color: GOV.textHint }}>
      Last refreshed: {new Date(timestamp).toLocaleTimeString()}
    </span>
  );
};
