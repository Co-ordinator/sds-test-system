import axios from 'axios';
import { normalizeApiError } from './errorNormalizer';

const isBrowser = typeof window !== 'undefined';
const hostName = isBrowser ? window.location.hostname : '';
const origin = isBrowser ? window.location.origin : '';
const localDevFallback = hostName === 'localhost' || hostName === '127.0.0.1'
  ? 'http://localhost:5000'
  : origin;

/** Strip trailing /api or /api/v1 so baseURL is the API host (or empty for same-origin proxy). */
const normalizeApiBase = (url) => {
  if (!url || typeof url !== 'string') return '';
  let t = url.trim().replace(/\/$/, '');
  t = t.replace(/\/api\/v1\/?$/i, '');
  t = t.replace(/\/api\/?$/i, '');
  return t;
};

const rawEnv = (process.env.REACT_APP_API_URL || '').trim();
const isLocalHost = hostName === 'localhost' || hostName === '127.0.0.1';
// Same-origin in dev so httpOnly SameSite=Strict cookies set by the API reach the browser (see package.json "proxy").
const useRelativeDevApi =
  isBrowser && process.env.NODE_ENV === 'development' && isLocalHost && !rawEnv;

const baseURL = useRelativeDevApi
  ? ''
  : normalizeApiBase(rawEnv) || localDevFallback || 'http://localhost:5000';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];
let authFailureNotified = false;

const isAuthEndpoint = (url = '') => {
  const normalizedUrl = url.toLowerCase();
  return normalizedUrl.includes('/api/v1/auth/login')
    || normalizedUrl.includes('/api/v1/auth/register')
    || normalizedUrl.includes('/api/v1/auth/refresh-token')
    || normalizedUrl.includes('/api/v1/auth/logout');
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const notifyAuthFailure = () => {
  if (authFailureNotified) return;
  authFailureNotified = true;
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
};

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    authFailureNotified = false;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const skipAuthRetry = Boolean(originalRequest?.skipAuthRetry);
    const suppressSessionExpired = Boolean(originalRequest?.suppressSessionExpired);

    // Handle 403 Forbidden - permission denied
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent('auth:permission-denied', {
        detail: { url: requestUrl, message: error.response?.data?.message }
      }));
    }

    if (
      error.response?.status === 401
      && originalRequest
      && !originalRequest._retry
      && !skipAuthRetry
      && !isAuthEndpoint(requestUrl)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          originalRequest._retry = true;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/api/v1/auth/refresh-token');
        authFailureNotified = false;
        processQueue(null, true);
        return api(originalRequest);
      } catch (err) {
        const normalized = err?.uiMessage ? err : normalizeApiError(err);
        processQueue(normalized, null);
        const refreshStatus = err?.response?.status ?? err?.status;
        if ((refreshStatus === 401 || refreshStatus === 403) && !suppressSessionExpired) {
          notifyAuthFailure();
        }
        return Promise.reject(normalized);
      } finally {
        isRefreshing = false;
      }
    }

    const normalized = normalizeApiError(error);
    return Promise.reject(normalized);
  }
);

export default api;
