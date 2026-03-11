import React, { useEffect, useState } from 'react';
import { Download, Users, FileCheck, Activity } from 'lucide-react';
import api from '../services/api';
import { GOV, TYPO } from '../theme/government';
import AppShell from '../components/layout/AppShell';

const Reports = () => {
  const [institutionAnalytics, setInstitutionAnalytics] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, iRes] = await Promise.all([
          api.get('/api/v1/admin/analytics'),
          api.get('/api/v1/admin/analytics/institutions'),
        ]);
        setAnalytics(aRes.data?.data || null);
        setInstitutionAnalytics(iRes.data?.data?.institutions || []);
      } catch { /* non-fatal */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleExport = async (type, filename) => {
    try {
      const res = await api.get(`/api/v1/admin/export/${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = filename || `${type}_export.csv`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
      showToast('Export downloaded');
    } catch { showToast('Export failed', 'error'); }
  };

  const STATS = [
    { label: 'Total Students', value: analytics?.totals?.students ?? '–', Icon: Users },
    { label: 'Total Counselors', value: analytics?.totals?.counselors ?? '–', Icon: Users },
    { label: 'Total Tests', value: analytics?.totals?.assessments ?? '–', Icon: FileCheck },
    { label: 'Completion Rate', value: analytics?.completionRate != null ? `${analytics.completionRate}%` : '–', Icon: Activity },
  ];

  return (
    <AppShell breadcrumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Reports' }]}>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-md border p-5" style={{ borderColor: GOV.border }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className={TYPO.pageTitle} style={{ color: GOV.text }}>Reports</h1>
              <p className={TYPO.body} style={{ color: GOV.textMuted }}>Export system data and view per-institution breakdowns.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => handleExport('users', 'users_export.csv')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ backgroundColor: GOV.blue }}>
                <Download className="w-4 h-4" /> Export Users CSV
              </button>
              <button type="button" onClick={() => handleExport('assessments', 'assessments_export.csv')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold border bg-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ borderColor: GOV.border, color: GOV.blue }}>
                <Download className="w-4 h-4" /> Export Results CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map(({ label, value, Icon }) => (
            <div key={label} className="bg-white rounded-md border p-4" style={{ borderColor: GOV.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: GOV.textMuted }}>{label}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: GOV.text }}>{value}</p>
                </div>
                <div className="p-2 rounded-md" style={{ backgroundColor: GOV.blueLightAlt }}>
                  <Icon className="w-4 h-4" style={{ color: GOV.blue }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Per-institution breakdown */}
        <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: GOV.border }}>
            <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Per-Institution Breakdown</h3>
            <span className="text-xs" style={{ color: GOV.textMuted }}>{institutionAnalytics.length} institutions</span>
          </div>
          {loading ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: GOV.textHint }}>Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead style={{ backgroundColor: GOV.blueLightAlt, color: GOV.textMuted }}>
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">Institution</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">Region</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">Students</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">Tests</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">Completed</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">Rate</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase">Export</th>
                  </tr>
                </thead>
                <tbody>
                  {institutionAnalytics.map(inst => (
                    <tr key={inst.institutionId} className="border-b" style={{ borderColor: GOV.borderLight }}>
                      <td className="px-4 py-3 font-medium" style={{ color: GOV.text }}>{inst.institutionName}</td>
                      <td className="px-4 py-3 capitalize text-xs" style={{ color: GOV.textMuted }}>{inst.region || '–'}</td>
                      <td className="px-4 py-3 capitalize text-xs" style={{ color: GOV.textMuted }}>{inst.type || '–'}</td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: GOV.text }}>{inst.totalStudents}</td>
                      <td className="px-4 py-3 text-xs">{inst.totalAssessments}</td>
                      <td className="px-4 py-3 text-xs">{inst.completedAssessments}</td>
                      <td className="px-4 py-3 text-xs font-semibold"
                        style={{ color: inst.completionRate >= 50 ? '#059669' : GOV.text }}>
                        {inst.completionRate}%
                      </td>
                      <td className="px-4 py-3">
                        <button type="button"
                          onClick={() => handleExport(`assessments?institutionId=${inst.institutionId}`, `${inst.institutionName}_results.csv`)}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border transition-all duration-150 hover:scale-[1.05] active:scale-95 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-1"
                          style={{ borderColor: GOV.border, color: GOV.blue }}>
                          <Download className="w-3 h-3" /> CSV
                        </button>
                      </td>
                    </tr>
                  ))}
                  {institutionAnalytics.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: GOV.textHint }}>No institution data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Reports;
