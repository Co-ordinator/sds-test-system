import api from './api';

export const analyticsService = {
  // ── Summary / overview ─────────────────────────────────────────────────
  getOverview: () => api.get('/api/v1/analytics/overview').then(r => r.data?.data || null),
  getRegional: () => api.get('/api/v1/analytics/regional').then(r => r.data?.data || null),
  getTrends: (params = {}) => {
    const q = new URLSearchParams();
    if (params.period) q.set('period', params.period);
    if (params.institutionId) q.set('institutionId', params.institutionId);
    return api.get(`/api/v1/analytics/trends?${q}`).then(r => r.data?.data || null);
  },

  // ── Institution analytics ──────────────────────────────────────────────
  getInstitutionBreakdown: () =>
    api.get('/api/v1/analytics/institutions').then(r => r.data?.data || null),

  // ── Career intelligence ────────────────────────────────────────────────
  getCareerIntelligence: () =>
    api.get('/api/v1/analytics/careers').then(r => r.data?.data || null),

  // ── Knowledge graph ────────────────────────────────────────────────────
  getKnowledgeGraph: () =>
    api.get('/api/v1/analytics/knowledge-graph').then(r => r.data?.data || null),

  // ── Export ─────────────────────────────────────────────────────────────
  exportReport: (type = 'summary') =>
    api.get(`/api/v1/analytics/export?type=${type}`, { responseType: 'blob' })
      .then(r => {
        const url = window.URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${type}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }),
};
