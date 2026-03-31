import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { GOV, TYPO } from '../../theme/government';

const RIASEC_COLORS = ['#F44336', '#2563eb', '#7c3aed', '#059669', '#d97706', '#2D8BC4'];
const PIE_COLORS = ['#F44336', '#FFEB3B', '#7FBEEB', '#2563eb', '#7c3aed', '#059669', '#d97706', '#2D8BC4'];

const CounselorAnalyticsPanel = ({ institutionStats, hollandDist }) => {
  const riasecData = institutionStats ? [
    { name: 'R', value: Number(institutionStats.avgR || 0) },
    { name: 'I', value: Number(institutionStats.avgI || 0) },
    { name: 'A', value: Number(institutionStats.avgA || 0) },
    { name: 'S', value: Number(institutionStats.avgS || 0) },
    { name: 'E', value: Number(institutionStats.avgE || 0) },
    { name: 'C', value: Number(institutionStats.avgC || 0) },
  ] : [];

  const pieData = (hollandDist || []).slice(0, 8).map(d => ({ name: d.hollandCode, value: Number(d.count) }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-md border p-5" style={{ borderColor: GOV.border }}>
          <h3 className={`${TYPO.sectionTitle} mb-4`} style={{ color: GOV.text }}>RIASEC Average Scores</h3>
          {riasecData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riasecData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riasecData.map((_, idx) => <Cell key={idx} fill={RIASEC_COLORS[idx % RIASEC_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: GOV.textHint }}>No completed assessments yet.</div>
          )}
        </div>

        <div className="bg-white rounded-md border p-5" style={{ borderColor: GOV.border }}>
          <h3 className={`${TYPO.sectionTitle} mb-4`} style={{ color: GOV.text }}>Holland Code Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: GOV.textHint }}>No data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounselorAnalyticsPanel;
