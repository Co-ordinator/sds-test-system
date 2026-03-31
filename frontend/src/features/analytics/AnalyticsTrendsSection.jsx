import React, { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import { GOV } from '../../theme/government';
import { RIASEC_COLORS, RIASEC_LABELS, PIE_COLORS, DOW_LABELS, USER_TYPE_LABELS } from './analyticsConstants';

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

const Empty = ({ h = 200 }) => <div className="flex items-center justify-center text-xs" style={{ height: h, color: GOV.textHint }}>No data</div>;

const GENDER_COLORS = {
  female: '#be185d', male: '#2563eb', other: '#6b7280', unknown: '#9ca3af', prefer_not_to_say: '#78716c',
};
const GENDER_LEGEND_LABELS = {
  male: 'Male', female: 'Female', other: 'Other', unknown: 'Unknown', prefer_not_to_say: 'Prefer not to say',
};

const parseSegmentAvg = (v) => {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
};
const USER_TYPE_COLORS = {
  'High School Student': '#F44336',
  'University Student': '#2563eb',
  'Professional': '#059669',
  'Test Administrator': '#7c3aed',
  school_student: '#F44336',
  university_student: '#2563eb',
  professional: '#059669',
};

const AnalyticsTrendsSection = ({ trendData, riasecData, hollandDist, kgData, segmentData }) => {
  const genderRiasecData = useMemo(() => {
    if (!segmentData?.riasecByGender?.length) return [];
    return ['R','I','A','S','E','C'].map(letter => {
      const entry = { name: RIASEC_LABELS[letter], key: letter };
      segmentData.riasecByGender.forEach((row) => {
        const key = row.gender || 'unknown';
        const raw = row[`avg${letter}`];
        const n = raw == null || raw === '' ? 0 : Number(raw);
        entry[key] = Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
      });
      return entry;
    });
  }, [segmentData]);

  const genderKeys = useMemo(() => {
    if (!segmentData?.riasecByGender?.length) return [];
    return [...new Set(segmentData.riasecByGender.map(g => g.gender || 'unknown'))];
  }, [segmentData]);

  /* Backend: riasecByUserType groups by users.user_type (not education_level FK) */
  const userTypeRiasecData = useMemo(() => {
    if (!segmentData?.riasecByUserType?.length) return [];
    return ['R', 'I', 'A', 'S', 'E', 'C'].map((letter) => {
      const entry = { name: letter, full: RIASEC_LABELS[letter] };
      segmentData.riasecByUserType.forEach((ut) => {
        if (ut.userType) entry[ut.userType] = parseSegmentAvg(ut[`avg${letter}`]);
      });
      return entry;
    });
  }, [segmentData]);

  const userTypeRadarSeries = useMemo(() => {
    if (!segmentData?.riasecByUserType?.length) return [];
    return segmentData.riasecByUserType.map(ut => ut.userType).filter(Boolean);
  }, [segmentData]);

  /* Same API slice as User Type × RIASEC radar: riasecByUserType */
  const careerByUserTypeRows = useMemo(() => {
    if (!segmentData?.riasecByUserType?.length) return [];
    return segmentData.riasecByUserType.map((ut) => ({
      group: USER_TYPE_LABELS[ut.userType] || ut.userType || '–',
      userType: ut.userType,
      R: parseSegmentAvg(ut.avgR), I: parseSegmentAvg(ut.avgI), A: parseSegmentAvg(ut.avgA),
      S: parseSegmentAvg(ut.avgS), E: parseSegmentAvg(ut.avgE), C: parseSegmentAvg(ut.avgC),
    }));
  }, [segmentData]);

  const hollandTotal = useMemo(() => hollandDist.reduce((s, x) => s + Number(x.count), 0), [hollandDist]);

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gridAutoRows: 'min-content' }}>

      {/* ═══ Row 1: Trend + Day-of-Week ═══ */}
      <Card title="Assessment Volume Trend" sub="Monthly started vs completed with completion rate" className="col-span-12 lg:col-span-8">
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} unit="%" />
              <Tooltip /><Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
              <Bar yAxisId="left" dataKey="total" name="Started" fill="#2563eb" fillOpacity={0.75} radius={[2,2,0,0]} />
              <Bar yAxisId="left" dataKey="completed" name="Completed" fill="#059669" fillOpacity={0.75} radius={[2,2,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="rate" name="Rate %" stroke="#d97706" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : <Empty h={220} />}
      </Card>

      <Card title="Completion by Day of Week" sub="Last 90 days of completions, by weekday" className="col-span-12 lg:col-span-4">
        {(kgData?.completionByDow || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DOW_LABELS.map((label, idx) => {
              const m = kgData.completionByDow.find(d => Number(d.dow) === idx);
              return { day: label, count: m ? Number(m.count) : 0 };
            })}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="count" name="Completions" radius={[3,3,0,0]}>
                {DOW_LABELS.map((_, i) => <Cell key={i} fill={i === 0 || i === 6 ? '#dc2626' : '#2563eb'} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty h={220} />}
      </Card>

      {/* ═══ Row 2: Gender Segmentation ═══ */}
      <Card title="Gender × Career Interest (RIASEC)" sub="Average RIASEC scores by gender" className="col-span-12 lg:col-span-6">
        {genderRiasecData.length > 0 && genderKeys.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={genderRiasecData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-15} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v) => [Number(v).toFixed(1), '']} />
              <Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
              {genderKeys.map((g) => (
                <Bar
                  key={g}
                  dataKey={g}
                  name={GENDER_LEGEND_LABELS[g] || (g ? `${g.charAt(0).toUpperCase()}${g.slice(1)}` : '—')}
                  fill={GENDER_COLORS[g] || '#6b7280'}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={24}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty h={240} />}
      </Card>

      <Card title="Gender Career Participation" sub="Holland code top picks per gender" className="col-span-12 lg:col-span-6">
        {(segmentData?.hollandByGender || []).length > 0 ? (
          <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
            {(() => {
              const genders = [...new Set(segmentData.hollandByGender.map(d => d.gender).filter(Boolean))];
              const byGender = {};
              genders.forEach(g => { byGender[g] = segmentData.hollandByGender.filter(d => d.gender === g).slice(0, 5); });
              return genders.map(g => {
                const items = byGender[g] || [];
                const maxCount = items[0] ? Number(items[0].count) : 1;
                return (
                  <div key={g} className="mb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS[g] || '#6b7280' }} />
                      <span className="text-xs font-bold" style={{ color: GOV.text }}>{GENDER_LEGEND_LABELS[g] || (g ? `${g.charAt(0).toUpperCase()}${g.slice(1)}` : '—')}</span>
                    </div>
                    {items.map(d => (
                      <div key={d.hollandCode} className="flex items-center gap-2 mb-1">
                        <span className="w-12 text-xs font-mono font-bold" style={{ color: GOV.blue }}>{d.hollandCode}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
                          <div className="h-full rounded-full" style={{ width: `${(Number(d.count) / maxCount) * 100}%`, backgroundColor: GENDER_COLORS[g] || '#6b7280' }} />
                        </div>
                        <span className="text-xs w-6 text-right tabular-nums" style={{ color: GOV.textMuted }}>{d.count}</span>
                      </div>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        ) : <Empty h={240} />}
      </Card>

      {/* ═══ Row 3: User type × RIASEC (segmentation API: group by users.user_type) ═══ */}
      <Card title="User Type × RIASEC" sub="Average RIASEC scores by learner type" className="col-span-12 lg:col-span-6">
        {userTypeRiasecData.length > 0 && userTypeRadarSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={userTypeRiasecData} cx="50%" cy="50%" outerRadius="60%">
              <PolarGrid stroke={GOV.borderLight} />
              <PolarAngleAxis dataKey="full" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis tick={{ fontSize: 7 }} />
              {userTypeRadarSeries.map(ut => (
                <Radar key={ut} dataKey={ut} name={USER_TYPE_LABELS[ut] || ut}
                  stroke={USER_TYPE_COLORS[ut] || '#6b7280'} fill={USER_TYPE_COLORS[ut] || '#6b7280'}
                  fillOpacity={0.15} strokeWidth={2} />
              ))}
              <Tooltip formatter={(v) => [Number(v).toFixed(1), '']} />
              <Legend iconSize={7} wrapperStyle={{ fontSize: 9 }} />
            </RadarChart>
          </ResponsiveContainer>
        ) : <Empty h={240} />}
      </Card>

      <Card title="Career Evolution by User Type" sub="Highest average RIASEC scores per type (top 3 shown)" className="col-span-12 lg:col-span-6">
        {careerByUserTypeRows.length > 0 ? (
          <div className="space-y-3">
            {careerByUserTypeRows.map((row) => {
              const sorted = ['R','I','A','S','E','C']
                .map(l => ({ key: l, label: RIASEC_LABELS[l], value: row[l] }))
                .sort((a, b) => b.value - a.value);
              const topInterest = sorted[0];
              const maxVal = sorted[0].value || 1;
              return (
                <div key={row.userType} className="p-3 rounded-lg border" style={{ borderColor: GOV.borderLight }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: USER_TYPE_COLORS[row.userType] || '#6b7280' }} />
                      <span className="text-xs font-bold" style={{ color: GOV.text }}>{row.group}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${RIASEC_COLORS[topInterest?.key]}20`, color: RIASEC_COLORS[topInterest?.key] }}>
                      {topInterest?.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sorted.slice(0, 3).map(item => (
                      <div key={item.key} className="flex items-center gap-2">
                        <span className="w-4 text-xs font-bold" style={{ color: RIASEC_COLORS[item.key] }}>{item.key}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
                          <div className="h-full rounded-full" style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: RIASEC_COLORS[item.key] }} />
                        </div>
                        <span className="text-xs w-8 text-right tabular-nums" style={{ color: GOV.textMuted }}>{item.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <Empty h={240} />}
      </Card>

      {/* ═══ Row 4: RIASEC Bar + Holland Table ═══ */}
      <Card title="RIASEC Score Distribution (National)" sub="Mean RIASEC score per dimension, completed assessments only" className="col-span-12 lg:col-span-6">
        {riasecData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riasecData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="full" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v) => [Number(v).toFixed(1), 'Avg Score']} />
              <Bar dataKey="value" name="Average Score" radius={[3,3,0,0]}>
                {riasecData.map((d) => <Cell key={d.name} fill={RIASEC_COLORS[d.name]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty h={220} />}
      </Card>

      {/* Holland codes: same data as GET /analytics/holland-distribution (hollandDist) */}
      <Card title="Holland Code Frequency" sub="Ranked by count · % of completions that have a Holland code (filters apply)" className="col-span-12 lg:col-span-6">
        {hollandDist.length > 0 ? (
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {hollandDist.map((d, i) => {
              const pct = hollandTotal > 0 ? (Number(d.count) / hollandTotal) * 100 : 0;
              return (
                <div key={`${d.hollandCode ?? '—'}-${i}`} className="flex items-center gap-2">
                  <span className="w-4 text-xs font-bold text-right" style={{ color: GOV.textHint }}>#{i + 1}</span>
                  <span className="w-12 text-xs font-mono font-bold" style={{ color: GOV.blue }}>{d.hollandCode}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                  <span className="text-xs w-8 text-right tabular-nums font-semibold" style={{ color: GOV.textMuted }}>{d.count}</span>
                  <span className="text-xs w-10 text-right tabular-nums" style={{ color: GOV.textHint }}>{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        ) : <Empty h={220} />}
      </Card>
    </div>
  );
};

export default AnalyticsTrendsSection;
