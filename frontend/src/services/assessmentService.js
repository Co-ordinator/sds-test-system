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

export const assessmentService = {
  // ── Start / progress ───────────────────────────────────────────────────
  start: () => api.post('/api/v1/assessments/start').then(r => r.data),
  getProgress: (id) => api.get(`/api/v1/assessments/${id}/progress`).then(r => r.data),
  submitAnswer: (id, payload) => api.post(`/api/v1/assessments/${id}/answer`, payload).then(r => r.data),
  complete: (id) => api.post(`/api/v1/assessments/${id}/complete`).then(r => r.data),

  // ── Results ────────────────────────────────────────────────────────────
  getResults: (id) => api.get(`/api/v1/results/${id}`).then(r => r.data?.data || null),
  downloadPdf: (id) =>
    api.get(`/api/v1/results/${id}/pdf`, { responseType: 'blob' })
      .then(r => downloadBlob(r.data, `SDS_Report_${id}.pdf`)),

  // ── My assessments (student) ───────────────────────────────────────────
  getMyAssessments: () => api.get('/api/v1/assessments/my').then(r => r.data?.data?.assessments || []),
};
