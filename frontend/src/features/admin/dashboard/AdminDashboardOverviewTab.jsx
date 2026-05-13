import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DataTable from '../../../components/data/DataTable';
import EswatiniLeafletMap from '../../../components/maps/EswatiniLeafletMap';
import { GOV } from '../../../theme/government';
import { INSTITUTION_TYPE_LABELS, PIE_COLORS, REGION_COLORS, REGION_LABELS } from '../../analytics/analyticsConstants';

const normalizeRegion = (value) => (value || '').toString().trim().toLowerCase();
const getHollandDisplayCode = (item) => item?.hollandCodeDisplay || item?.hollandCode || item?.holland_code || item?.code || '';
const INSTITUTION_TYPE_ORDER = ['school', 'university', 'college', 'tvet', 'vocational', 'other'];
const INSTITUTION_TYPE_SINGULARS = {
  school: 'school',
  university: 'university',
  college: 'college',
  tvet: 'TVET',
  vocational: 'vocational',
  other: 'other',
};
const INSTITUTION_TYPE_PLURALS = {
  school: 'schools',
  university: 'universities',
  college: 'colleges',
  tvet: 'TVET',
  vocational: 'vocational',
  other: 'other',
};
const formatInstitutionType = (type, count) => {
  if (Number(count) === 1) return INSTITUTION_TYPE_SINGULARS[type] || (INSTITUTION_TYPE_LABELS[type] || type).toLowerCase();
  return INSTITUTION_TYPE_PLURALS[type] || (INSTITUTION_TYPE_LABELS[type] || type).toLowerCase();
};

const AdminDashboardOverviewTab = ({
  analytics,
  regionalData,
  mapRegionalData,
  hollandDist,
  trend,
  institutionBreakdown,
  filters,
  onRegionSelect,
}) => {
  const institutionRows = useMemo(() => {
    return (institutionBreakdown?.institutions || []).map((row, index) => {
      const region = normalizeRegion(row.region) || 'unknown';
      const type = (row.type || 'unknown').toString().trim().toLowerCase();
      const totalAssessments = Number(row.totalAssessments || 0);
      const completedAssessments = Number(row.completedAssessments || 0);
      const completionRate = Number(row.completionRate ?? 0);
      const safeInstitutionId = row.institutionId ?? `unknown-${region}-${type}-${index}`;
      return {
        id: String(safeInstitutionId),
        institutionName: row.institutionName || 'Unknown Institution',
        region,
        type,
        tested: totalAssessments,
        completed: completedAssessments,
        completionRate,
        topCode: row.topCode || '-',
      };
    }).sort((a, b) => b.tested - a.tested || a.institutionName.localeCompare(b.institutionName));
  }, [institutionBreakdown]);

  const completionRate = analytics?.completionRate ?? 0;
  const totalUsers = analytics?.totals?.users ?? regionalData?.summary?.totalUsers ?? 0;
  const totalCompleted = analytics?.totals?.completedAssessments ?? regionalData?.summary?.completedAssessments ?? 0;
  const totalAssessments = analytics?.totals?.assessments ?? regionalData?.summary?.totalAssessments ?? 0;
  const institutionTypeCounts = useMemo(() => {
    const summaryRows = institutionBreakdown?.summary?.byType || [];
    if (summaryRows.length > 0) {
      return summaryRows.reduce((acc, row) => {
        const key = row.type || 'other';
        acc[key] = Number(row.count || 0);
        return acc;
      }, {});
    }

    return institutionRows.reduce((acc, row) => {
      const key = row.type || 'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [institutionBreakdown, institutionRows]);
  const institutionKpiTotal = institutionBreakdown?.summary?.totalInstitutions ?? institutionRows.length;
  const institutionKpiHint = useMemo(() => {
    const knownParts = INSTITUTION_TYPE_ORDER
      .filter((type) => Number(institutionTypeCounts[type] || 0) > 0)
      .map((type) => {
        const count = Number(institutionTypeCounts[type]);
        return `${count.toLocaleString()} ${formatInstitutionType(type, count)}`;
      });
    const extraParts = Object.entries(institutionTypeCounts)
      .filter(([type, count]) => !INSTITUTION_TYPE_ORDER.includes(type) && Number(count || 0) > 0)
      .map(([type, count]) => `${Number(count).toLocaleString()} ${formatInstitutionType(type, Number(count))}`);
    const parts = [...knownParts, ...extraParts];

    if (parts.length === 0) return 'No institutions matched current filters';
    return parts.join(' - ');
  }, [institutionTypeCounts]);
  const engagementPct = totalUsers > 0 ? Math.round((totalCompleted / totalUsers) * 100) : 0;

  const trendData = useMemo(
    () => trend.map(t => ({
      month: t.month ? new Date(t.month).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }) : '',
      started: Number(t.total || 0),
      completed: Number(t.completed || 0),
    })),
    [trend]
  );

  const regionalChartData = useMemo(
    () => (regionalData?.regions || []).map((r) => {
      const key = normalizeRegion(r.region) || 'unknown';
      return {
        key,
        region: REGION_LABELS[key] || r.region || 'Unknown',
        users: Number(r.totalUsers || 0),
        assessments: Number(r.totalAssessments || 0),
        completed: Number(r.completedAssessments || 0),
      };
    }),
    [regionalData]
  );

  const pieData = useMemo(
    () => hollandDist.slice(0, 8).map(d => ({ name: getHollandDisplayCode(d), value: Number(d.count) })),
    [hollandDist]
  );

  const schoolUsageRows = useMemo(() => {
    return institutionRows.map((row) => ({
      ...row,
      regionLabel: REGION_LABELS[row.region] || row.region,
    }));
  }, [institutionRows]);

  const selectedRegionDetail = useMemo(
    () => (
      filters.region
        ? (mapRegionalData?.regions || []).find((r) => normalizeRegion(r.region) === normalizeRegion(filters.region))
        : null
    ),
    [filters.region, mapRegionalData]
  );

  const schoolUsageColumns = [
    {
      key: 'institutionName',
      header: 'Institution',
      sortable: true,
      render: (row) => <span className="text-sm font-semibold" style={{ color: GOV.text }}>{row.institutionName}</span>,
    },
    {
      key: 'regionLabel',
      header: 'Region',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: GOV.textMuted }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: REGION_COLORS[row.region] || GOV.textHint }} />
          {row.regionLabel}
        </span>
      ),
    },
    { key: 'tested', header: 'Assessment Records', sortable: true, align: 'right' },
    { key: 'completed', header: 'Completed', sortable: true, align: 'right' },
    {
      key: 'completionRate',
      header: 'Completion Rate',
      sortable: true,
      align: 'right',
      render: (row) => <span className="font-semibold" style={{ color: GOV.blue }}>{row.completionRate}%</span>,
    },
    {
      key: 'topCode',
      header: 'Top Holland Code',
      sortable: true,
      align: 'center',
      render: (row) => <span className="font-mono font-semibold" style={{ color: GOV.text }}>{row.topCode}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard title="Total Users" value={totalUsers.toLocaleString()} hint="Registered users on SDS" />
        <KpiCard title="Tests Completed" value={totalCompleted.toLocaleString()} hint="Completed assessments" />
        <KpiCard
          title="Completion Rate"
          value={`${completionRate}%`}
          status={completionRate >= 70 ? 'good' : completionRate >= 40 ? 'warn' : 'bad'}
          hint={`${totalCompleted} of ${totalAssessments} finished`}
        />
        <KpiCard
          title="User Engagement"
          value={`${engagementPct}%`}
          status={engagementPct >= 50 ? 'good' : engagementPct >= 25 ? 'warn' : 'bad'}
          hint={`${totalCompleted} completions / ${totalUsers} users`}
        />
        <KpiCard
          title="Institutions"
          value={institutionKpiTotal.toLocaleString()}
          hint={institutionKpiHint}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 xl:col-span-2" style={{ borderColor: GOV.border }}>
          <h3 className="mb-2 text-sm font-bold" style={{ color: GOV.text }}>Assessments per Region</h3>
          <p className="mb-4 text-xs" style={{ color: GOV.textMuted }}>Compare total assessments and completed assessments by region.</p>
          {regionalChartData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={regionalChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
                <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="assessments" name="Total assessments" fill="#2563eb" radius={[4, 4, 0, 0]}>
                  {regionalChartData.map((entry) => (
                    <Cell key={`assessments-${entry.key}`} cursor="pointer" onClick={() => onRegionSelect?.(entry.key)} />
                  ))}
                </Bar>
                <Bar dataKey="completed" name="Completed" fill="#059669" radius={[4, 4, 0, 0]}>
                  {regionalChartData.map((entry) => (
                    <Cell key={`completed-${entry.key}`} cursor="pointer" onClick={() => onRegionSelect?.(entry.key)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4" style={{ borderColor: GOV.border }}>
          <h3 className="mb-2 text-sm font-bold" style={{ color: GOV.text }}>Holland Distribution</h3>
          <p className="mb-4 text-xs" style={{ color: GOV.textMuted }}>National personality profile split.</p>
          {pieData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={90} label>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 xl:col-span-2" style={{ borderColor: GOV.border }}>
          <h3 className="mb-2 text-sm font-bold" style={{ color: GOV.text }}>Monthly SDS Adoption Trend</h3>
          <p className="mb-4 text-xs" style={{ color: GOV.textMuted }}>Track growth of test usage over time.</p>
          {trendData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="started" stroke="#2563eb" fill="#2563eb" fillOpacity={0.16} name="Started" />
                <Area type="monotone" dataKey="completed" stroke="#059669" fill="#059669" fillOpacity={0.16} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4" style={{ borderColor: GOV.border }}>
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" style={{ color: GOV.blue }} />
            <h3 className="text-sm font-bold" style={{ color: GOV.text }}>National Map</h3>
          </div>
          <p className="mb-3 text-xs" style={{ color: GOV.textMuted }}>Click regions to filter. Hover for details.</p>
          <EswatiniLeafletMap
            regionRows={mapRegionalData?.regions || regionalData?.regions || []}
            selectedRegion={filters.region}
            onSelectRegion={(region) => onRegionSelect?.(filters.region === region ? '' : region)}
          />
          {selectedRegionDetail && (
            <div className="mt-3 rounded-md p-3" style={{ backgroundColor: GOV.blueLightAlt }}>
              <p className="text-xs font-semibold" style={{ color: GOV.text }}>{REGION_LABELS[selectedRegionDetail.region]} Region</p>
              <p className="mt-1 text-xs" style={{ color: GOV.textMuted }}>
                {selectedRegionDetail.totalUsers} users, {selectedRegionDetail.completedAssessments} completed, top code {selectedRegionDetail.topCode || '-'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={schoolUsageColumns}
          rows={schoolUsageRows}
          rowKey="id"
          loading={false}
          pageSize={7}
            emptyTitle="No institutional usage data"
          emptyMessage="Adjust filters to broaden results."
          toolbar={(
            <>
              <h3 className="text-sm font-bold" style={{ color: GOV.text }}>Detailed Institutional Usage Table</h3>
              <span className="ml-auto text-xs" style={{ color: GOV.textMuted }}>
                {schoolUsageRows.length} institutions matched
              </span>
            </>
          )}
        />
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, status, hint }) => {
  const accentColor = status === 'good' ? '#059669' : status === 'warn' ? '#d97706' : status === 'bad' ? '#dc2626' : GOV.blue;
  return (
    <div className="flex min-h-[120px] flex-col gap-1 rounded-lg border bg-white p-4" style={{ borderColor: GOV.border }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: GOV.textMuted }}>{title}</p>
      <p className="mt-1 text-2xl font-bold leading-none sm:text-3xl" style={{ color: status ? accentColor : GOV.text }}>{value}</p>
      {hint && <p className="mt-2 text-xs" style={{ color: GOV.textHint }}>{hint}</p>}
    </div>
  );
};

const EmptyChart = () => (
  <div className="flex h-[250px] items-center justify-center rounded-md border border-dashed" style={{ borderColor: GOV.borderLight }}>
    <p className="text-xs" style={{ color: GOV.textHint }}>No data available for these filters.</p>
  </div>
);

export default AdminDashboardOverviewTab;
