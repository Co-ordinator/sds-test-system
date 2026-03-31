import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, Users, MapPin, Briefcase } from 'lucide-react';
import { GOV } from '../../theme/government';
import { REGION_LABELS, USER_TYPE_LABELS } from './analyticsConstants';

const COLORS = {
  high: '#16a34a',
  medium: '#d97706',
  low: '#dc2626'
};

const PIE_COLORS = [COLORS.high, COLORS.medium, COLORS.low];

const AnalyticsFundingAlignmentSection = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: GOV.borderLight, borderTopColor: GOV.blue }} />
        <p className="text-sm mt-3" style={{ color: GOV.textHint }}>Loading funding alignment data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <Award className="w-12 h-12 mx-auto mb-3" style={{ color: GOV.textHint }} />
        <p className="text-sm font-medium" style={{ color: GOV.text }}>No funding alignment data available</p>
      </div>
    );
  }

  const {
    summary,
    alignmentDistribution,
    fieldAlignment,
    regionalAlignment,
    userTypeAlignment,
    trends = [],
  } = data;

  const pctLevel = (level) => alignmentDistribution.find((d) => d.level === level)?.percentage ?? '–';

  const trendChartData = (trends || []).map((t) => ({
    ...t,
    monthLabel: t.month
      ? new Date(t.month).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })
      : '–',
  }));

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border" style={{ borderColor: GOV.borderLight }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: GOV.textMuted }}>Total Assessments</p>
              <p className="text-2xl font-bold mt-1" style={{ color: GOV.text }}>{summary.totalAssessments.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8" style={{ color: GOV.blue }} />
          </div>
        </div>

        <div className="p-4 rounded-lg border" style={{ borderColor: GOV.borderLight }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: GOV.textMuted }}>High Alignment</p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.high }}>{summary.highAlignment.toLocaleString()}</p>
              <p className="text-xs" style={{ color: GOV.textHint }}>{pctLevel('HIGH')}%</p>
            </div>
            <Award className="w-8 h-8" style={{ color: COLORS.high }} />
          </div>
        </div>

        <div className="p-4 rounded-lg border" style={{ borderColor: GOV.borderLight }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: GOV.textMuted }}>Medium Alignment</p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.medium }}>{summary.mediumAlignment.toLocaleString()}</p>
              <p className="text-xs" style={{ color: GOV.textHint }}>{pctLevel('MEDIUM')}%</p>
            </div>
            <TrendingUp className="w-8 h-8" style={{ color: COLORS.medium }} />
          </div>
        </div>

        <div className="p-4 rounded-lg border" style={{ borderColor: GOV.borderLight }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: GOV.textMuted }}>Low Alignment</p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.low }}>{summary.lowAlignment.toLocaleString()}</p>
              <p className="text-xs" style={{ color: GOV.textHint }}>{pctLevel('LOW')}%</p>
            </div>
            <Briefcase className="w-8 h-8" style={{ color: COLORS.low }} />
          </div>
        </div>
      </div>

      {/* ── Alignment Distribution Pie Chart ── */}
      <div className="bg-white rounded-lg p-6 border" style={{ borderColor: GOV.border }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: GOV.text }}>Funding Alignment Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={alignmentDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ level, percentage }) => `${level}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {alignmentDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} assessments`, 'Count']} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── Field Alignment ── */}
      <div className="bg-white rounded-lg p-6 border" style={{ borderColor: GOV.border }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: GOV.text }}>Top Priority Fields by Alignment</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fieldAlignment} margin={{ top: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
            <XAxis 
              dataKey="field" 
              tick={{ fontSize: 11 }} 
              angle={-45}
              textAnchor="end"
              height={80}
              stroke={GOV.textMuted}
            />
            <YAxis tick={{ fontSize: 11 }} stroke={GOV.textMuted} />
            <Tooltip
              formatter={(value, name) => [
                `${value} assessment–field pairs`,
                name === 'high' ? 'High priority' : name === 'medium' ? 'Medium priority' : 'Low / other',
              ]}
            />
            <Bar dataKey="high" stackId="alignment" fill={COLORS.high} />
            <Bar dataKey="medium" stackId="alignment" fill={COLORS.medium} />
            <Bar dataKey="low" stackId="alignment" fill={COLORS.low} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Regional & User Type Alignment ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: GOV.border }}>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: GOV.text }}>
            <MapPin className="w-4 h-4" /> Regional Alignment
          </h3>
          <div className="space-y-2">
            {regionalAlignment.slice(0, 5).map((region) => (
              <div key={region.region} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: GOV.bgLight }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: GOV.text }}>
                    {REGION_LABELS[region.region] || region.region}
                  </p>
                  <p className="text-xs" style={{ color: GOV.textMuted }}>
                    {region.total} assessments
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: COLORS.high }}>
                    {region.highPercentage}% HIGH
                  </p>
                  <p className="text-xs" style={{ color: GOV.textMuted }}>
                    {region.high}/{region.total}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: GOV.border }}>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: GOV.text }}>
            <Users className="w-4 h-4" /> User Type Alignment
          </h3>
          <div className="space-y-2">
            {userTypeAlignment.map((type) => (
              <div key={type.userType || 'unknown'} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: GOV.bgLight }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: GOV.text }}>
                    {USER_TYPE_LABELS[type.userType] || type.userType}
                  </p>
                  <p className="text-xs" style={{ color: GOV.textMuted }}>
                    {type.total} assessments
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: COLORS.high }}>
                    {type.highPercentage}% HIGH
                  </p>
                  <p className="text-xs" style={{ color: GOV.textMuted }}>
                    {type.high}/{type.total}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {trendChartData.length > 0 && (
        <div className="bg-white rounded-lg p-6 border" style={{ borderColor: GOV.border }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: GOV.text }}>Funding alignment by completion month</h3>
          <p className="text-xs mb-3" style={{ color: GOV.textHint }}>
            Stacked counts of completed assessments by overall alignment (HIGH / MEDIUM / LOW), grouped by UTC month of completion.
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendChartData} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
              <XAxis dataKey="monthLabel" tick={{ fontSize: 10 }} stroke={GOV.textMuted} />
              <YAxis tick={{ fontSize: 10 }} stroke={GOV.textMuted} allowDecimals={false} />
              <Tooltip
                formatter={(value, name) => [
                  value,
                  name === 'high' ? 'HIGH' : name === 'medium' ? 'MEDIUM' : 'LOW',
                ]}
              />
              <Bar dataKey="high" stackId="m" name="high" fill={COLORS.high} radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" stackId="m" name="medium" fill={COLORS.medium} radius={[0, 0, 0, 0]} />
              <Bar dataKey="low" stackId="m" name="low" fill={COLORS.low} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AnalyticsFundingAlignmentSection;
