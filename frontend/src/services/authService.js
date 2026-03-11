import api from './api';

export const authService = {
  login: (credentials) =>
    api.post('/api/v1/auth/login', credentials).then(r => r.data),
  register: (payload) =>
    api.post('/api/v1/auth/register', payload).then(r => r.data),
  logout: () =>
    api.post('/api/v1/auth/logout').then(r => r.data),
  me: () =>
    api.get('/api/v1/auth/me').then(r => r.data?.data?.user ?? r.data?.user),
  updateProfile: (payload) =>
    api.patch('/api/v1/auth/me', payload).then(r => r.data),
  changePassword: (payload) =>
    api.post('/api/v1/auth/change-password', payload).then(r => r.data),
  forgotPassword: (email) =>
    api.post('/api/v1/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token, password) =>
    api.post('/api/v1/auth/reset-password', { token, password }).then(r => r.data),
  verifyEmail: (token) =>
    api.post('/api/v1/auth/verify-email', { token }).then(r => r.data),
  resendVerification: () =>
    api.post('/api/v1/auth/resend-verification').then(r => r.data),
  deleteAccount: () =>
    api.delete('/api/v1/auth/me').then(r => r.data),
  exportData: () =>
    api.get('/api/v1/auth/me/export', { responseType: 'blob' }).then(r => r.data),
};
