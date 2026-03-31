import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GOV, TYPO } from '../../theme/government';

const RIASEC_COLORS = ['#F44336', '#2563eb', '#7c3aed', '#059669', '#d97706', '#2D8BC4'];

const SBadge = ({ status }) => {
  const map = {
    completed: 'bg-green-50 text-green-700 border-green-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    expired: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  if (!status) return <span className="text-xs" style={{ color: GOV.textHint }}>No test</span>;
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${map[status] || map.in_progress}`}>{status.replace('_', ' ')}</span>;
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: GOV.borderLight }}>
    <span className="text-xs" style={{ color: GOV.textMuted }}>{label}</span>
    <span className="text-sm font-semibold" style={{ color: GOV.text }}>{value}</span>
  </div>
);

const CounselorOverviewPanel = ({ students, institutionStats }) => {
  const navigate = useNavigate();

  const riasecData = institutionStats ? [
    { name: 'R', value: Number(institutionStats.avgR || 0) },
    { name: 'I', value: Number(institutionStats.avgI || 0) },
    { name: 'A', value: Number(institutionStats.avgA || 0) },
    { name: 'S', value: Number(institutionStats.avgS || 0) },
    { name: 'E', value: Number(institutionStats.avgE || 0) },
    { name: 'C', value: Number(institutionStats.avgC || 0) },
  ] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Recent Activity */}
      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <div className="p-4 border-b" style={{ borderColor: GOV.border }}>
          <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Recent Test Activity</h3>
        </div>
        <div className="divide-y" style={{ borderColor: GOV.borderLight }}>
          {students.filter(s => s.latestAssessment).slice(0, 10).map(s => (
            <div key={s.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: GOV.text }}>{s.firstName} {s.lastName}</p>
                <p className="text-xs" style={{ color: GOV.textMuted }}>{s.email || '–'}</p>
              </div>
              <div className="text-right">
                <SBadge status={s.latestAssessment?.status} />
                <p className="text-xs mt-0.5 font-mono" style={{ color: GOV.textMuted }}>
                  {s.latestAssessment?.hollandCode || `${Math.round(s.latestAssessment?.progress || 0)}%`}
                </p>
              </div>
              {s.latestAssessment?.status === 'completed' && (
                <button type="button"
                  onClick={() => navigate('/results', { state: { assessmentId: s.latestAssessment.id } })}
                  className="p-1 rounded hover:bg-gray-100">
                  <Eye className="w-4 h-4" style={{ color: GOV.blue }} />
                </button>
              )}
            </div>
          ))}
          {students.filter(s => s.latestAssessment).length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: GOV.textHint }}>No assessment activity yet.</div>
          )}
        </div>
      </div>

      {/* Institution Summary */}
      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <div className="p-4 border-b" style={{ borderColor: GOV.border }}>
          <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Institution Summary</h3>
        </div>
        <div className="p-5 space-y-3">
          {institutionStats ? (
            <>
              <Row label="Total Students" value={institutionStats.totalStudents ?? '–'} />
              <Row label="With Assessments" value={institutionStats.studentsWithAssessments ?? '–'} />
              <Row label="Completed Tests" value={institutionStats.completedCount ?? '–'} />
              <Row label="Avg RIASEC R" value={institutionStats.avgR ? Number(institutionStats.avgR).toFixed(1) : '–'} />
              <Row label="Avg RIASEC I" value={institutionStats.avgI ? Number(institutionStats.avgI).toFixed(1) : '–'} />
              <Row label="Avg RIASEC A" value={institutionStats.avgA ? Number(institutionStats.avgA).toFixed(1) : '–'} />
              {riasecData.some(d => d.value > 0) && (
                <div className="pt-2">
                  <p className="text-xs font-semibold mb-2" style={{ color: GOV.textMuted }}>RIASEC Average Scores</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={riasecData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {riasecData.map((_, idx) => <Cell key={idx} fill={RIASEC_COLORS[idx % RIASEC_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: GOV.textHint }}>No institution data. Students must complete assessments first.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounselorOverviewPanel;
