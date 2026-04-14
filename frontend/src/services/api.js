import axios from 'axios';

// Use origin only (e.g. http://localhost:5000). Paths in the app include /api/v1.
const rawUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
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
        processQueue(null, true);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
