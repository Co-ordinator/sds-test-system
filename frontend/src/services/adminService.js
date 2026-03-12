import api from './api';

const downloadBlob = (data, filename, mime = 'text/csv') => {
  const url = window.URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const adminService = {
  // ── Users ──────────────────────────────────────────────────────────────
  getUsers: (params = {}) => {
    const q = new URLSearchParams();
    if (params.role) q.set('role', params.role);
    if (params.search) q.set('search', params.search);
    return api.get(`/api/v1/admin/users?${q}`).then(r => r.data?.data?.users || []);
  },
  getUser: (id) => api.get(`/api/v1/admin/users/${id}`).then(r => r.data?.data?.user),
  updateUser: (id, payload) => api.patch(`/api/v1/admin/users/${id}`, payload).then(r => r.data),
  deleteUser: (id) => api.delete(`/api/v1/admin/users/${id}`).then(r => r.data),
  exportUsers: () => api.get('/api/v1/admin/export/users', { responseType: 'blob' })
    .then(r => downloadBlob(r.data, 'users_export.csv')),

  // ── Analytics ──────────────────────────────────────────────────────────
  getAnalytics: () => api.get('/api/v1/admin/analytics').then(r => r.data?.data || null),

  // ── Assessments ────────────────────────────────────────────────────────
  getAssessments: (limit = 200) =>
    api.get(`/api/v1/admin/assessments?limit=${limit}`).then(r => r.data?.data?.assessments || []),

  // ── Questions ──────────────────────────────────────────────────────────
  getQuestions: () => api.get('/api/v1/admin/questions').then(r => r.data?.data?.questions || []),
  createQuestion: (payload) => api.post('/api/v1/admin/questions', payload).then(r => r.data),
  updateQuestion: (id, payload) => api.patch(`/api/v1/admin/questions/${id}`, payload).then(r => r.data),
  deleteQuestion: (id) => api.delete(`/api/v1/admin/questions/${id}`).then(r => r.data),
  importQuestions: (csvText) =>
    api.post('/api/v1/admin/questions/import', csvText, { headers: { 'Content-Type': 'text/csv' } }).then(r => r.data),
  exportQuestions: () =>
    api.get('/api/v1/admin/questions/export?format=csv', { responseType: 'blob' })
      .then(r => downloadBlob(r.data, 'questions.csv')),

  // ── Occupations ────────────────────────────────────────────────────────
  getOccupations: () => api.get('/api/v1/admin/occupations').then(r => r.data?.data?.occupations || []),
  createOccupation: (payload) => api.post('/api/v1/admin/occupations', payload).then(r => r.data),
  updateOccupation: (id, payload) => api.patch(`/api/v1/admin/occupations/${id}`, payload).then(r => r.data),
  deleteOccupation: (id) => api.delete(`/api/v1/admin/occupations/${id}`).then(r => r.data),
  importOccupations: (csvText) =>
    api.post('/api/v1/admin/occupations/import', csvText, { headers: { 'Content-Type': 'text/csv' } }).then(r => r.data),
  exportOccupations: () =>
    api.get('/api/v1/admin/occupations/export?format=csv', { responseType: 'blob' })
      .then(r => downloadBlob(r.data, 'occupations.csv')),

  // ── User Creation ─────────────────────────────────────────────────────
  createUser: (payload) => api.post('/api/v1/admin/users', payload).then(r => r.data),

  // ── Permissions ──────────────────────────────────────────────────────
  getPermissions: () => api.get('/api/v1/admin/permissions').then(r => r.data?.data?.permissions || []),
  getUserPermissions: (id) => api.get(`/api/v1/admin/permissions/user/${id}`).then(r => r.data?.data?.user),
  updateUserPermissions: (id, permissionIds) => api.patch(`/api/v1/admin/users/${id}/permissions`, { permissionIds }).then(r => r.data),

  // ── Audit Logs ─────────────────────────────────────────────────────────
  getAuditLogs: () => api.get('/api/v1/admin/audit-logs').then(r => r.data?.data?.logs || []),
  getAuditLog: (id) => api.get(`/api/v1/admin/audit-logs/${id}`).then(r => r.data?.data?.log),

  // ── Institutions ───────────────────────────────────────────────────────
  getInstitutions: () => api.get('/api/v1/institutions').then(r => r.data?.data?.institutions || []),
  createInstitution: (payload) => api.post('/api/v1/institutions', payload).then(r => r.data?.data?.institution),
  updateInstitution: (id, payload) => api.patch(`/api/v1/institutions/${id}`, payload).then(r => r.data),
  deleteInstitution: (id) => api.delete(`/api/v1/institutions/${id}`).then(r => r.data),
  importInstitutions: (csvText) =>
    api.post('/api/v1/institutions/import', csvText, { headers: { 'Content-Type': 'text/csv' } }).then(r => r.data),
  exportInstitutions: () =>
    api.get('/api/v1/institutions/export', { responseType: 'blob' })
      .then(r => downloadBlob(r.data, 'institutions.csv')),

  // ── Subjects ───────────────────────────────────────────────────────────
  getSubjects: () => api.get('/api/v1/admin/subjects').then(r => r.data?.data?.subjects || []),
  createSubject: (payload) => api.post('/api/v1/admin/subjects', payload).then(r => r.data),
  updateSubject: (id, payload) => api.patch(`/api/v1/admin/subjects/${id}`, payload).then(r => r.data),
  deleteSubject: (id) => api.delete(`/api/v1/admin/subjects/${id}`).then(r => r.data),
  importSubjects: (csvText) =>
    api.post('/api/v1/admin/subjects/import', csvText, { headers: { 'Content-Type': 'text/csv' } }).then(r => r.data),
  exportSubjects: () =>
    api.get('/api/v1/admin/subjects/export', { responseType: 'blob' })
      .then(r => downloadBlob(r.data, 'subjects.csv')),

  // ── PDF ────────────────────────────────────────────────────────────────
  downloadResultPdf: (assessmentId) =>
    api.get(`/api/v1/results/${assessmentId}/pdf`, { responseType: 'blob' })
      .then(r => downloadBlob(r.data, `SDS_Report_${assessmentId}.pdf`, 'application/pdf')),

  // ── Certificates ───────────────────────────────────────────────────────
  getCertificates: () => api.get('/api/v1/admin/certificates').then(r => r.data?.data?.certificates || []),
  generateCertificate: (assessmentId) =>
    api.post(`/api/v1/admin/certificates/${assessmentId}/generate`).then(r => r.data),
  downloadCertificate: (assessmentId, certNumber) =>
    api.get(`/api/v1/admin/certificates/${assessmentId}/download`, { responseType: 'blob' })
      .then(r => downloadBlob(r.data, `SDS_Certificate_${(certNumber || assessmentId).replace(/\//g, '-')}.pdf`, 'application/pdf')),
};
