import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { MoreHorizontal, TrendingUp, TrendingDown, Minus, ChevronRight, Search } from 'lucide-react';
import { GOV } from '../../theme/government';
import DataTable from '../../components/data/DataTable';
import { PIE_COLORS, DEMAND_COLORS, DEMAND_LABELS, RIASEC_COLORS, RIASEC_LABELS, QUAL_LABELS } from './analyticsConstants';

const DEMAND_LEVEL_KEYS = Object.keys(DEMAND_LABELS);

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
const DEMAND_UNRATED_COLOR = '#94a3b8';

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

const AnalyticsCareersSection = ({ kgData, pipelineData, hollandDist = [] }) => {
  const [careerSearch, setCareerSearch] = useState('');
  const [careerRiasec, setCareerRiasec] = useState('');
  const [careerCategory, setCareerCategory] = useState('');
  const [careerNationalDemand, setCareerNationalDemand] = useState('');
  const [careerLocalDemand, setCareerLocalDemand] = useState('');
  /* Same aggregation as GET /analytics/holland-distribution (avoids duplicating query in skills-pipeline) */
  const allTimePipelineBar = useMemo(() => {
    if (!hollandDist?.length) return [];
    return hollandDist.slice(0, 12).map((d) => ({ code: d.hollandCode, count: Number(d.count) }));
  }, [hollandDist]);

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

  const nationalDemandBarRows = useMemo(() => {
    const rows = kgData?.demandDistribution || [];
    return rows.map((d) => {
      const unrated = d.demandLevel == null || d.demandLevel === '';
      return {
        name: unrated ? 'Not rated' : (DEMAND_LABELS[d.demandLevel] || d.demandLevel),
        value: Number(d.count),
        levelKey: unrated ? null : d.demandLevel,
      };
    });
  }, [kgData]);

  const localDemandPieSlices = useMemo(() => {
    const rows = kgData?.localDemandDist || [];
    return rows.map((d) => {
      const unrated = d.localDemand == null || d.localDemand === '';
      return {
        name: unrated ? 'Not rated' : (DEMAND_LABELS[d.localDemand] || d.localDemand),
        value: Number(d.count),
        levelKey: unrated ? null : d.localDemand,
      };
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

  const careerKnowledgeRows = useMemo(() => {
    const list = kgData?.topCareers || [];
    return list.map((c) => ({
      ...c,
      nationalDemandRank: DEMAND_ORDER[c.demandLevel] ?? 99,
      localDemandRank: DEMAND_ORDER[c.localDemand] ?? 99,
    }));
  }, [kgData]);

  const careerCategoryOptions = useMemo(() => {
    const set = new Set();
    (kgData?.topCareers || []).forEach((c) => {
      if (c.category && String(c.category).trim()) set.add(String(c.category).trim());
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [kgData]);

  const careerKnowledgeFiltered = useMemo(() => {
    const q = careerSearch.trim().toLowerCase();
    return careerKnowledgeRows.filter((r) => {
      if (q) {
        const hay = `${r.name || ''} ${r.category || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (careerRiasec && r.primaryRiasec !== careerRiasec) return false;
      if (careerCategory && (r.category || '') !== careerCategory) return false;
      if (careerNationalDemand && r.demandLevel !== careerNationalDemand) return false;
      if (careerLocalDemand && r.localDemand !== careerLocalDemand) return false;
      return true;
    });
  }, [careerKnowledgeRows, careerSearch, careerRiasec, careerCategory, careerNationalDemand, careerLocalDemand]);

  const careerKnowledgeToolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[140px] max-w-xs">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: GOV.textMuted }} />
        <input
          type="search"
          className="w-full rounded-md border pl-7 pr-2 py-1.5 text-xs"
          style={{ borderColor: GOV.border, color: GOV.text }}
          placeholder="Search career or category…"
          value={careerSearch}
          onChange={(e) => setCareerSearch(e.target.value)}
          aria-label="Search careers"
        />
      </div>
      <select
        className="text-xs border rounded-md px-2 py-1.5 min-w-[7rem]"
        style={{ borderColor: GOV.border, color: careerRiasec ? GOV.blue : GOV.textMuted }}
        value={careerRiasec}
        onChange={(e) => setCareerRiasec(e.target.value)}
        aria-label="Filter by RIASEC"
      >
        <option value="">All RIASEC</option>
        {['R', 'I', 'A', 'S', 'E', 'C'].map((t) => (
          <option key={t} value={t}>{t} — {RIASEC_LABELS[t]}</option>
        ))}
      </select>
      <select
        className="text-xs border rounded-md px-2 py-1.5 min-w-[8rem] max-w-[11rem]"
        style={{ borderColor: GOV.border, color: careerCategory ? GOV.blue : GOV.textMuted }}
        value={careerCategory}
        onChange={(e) => setCareerCategory(e.target.value)}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {careerCategoryOptions.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <select
        className="text-xs border rounded-md px-2 py-1.5 min-w-[9rem]"
        style={{ borderColor: GOV.border, color: careerNationalDemand ? GOV.blue : GOV.textMuted }}
        value={careerNationalDemand}
        onChange={(e) => setCareerNationalDemand(e.target.value)}
        aria-label="Filter by national demand"
      >
        <option value="">National demand</option>
        {DEMAND_LEVEL_KEYS.map((k) => (
          <option key={k} value={k}>{DEMAND_LABELS[k]}</option>
        ))}
      </select>
      <select
        className="text-xs border rounded-md px-2 py-1.5 min-w-[9rem]"
        style={{ borderColor: GOV.border, color: careerLocalDemand ? GOV.blue : GOV.textMuted }}
        value={careerLocalDemand}
        onChange={(e) => setCareerLocalDemand(e.target.value)}
        aria-label="Filter by local demand"
      >
        <option value="">Local demand</option>
        {DEMAND_LEVEL_KEYS.map((k) => (
          <option key={k} value={k}>{DEMAND_LABELS[k]}</option>
        ))}
      </select>
      {(careerSearch || careerRiasec || careerCategory || careerNationalDemand || careerLocalDemand) && (
        <button
          type="button"
          className="text-xs font-semibold px-2 py-1 rounded-md border"
          style={{ borderColor: GOV.border, color: GOV.blue }}
          onClick={() => {
            setCareerSearch('');
            setCareerRiasec('');
            setCareerCategory('');
            setCareerNationalDemand('');
            setCareerLocalDemand('');
          }}
        >
          Clear filters
        </button>
      )}
      <span className="text-xs ml-auto tabular-nums" style={{ color: GOV.textMuted }}>
        {careerKnowledgeFiltered.length}
        {careerKnowledgeFiltered.length !== careerKnowledgeRows.length ? ` / ${careerKnowledgeRows.length}` : ''} careers
      </span>
    </div>
  );

  const careerKnowledgeColumns = useMemo(() => [
    { key: 'name', header: 'Career', sortable: true },
    {
      key: 'primaryRiasec',
      header: 'RIASEC',
      sortable: true,
      width: 'w-24',
      render: (r) => (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: RIASEC_COLORS[r.primaryRiasec] || '#6b7280' }}>
          {r.primaryRiasec || '–'}
        </span>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, render: (r) => r.category || '–' },
    {
      key: 'nationalDemandRank',
      header: 'National demand',
      sortable: true,
      width: 'w-36',
      render: (r) => <DemandBadge level={r.demandLevel} />,
    },
    {
      key: 'localDemandRank',
      header: 'Local demand',
      sortable: true,
      width: 'w-36',
      render: (r) => <DemandBadge level={r.localDemand} />,
    },
  ], []);

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
                {allTimePipelineBar.map((row, i) => <Cell key={row.code || i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
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
        {nationalDemandBarRows.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={nationalDemandBarRows} layout="vertical" margin={{ left: 4, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={72} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} name="Careers" maxBarSize={18}>
                {nationalDemandBarRows.map((d, i) => (
                  <Cell
                    key={`${d.levelKey ?? 'unrated'}-${i}`}
                    fill={d.levelKey ? (DEMAND_COLORS[d.levelKey] || '#6b7280') : DEMAND_UNRATED_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Card>

      {/* Local Demand Donut */}
      <Card title="Local Demand (Eswatini)" sub="Career demand in the local market" className="col-span-12 md:col-span-6 lg:col-span-4">
        {localDemandPieSlices.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={localDemandPieSlices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {localDemandPieSlices.map((d, i) => (
                  <Cell
                    key={`${d.levelKey ?? 'unrated'}-${i}`}
                    fill={d.levelKey ? (DEMAND_COLORS[d.levelKey] || PIE_COLORS[i % PIE_COLORS.length]) : DEMAND_UNRATED_COLOR}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
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
      <Card title="Courses per RIASEC Type" sub="Active courses whose RIASEC / Holland tags include each letter (from the knowledge-graph API)" className="col-span-12 lg:col-span-6">
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

      {/* Career Knowledge Base — occupations from DB (knowledge-graph API) */}
      {kgData && (
        <div className="col-span-12 bg-white rounded-lg border overflow-hidden" style={{ borderColor: GOV.border, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div className="flex items-start justify-between px-4 pt-4 pb-2">
            <div>
              <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>Career Knowledge Base</p>
              <p className="text-xs mt-0.5" style={{ color: GOV.textHint }}>
                Occupations in the catalog with primary RIASEC and demand levels (live data from the database)
              </p>
            </div>
            <button type="button" className="p-0.5 rounded hover:bg-gray-100" style={{ color: GOV.textHint }} aria-label="Section menu"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <DataTable
            columns={careerKnowledgeColumns}
            rows={careerKnowledgeFiltered}
            rowKey={(r) => String(r.id ?? r.name)}
            loading={false}
            pageSize={8}
            stickyHeader
            toolbar={careerKnowledgeToolbar}
            emptyTitle="No careers match"
            emptyMessage={
              careerKnowledgeRows.length === 0
                ? 'Add occupations with a primary RIASEC code in Admin → Occupations, or wait for the catalog to load.'
                : 'Try adjusting search or filters.'
            }
          />
        </div>
      )}
    </div>
  );
};

export default AnalyticsCareersSection;
