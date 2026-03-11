import api from './api';

const downloadBlob = (data, filename, mime = 'application/pdf') => {
  const url = window.URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const counselorService = {
  // ── Students ───────────────────────────────────────────────────────────
  getStudents: (institutionId = '') => {
    const params = institutionId ? `?institutionId=${institutionId}` : '';
    return api.get(`/api/v1/counselor/students${params}`).then(r => r.data?.data?.students || []);
  },
  updateStudent: (id, payload) =>
    api.patch(`/api/v1/counselor/students/${id}`, payload).then(r => r.data),
  deleteStudent: (id) =>
    api.delete(`/api/v1/counselor/students/${id}`).then(r => r.data),
  getStudentResults: (studentId) =>
    api.get(`/api/v1/counselor/students/${studentId}/results`).then(r => r.data?.data || null),

  // ── Institution stats ──────────────────────────────────────────────────
  getInstitutionStats: (institutionId = '') => {
    const params = institutionId ? `?institutionId=${institutionId}` : '';
    return api.get(`/api/v1/counselor/institution-stats${params}`)
      .then(r => ({
        stats: r.data?.data?.stats || null,
        hollandDistribution: r.data?.data?.hollandDistribution || [],
      }))
      .catch(() => ({ stats: null, hollandDistribution: [] }));
  },

  // ── Import ─────────────────────────────────────────────────────────────
  importStudents: (csvText, institutionId = '') => {
    const url = institutionId
      ? `/api/v1/counselor/students/import?institutionId=${institutionId}`
      : '/api/v1/counselor/students/import';
    return api.post(url, csvText, { headers: { 'Content-Type': 'text/csv' } })
      .then(r => r.data?.data?.credentials || []);
  },

  // ── Login cards ────────────────────────────────────────────────────────
  generateLoginCards: (institutionId = '', grade = '') => {
    const params = new URLSearchParams();
    if (institutionId) params.append('institutionId', institutionId);
    if (grade.trim()) params.append('grade', grade.trim());
    return api.get(`/api/v1/counselor/login-cards?${params}`, { responseType: 'blob' })
      .then(r => downloadBlob(r.data, `LoginCards${grade ? '_' + grade : ''}.pdf`));
  },

  // ── Results PDF ────────────────────────────────────────────────────────
  downloadResultPdf: (assessmentId, studentId) =>
    api.get(`/api/v1/results/${assessmentId}/pdf`, { responseType: 'blob' })
      .then(r => downloadBlob(r.data, `SDS_Report_${studentId || assessmentId}.pdf`)),
};
