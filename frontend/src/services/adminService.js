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
  bulkDeleteQuestions: (ids) => api.post('/api/v1/admin/questions/bulk-delete', { ids }).then(r => r.data),
  importQuestions: (csvText) =>
    api.post('/api/v1/admin/questions/import', csvText, { headers: { 'Content-Type': 'text/csv' } }).then(r => r.data),
  exportQuestions: () =>
    api.get('/api/v1/admin/questions/export?format=csv', { responseType: 'blob' })
      .then(r => downloadBlob(r.data, 'questions.csv')),

  // ── Occupations ────────────────────────────────────────────────────────
  getOccupations: () => api.get('/api/v1/admin/occupations').then(r => r.data?.data?.occupations || []),
  createOccupation: (payload) => api.post('/api/v1/admin/occupations', payload).then(r => r.data),
  updateOccupation: (id, payload) => api.patch(`/api/v1/admin/occupations/${id}`, payload).then(r => r.data),
  reviewOccupation: (id, payload) => api.patch(`/api/v1/admin/occupations/${id}/review`, payload).then(r => r.data),
  deleteOccupation: (id) => api.delete(`/api/v1/admin/occupations/${id}`).then(r => r.data),
  bulkDeleteOccupations: (ids) => api.post('/api/v1/admin/occupations/bulk-delete', { ids }).then(r => r.data),
  bulkApproveOccupations: (ids) => api.post('/api/v1/admin/occupations/bulk-approve', { ids }).then(r => r.data),
  importOccupations: (csvText) =>
    api.post('/api/v1/admin/occupations/import', csvText, { headers: { 'Content-Type': 'text/csv' } }).then(r => r.data),
  exportOccupations: () =>
    api.get('/api/v1/admin/occupations/export?format=csv', { responseType: 'blob' })
      .then(r => downloadBlob(r.data, 'occupations.csv')),

  // ── Bulk User Operations ──────────────────────────────────────────────
  bulkDeleteUsers: (ids) => api.post('/api/v1/admin/users/bulk-delete', { ids }).then(r => r.data),
  bulkUpdateUsers: (ids, updates) => api.post('/api/v1/admin/users/bulk-update', { ids, updates }).then(r => r.data),

  // ── User Creation ─────────────────────────────────────────────────────
  createUser: (payload) => api.post('/api/v1/admin/users', payload).then(r => r.data),

  // ── Permissions ──────────────────────────────────────────────────────
  getPermissions: () => api.get('/api/v1/admin/permissions').then(r => r.data?.data?.permissions || []),
  getUserPermissions: (id) => api.get(`/api/v1/admin/permissions/user/${id}`).then(r => r.data?.data?.user),
  updateUserPermissions: (id, permissionIds) => api.patch(`/api/v1/admin/users/${id}/permissions`, { permissionIds }).then(r => r.data),

  // ── Audit Logs ─────────────────────────────────────────────────────────
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams();
    if (params.actionType) q.set('actionType', params.actionType);
    if (params.userId) q.set('userId', params.userId);
    if (params.search) q.set('search', params.search);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    if (params.limit) q.set('limit', params.limit);
    if (params.offset) q.set('offset', params.offset);
    return api.get(`/api/v1/admin/audit-logs?${q}`).then(r => ({ logs: r.data?.data?.logs || [], total: r.data?.total || 0 }));
  },
  getAuditLog: (id) => api.get(`/api/v1/admin/audit-logs/${id}`).then(r => r.data?.data?.log),
  exportAuditLogs: (params = {}) => {
    const q = new URLSearchParams();
    if (params.actionType) q.set('actionType', params.actionType);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    return api.get(`/api/v1/admin/audit-logs/export?${q}`, { responseType: 'blob' })
      .then(r => downloadBlob(r.data, 'audit_logs.csv'));
  },

  // ── Institutions ───────────────────────────────────────────────────────
  getInstitutions: () => api.get('/api/v1/institutions').then(r => r.data?.data?.institutions || []),
  createInstitution: (payload) => api.post('/api/v1/institutions', payload).then(r => r.data?.data?.institution),
  updateInstitution: (id, payload) => api.patch(`/api/v1/institutions/${id}`, payload).then(r => r.data),
  reviewInstitution: (id, payload) => api.patch(`/api/v1/institutions/${id}/review`, payload).then(r => r.data),
  deleteInstitution: (id) => api.delete(`/api/v1/institutions/${id}`).then(r => r.data),
  bulkDeleteInstitutions: (ids) => api.post('/api/v1/institutions/bulk-delete', { ids }).then(r => r.data),
  bulkApproveInstitutions: (ids) => api.post('/api/v1/institutions/bulk-approve', { ids }).then(r => r.data),
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

  // ── Courses ────────────────────────────────────────────────────────────
  getCourses: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.qualificationType) q.set('qualificationType', params.qualificationType);
    if (params.fundingPriority !== undefined && params.fundingPriority !== null && params.fundingPriority !== '') {
      q.set('fundingPriority', params.fundingPriority === true ? 'true' : params.fundingPriority === false ? 'false' : String(params.fundingPriority));
    }
    if (params.isActive !== undefined) q.set('isActive', params.isActive);
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.offset != null) q.set('offset', String(params.offset));
    return api.get(`/api/v1/courses?${q}`).then(r => r.data?.data?.courses || []);
  },
  getCourse: (id) => api.get(`/api/v1/courses/${id}`).then(r => r.data?.data?.course),
  createCourse: (payload) => api.post('/api/v1/courses', payload).then(r => r.data),
  updateCourse: (id, payload) => api.patch(`/api/v1/courses/${id}`, payload).then(r => r.data),
  deleteCourse: (id) => api.delete(`/api/v1/courses/${id}`).then(r => r.data),
  bulkDeleteCourses: (ids) => api.post('/api/v1/courses/bulk-delete', { ids }).then(r => r.data),
  importCourses: (csvText) =>
    api.post('/api/v1/courses/import', csvText, { headers: { 'Content-Type': 'text/csv' } }).then(r => r.data),
  exportCourses: () =>
    api.get('/api/v1/courses/export', { responseType: 'blob' })
      .then(r => downloadBlob(r.data, 'courses.csv')),
  addCourseRequirement: (courseId, payload) =>
    api.post(`/api/v1/courses/${courseId}/requirements`, payload).then(r => r.data),
  removeCourseRequirement: (courseId, reqId) =>
    api.delete(`/api/v1/courses/${courseId}/requirements/${reqId}`).then(r => r.data),
  linkCourseInstitution: (courseId, payload) =>
    api.post(`/api/v1/courses/${courseId}/institutions`, payload).then(r => r.data),
  unlinkCourseInstitution: (courseId, institutionId) =>
    api.delete(`/api/v1/courses/${courseId}/institutions/${institutionId}`).then(r => r.data),
  linkCourseOccupation: (courseId, payload) =>
    api.post(`/api/v1/courses/${courseId}/occupations`, payload).then(r => r.data),
  unlinkCourseOccupation: (courseId, occupationId) =>
    api.delete(`/api/v1/courses/${courseId}/occupations/${occupationId}`).then(r => r.data),

  // ── Education Levels ────────────────────────────────────────────────────
  getEducationLevels: () =>
    api.get('/api/v1/admin/education-levels').then(r => r.data?.data?.educationLevels || []),
  createEducationLevel: (payload) =>
    api.post('/api/v1/admin/education-levels', payload).then(r => r.data),
  updateEducationLevel: (id, payload) =>
    api.patch(`/api/v1/admin/education-levels/${id}`, payload).then(r => r.data),
  deleteEducationLevel: (id) =>
    api.delete(`/api/v1/admin/education-levels/${id}`).then(r => r.data),

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
