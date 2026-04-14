import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin, Filter, X, RefreshCw
} from 'lucide-react';
import FilterDialog from '../components/ui/FilterDialog';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PermissionGate } from '../context/PermissionContext';
import { GOV } from '../theme/government';
import AppShell from '../components/layout/AppShell';
import { adminService } from '../services/adminService';
import DataTable from '../components/data/DataTable';
import EswatiniLeafletMap from '../components/maps/EswatiniLeafletMap';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { PIE_COLORS, REGION_COLORS, REGION_LABELS } from '../features/analytics/analyticsConstants';

const normalizeRegion = (value) => (value || '').toString().trim().toLowerCase();

const AdminDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [regionalData, setRegionalData] = useState(null);
  const [mapRegionalData, setMapRegionalData] = useState(null);
  const [hollandDist, setHollandDist] = useState([]);
  const [trend, setTrend] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    region: '',
    institutionId: '',
    startDate: '',
    endDate: '',
  });

  const firstName = user?.firstName?.trim() || 'User';

  const buildParams = ({ includeRegion = true } = {}) => {
    const p = new URLSearchParams();
    if (includeRegion && filters.region) p.set('region', normalizeRegion(filters.region));
    if (filters.institutionId) p.set('institutionId', filters.institutionId);
    if (filters.startDate) p.set('startDate', filters.startDate);
    if (filters.endDate) p.set('endDate', filters.endDate);
    return p.toString();
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const qs = buildParams();
        const mapQs = buildParams({ includeRegion: false });
        const [aRes, rRes, hRes, tRes, mapRes] = await Promise.all([
          api.get(`/api/v1/analytics${qs ? `?${qs}` : ''}`),
          api.get(`/api/v1/analytics/regional${qs ? `?${qs}` : ''}`),
          api.get(`/api/v1/analytics/holland-distribution${qs ? `?${qs}` : ''}`),
          api.get(`/api/v1/analytics/trend${qs ? `?${qs}` : ''}`),
          filters.region
            ? api.get(`/api/v1/analytics/regional${mapQs ? `?${mapQs}` : ''}`)
            : Promise.resolve(null),
        ]);
        setAnalytics(aRes.data?.data || null);
        setRegionalData(rRes.data?.data || null);
        setMapRegionalData(mapRes?.data?.data || rRes.data?.data || null);
        setHollandDist(hRes.data?.data?.distribution || []);
        setTrend(tRes.data?.data?.trend || []);
      } catch {
        setAnalytics(null);
        setRegionalData(null);
        setMapRegionalData(null);
        setHollandDist([]);
        setTrend([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [filters.region, filters.institutionId, filters.startDate, filters.endDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const qs = buildParams();
      const mapQs = buildParams({ includeRegion: false });
      const [aRes, rRes, hRes, tRes, mapRes] = await Promise.all([
        api.get(`/api/v1/analytics${qs ? `?${qs}` : ''}`),
        api.get(`/api/v1/analytics/regional${qs ? `?${qs}` : ''}`),
        api.get(`/api/v1/analytics/holland-distribution${qs ? `?${qs}` : ''}`),
        api.get(`/api/v1/analytics/trend${qs ? `?${qs}` : ''}`),
        filters.region
          ? api.get(`/api/v1/analytics/regional${mapQs ? `?${mapQs}` : ''}`)
          : Promise.resolve(null),
      ]);
      setAnalytics(aRes.data?.data || null);
      setRegionalData(rRes.data?.data || null);
      setMapRegionalData(mapRes?.data?.data || rRes.data?.data || null);
      setHollandDist(hRes.data?.data?.distribution || []);
      setTrend(tRes.data?.data?.trend || []);
    } catch { /* silent */ }
    finally { setRefreshing(false); }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [assessmentsRes, institutionsRes] = await Promise.all([
          adminService.getAssessments(1000),
          adminService.getInstitutions(),
        ]);
        setAssessments(assessmentsRes || []);
        setInstitutions(institutionsRes || []);
      } catch {
        setAssessments([]);
        setInstitutions([]);
      }
    };
    fetchAdminData();
  }, []);

  const completionRate = analytics?.completionRate ?? 0;
  const totalUsers = analytics?.totals?.users ?? 0;
  const totalCompleted = analytics?.totals?.completedAssessments ?? 0;
  const totalAssessments = analytics?.totals?.assessments ?? 0;
  const schoolCount = institutions.filter(i => i.type === 'school').length;
  const universityCount = institutions.filter(i => i.type === 'university').length;
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
        completed: Number(r.completedAssessments || 0),
      };
    }),
    [regionalData]
  );

  const pieData = useMemo(
    () => hollandDist.slice(0, 8).map(d => ({ name: d.hollandCode, value: Number(d.count) })),
    [hollandDist]
  );

  const schoolUsageRows = useMemo(() => {
    const map = new Map();
    const parseDate = (v) => (v ? new Date(v) : null);
    const start = parseDate(filters.startDate);
    const end = parseDate(filters.endDate);
    const selectedRegion = normalizeRegion(filters.region);
    // Keep date filtering inclusive of the selected "to" date.
    if (end) end.setHours(23, 59, 59, 999);

    assessments.forEach((a) => {
      const inst = a.user?.institution;
      const institutionRegion = normalizeRegion(inst?.region);
      const userRegion = normalizeRegion(a.user?.region);
      const rowRegion = institutionRegion || userRegion || 'unknown';
      const completedAt = parseDate(a.completedAt || a.createdAt);
      if (start && completedAt && completedAt < start) return;
      if (end && completedAt && completedAt > end) return;
      if (selectedRegion && rowRegion !== selectedRegion) return;
      if (filters.institutionId && String(inst?.id) !== String(filters.institutionId)) return;

      const key = inst?.id || a.user?.institutionId || 'unknown';
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          institutionName: inst?.name || 'Unknown Institution',
          region: rowRegion,
          tested: 0,
          completed: 0,
          topCode: null,
          codes: {},
        });
      }

      const row = map.get(key);
      row.tested += 1;
      if (a.status === 'completed') row.completed += 1;
      if (a.hollandCode) {
        row.codes[a.hollandCode] = (row.codes[a.hollandCode] || 0) + 1;
      }
    });

    return Array.from(map.values())
      .map((r) => {
        const topCode = Object.entries(r.codes).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        return {
          ...r,
          topCode,
          completionRate: r.tested > 0 ? Math.round((r.completed / r.tested) * 100) : 0,
          regionLabel: REGION_LABELS[r.region] || r.region,
        };
      })
      .sort((a, b) => b.tested - a.tested);
  }, [assessments, filters.endDate, filters.institutionId, filters.region, filters.startDate]);

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
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REGION_COLORS[row.region] || GOV.textHint }} />
          {row.regionLabel}
        </span>
      ),
    },
    { key: 'tested', header: 'Students Tested', sortable: true, align: 'right' },
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

  const resetFilters = () => setFilters({ region: '', institutionId: '', startDate: '', endDate: '' });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-5 pb-1">
          <div className="pt-1">
            <h1 className="text-2xl font-bold" style={{ color: GOV.text }}>Welcome back, {firstName}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              style={{ borderColor: GOV.border, color: GOV.blue }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Total Users"
            value={totalUsers.toLocaleString()}
            hint="Registered users on SDS"
          />
          <KpiCard
            title="Tests Completed"
            value={totalCompleted.toLocaleString()}
            hint="Completed assessments"
          />
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
            value={`${schoolCount + universityCount}`}
            hint={`${schoolCount} schools · ${universityCount} universities`}
          />
        </div>

        {/* ── Compact Applied-Filters bar ── */}
        <div className="flex flex-wrap items-center gap-2 px-1 py-1">
          <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOV.blue }} />
          <span className="text-xs font-semibold mr-1 flex-shrink-0" style={{ color: GOV.textMuted }}>Applied Filters:</span>

          {!filters.region && !filters.institutionId && !filters.startDate && !filters.endDate && (
            <span className="text-xs italic" style={{ color: GOV.textHint }}>None — showing all data</span>
          )}

          {filters.region && (
            <button type="button" onClick={() => setFilters(p => ({ ...p, region: '' }))}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
              {REGION_LABELS[filters.region] || filters.region}
              <X className="w-3 h-3" />
            </button>
          )}
          {filters.institutionId && (
            <button type="button" onClick={() => setFilters(p => ({ ...p, institutionId: '' }))}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
              {institutions.find(i => String(i.id) === String(filters.institutionId))?.name || 'Institution'}
              <X className="w-3 h-3" />
            </button>
          )}
          {filters.startDate && (
            <button type="button" onClick={() => setFilters(p => ({ ...p, startDate: '' }))}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
              From {filters.startDate} <X className="w-3 h-3" />
            </button>
          )}
          {filters.endDate && (
            <button type="button" onClick={() => setFilters(p => ({ ...p, endDate: '' }))}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
              To {filters.endDate} <X className="w-3 h-3" />
            </button>
          )}

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setFilterDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border transition-colors hover:bg-blue-50"
            style={{ borderColor: GOV.blue, color: GOV.blue, backgroundColor: 'white' }}
          >
            <span className="text-base leading-none">+</span> Add Filter
          </button>

          {(filters.region || filters.institutionId || filters.startDate || filters.endDate) && (
            <button type="button" onClick={resetFilters}
              className="px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-red-50"
              style={{ color: '#dc2626' }}>
              Clear all
            </button>
          )}
        </div>

        {/* Filter Dialog */}
        <FilterDialog
          isOpen={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          filters={filters}
          onFilterChange={setFilters}
          onReset={resetFilters}
          title="Dashboard Filters"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>Region</label>
              <select value={filters.region} onChange={e => setFilters(p => ({ ...p, region: e.target.value }))} className="form-control w-full" style={{ borderBottomColor: GOV.border, color: GOV.text }}>
                <option value="">All Regions</option>
                {Object.entries(REGION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>Institution</label>
              <select value={filters.institutionId} onChange={e => setFilters(p => ({ ...p, institutionId: e.target.value }))} className="form-control w-full" style={{ borderBottomColor: GOV.border, color: GOV.text }}>
                <option value="">All Institutions</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>Start Date</label>
              <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} className="form-control w-full" style={{ borderBottomColor: GOV.border, color: GOV.text }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>End Date</label>
              <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} className="form-control w-full" style={{ borderBottomColor: GOV.border, color: GOV.text }} />
            </div>
          </div>
        </FilterDialog>

        {/* Charts + map */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-lg border p-4" style={{ borderColor: GOV.border }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: GOV.text }}>Assessments per Region</h3>
            <p className="text-xs mb-4" style={{ color: GOV.textMuted }}>Compare started and completed assessments by region.</p>
            {loading ? <LoadingChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionalChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
                  <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="users" name="Started" fill="#2563eb" radius={[4, 4, 0, 0]}>
                    {regionalChartData.map((entry) => (
                      <Cell key={`users-${entry.key}`} cursor="pointer" onClick={() => setFilters(prev => ({ ...prev, region: entry.key }))} />
                    ))}
                  </Bar>
                  <Bar dataKey="completed" name="Completed" fill="#059669" radius={[4, 4, 0, 0]}>
                    {regionalChartData.map((entry) => (
                      <Cell key={`completed-${entry.key}`} cursor="pointer" onClick={() => setFilters(prev => ({ ...prev, region: entry.key }))} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg border p-4" style={{ borderColor: GOV.border }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: GOV.text }}>Holland Distribution</h3>
            <p className="text-xs mb-4" style={{ color: GOV.textMuted }}>National personality profile split.</p>
            {loading ? <LoadingChart /> : (
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-lg border p-4" style={{ borderColor: GOV.border }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: GOV.text }}>Monthly SDS Adoption Trend</h3>
            <p className="text-xs mb-4" style={{ color: GOV.textMuted }}>Track growth of test usage over time.</p>
            {loading ? <LoadingChart /> : (
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

          <div className="bg-white rounded-lg border p-4" style={{ borderColor: GOV.border }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" style={{ color: GOV.blue }} />
              <h3 className="text-sm font-bold" style={{ color: GOV.text }}>National Map</h3>
            </div>
            <p className="text-xs mb-3" style={{ color: GOV.textMuted }}>Click regions to filter. Hover for details.</p>
            {loading ? <LoadingChart /> : (
              <EswatiniLeafletMap
                regionRows={mapRegionalData?.regions || []}
                selectedRegion={filters.region}
                onSelectRegion={(region) => setFilters(prev => ({ ...prev, region: prev.region === region ? '' : region }))}
              />
            )}
            {selectedRegionDetail && (
              <div className="mt-3 p-3 rounded-md" style={{ backgroundColor: GOV.blueLightAlt }}>
                <p className="text-xs font-semibold" style={{ color: GOV.text }}>{REGION_LABELS[selectedRegionDetail.region]} Region</p>
                <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>
                  {selectedRegionDetail.totalUsers} users, {selectedRegionDetail.completedAssessments} completed, top code {selectedRegionDetail.topCode || '-'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed data table */}
        <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: GOV.border }}>
          <DataTable
            columns={schoolUsageColumns}
            rows={schoolUsageRows}
            rowKey="id"
            loading={loading}
            pageSize={7}
            emptyTitle="No school usage data"
            emptyMessage="Adjust region/school/date filters to broaden results."
            toolbar={(
              <>
                <h3 className="text-sm font-bold" style={{ color: GOV.text }}>Detailed Institutional Usage Table</h3>
                <span className="text-xs ml-auto" style={{ color: GOV.textMuted }}>
                  {schoolUsageRows.length} institutions matched
                </span>
              </>
            )}
          />
        </div>

      </div>
    </AppShell>
  );
};

const KpiCard = ({ title, value, status, hint }) => {
  const accentColor = status === 'good' ? '#059669' : status === 'warn' ? '#d97706' : status === 'bad' ? '#dc2626' : GOV.blue;
  return (
    <div className="bg-white rounded-xl border p-5 flex flex-col gap-1" style={{ borderColor: GOV.border }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: GOV.textMuted }}>{title}</p>
      <p className="text-4xl font-bold leading-none mt-1" style={{ color: status ? accentColor : GOV.text }}>{value}</p>
      {hint && <p className="text-xs mt-2 italic" style={{ color: GOV.textHint }}>{hint}</p>}
    </div>
  );
};

const LoadingChart = () => (
  <div className="h-[250px] flex items-center justify-center">
    <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: GOV.borderLight, borderTopColor: GOV.blue }} />
  </div>
);

export default AdminDashboard;
