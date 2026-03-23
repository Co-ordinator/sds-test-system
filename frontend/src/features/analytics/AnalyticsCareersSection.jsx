import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { MoreHorizontal, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { GOV } from '../../theme/government';
import { PIE_COLORS, DEMAND_COLORS, DEMAND_LABELS, RIASEC_COLORS, RIASEC_LABELS, QUAL_LABELS } from './analyticsConstants';

/* ── Shared Card (matches Overview) ── */
const Card = ({ title, sub, children, className = '', bodyClass = 'px-4 pb-4' }) => (
  <div className={`bg-white rounded-lg border flex flex-col ${className}`} style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
    <div className="flex items-start justify-between px-4 pt-4 pb-1 flex-shrink-0">
      <div>
        <p className="text-xs font-semibold leading-tight" style={{ color: GOV.textMuted }}>{title}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: GOV.textHint }}>{sub}</p>}
      </div>
      <button className="p-0.5 rounded hover:bg-gray-100 flex-shrink-0" style={{ color: GOV.textHint }}>
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
    <div className={`flex-1 ${bodyClass}`}>{children}</div>
  </div>
);

const Empty = ({ h = 200 }) => <div className={`flex items-center justify-center text-xs`} style={{ height: h, color: GOV.textHint }}>No data</div>;

const DEMAND_ORDER = { critical: 0, very_high: 1, high: 2, medium: 3, low: 4 };

const GrowthBadge = ({ growth }) => {
  if (growth > 0) return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
      <TrendingUp className="w-3 h-3" /> +{growth}%
    </span>
  );
  if (growth < 0) return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
      <TrendingDown className="w-3 h-3" /> {growth}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
};

const DemandBadge = ({ level }) => {
  const color = DEMAND_COLORS[level] || '#6b7280';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${color}15`, color }}>
      {DEMAND_LABELS[level] || level || '–'}
    </span>
  );
};

const AnalyticsCareersSection = ({ kgData, pipelineData }) => {
  const allTimePipelineBar = useMemo(() => {
    if (!pipelineData?.allTimeDist?.length) return [];
    return pipelineData.allTimeDist.slice(0, 12).map(d => ({ code: d.hollandCode, count: Number(d.count) }));
  }, [pipelineData]);

  const sortedEmergingCareers = useMemo(() => {
    if (!pipelineData?.emergingCareers?.length) return [];
    return [...pipelineData.emergingCareers].sort((a, b) => (DEMAND_ORDER[a.localDemand] || 99) - (DEMAND_ORDER[b.localDemand] || 99));
  }, [pipelineData]);

  const educationPathwayData = useMemo(() => {
    if (!kgData?.coursesByQualType?.length) return [];
    return kgData.coursesByQualType.map(d => ({ name: QUAL_LABELS[d.qualificationType] || d.qualificationType, value: Number(d.count) })).sort((a, b) => b.value - a.value);
  }, [kgData]);

  const riasecCareerRadar = useMemo(() => {
    if (!kgData?.riasecCareerFlow?.length) return [];
    return ['R','I','A','S','E','C'].map(l => {
      const m = kgData.riasecCareerFlow.find(r => r.primaryRiasec === l);
      return { type: l, full: RIASEC_LABELS[l], careers: m ? Number(m.count) : 0 };
    });
  }, [kgData]);

  const kgLayers = useMemo(() => {
    if (!kgData?.summary) return [];
    return [
      { label: 'RIASEC Types', count: 6, color: '#2563eb' },
      { label: 'Skills', count: (kgData.topSkills || []).length, color: '#7c3aed' },
      { label: 'Careers', count: kgData.summary.totalOccupations || 0, color: '#059669' },
      { label: 'Career Pathways', count: kgData.summary.totalCareerPathways || 0, color: '#0d9488' },
      { label: 'Courses', count: kgData.summary.totalCourses || 0, color: '#d97706' },
      { label: 'Programmes', count: kgData.summary.totalCourseLinks || 0, color: '#0891b2' },
      { label: 'Institutions', count: kgData.summary.totalInstitutions || 0, color: '#dc2626' },
    ];
  }, [kgData]);

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gridAutoRows: 'min-content' }}>

      {/* ═══ Knowledge Graph Flow (absorbed from KG tab) ═══ */}
      {kgLayers.length > 0 && (
        <div className="col-span-12 bg-white rounded-lg border p-4" style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: GOV.textMuted }}>Career Knowledge Graph — How the platform connects students to outcomes</p>
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {kgLayers.map((layer, i) => (
              <React.Fragment key={layer.label}>
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold" style={{ backgroundColor: `${layer.color}12`, color: layer.color }}>
                    {layer.count}
                  </div>
                  <span className="text-xs mt-1.5 text-center leading-tight" style={{ color: GOV.textMuted }}>{layer.label}</span>
                </div>
                {i < kgLayers.length - 1 && <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: GOV.textHint }} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Skills Pipeline ═══ */}

      {/* Career Interest Momentum */}
      <Card title="Career Interest Momentum" sub="Holland code growth: current 30d vs prior 30d" className="col-span-12 lg:col-span-6">
        {(pipelineData?.hollandPipeline?.length > 0) ? (
          <div className="space-y-2">
            {pipelineData.hollandPipeline.slice(0, 10).map((item, i) => (
              <div key={item.code} className="flex items-center gap-3">
                <span className="w-4 text-xs font-bold text-right" style={{ color: GOV.textHint }}>{i + 1}</span>
                <span className="w-14 text-xs font-mono font-bold" style={{ color: GOV.blue }}>{item.code}</span>
                <div className="flex-1">
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min((item.current / Math.max(...pipelineData.hollandPipeline.map(p => p.current), 1)) * 100, 100)}%`,
                      backgroundColor: item.growth > 0 ? '#059669' : item.growth < 0 ? '#dc2626' : '#6b7280'
                    }} />
                  </div>
                </div>
                <span className="text-xs w-8 text-right font-semibold" style={{ color: GOV.textMuted }}>{item.current}</span>
                <GrowthBadge growth={item.growth} />
              </div>
            ))}
          </div>
        ) : <Empty h={250} />}
      </Card>

      {/* All-time Holland bar */}
      <Card title="All-Time Career Interest Ranking" sub="Most common Holland codes from completed assessments" className="col-span-12 lg:col-span-6">
        {allTimePipelineBar.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={allTimePipelineBar} layout="vertical" margin={{ left: 4, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="code" tick={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 600 }} width={38} />
              <Tooltip formatter={(v) => [v, 'Assessments']} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]} name="Assessments" maxBarSize={18}>
                {allTimePipelineBar.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty h={250} />}
      </Card>

      {/* Emerging careers grid */}
      {sortedEmergingCareers.length > 0 && (
        <div className="col-span-12 bg-white rounded-lg border overflow-hidden" style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>Emerging High-Demand Careers (Eswatini)</p>
              <p className="text-xs mt-0.5" style={{ color: GOV.textHint }}>Critical workforce pipeline — careers with high local demand</p>
            </div>
            <button className="p-0.5 rounded hover:bg-gray-100" style={{ color: GOV.textHint }}><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px mx-4 mb-4 rounded-lg overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
            {sortedEmergingCareers.map((career, i) => (
              <div key={i} className="bg-white p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold leading-snug flex-1" style={{ color: GOV.text }}>{career.name}</p>
                  <DemandBadge level={career.localDemand} />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {career.primaryRiasec && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: RIASEC_COLORS[career.primaryRiasec] || '#6b7280' }}>
                      {career.primaryRiasec}
                    </span>
                  )}
                  {career.category && <span className="text-xs" style={{ color: GOV.textHint }}>{career.category}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Education Pathway + Career Demand ═══ */}

      {/* Career Demand Distribution */}
      <Card title="Career Demand Distribution" sub="National demand levels across all careers" className="col-span-12 md:col-span-6 lg:col-span-4">
        {(kgData?.demandDistribution || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={kgData.demandDistribution.map(d => ({ name: DEMAND_LABELS[d.demandLevel] || d.demandLevel, value: Number(d.count) }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={65} />
              <Tooltip />
              <Bar dataKey="value" radius={[0,3,3,0]} name="Careers" maxBarSize={18}>
                {kgData.demandDistribution.map((d, i) => <Cell key={i} fill={DEMAND_COLORS[d.demandLevel] || '#6b7280'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Card>

      {/* Local Demand Donut */}
      <Card title="Local Demand (Eswatini)" sub="Career demand in the local market" className="col-span-12 md:col-span-6 lg:col-span-4">
        {(kgData?.localDemandDist || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={kgData.localDemandDist.map(d => ({ name: DEMAND_LABELS[d.localDemand] || d.localDemand, value: Number(d.count) }))}
                dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {kgData.localDemandDist.map((d, i) => <Cell key={i} fill={DEMAND_COLORS[d.localDemand] || PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Card>

      {/* RIASEC → Career Mapping (from KG tab) */}
      <Card title="RIASEC → Career Mapping" sub="How many careers map to each personality type" className="col-span-12 md:col-span-6 lg:col-span-4">
        {riasecCareerRadar.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={riasecCareerRadar} cx="50%" cy="50%" outerRadius="60%">
              <PolarGrid stroke={GOV.borderLight} />
              <PolarAngleAxis dataKey="type" tick={{ fontSize: 10, fontWeight: 600 }} />
              <PolarRadiusAxis tick={{ fontSize: 8 }} />
              <Radar dataKey="careers" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip formatter={(v, n, p) => [v, `${p.payload.full} Careers`]} />
            </RadarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Card>

      {/* Courses by Qualification Level */}
      <Card title="Courses by Qualification Level" sub="Which qualifications are most available nationally" className="col-span-12 lg:col-span-6">
        {educationPathwayData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={educationPathwayData} layout="vertical" margin={{ left: 4, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={85} />
              <Tooltip formatter={(v) => [v, 'Courses']} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} name="Courses" maxBarSize={18}>
                {educationPathwayData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Card>

      {/* RIASEC Course Pathway Coverage */}
      <Card title="Courses per RIASEC Type" sub="How many course pathways align with each personality" className="col-span-12 lg:col-span-6">
        {(kgData?.coursesPerRiasec || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={kgData.coursesPerRiasec.map(d => ({ name: d.letter, label: RIASEC_LABELS[d.letter], value: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v, n, p) => [v, `${p.payload.label} Courses`]} />
              <Bar dataKey="value" radius={[3,3,0,0]} name="Courses">
                {kgData.coursesPerRiasec.map((d, i) => <Cell key={i} fill={RIASEC_COLORS[d.letter] || PIE_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Card>

      {/* Institution Course Coverage */}
      {(kgData?.institutionCoverage || []).length > 0 && (
        <Card title="Institution Course Coverage" sub="Active courses offered per institution" className="col-span-12 lg:col-span-8">
          <ResponsiveContainer width="100%" height={Math.max(160, kgData.institutionCoverage.length * 32)}>
            <BarChart data={kgData.institutionCoverage.map(d => ({ name: d.institution?.name || 'Unknown', value: Number(d.courseCount) }))} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={170} />
              <Tooltip formatter={(v) => [v, 'Courses']} />
              <Bar dataKey="value" radius={[0,3,3,0]} name="Courses" maxBarSize={18}>
                {kgData.institutionCoverage.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Skills in Demand */}
      <Card title="Top Skills in Demand" sub="Most required skills across all careers" className="col-span-12 lg:col-span-4">
        {(kgData?.topSkills || []).length > 0 ? (
          <div className="space-y-1.5">
            {kgData.topSkills.slice(0, 12).map((s, i) => {
              const max = kgData.topSkills[0]?.count || 1;
              const pct = Math.min((s.count / max) * 100, 100);
              return (
                <div key={s.skill} className="flex items-center gap-2">
                  <span className="w-4 text-xs font-bold text-right" style={{ color: GOV.textHint }}>{i + 1}</span>
                  <span className="w-28 text-xs truncate" style={{ color: GOV.text }}>{s.skill}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                  <span className="text-xs font-semibold w-6 text-right tabular-nums" style={{ color: GOV.textMuted }}>{s.count}</span>
                </div>
              );
            })}
          </div>
        ) : <Empty />}
      </Card>

      {/* Career Categories */}
      {(kgData?.careerCategories || []).length > 0 && (
        <Card title="Career Categories" sub="Occupations grouped by industry" className="col-span-12">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={kgData.careerCategories.slice(0, 12).map(d => ({ name: d.category, value: Number(d.count) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-25} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="value" name="Careers" radius={[3,3,0,0]}>
                {kgData.careerCategories.slice(0, 12).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Career Knowledge Base table */}
      {(kgData?.topCareers || []).length > 0 && (
        <div className="col-span-12 bg-white rounded-lg border overflow-hidden" style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div className="flex items-start justify-between px-4 pt-4 pb-2">
            <div>
              <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>Career Knowledge Base</p>
              <p className="text-xs mt-0.5" style={{ color: GOV.textHint }}>All careers with demand levels and RIASEC alignment</p>
            </div>
            <button className="p-0.5 rounded hover:bg-gray-100" style={{ color: GOV.textHint }}><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ backgroundColor: GOV.blueLightAlt }}>
                <tr>{['Career','RIASEC','Category','National Demand','Local Demand'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-xs uppercase font-semibold" style={{ color: GOV.textMuted }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {kgData.topCareers.slice(0, 30).map((c, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: GOV.borderLight }}>
                    <td className="px-4 py-2 font-medium" style={{ color: GOV.text }}>{c.name}</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: RIASEC_COLORS[c.primaryRiasec] || '#6b7280' }}>
                        {c.primaryRiasec || '–'}
                      </span>
                    </td>
                    <td className="px-4 py-2" style={{ color: GOV.textMuted }}>{c.category || '–'}</td>
                    <td className="px-4 py-2"><DemandBadge level={c.demandLevel} /></td>
                    <td className="px-4 py-2"><DemandBadge level={c.localDemand} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCareersSection;
