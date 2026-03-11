import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { GOV } from '../../theme/government';
import { RIASEC_COLORS, RIASEC_LABELS, PIE_COLORS } from './analyticsConstants';

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-lg border shadow-sm" style={{ borderColor: GOV.border }}>
    <div className="px-5 pt-5 pb-2">
      <h3 className="text-sm font-bold" style={{ color: GOV.text }}>{title}</h3>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: GOV.textHint }}>{subtitle}</p>}
    </div>
    <div className="px-5 pb-5">{children}</div>
  </div>
);

const KnowledgeGraphFlow = ({ kgData }) => {
  if (!kgData) return null;
  const { summary, riasecCareerFlow } = kgData;
  const layers = [
    { label: 'RIASEC Profiles', count: 6, icon: '🎯', color: '#2563eb' },
    { label: 'Skills', count: (kgData.topSkills || []).length, icon: '⚡', color: '#7c3aed' },
    { label: 'Careers', count: summary?.totalOccupations || 0, icon: '💼', color: '#059669' },
    { label: 'Courses', count: summary?.totalCourses || 0, icon: '📚', color: '#d97706' },
    { label: 'Institutions', count: summary?.totalInstitutions || 0, icon: '🏛️', color: '#dc2626' },
    { label: 'Job Market', count: summary?.totalCourseLinks || 0, icon: '📊', color: '#0891b2' },
  ];

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6" style={{ borderColor: GOV.border }}>
      <h3 className="text-sm font-bold mb-1" style={{ color: GOV.text }}>Career Knowledge Graph</h3>
      <p className="text-xs mb-6" style={{ color: GOV.textHint }}>How your platform connects students to career outcomes</p>
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
        {layers.map((layer, i) => (
          <React.Fragment key={layer.label}>
            <div className="flex flex-col items-center min-w-[90px]">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shadow-sm border"
                style={{ backgroundColor: `${layer.color}10`, borderColor: `${layer.color}30` }}>
                {layer.icon}
              </div>
              <span className="text-xs font-bold mt-2" style={{ color: GOV.text }}>{layer.count}</span>
              <span className="text-xs text-center" style={{ color: GOV.textMuted }}>{layer.label}</span>
            </div>
            {i < layers.length - 1 && <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: GOV.textHint }} />}
          </React.Fragment>
        ))}
      </div>
      {riasecCareerFlow?.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: GOV.borderLight }}>
          <p className="text-xs font-semibold mb-3" style={{ color: GOV.textMuted }}>RIASEC → Career Pathway Distribution</p>
          <div className="grid grid-cols-6 gap-2">
            {['R','I','A','S','E','C'].map(letter => {
              const match = riasecCareerFlow.find(r => r.primaryRiasec === letter);
              const count = match ? Number(match.count) : 0;
              const max = Math.max(...riasecCareerFlow.map(r => Number(r.count)), 1);
              return (
                <div key={letter} className="text-center">
                  <div className="mx-auto w-full rounded-md overflow-hidden mb-1" style={{ height: 60, backgroundColor: GOV.borderLight }}>
                    <div className="w-full transition-all rounded-md" style={{
                      height: `${Math.max((count / max) * 100, 5)}%`,
                      backgroundColor: RIASEC_COLORS[letter],
                      marginTop: `${100 - Math.max((count / max) * 100, 5)}%`
                    }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: RIASEC_COLORS[letter] }}>{letter}</span>
                  <p className="text-xs" style={{ color: GOV.textMuted }}>{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const AnalyticsGraphSection = ({ kgData }) => (
  <div className="space-y-6">
    <KnowledgeGraphFlow kgData={kgData} />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="RIASEC → Career Mapping" subtitle="How many careers map to each personality type">
        {(kgData?.riasecCareerFlow || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={['R','I','A','S','E','C'].map(l => {
              const m = kgData.riasecCareerFlow.find(r => r.primaryRiasec === l);
              return { type: l, full: RIASEC_LABELS[l], careers: m ? Number(m.count) : 0 };
            })}>
              <PolarGrid stroke={GOV.borderLight} />
              <PolarAngleAxis dataKey="type" tick={{ fontSize: 12, fontWeight: 600 }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} />
              <Radar dataKey="careers" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} strokeWidth={2} />
              <Tooltip formatter={(v, n, p) => [v, `${p.payload.full} Careers`]} />
            </RadarChart>
          </ResponsiveContainer>
        ) : <div className="h-[260px] flex items-center justify-center text-xs" style={{ color: GOV.textHint }}>No data</div>}
      </ChartCard>

      <ChartCard title="Top Holland Code Matches" subtitle="Most frequently assigned Holland codes">
        {(kgData?.topHollandCareerMatches || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={kgData.topHollandCareerMatches.slice(0, 10).map(d => ({ code: d.hollandCode, count: Number(d.assessmentCount) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="code" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" name="Assessments" radius={[3,3,0,0]}>
                {kgData.topHollandCareerMatches.slice(0, 10).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[260px] flex items-center justify-center text-xs" style={{ color: GOV.textHint }}>No data</div>}
      </ChartCard>
    </div>
  </div>
);

export default AnalyticsGraphSection;
