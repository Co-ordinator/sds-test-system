import React, { useEffect, useState, useMemo } from 'react';
import {
  Filter, RefreshCw, Briefcase, MapPin, TrendingUp, BarChart2, Download
} from 'lucide-react';
import api from '../services/api';
import { analyticsService } from '../services/analyticsService';
import { GOV } from '../theme/government';
import AppShell from '../components/layout/AppShell';
import FilterDialog from '../components/ui/FilterDialog';
import {
  RIASEC_LABELS, REGION_LABELS, INSTITUTION_TYPE_LABELS, USER_TYPE_LABELS
} from '../features/analytics/analyticsConstants';
import AnalyticsOverviewSection from '../features/analytics/AnalyticsOverviewSection';
import AnalyticsCareersSection from '../features/analytics/AnalyticsCareersSection';
import AnalyticsMapSection from '../features/analytics/AnalyticsMapSection';
import AnalyticsTrendsSection from '../features/analytics/AnalyticsTrendsSection';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'career', label: 'Career Intelligence' },
  { key: 'map', label: 'Regional Map' },
  { key: 'trends', label: 'Trends & Segmentation' },
];

const EMPTY_FILTERS = {
  institutionId: '', institutionType: '', region: '', userType: '', startDate: '', endDate: ''
};

const QUICK_DATE_RANGES = [
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: 'ytd', label: 'Year to date', type: 'ytd' },
];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [hollandDist, setHollandDist] = useState([]);
  const [trend, setTrend] = useState([]);
  const [regionalData, setRegionalData] = useState(null);
  const [kgData, setKgData] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [segmentData, setSegmentData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [refreshKey, setRefreshKey] = useState(0);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(Boolean),
    [filters]
  );

  const institutionMap = useMemo(
    () => {
      const map = {};
      institutions.forEach(item => {
        map[item.id] = item.name;
      });
      return map;
    },
    [institutions]
  );

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.institutionId) chips.push({ key: 'institutionId', label: institutionMap[filters.institutionId] || 'Institution' });
    if (filters.institutionType) chips.push({ key: 'institutionType', label: INSTITUTION_TYPE_LABELS[filters.institutionType] || filters.institutionType });
    if (filters.region) chips.push({ key: 'region', label: REGION_LABELS[filters.region] || filters.region });
    if (filters.userType) chips.push({ key: 'userType', label: USER_TYPE_LABELS[filters.userType] || filters.userType });
    if (filters.startDate) chips.push({ key: 'startDate', label: `From ${filters.startDate}` });
    if (filters.endDate) chips.push({ key: 'endDate', label: `To ${filters.endDate}` });
    return chips;
  }, [filters, institutionMap]);

  const clearFilter = (filterKey) => {
    setFilters(prev => ({ ...prev, [filterKey]: '' }));
  };

  const resetFilters = () => setFilters({ ...EMPTY_FILTERS });

  const applyQuickDateRange = (range) => {
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);

    if (range.type === 'ytd') {
      const startDate = `${now.getFullYear()}-01-01`;
      setFilters(prev => ({ ...prev, startDate, endDate }));
      return;
    }

    const start = new Date(now);
    start.setDate(start.getDate() - (range.days - 1));
    setFilters(prev => ({ ...prev, startDate: start.toISOString().slice(0, 10), endDate }));
  };

  const handleExport = async (format) => {
    try {
      const f = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      await analyticsService.exportReport(format, f);
    } catch {}
  };

  useEffect(() => {
    api.get('/api/v1/institutions').then(r => setInstitutions(r.data?.data?.institutions || [])).catch(() => {});
    analyticsService.getKnowledgeGraph().then(d => setKgData(d)).catch(() => {});
    analyticsService.getSkillsPipeline().then(d => setPipelineData(d)).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const f = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
        const [overviewData, hollandData, trendData, regionalData, segmentData] = await Promise.all([
          analyticsService.getOverview(f),
          analyticsService.getHollandDistribution(f),
          analyticsService.getTrend(f),
          analyticsService.getRegional(f),
          analyticsService.getSegmentation(f),
        ]);
        setAnalytics(overviewData);
        setHollandDist(hollandData);
        setTrend(trendData);
        setRegionalData(regionalData);
        setSegmentData(segmentData);
      } catch {
        setAnalytics(null); setHollandDist([]); setTrend([]); setRegionalData(null); setSegmentData(null);
      } finally { setLoading(false); }
    };
    setLoading(true); fetchAll();
  }, [filters.institutionId, filters.institutionType, filters.region, filters.userType, filters.startDate, filters.endDate, refreshKey]);

  /* Derived data */
  const riasecData = useMemo(() => analytics?.riasecAverages ? [
    { name: 'R', full: RIASEC_LABELS.R, value: Number(analytics.riasecAverages.avgR || 0) },
    { name: 'I', full: RIASEC_LABELS.I, value: Number(analytics.riasecAverages.avgI || 0) },
    { name: 'A', full: RIASEC_LABELS.A, value: Number(analytics.riasecAverages.avgA || 0) },
    { name: 'S', full: RIASEC_LABELS.S, value: Number(analytics.riasecAverages.avgS || 0) },
    { name: 'E', full: RIASEC_LABELS.E, value: Number(analytics.riasecAverages.avgE || 0) },
    { name: 'C', full: RIASEC_LABELS.C, value: Number(analytics.riasecAverages.avgC || 0) },
  ] : [], [analytics]);

  const pieData = useMemo(() => hollandDist.slice(0, 10).map(d => ({ name: d.hollandCode, value: Number(d.count) })), [hollandDist]);

  const trendData = useMemo(() => trend.map(t => ({
    month: t.month ? new Date(t.month).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }) : '',
    total: Number(t.total || 0), completed: Number(t.completed || 0),
    rate: Number(t.total) > 0 ? Math.round((Number(t.completed) / Number(t.total)) * 100) : 0
  })), [trend]);

  const regionChartData = useMemo(() => (regionalData?.regions || []).map(r => ({
    name: REGION_LABELS[r.region] || r.region, key: r.region,
    users: Number(r.totalUsers || 0), completed: Number(r.completedAssessments || 0),
    topCode: r.topCode || '--'
  })), [regionalData]);

  const userTypePieData = useMemo(() => (regionalData?.userTypeDistribution || []).map(d => ({
    name: USER_TYPE_LABELS[d.userType] || d.userType, value: Number(d.count || 0)
  })), [regionalData]);

  const completionRate = analytics?.completionRate ?? 0;
  const totalUsers = regionalData?.summary?.totalUsers ?? analytics?.totals?.users ?? 0;
  const totalAssessments = analytics?.totals?.assessments ?? regionalData?.summary?.totalAssessments ?? 0;
  const completedAssessments = analytics?.totals?.completedAssessments ?? regionalData?.summary?.completedAssessments ?? 0;

  return (
    <AppShell>
      {/* Sub-header */}
      <div className="border-b bg-white shadow-sm" style={{ borderColor: GOV.border }}>
        <div className="max-w-7xl mx-auto px-6 pt-5">
          <div className="flex items-start gap-4 pb-4">
            <h1 className="text-lg font-bold flex-1 pt-1" style={{ color: GOV.text }}>National Career Intelligence Platform</h1>
            <button
              type="button"
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold bg-white"
              style={{ borderColor: GOV.border, color: GOV.text }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button type="button" onClick={() => handleExport('csv')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold bg-white" style={{ borderColor: GOV.border, color: GOV.blue }}>
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button type="button" onClick={() => handleExport('pdf')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white" style={{ backgroundColor: GOV.blue }}>
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-2">
            {TABS.map(tab => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 rounded-md text-xs whitespace-nowrap transition-colors border ${activeTab === tab.key ? 'font-bold' : 'font-medium'}`}
                style={activeTab === tab.key
                  ? {
                    color: GOV.blue,
                    backgroundColor: GOV.blueLightAlt,
                    borderColor: '#bfdbfe'
                  }
                  : {
                    color: GOV.textMuted,
                    backgroundColor: 'transparent',
                    borderColor: 'transparent'
                  }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* ── Compact Applied-Filters bar ── */}
        <div className="flex flex-wrap items-center gap-2 px-1 py-1">
          <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOV.blue }} />
          <span className="text-xs font-semibold mr-1 flex-shrink-0" style={{ color: GOV.textMuted }}>Applied Filters:</span>

          {/* active filter chips */}
          {activeFilterChips.length === 0 && (
            <span className="text-xs italic" style={{ color: GOV.textHint }}>None — showing all data</span>
          )}
          {activeFilterChips.map(chip => (
            <button
              key={chip.key}
              type="button"
              onClick={() => clearFilter(chip.key)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}
            >
              {chip.label}
              <span className="ml-0.5 text-blue-400 hover:text-blue-700">×</span>
            </button>
          ))}

          {/* quick date presets */}
          <div className="flex items-center gap-1 ml-1">
            {QUICK_DATE_RANGES.map(range => (
              <button
                key={range.key}
                type="button"
                onClick={() => applyQuickDateRange(range)}
                className="px-2.5 py-0.5 rounded-full border text-xs font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: GOV.borderLight, color: GOV.textMuted }}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Add Filter button */}
          <button
            type="button"
            onClick={() => setFilterDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border transition-colors hover:bg-blue-50"
            style={{ borderColor: GOV.blue, color: GOV.blue, backgroundColor: 'white' }}
          >
            <span className="text-base leading-none">+</span> Add Filter
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors hover:bg-red-50"
              style={{ color: '#dc2626' }}
            >
              Clear all
            </button>
          )}

          {/* summary badge */}
          <span className="ml-1 text-xs pl-2 border-l" style={{ borderColor: GOV.borderLight, color: GOV.textHint }}>
            {totalUsers.toLocaleString()} users · {completedAssessments.toLocaleString()} completed
          </span>
        </div>

        {/* Filter Dialog */}
        <FilterDialog
          isOpen={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          filters={filters}
          onFilterChange={setFilters}
          onReset={resetFilters}
          title="Analytics Filters"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>Institution</label>
              <select 
                value={filters.institutionId} 
                onChange={e => setFilters(p => ({ ...p, institutionId: e.target.value }))} 
                className="form-control w-full" 
                style={{ borderBottomColor: GOV.border, color: GOV.text }}
              >
                <option value="">All Institutions</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>Institution Type</label>
              <select 
                value={filters.institutionType} 
                onChange={e => setFilters(p => ({ ...p, institutionType: e.target.value }))} 
                className="form-control w-full" 
                style={{ borderBottomColor: GOV.border, color: GOV.text }}
              >
                <option value="">All Types</option>
                {Object.entries(INSTITUTION_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>Region</label>
              <select 
                value={filters.region} 
                onChange={e => setFilters(p => ({ ...p, region: e.target.value }))} 
                className="form-control w-full" 
                style={{ borderBottomColor: GOV.border, color: GOV.text }}
              >
                <option value="">All Regions</option>
                {Object.entries(REGION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>User Type</label>
              <select 
                value={filters.userType} 
                onChange={e => setFilters(p => ({ ...p, userType: e.target.value }))} 
                className="form-control w-full" 
                style={{ borderBottomColor: GOV.border, color: GOV.text }}
              >
                <option value="">All User Types</option>
                {Object.entries(USER_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>Start Date</label>
              <input 
                type="date" 
                value={filters.startDate} 
                onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))} 
                className="form-control w-full" 
                style={{ borderBottomColor: GOV.border, color: GOV.text }} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>End Date</label>
              <input 
                type="date" 
                value={filters.endDate} 
                onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))} 
                className="form-control w-full" 
                style={{ borderBottomColor: GOV.border, color: GOV.text }} 
              />
            </div>
          </div>
        </FilterDialog>

        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: GOV.borderLight, borderTopColor: GOV.blue }} />
            <p className="text-sm mt-3" style={{ color: GOV.textHint }}>Loading analytics data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <AnalyticsOverviewSection
                analytics={analytics} riasecData={riasecData} pieData={pieData}
                regionChartData={regionChartData} userTypePieData={userTypePieData}
                trendData={trendData} kgData={kgData} completionRate={completionRate}
                totalUsers={totalUsers} totalAssessments={totalAssessments}
                completedAssessments={completedAssessments}
              />
            )}
            {activeTab === 'career' && <AnalyticsCareersSection kgData={kgData} pipelineData={pipelineData} />}
            {activeTab === 'map' && (
              <AnalyticsMapSection
                regionalData={regionalData} regionChartData={regionChartData}
                selectedRegion={selectedRegion} onRegionChange={setSelectedRegion}
              />
            )}
            {activeTab === 'trends' && (
              <AnalyticsTrendsSection trendData={trendData} riasecData={riasecData} hollandDist={hollandDist} kgData={kgData} segmentData={segmentData} />
            )}
          </>
        )}

        <p className="text-xs text-center py-4" style={{ color: GOV.textHint }}>
          Kingdom of Eswatini · National Career Intelligence Platform · Ministry of Labour and Social Security
        </p>
      </div>
    </AppShell>
  );
};

export default Analytics;
