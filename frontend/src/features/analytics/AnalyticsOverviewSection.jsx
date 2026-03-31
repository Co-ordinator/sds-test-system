import React, { useMemo } from 'react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ComposedChart, Line, Legend,
} from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import { GOV } from '../../theme/government';
import { PIE_COLORS, RIASEC_LABELS } from './analyticsConstants';

/* ── Card shell ── */
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

const RIASEC_PIE_COLORS = { R: '#F44336', I: '#2563eb', A: '#7c3aed', S: '#059669', E: '#d97706', C: '#2D8BC4' };
const GENDER_PIE = ['#2563eb', '#be185d', '#6b7280', '#059669'];

const DonutCenter = ({ cx, cy, total, label }) => (
  <>
    <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight="700" fill={GOV.text}>{total}</text>
    <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill={GOV.textHint}>{label}</text>
  </>
);

const AnalyticsOverviewSection = ({
  analytics, riasecData, pieData, regionChartData, userTypePieData, trendData,
  kgData, completionRate, totalUsers, totalAssessments, completedAssessments,
}) => {
  const riasecDonutData = useMemo(() => {
    if (!riasecData?.length) return [];
    const total = riasecData.reduce((s, d) => s + d.value, 0);
    if (!total) return [];
    return riasecData.map(d => ({
      name: d.name, full: RIASEC_LABELS[d.name],
      pct: Math.round((d.value / total) * 1000) / 10,
      value: d.value,
    }));
  }, [riasecData]);

  const topCode = pieData.length > 0 ? pieData[0].name : '–';
  const topCodeCount = pieData.length > 0 ? Number(pieData[0].value) : 0;

  const careerFieldData = useMemo(() => {
    if (!kgData?.careerCategories) return [];
    return [...kgData.careerCategories]
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 8)
      .map(d => ({ name: d.category, value: Number(d.count) }));
  }, [kgData]);

  const genderData = useMemo(() =>
    (kgData?.genderDist || []).map(d => ({
      name: d.gender ? d.gender.charAt(0).toUpperCase() + d.gender.slice(1) : 'Unknown',
      value: Number(d.count),
    })), [kgData]);

  const completionPct = Math.min(Number(completionRate) || 0, 100);

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        gridAutoRows: 'min-content',
      }}
    >
      {/* ── Row 1 ── */}

      {/* RIASEC Donut */}
      <Card title="Career Interest Distribution" sub="National RIASEC breakdown" className="col-span-12 md:col-span-4 lg:col-span-3">
        {riasecDonutData.length > 0 ? (
          <div className="flex items-center gap-3">
            <ResponsiveContainer width="55%" height={170}>
              <PieChart>
                <Pie data={riasecDonutData} dataKey="pct" nameKey="full"
                  cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={2} startAngle={90} endAngle={-270}>
                  {riasecDonutData.map(d => <Cell key={d.name} fill={RIASEC_PIE_COLORS[d.name] || '#6b7280'} />)}
                  <DonutCenter cx="50%" cy="50%" total={totalUsers.toLocaleString()} label="users" />
                </Pie>
                <Tooltip formatter={(v, n) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {riasecDonutData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RIASEC_PIE_COLORS[d.name] }} />
                  <span className="text-xs flex-1 truncate" style={{ color: GOV.text }}>{d.full}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: RIASEC_PIE_COLORS[d.name] }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : <div className="h-[170px] flex items-center justify-center text-xs" style={{ color: GOV.textHint }}>No data</div>}
      </Card>

      {/* Completion Rate */}
      <Card title="Completion Rate" sub="Assessments completed nationally" className="col-span-6 md:col-span-4 lg:col-span-2" bodyClass="px-4 pb-4 flex flex-col justify-between">
        <p className="text-4xl font-bold mt-2 mb-1 tabular-nums" style={{ color: GOV.text }}>{completionPct.toFixed(1)}%</p>
        <div>
          <div className="w-full h-3 rounded-full overflow-hidden mb-1" style={{ backgroundColor: GOV.borderLight }}>
            <div className="h-full rounded-full" style={{ width: `${completionPct}%`, backgroundColor: '#059669' }} />
          </div>
          <p className="text-xs" style={{ color: GOV.textHint }}>{completedAssessments.toLocaleString()} of {totalAssessments.toLocaleString()} total</p>
        </div>
      </Card>

      {/* Top Holland Code */}
      <Card title="Top Holland Code" sub="Most common assessment result" className="col-span-6 md:col-span-4 lg:col-span-2" bodyClass="px-4 pb-4 flex flex-col justify-between">
        <div>
          <p className="text-5xl font-black mt-2 tabular-nums" style={{ color: GOV.blue }}>{topCode}</p>
          <p className="text-xs mt-1" style={{ color: GOV.textHint }}>{topCodeCount.toLocaleString()} assessments</p>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {pieData.slice(0, 5).map((d, i) => (
            <span key={d.name} className="text-xs px-2 py-0.5 rounded-full font-semibold tabular-nums"
              style={{ backgroundColor: `${PIE_COLORS[i]}18`, color: PIE_COLORS[i] }}>
              {d.name}
            </span>
          ))}
        </div>
      </Card>

      {/* Users by Region */}
      <Card title="Users by Region" sub="Registered vs completed per region" className="col-span-12 md:col-span-12 lg:col-span-5">
        {regionChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={regionChartData} barGap={2} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip /><Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
              <Bar dataKey="users" name="Registered" fill="#2563eb" radius={[2,2,0,0]} />
              <Bar dataKey="completed" name="Completed" fill="#059669" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[170px] flex items-center justify-center text-xs" style={{ color: GOV.textHint }}>No data</div>}
      </Card>

      {/* ── Row 2 — wide trend chart ── */}
      <Card title="Assessment Volume & Completion Rate over Time" sub="Monthly started vs completed with completion rate trend"
        className="col-span-12 lg:col-span-8">
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="gradT2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradC2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 9 }} />
              <Tooltip /><Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
              <Bar yAxisId="left" dataKey="total" name="Started" fill="#2563eb" fillOpacity={0.75} radius={[2,2,0,0]} />
              <Bar yAxisId="left" dataKey="completed" name="Completed" fill="#059669" fillOpacity={0.75} radius={[2,2,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="rate" name="Rate %" stroke="#d97706" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <div className="h-[220px] flex items-center justify-center text-xs" style={{ color: GOV.textHint }}>No data</div>}
      </Card>

      {/* User Type Donut */}
      <Card title="User Types" sub="By education/career stage" className="col-span-12 md:col-span-6 lg:col-span-4">
        {userTypePieData.length > 0 ? (
          <div className="flex items-center gap-3">
            <ResponsiveContainer width="55%" height={170}>
              <PieChart>
                <Pie data={userTypePieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={44} outerRadius={70} paddingAngle={3}>
                  {userTypePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {userTypePieData.map((d, i) => {
                const total = userTypePieData.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs" style={{ color: GOV.text }}>{d.name}</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: GOV.textMuted }}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : <div className="h-[170px] flex items-center justify-center text-xs" style={{ color: GOV.textHint }}>No data</div>}
      </Card>

      {/* ── Row 3 ── */}

      {/* Career Fields */}
      <Card title="Career Field Popularity" sub="Top categories from career database" className="col-span-12 md:col-span-6 lg:col-span-4">
        {careerFieldData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={careerFieldData} layout="vertical" margin={{ left: 4, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 8 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={100} />
              <Tooltip formatter={(v) => [v, 'Careers']} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={16}>
                {careerFieldData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[200px] flex items-center justify-center text-xs" style={{ color: GOV.textHint }}>No data</div>}
      </Card>

      {/* RIASEC Radar */}
      <Card title="RIASEC National Average Profile" sub="Radar of avg scores across completed assessments" className="col-span-12 md:col-span-6 lg:col-span-4">
        {riasecData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={riasecData} cx="50%" cy="50%" outerRadius="60%">
              <PolarGrid stroke={GOV.borderLight} />
              <PolarAngleAxis dataKey="full" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis tick={{ fontSize: 7 }} />
              <Radar name="National" dataKey="value" stroke={GOV.blue} fill={GOV.blue} fillOpacity={0.22} strokeWidth={2} />
              <Tooltip formatter={(v) => [Number(v).toFixed(1), 'Avg']} />
            </RadarChart>
          </ResponsiveContainer>
        ) : <div className="h-[200px] flex items-center justify-center text-xs" style={{ color: GOV.textHint }}>No data</div>}
      </Card>

      {/* Gender Distribution */}
      <Card title="Gender Distribution" sub="Completed assessments" className="col-span-12 md:col-span-6 lg:col-span-4">
        {genderData.length > 0 ? (
          <div className="flex items-center gap-3">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={44} outerRadius={70} paddingAngle={3}>
                  {genderData.map((_, i) => <Cell key={i} fill={GENDER_PIE[i % 4]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {genderData.map((d, i) => {
                const total = genderData.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_PIE[i % 4] }} />
                        <span className="text-xs" style={{ color: GOV.text }}>{d.name}</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums" style={{ color: GOV.textMuted }}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GENDER_PIE[i % 4] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : <div className="h-[200px] flex items-center justify-center text-xs" style={{ color: GOV.textHint }}>No data</div>}
      </Card>

    </div>
  );
};

export default AnalyticsOverviewSection;
