import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  FileText, Map, Users, Briefcase, Building2, TrendingUp,
  Download, Filter, RefreshCw, AlertCircle,
  Globe, Loader, Maximize2, Minimize2, X, Printer,
} from 'lucide-react';
import { GOV } from '../../../theme/government';
import FilterDialog from '../../../components/ui/FilterDialog';
import api from '../../../services/api';

/* ── Report section definitions (composable master report) ───────────────── */
const REPORT_SECTIONS = [
  { key: 'executive_summary',       label: 'Executive Summary',       icon: Globe,      description: 'KPIs, Holland codes, distribution charts' },
  { key: 'regional',                label: 'Regional Distribution',   icon: Map,        description: 'Regional performance scorecard' },
  { key: 'gender_demographics',     label: 'Gender & Demographics',   icon: Users,      description: 'Gender breakdown, cross-tabulation' },
  { key: 'career_intelligence',     label: 'Career Intelligence',     icon: Briefcase,  description: 'RIASEC averages, Holland codes, occupations' },
  { key: 'institution_performance', label: 'Institution Performance', icon: Building2,  description: 'Performance ranking by institution' },
  { key: 'assessment_trends',       label: 'Assessment Trends',       icon: TrendingUp, description: 'Monthly completion & registration trends' },
];
const ALL_SECTION_KEYS = REPORT_SECTIONS.map(s => s.key);

const REGIONS    = ['hhohho', 'manzini', 'lubombo', 'shiselweni'];
const GENDERS    = ['male', 'female', 'other', 'prefer_not_to_say'];
const GENDER_LABELS = { male: 'Male', female: 'Female', other: 'Other', prefer_not_to_say: 'Prefer not to say' };
const USER_TYPES = ['High School Student', 'University Student', 'Professional'];
const EMPTY_FILTERS = { institutionId: '', region: '', userType: '', gender: '', startDate: '', endDate: '' };

const FilterSection = ({ filters, setFilters, institutions }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>Region</label>
        <select
          value={filters.region}
          onChange={e => setFilters(p => ({ ...p, region: e.target.value }))}
          className="form-control w-full"
          style={{ borderBottomColor: GOV.border, color: GOV.text }}
        >
          <option value="">All Regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: GOV.text }}>Gender</label>
        <select
          value={filters.gender}
          onChange={e => setFilters(p => ({ ...p, gender: e.target.value }))}
          className="form-control w-full"
          style={{ borderBottomColor: GOV.border, color: GOV.text }}
        >
          <option value="">All Genders</option>
          {GENDERS.map(g => <option key={g} value={g}>{GENDER_LABELS[g]}</option>)}
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
          {USER_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
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
  </div>
);

/* ── Report colours — neutral formal palette ─────────────────────────────── */
const C = {
  NAVY: '#1e3a5f', ICE: '#e8eef6', STRIPE: '#f7f9fc',
  BORDER: '#d1d5db', TEXT: '#111827', MUTED: '#6b7280', WHITE: '#ffffff',
  BAR_TRK: '#e5e7eb',
};
const RIASEC_NAME = { R:'Realistic', I:'Investigative', A:'Artistic', S:'Social', E:'Enterprising', C:'Conventional' };
const REGION_LBL = { hhohho:'Hhohho', manzini:'Manzini', lubombo:'Lubombo', shiselweni:'Shiselweni' };
const GENDER_LBL = { male:'Male', female:'Female', other:'Other', prefer_not_to_say:'Prefer not to say' };
const UTYPE_LBL = { 'High School Student':'High School', 'University Student':'University', Professional:'Professional', 'Test Administrator':'Test Admin', 'System Administrator':'Sys Admin' };
const fmtN = n => Number(n || 0).toLocaleString();
const capF = s => s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '—';

/* ── Reusable report preview primitives — clean formal style ────────────── */
const KpiCard = ({ label, value, sub }) => (
  <div className="border py-3 px-2 text-center" style={{ borderColor: C.BORDER }}>
    <p className="text-lg font-bold leading-tight" style={{ color: C.TEXT }}>{value}</p>
    <p className="text-[9px] font-medium uppercase tracking-wider mt-1" style={{ color: C.MUTED }}>{label}</p>
    {sub && <p className="text-[9px] mt-0.5" style={{ color: C.MUTED }}>{sub}</p>}
  </div>
);

const SectionHead = ({ title }) => (
  <div className="mt-5 mb-1.5 pb-1 border-b" style={{ borderColor: C.BORDER }}>
    <p className="text-[11px] font-bold" style={{ color: C.TEXT }}>{title}</p>
  </div>
);

const THead = ({ cols }) => (
  <tr>
    {cols.map((c, i) => (
      <th key={i} className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide text-left border-b" style={{ backgroundColor: C.WHITE, color: C.TEXT, borderColor: C.BORDER }}>{c}</th>
    ))}
  </tr>
);

const HBar = ({ value, max, width }) => (
  <div className="overflow-hidden" style={{ height: 7, backgroundColor: C.BAR_TRK, width: width || '100%' }}>
    <div className="h-full" style={{ width: `${max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0}%`, backgroundColor: C.NAVY }} />
  </div>
);

const gradeLabel = (rate) => {
  const g = rate >= 80 ? 'A' : rate >= 60 ? 'B' : rate >= 40 ? 'C' : 'D';
  return <span className="text-[10px] font-bold" style={{ color: C.TEXT }}>{g}</span>;
};

/* ── Pie chart palette — distinct professional tones ─────────────────── */
const PIE_PAL = ['#1e3a5f', '#457b9d', '#2d6a4f', '#6d6875', '#e07a5f', '#3d405b'];
function polarToCart(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
const PieChart = ({ data, size = 104, vertical = false }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;
  let cum = 0;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const s = { ...d, start: cum, angle, color: PIE_PAL[i % PIE_PAL.length], pct: Math.round((d.value / total) * 100) };
    cum += angle;
    return s;
  });
  const svgEl = (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {slices.map((s, i) => {
        if (s.angle < 0.5) return null;
        if (s.angle >= 359.9) return <circle key={i} cx={cx} cy={cy} r={r} fill={s.color} />;
        const p1 = polarToCart(cx, cy, r, s.start);
        const p2 = polarToCart(cx, cy, r, s.start + s.angle);
        return <path key={i} d={`M${cx},${cy} L${p1.x},${p1.y} A${r},${r},0,${s.angle > 180 ? 1 : 0},1,${p2.x},${p2.y} Z`} fill={s.color} stroke="#fff" strokeWidth={1} />;
      })}
    </svg>
  );
  const legendEl = (
    <div className={`space-y-1 ${vertical ? 'w-full' : 'min-w-0 flex-1'}`}>
      {slices.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: C.TEXT }}>
          <span className="flex-shrink-0 rounded-sm" style={{ width: 8, height: 8, backgroundColor: s.color, display: 'inline-block' }} />
          <span className="truncate">{s.label}</span>
          <span className="ml-auto font-semibold flex-shrink-0" style={{ color: C.MUTED }}>{fmtN(s.value)} ({s.pct}%)</span>
        </div>
      ))}
    </div>
  );
  if (vertical) {
    return (
      <div className="flex flex-col items-center gap-2">
        {svgEl}
        {legendEl}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      {svgEl}
      {legendEl}
    </div>
  );
};

/* ── Main Panel ──────────────────────────────────────────────────────────── */
const AdminReportsPanel = () => {
  const [enabledSections, setEnabledSections] = useState(() => new Set(ALL_SECTION_KEYS));
  const [filters, setFilters]               = useState({ ...EMPTY_FILTERS });
  const [institutions, setInstitutions]     = useState([]);
  const [preview, setPreview]               = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState(null);
  const [generating, setGenerating]         = useState(false);
  const [printing, setPrinting]             = useState(false);
  const [genError, setGenError]             = useState(null);
  const [genSuccess, setGenSuccess]         = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const presentationRef = useRef(null);

  useEffect(() => {
    api.get('/api/v1/institutions').then(r => setInstitutions(r.data?.data?.institutions || [])).catch(() => {});
  }, []);

  const reportTitle = useMemo(() => {
    if (filters.institutionId) {
      const inst = institutions.find(i => i.id === filters.institutionId);
      return `Institutional Report${inst ? ': ' + inst.name : ''}`;
    }
    if (filters.region) return `Regional Report: ${REGION_LBL[filters.region] || capF(filters.region)}`;
    return 'National Report';
  }, [filters.institutionId, filters.region, institutions]);

  /* Sync React state with native fullscreen changes (ESC / F11 / browser exit) */
  useEffect(() => {
    const onFsChange = () => {
      setPresentationMode(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const enterPresentation = useCallback(() => {
    presentationRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  const exitPresentation = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const togglePresentation = useCallback(() => {
    if (document.fullscreenElement) exitPresentation();
    else enterPresentation();
  }, [enterPresentation, exitPresentation]);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview({});
    try {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) qs.set(k, v); });
      const results = await Promise.all(
        REPORT_SECTIONS.map(s =>
          api.get(`/api/v1/reports/preview/${s.key}?${qs}`)
            .then(r => ({ key: s.key, data: r.data?.data || null }))
            .catch(() => ({ key: s.key, data: null }))
        )
      );
      const merged = {};
      results.forEach(r => { if (r.data) merged[r.key] = r.data; });
      setPreview(merged);
    } catch (err) {
      setPreviewError('Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  }, [filters]);

  /* Auto-load preview on mount */
  useEffect(() => {
    loadPreview();
  }, []); // eslint-disable-line

  const toggleSection = (key) => {
    setEnabledSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleAllSections = () => {
    setEnabledSections(prev => prev.size === ALL_SECTION_KEYS.length ? new Set() : new Set(ALL_SECTION_KEYS));
  };

  const generateReport = async () => {
    setGenerating(true);
    setGenError(null);
    setGenSuccess(false);
    try {
      const res = await api.post('/api/v1/reports/generate', { sections: [...enabledSections], filters }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setGenSuccess(true);
      setTimeout(() => setGenSuccess(false), 4000);
    } catch {
      setGenError('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const printReport = async () => {
    setPrinting(true);
    try {
      const res = await api.post('/api/v1/reports/generate', { sections: [...enabledSections], filters }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    } catch {
      setGenError('Failed to generate report for printing.');
    } finally {
      setPrinting(false);
    }
  };

  const resetFilters = useCallback(() => setFilters({ ...EMPTY_FILTERS }), []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  /* ── Section renderer — mirrors PDF layout exactly ──────────────────── */
  const renderSection = (sectionKey, preview) => {
    switch (sectionKey) {

      /* ═══════════════════════ EXECUTIVE SUMMARY ═══════════════════════ */
      case 'executive_summary': {
        const rate = preview.completionRate || 0;
        const hMax = Math.max(...(preview.hollandDist || []).map(r => Number(r.count)), 1);
        const gTotal = (preview.genderDist || []).reduce((s, r) => s + Number(r.count), 0) || 1;
        const rTotal = (preview.regionDist || []).reduce((s, r) => s + Number(r.count), 0) || 1;
        const uTotal = (preview.userTypeDist || []).reduce((s, r) => s + Number(r.count), 0) || 1;
        return (
          <div>
            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <KpiCard label="Total Participants" value={fmtN(preview.totalUsers)} />
              <KpiCard label="Assessments Taken" value={fmtN(preview.totalAssessments)} />
              <KpiCard label="Assessments Completed" value={fmtN(preview.completedAssessments)} />
              <KpiCard label="Completion Rate" value={`${rate}%`}
                sub={rate >= 70 ? 'On Target' : rate >= 40 ? 'Needs Attention' : 'Below Target'} />
            </div>

            {/* 1. Holland Code Distribution */}
            <SectionHead title="1. Holland Code Distribution (Top 10)" />
            <table className="w-full border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
              <thead><THead cols={['Code', 'Personality Profile', 'Frequency', 'Count']} /></thead>
              <tbody>
                {(preview.hollandDist || []).map((row, i) => {
                  const code = row.holland_code || '', cnt = Number(row.count);
                  const desc = code.split('').map(c => RIASEC_NAME[c] || c).join(' / ');
                  return (
                    <tr key={i} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                      <td className="px-2 py-1 border-b font-bold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{code}</td>
                      <td className="px-2 py-1 border-b" style={{ borderColor: C.BORDER, color: C.TEXT }}>{desc}</td>
                      <td className="px-2 py-1 border-b" style={{ borderColor: C.BORDER, width: '35%' }}>
                        <HBar value={cnt} max={hMax} />
                      </td>
                      <td className="px-2 py-1 border-b text-right font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(cnt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 2-4. Distribution charts — max 3 per row */}
            <SectionHead title="2–4. Participant Distribution" />
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide mb-2 text-center" style={{ color: C.MUTED }}>Gender</p>
                <PieChart vertical size={88} data={(preview.genderDist || []).map(r => ({ label: GENDER_LBL[r.gender] || capF(r.gender), value: Number(r.count) }))} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide mb-2 text-center" style={{ color: C.MUTED }}>Region</p>
                <PieChart vertical size={88} data={(preview.regionDist || []).map(r => ({ label: REGION_LBL[r.region] || capF(r.region), value: Number(r.count) }))} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide mb-2 text-center" style={{ color: C.MUTED }}>User Type</p>
                <PieChart vertical size={88} data={(preview.userTypeDist || []).map(r => ({ label: UTYPE_LBL[r.user_type] || r.user_type || '—', value: Number(r.count) }))} />
              </div>
            </div>
          </div>
        );
      }

      /* ═══════════════════════ REGIONAL DISTRIBUTION ═══════════════════ */
      case 'regional': {
        const regions = preview.regions || [];
        const t = preview.totals || {};
        const totalRate = t.totalUsers > 0 ? Math.round((t.completedAssessments / t.totalUsers) * 100) : 0;
        return (
          <div>
            {/* Regional pie + KPI cards side by side */}
            <div className="flex gap-6 items-start mb-4">
              <div style={{ minWidth: 260 }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: C.MUTED }}>Participant Share by Region</p>
                <PieChart data={regions.map(r => ({ label: REGION_LBL[r.region] || capF(r.region), value: Number(r.totalUsers) }))} size={120} />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                {regions.slice(0, 4).map((r, i) => (
                  <KpiCard key={i} label={REGION_LBL[r.region] || capF(r.region)} value={`${r.completionRate || 0}%`} sub={`${fmtN(r.totalUsers)} participants`} />
                ))}
              </div>
            </div>

            {/* Scorecard table */}
            <SectionHead title="Regional Performance Scorecard" />
            <table className="w-full border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
              <thead><THead cols={['Region', 'Grade', 'Participants', 'Completed', 'Completion Rate', 'Top Code']} /></thead>
              <tbody>
                {regions.map((row, i) => {
                  const rate = row.completionRate || 0;
                  return (
                    <tr key={i} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                      <td className="px-2 py-1.5 border-b font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{REGION_LBL[row.region] || capF(row.region)}</td>
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: C.BORDER }}>{gradeLabel(rate)}</td>
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(row.totalUsers)}</td>
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(row.completedAssessments)}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: C.BORDER, width: '22%' }}>
                        <div className="flex items-center gap-1.5">
                          <HBar value={rate} max={100} />
                          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: C.TEXT, minWidth: 28 }}>{rate}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 border-b text-center font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{row.topCode || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* National totals */}
            <div className="mt-2 px-3 py-2 border text-[10px] font-bold" style={{ borderColor: C.BORDER, color: C.TEXT }}>
              NATIONAL TOTALS — {fmtN(t.totalUsers)} participants, {fmtN(t.completedAssessments)} completed ({totalRate}% national rate)
            </div>
          </div>
        );
      }

      /* ═══════════════════════ GENDER & DEMOGRAPHICS ══════════════════ */
      case 'gender_demographics': {
        const gBreak = preview.genderBreakdown || [];
        return (
          <div>
            {/* Gender pie + summary side by side */}
            <div className="flex gap-6 items-start mb-4">
              <div style={{ minWidth: 260 }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: C.MUTED }}>Participant Distribution by Gender</p>
                <PieChart data={gBreak.map(g => ({ label: GENDER_LBL[g.gender] || capF(g.gender), value: Number(g.totalUsers) }))} size={120} />
              </div>
              <table className="flex-1 border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
                <thead><THead cols={['Gender', 'Participants', 'Completed', 'Top Code']} /></thead>
                <tbody>
                  {gBreak.map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                      <td className="px-2 py-1.5 border-b font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{GENDER_LBL[row.gender] || capF(row.gender)}</td>
                      <td className="px-2 py-1.5 border-b text-right" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(row.totalUsers)}</td>
                      <td className="px-2 py-1.5 border-b text-right" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(row.completedAssessments)}</td>
                      <td className="px-2 py-1.5 border-b text-center font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{row.topCode || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 1. Participant Type by Gender */}
            <SectionHead title="1. Participant Type by Gender" />
            <table className="w-full border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
              <thead><THead cols={['User Type', 'Gender', 'Count']} /></thead>
              <tbody>
                {(preview.userTypeDist || []).map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                    <td className="px-2 py-1 border-b" style={{ borderColor: C.BORDER, color: C.TEXT }}>{UTYPE_LBL[row.user_type] || row.user_type || '—'}</td>
                    <td className="px-2 py-1 border-b" style={{ borderColor: C.BORDER, color: C.TEXT }}>{GENDER_LBL[row.gender] || capF(row.gender)}</td>
                    <td className="px-2 py-1 border-b text-center font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 3. Regional Gender Distribution */}
            <SectionHead title="3. Regional Gender Distribution" />
            <table className="w-full border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
              <thead><THead cols={['Region', 'Gender', 'Count']} /></thead>
              <tbody>
                {(preview.regionGenderDist || []).map((row, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                    <td className="px-2 py-1 border-b" style={{ borderColor: C.BORDER, color: C.TEXT }}>{REGION_LBL[row.region] || capF(row.region)}</td>
                    <td className="px-2 py-1 border-b" style={{ borderColor: C.BORDER, color: C.TEXT }}>{GENDER_LBL[row.gender] || capF(row.gender)}</td>
                    <td className="px-2 py-1 border-b text-center font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      /* ═══════════════════════ CAREER INTELLIGENCE ════════════════════ */
      case 'career_intelligence': {
        const ri = preview.riasecAverages || {};
        const riasec = [
          { key:'R', label:'Realistic',     val: parseFloat(ri.avgR || 0) },
          { key:'I', label:'Investigative', val: parseFloat(ri.avgI || 0) },
          { key:'A', label:'Artistic',      val: parseFloat(ri.avgA || 0) },
          { key:'S', label:'Social',        val: parseFloat(ri.avgS || 0) },
          { key:'E', label:'Enterprising',  val: parseFloat(ri.avgE || 0) },
          { key:'C', label:'Conventional',  val: parseFloat(ri.avgC || 0) },
        ];
        const rMax = Math.max(...riasec.map(r => r.val), 1);
        const hMax = Math.max(...(preview.hollandDist || []).map(r => Number(r.count)), 1);

        return (
          <div>
            {/* 1. RIASEC Dimension Averages */}
            <SectionHead title="1. RIASEC Dimension Averages" />
            <table className="w-full border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
              <thead><THead cols={['Code', 'Dimension', 'Average Score', 'Distribution']} /></thead>
              <tbody>
                {riasec.map((r, i) => (
                  <tr key={r.key} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                    <td className="px-2 py-1.5 border-b font-bold text-center" style={{ borderColor: C.BORDER, color: C.TEXT }}>{r.key}</td>
                    <td className="px-2 py-1.5 border-b font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{r.label}</td>
                    <td className="px-2 py-1.5 border-b text-center font-bold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{r.val.toFixed(1)}</td>
                    <td className="px-2 py-1.5 border-b" style={{ borderColor: C.BORDER, width: '35%' }}>
                      <HBar value={r.val} max={rMax} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 2. Holland Code Frequency */}
            <SectionHead title="2. Holland Code Frequency (Top 15)" />
            <table className="w-full border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
              <thead><THead cols={['Code', 'Personality Profile', 'Frequency', 'Count']} /></thead>
              <tbody>
                {(preview.hollandDist || []).map((row, i) => {
                  const code = row.holland_code || '', cnt = Number(row.count);
                  const desc = code.split('').map(c => RIASEC_NAME[c] || c).join(' / ');
                  return (
                    <tr key={i} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                      <td className="px-2 py-1 border-b font-bold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{code}</td>
                      <td className="px-2 py-1 border-b" style={{ borderColor: C.BORDER, color: C.TEXT }}>{desc}</td>
                      <td className="px-2 py-1 border-b" style={{ borderColor: C.BORDER, width: '30%' }}>
                        <HBar value={cnt} max={hMax} />
                      </td>
                      <td className="px-2 py-1 border-b text-right font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(cnt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 3. Top Occupations */}
            <SectionHead title="3. Top Occupations in System" />
            <table className="w-full border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
              <thead><THead cols={['Occupation Name', 'Holland Code']} /></thead>
              <tbody>
                {(preview.topOccupations || []).map((occ, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                    <td className="px-2 py-1 border-b" style={{ borderColor: C.BORDER, color: C.TEXT }}>{occ.name}</td>
                    <td className="px-2 py-1 border-b text-center font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{occ.code || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      /* ═══════════════════════ INSTITUTION PERFORMANCE ════════════════ */
      case 'institution_performance': {
        return (
          <div>
            <SectionHead title="Institution Performance Ranking (by Completion Rate)" />
            <table className="w-full border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
              <thead><THead cols={['Institution', 'Grade', 'Type', 'Students', 'Completed', 'Completion Rate']} /></thead>
              <tbody>
                {(preview.institutions || []).map((row, i) => {
                  const rate = row.completionRate || 0;
                  return (
                    <tr key={i} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                      <td className="px-2 py-1.5 border-b font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT, maxWidth: 160 }}>
                        <span className="block truncate">{row.name || '—'}</span>
                      </td>
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: C.BORDER }}>{gradeLabel(rate)}</td>
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: C.BORDER, color: C.TEXT }}>{capF(row.type)}</td>
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(row.totalStudents)}</td>
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(row.completedAssessments)}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: C.BORDER, width: '20%' }}>
                        <div className="flex items-center gap-1.5">
                          <HBar value={rate} max={100} />
                          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: C.TEXT, minWidth: 28 }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(preview.institutions || []).length === 0 && (
              <p className="text-[10px] text-center py-3" style={{ color: C.MUTED }}>No institution data available for the selected filters.</p>
            )}
          </div>
        );
      }

      /* ═══════════════════════ ASSESSMENT TRENDS ═════════════════════ */
      case 'assessment_trends': {
        const maxComp = Math.max(...(preview.trendData || []).map(r => Number(r.completed || 0)), 1);
        const maxReg = Math.max(...(preview.trendData || []).map(r => Number(r.registrations || 0)), 1);
        return (
          <div>
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <KpiCard label="Total Completions (Period)" value={fmtN(preview.totalCompleted)} />
              <KpiCard label="New Registrations (Period)" value={fmtN(preview.totalRegistrations)} />
            </div>

            {/* Monthly trend table with visual bars */}
            <SectionHead title="Month-by-Month Assessment Activity" />
            <table className="w-full border-collapse text-[10px]" style={{ borderColor: C.BORDER }}>
              <thead><THead cols={['Month', 'Completed', 'Distribution', 'Registrations', 'Distribution']} /></thead>
              <tbody>
                {(preview.trendData || []).map((row, i) => {
                  const comp = Number(row.completed || 0), reg = Number(row.registrations || 0);
                  return (
                    <tr key={i} style={{ backgroundColor: i % 2 === 1 ? C.STRIPE : C.WHITE }}>
                      <td className="px-2 py-1.5 border-b font-semibold" style={{ borderColor: C.BORDER, color: C.TEXT }}>{row.month || '—'}</td>
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(comp)}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: C.BORDER, width: '22%' }}>
                        <HBar value={comp} max={maxComp} />
                      </td>
                      <td className="px-2 py-1.5 border-b text-center" style={{ borderColor: C.BORDER, color: C.TEXT }}>{fmtN(reg)}</td>
                      <td className="px-2 py-1.5 border-b" style={{ borderColor: C.BORDER, width: '22%' }}>
                        <HBar value={reg} max={maxReg} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      default: return null;
    }
  };

  const renderAllSections = () => {
    const active = REPORT_SECTIONS.filter(s => enabledSections.has(s.key) && preview[s.key]);
    if (active.length === 0) return null;
    return (
      <div className="space-y-6">
        {active.map(sec => (
          <div key={sec.key}>
            <div className="mb-3 pb-1.5 border-b" style={{ borderColor: C.BORDER }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.NAVY }}>{sec.label}</p>
            </div>
            {renderSection(sec.key, preview[sec.key])}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: GOV.text }}>Report</h1>
      </div>

      <div className="flex gap-6">
        {/* ── Sidebar: section toggles ── */}
        <nav className="w-64 flex-shrink-0">
          <div className="bg-white border rounded-md overflow-hidden" style={{ borderColor: GOV.border }}>
            {/* Header with Select All / Deselect All */}
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: GOV.borderLight, backgroundColor: '#f9fafb' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.MUTED }}>Report Sections</p>
              <button type="button" onClick={toggleAllSections} className="text-[10px] font-semibold hover:underline" style={{ color: GOV.blue }}>
                {enabledSections.size === ALL_SECTION_KEYS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            {REPORT_SECTIONS.map((sec, idx) => {
              const Icon = sec.icon;
              const isOn = enabledSections.has(sec.key);
              return (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => toggleSection(sec.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${idx > 0 ? 'border-t' : ''} hover:bg-gray-50`}
                  style={{ borderColor: GOV.borderLight }}
                >
                  <input type="checkbox" checked={isOn} readOnly
                    className="w-3.5 h-3.5 rounded flex-shrink-0 accent-blue-700 pointer-events-none" />
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isOn ? GOV.blue : '#e5e7eb' }}
                  >
                    <Icon className="w-3 h-3" style={{ color: isOn ? '#ffffff' : GOV.textMuted }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold leading-none" style={{ color: isOn ? GOV.text : GOV.textMuted }}>{sec.label}</p>
                    <p className="text-[10px] mt-0.5 leading-tight" style={{ color: GOV.textHint }}>{sec.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Main content: Filters + Preview + Generate ── */}
        <div
          className="flex-1 min-w-0 space-y-5"
          style={{ minHeight: '400px' }}
        >
          {/* Filter Dialog */}
          <FilterDialog
            isOpen={filterDialogOpen}
            onClose={() => setFilterDialogOpen(false)}
            filters={filters}
            onFilterChange={setFilters}
            onReset={resetFilters}
            title="Report Filters"
          >
            <FilterSection filters={filters} setFilters={setFilters} institutions={institutions} />
          </FilterDialog>

          {/* Preview panel */}
          <div className="bg-white border rounded-md overflow-hidden" style={{ borderColor: GOV.border }}>
            {/* Ministry branded header bar */}
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: GOV.blue }}>
              <img src="/siyinqaba.png" alt="Ministry Logo" className="h-8 w-8 object-contain flex-shrink-0 rounded"
                onError={e => { e.target.style.display = 'none'; }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold tracking-wide text-white opacity-90">MINISTRY OF LABOUR AND SOCIAL SECURITY</p>
                <p className="text-[9px] text-white/60 font-medium truncate">Kingdom of Eswatini · National Career Guidance System</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button type="button" onClick={() => setFilterDialogOpen(true)}
                  className="p-1.5 rounded transition-colors hover:bg-white/20" style={{ color: 'white' }} title="Filters">
                  <Filter className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={loadPreview} disabled={previewLoading}
                  className="p-1.5 rounded transition-colors hover:bg-white/20" style={{ color: 'white' }} title="Refresh preview">
                  <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
                </button>
                <button type="button" onClick={printReport} disabled={printing}
                  className="p-1.5 rounded transition-colors hover:bg-white/20" style={{ color: 'white' }} title="Print PDF">
                  <Printer className={`w-3.5 h-3.5 ${printing ? 'animate-pulse' : ''}`} />
                </button>
                <button type="button" onClick={generateReport} disabled={generating}
                  className="p-1.5 rounded transition-colors hover:bg-white/20" style={{ color: 'white' }} title="Download PDF">
                  <Download className={`w-3.5 h-3.5 ${generating ? 'animate-pulse' : ''}`} />
                </button>
                <button type="button" onClick={enterPresentation}
                  className="p-1.5 rounded transition-colors hover:bg-white/20" style={{ color: 'white' }}
                  title="Enter presentation mode">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* Report title sub-bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: GOV.border, backgroundColor: '#f9fafb' }}>
              <div>
                <p className="text-xs font-bold" style={{ color: C.TEXT }}>{reportTitle}</p>
                <p className="text-[9px]" style={{ color: C.MUTED }}>Generated: {new Date().toLocaleDateString('en-ZA', { year:'numeric', month:'long', day:'numeric' })}</p>
              </div>
              <p className="text-[9px]" style={{ color: C.MUTED }}>{activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied` : 'No filters — full dataset'}</p>
            </div>
            <div className="p-4 min-h-[180px]">
              {previewLoading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader className="w-6 h-6 animate-spin" style={{ color: GOV.blue }} />
                  <p className="text-xs" style={{ color: GOV.textMuted }}>Loading preview data...</p>
                </div>
              )}
              {previewError && !previewLoading && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <p className="text-xs text-red-700">{previewError}</p>
                </div>
              )}
              {!previewLoading && !previewError && Object.keys(preview).length > 0 && (
                <>
                  {renderAllSections()}
                  {/* Disclaimer — mirrors PDF */}
                  <div className="mt-4 px-3 py-2 rounded text-[9px] leading-relaxed" style={{ backgroundColor: C.ICE, border: `1px solid ${C.BORDER}`, color: C.MUTED }}>
                    This report has been prepared by the Ministry of Labour and Social Security, Kingdom of Eswatini, using data from the
                    National Career Guidance System. The information is intended for official government use only and may not be distributed
                    without written authorisation from the Ministry.
                  </div>
                </>
              )}
              {!previewLoading && !previewError && Object.keys(preview).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <FileText className="w-8 h-8" style={{ color: GOV.border }} />
                  <p className="text-xs" style={{ color: GOV.textHint }}>Click Refresh to load preview</p>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t" style={{ borderColor: C.BORDER }}>
              <p className="text-[8px]" style={{ color: C.MUTED }}>Ministry of Labour and Social Security · Kingdom of Eswatini</p>
              <p className="text-[8px]" style={{ color: C.MUTED }}>Preview</p>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════ TRUE FULLSCREEN PRESENTATION MODE (PowerPoint-style slide) ═══════ */}
      <div ref={presentationRef} style={{ display: presentationMode ? 'flex' : 'none', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#ffffff' }}>
        {/* ── Thin ministry header ── */}
        <div className="flex items-center gap-3 px-10 py-2 flex-shrink-0" style={{ backgroundColor: GOV.blue }}>
          <img src="/siyinqaba.png" alt="Ministry Logo" className="h-7 w-7 object-contain flex-shrink-0"
            onError={e => { e.target.style.display = 'none'; }} />
          <p className="text-[10px] font-bold tracking-widest text-white flex-1">MINISTRY OF LABOUR AND SOCIAL SECURITY</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button type="button" onClick={loadPreview} disabled={previewLoading}
              className="p-1.5 rounded transition-colors hover:bg-white/20" style={{ color: 'white' }} title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={exitPresentation}
              className="p-1.5 rounded transition-colors hover:bg-white/20" style={{ color: 'white' }}
              title="Exit (ESC)">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Slide content ── */}
        <div className="flex-1 flex flex-col overflow-auto px-16 py-10 custom-scrollbar">
          {/* Slide title */}
          <div className="flex items-center gap-4 mb-8 flex-shrink-0">
            <h1 className="text-2xl font-bold" style={{ color: GOV.text }}>{reportTitle}</h1>
            {activeFilterCount > 0 && (
              <span className="text-[11px]" style={{ color: C.MUTED }}>
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
              </span>
            )}
          </div>

          {/* Slide body — report data fills remaining space */}
          <div className="flex-1">
            {previewLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader className="w-10 h-10 animate-spin" style={{ color: GOV.blue }} />
                <p className="text-sm" style={{ color: GOV.textMuted }}>Loading report data...</p>
              </div>
            )}
            {previewError && !previewLoading && (
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{previewError}</p>
              </div>
            )}
            {!previewLoading && !previewError && Object.keys(preview).length > 0 && renderAllSections()}
            {!previewLoading && !previewError && Object.keys(preview).length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <FileText className="w-12 h-12" style={{ color: GOV.border }} />
                <p className="text-sm" style={{ color: GOV.textHint }}>Click Refresh to load preview</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Thin footer ── */}
        <div className="flex items-center justify-between px-10 py-1.5 flex-shrink-0" style={{ borderTop: `1px solid ${GOV.borderLight}` }}>
          <p className="text-[10px]" style={{ color: GOV.textHint }}>
            Kingdom of Eswatini · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-[10px]" style={{ color: GOV.textHint }}>
            Press <span className="font-semibold" style={{ color: GOV.textMuted }}>ESC</span> to exit
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPanel;
