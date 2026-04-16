import axios from 'axios';
import { normalizeApiError } from './errorNormalizer';

const isBrowser = typeof window !== 'undefined';
const hostName = isBrowser ? window.location.hostname : '';
const origin = isBrowser ? window.location.origin : '';
const localDevFallback = hostName === 'localhost' || hostName === '127.0.0.1'
  ? 'http://localhost:5000'
  : origin;

// Paths in the app include /api/v1, so this should point to origin only.
const rawUrl = (process.env.REACT_APP_API_URL || localDevFallback || 'http://localhost:5000').trim();
const baseURL = rawUrl.replace(/\/api\/v1\/?$/, '') || rawUrl;

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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    
    if (
      error.response?.status === 401
      && originalRequest
      && !originalRequest._retry
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
        const normalized = normalizeApiError(err);
        processQueue(normalized, null);
        notifyAuthFailure();
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
