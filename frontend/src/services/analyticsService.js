import api from './api';

const BASE = '/api/v1/analytics';

const qs = (filters = {}) => {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const analyticsService = {
  // ── Overview / KPIs ────────────────────────────────────────────────────
  getOverview: (filters = {}) =>
    api.get(`${BASE}${qs(filters)}`).then(r => r.data?.data || null),

  // ── Holland code distribution ─────────────────────────────────────────
  getHollandDistribution: (filters = {}) =>
    api.get(`${BASE}/holland-distribution${qs(filters)}`).then(r => r.data?.data?.distribution || []),

  // ── Monthly assessment trend ──────────────────────────────────────────
  getTrend: (filters = {}) =>
    api.get(`${BASE}/trend${qs(filters)}`).then(r => r.data?.data?.trend || []),

  // ── Regional breakdown ────────────────────────────────────────────────
  getRegional: (filters = {}) =>
    api.get(`${BASE}/regional${qs(filters)}`).then(r => r.data?.data || null),

  // ── Segmentation (gender × RIASEC, userType × RIASEC, Holland by gender)
  getSegmentation: (filters = {}) =>
    api.get(`${BASE}/segmentation${qs(filters)}`).then(r => r.data?.data || null),

  // ── Career Knowledge Graph (occupations, courses, institutions stats) ──
  getKnowledgeGraph: () =>
    api.get(`${BASE}/knowledge-graph`).then(r => r.data?.data || null),

  // ── Skills pipeline (30-day Holland momentum + emerging careers) ───────
  getSkillsPipeline: () =>
    api.get(`${BASE}/skills-pipeline`).then(r => r.data?.data || null),

  // ── Per-institution analytics ─────────────────────────────────────────
  getInstitutionBreakdown: () =>
    api.get(`${BASE}/institutions`).then(r => r.data?.data || null),

  // ── Export (CSV or PDF, filter-aware) ────────────────────────────────
  exportReport: (format = 'csv', filters = {}) => {
    const params = new URLSearchParams({ format });
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    return api.get(`${BASE}/export?${params}`, { responseType: 'blob' }).then(r => {
      const mime = format === 'pdf' ? 'application/pdf' : 'text/csv';
      const url = window.URL.createObjectURL(new Blob([r.data], { type: mime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_report_${Date.now()}.${format === 'pdf' ? 'pdf' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  },
};
