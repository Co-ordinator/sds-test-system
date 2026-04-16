import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Download, BookOpen, Building2, Award, ChevronDown, ChevronUp,
  CheckCircle2, Briefcase, GraduationCap, Loader2, FileText, Mail, TrendingUp
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GOV, TYPO } from '../theme/government';
import AssessmentShell from '../components/layout/AssessmentShell';

/* Constants & Metadata */
const RIASEC_META = {
  R: {
    label: 'Realistic', color: '#F44336', lightBg: '#ffebee',
    description: 'You are practical and hands-on. You enjoy working with tools, machines, and physical objects. You thrive in environments that involve building, repairing, and working outdoors.',
    traits: ['Practical', 'Mechanical', 'Athletic', 'Hands-on'],
    icon: '🔧'
  },
  I: {
    label: 'Investigative', color: '#2563eb', lightBg: '#eff6ff',
    description: 'You are analytical and intellectual. You enjoy research, mathematics, and science. You prefer solving complex problems through careful observation and investigation.',
    traits: ['Analytical', 'Scientific', 'Curious', 'Intellectual'],
    icon: '🔬'
  },
  A: {
    label: 'Artistic', color: '#7c3aed', lightBg: '#f5f3ff',
    description: 'You are creative and expressive. You enjoy art, music, writing, and drama. You value aesthetics, originality, and freedom to express yourself.',
    traits: ['Creative', 'Original', 'Expressive', 'Imaginative'],
    icon: '🎨'
  },
  S: {
    label: 'Social', color: '#059669', lightBg: '#ecfdf5',
    description: 'You are empathetic and people-oriented. You enjoy teaching, counseling, and community service. You value cooperation, helping others, and making a positive impact.',
    traits: ['Empathetic', 'Helpful', 'Cooperative', 'Patient'],
    icon: '🤝'
  },
  E: {
    label: 'Enterprising', color: '#d97706', lightBg: '#fffbeb',
    description: 'You are ambitious and leadership-oriented. You enjoy business, management, and persuading others. You value achievement, influence, and taking initiative.',
    traits: ['Ambitious', 'Persuasive', 'Confident', 'Energetic'],
    icon: '📈'
  },
  C: {
    label: 'Conventional', color: '#2D8BC4', lightBg: '#EDF6FC',
    description: 'You are organized and detail-oriented. You enjoy working with data, numbers, and structured processes. You value order, accuracy, and efficiency.',
    traits: ['Organized', 'Detail-oriented', 'Systematic', 'Reliable'],
    icon: '📊'
  }
};

const QUAL_LABELS = {
  certificate: 'Certificate', diploma: 'Diploma', bachelor: "Bachelor's Degree",
  honours: 'Honours Degree', postgrad_diploma: 'Postgrad Diploma',
  masters: "Master's Degree", doctorate: 'Doctorate', short_course: 'Short Course',
  tvet: 'TVET Programme', other: 'Qualification'
};

const DEMAND_COLORS = { critical: '#dc2626', very_high: '#ea580c', high: '#d97706', medium: '#2563eb', low: '#6b7280' };
const DEMAND_LABELS = { critical: 'Critical', very_high: 'Very High', high: 'High', medium: 'Medium', low: 'Low' };
const RIASEC_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

/* Sub-components */
const DemandBadge = ({ level }) => {
  if (!level) return null;
  const color = DEMAND_COLORS[level] || '#6b7280';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${color}15`, color }}>
      <TrendingUp className="w-3 h-3" />
      {DEMAND_LABELS[level] || level}
    </span>
  );
};

const ScoreBar = ({ letter, score, maxScore }) => {
  const meta = RIASEC_META[letter];
  const pct = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: meta.color }}>
            {letter}
          </span>
          <span className="text-xs font-medium" style={{ color: GOV.text }}>{meta.label}</span>
        </div>
        <span className="text-xs font-bold" style={{ color: meta.color }}>{score}</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: GOV.borderLight }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
      </div>
    </div>
  );
};

const HollandCodeCard = ({ letter, rank }) => {
  const meta = RIASEC_META[letter];
  if (!meta) return null;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: `${meta.color}30` }}>
      <div className="px-4 py-3" style={{ backgroundColor: meta.lightBg }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: meta.color }}>{rank}</span>
              <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {meta.traits.map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs leading-relaxed" style={{ color: GOV.textMuted }}>{meta.description}</p>
      </div>
    </div>
  );
};

const CourseCard = ({ course }) => {
  const [open, setOpen] = useState(false);
  const reqs = course.requirements || [];
  const institutions = (course.courseInstitutions || []).map(ci => ci.institution).filter(Boolean);
  const qualLabel = QUAL_LABELS[course.qualificationType] || course.qualificationType;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: GOV.border }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-gray-50 transition-all duration-200 hover:shadow-sm active:scale-[0.99]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: GOV.blueLight, color: GOV.blue }}>{qualLabel}</span>
            {course.durationYears && (
              <span className="text-xs" style={{ color: GOV.textHint }}>{course.durationYears} yr{Number(course.durationYears) !== 1 ? 's' : ''}</span>
            )}
          </div>
          <p className="font-semibold text-sm" style={{ color: GOV.text }}>{course.name}</p>
          {course.description && !open && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: GOV.textMuted }}>{course.description}</p>
          )}
        </div>
        <div className="ml-3 shrink-0" style={{ color: GOV.textHint }}>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3" style={{ borderColor: GOV.borderLight }}>
          {course.description && <p className="text-sm" style={{ color: GOV.textMuted }}>{course.description}</p>}
          {reqs.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: GOV.text }}>
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#059669' }} /> Entry Requirements
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {reqs.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs rounded-md px-3 py-1.5" style={{ backgroundColor: GOV.blueLightAlt }}>
                    <span style={{ color: GOV.text }}>{r.subject}</span>
                    <span className="font-bold ml-2" style={{ color: r.isMandatory ? GOV.blue : GOV.textHint }}>
                      {r.minimumGrade}{!r.isMandatory && ' *'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-1.5" style={{ color: GOV.textHint }}>* recommended but not required</p>
            </div>
          )}
          {institutions.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: GOV.text }}>
                <Building2 className="w-3.5 h-3.5" style={{ color: GOV.blue }} /> Offered at
              </p>
              <div className="flex flex-wrap gap-1.5">
                {institutions.map(inst => (
                  <span key={inst.id} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: GOV.blueLight, color: GOV.blue }}>
                    {inst.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* Main component */
const TestResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const assessmentIdFromState = location.state?.assessmentId;
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [assessmentId, setAssessmentId] = useState(assessmentIdFromState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const getDashboardPath = () => {
    if (user?.role === 'System Administrator') return '/admin/dashboard';
    if (user?.role === 'Test Administrator') return '/test-administrator';
    return '/dashboard';
  };

  useEffect(() => {
    let id = assessmentIdFromState;
    const fetchResults = async () => {
      try {
        if (!id) {
          const listRes = await api.get('/api/v1/assessments');
          const list = listRes.data?.data?.assessments || [];
          const completed = list.find((a) => a.status === 'completed');
          if (!completed) { setError('No completed assessment found. Complete a test first.'); setLoading(false); return; }
          id = completed.id;
          setAssessmentId(id);
        }
        const res = await api.get(`/api/v1/results/${id}`);
        const payload = res.data?.data;
        if (payload) setData(payload);
        else setError('Results not found.');
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load results.');
      } finally { setLoading(false); }
    };
    fetchResults();
  }, [assessmentIdFromState]);

  const handleDownloadPdf = async () => {
    if (!assessmentId) return;
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/api/v1/results/${assessmentId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url;
      a.download = `CareerReport_${assessmentId}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to download PDF. Please try again.'); }
    finally { setDownloadingPdf(false); }
  };

  const handleEmailResults = () => {
    const subject = encodeURIComponent('My SDS Career Assessment Results');
    const body = encodeURIComponent(
      `I completed my Self-Directed Search (SDS) Career Assessment.\n\nHolland Code: ${hollandDisplayCode}\nProfile: ${hollandDisplayLabel}\n\nView the full results on the Eswatini National Career Guidance Platform.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  /* Loading / Error states */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: GOV.borderLight, borderTopColor: GOV.blue }} />
          <p className="text-sm mt-3" style={{ color: GOV.textHint }}>Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8fafc' }}>
        <div className="bg-white rounded-md border p-8 max-w-md text-center" style={{ borderColor: GOV.border }}>
          <Award className="w-10 h-10 mx-auto mb-3" style={{ color: GOV.textHint }} />
          <p className="text-sm mb-4" style={{ color: GOV.text }}>{error}</p>
          <div className="flex gap-3 justify-center">
            <button type="button" onClick={() => navigate(getDashboardPath())}
              className="px-4 py-2 rounded-md text-sm font-semibold border bg-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2" style={{ borderColor: GOV.border, color: GOV.text }}>
              Dashboard
            </button>
            <button type="button" onClick={() => navigate('/test')}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: GOV.blue }}>
              Take Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Extract data */
  const assessment = data?.assessment || {};
  const recs = data?.recommendations || {};
  const occupations = recs.occupations || [];
  const courses = recs.courses || [];
  const suggestedSubjects = recs.suggestedSubjects || [];

  const scores = {
    R: assessment.scoreR ?? 0, I: assessment.scoreI ?? 0, A: assessment.scoreA ?? 0,
    S: assessment.scoreS ?? 0, E: assessment.scoreE ?? 0, C: assessment.scoreC ?? 0
  };
  const maxScore = Math.max(...Object.values(scores), 1);
  const hollandCode = assessment.hollandCodeDisplay || assessment.hollandCode || '';
  const parsedDisplayGroups = String(hollandCode || '')
    .toUpperCase()
    .trim()
    .split(/\s+/)
    .map((group) => group.split('/').map((letter) => letter.trim()).filter((letter) => RIASEC_META[letter]))
    .filter((group) => group.length > 0);

  const sortedScoreEntries = Object.entries(scores)
    .map(([key, score]) => [key, Number(score || 0)])
    .sort((a, b) => b[1] - a[1] || RIASEC_ORDER.indexOf(a[0]) - RIASEC_ORDER.indexOf(b[0]));

  const scoreRankGroups = [];
  sortedScoreEntries.forEach(([letter, score]) => {
    if (scoreRankGroups.length === 0) {
      scoreRankGroups.push([{ letter, score }]);
      return;
    }
    const lastGroup = scoreRankGroups[scoreRankGroups.length - 1];
    if (lastGroup[0].score === score) {
      lastGroup.push({ letter, score });
      return;
    }
    scoreRankGroups.push([{ letter, score }]);
  });

  const hollandDisplayGroups = (parsedDisplayGroups.length > 0
    ? parsedDisplayGroups
    : scoreRankGroups.map((group) => group.map((entry) => entry.letter)))
    .slice(0, 3);

  const hollandDisplayCode = hollandDisplayGroups.map((group) => group.join('/')).join(' ') || hollandCode;
  const hollandDisplayLabel = hollandDisplayGroups
    .map((group) => group.map((letter) => RIASEC_META[letter]?.label).filter(Boolean).join('/'))
    .join(' - ');
  const hollandLetters = Array.from(new Set(hollandDisplayGroups.flat().filter((letter) => RIASEC_META[letter])));
  const userType = assessment.user?.userType || user?.userType;
  const studentName = [assessment.user?.firstName || user?.firstName, assessment.user?.lastName || user?.lastName].filter(Boolean).join(' ') || 'Student';

  const focusLabel = userType === 'professional'
    ? 'Career Transition Opportunities'
    : userType === 'university_student'
      ? 'Graduate Career Pathways'
      : 'Career Paths & Study Options';

  /* Chart data */
  const radarData = Object.entries(scores).map(([key, score]) => ({
    type: key, label: RIASEC_META[key].label, score, fullMark: maxScore
  }));

  const barData = Object.entries(scores).map(([key, score]) => ({
    name: key, label: RIASEC_META[key].label, score, color: RIASEC_META[key].color
  }));

  const completedDate = assessment.completedAt
    ? new Date(assessment.completedAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  /* Render */
  return (
    <AssessmentShell
      title="Self-Directed Search (SDS) - Results"
      contextLabel="Assessment Results"
      actions={(
        <>
          <button type="button" onClick={handleDownloadPdf} disabled={downloadingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2" style={{ backgroundColor: GOV.blue }}>
            {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadingPdf ? 'Generating...' : 'Download PDF Report'}
          </button>
          <button type="button" onClick={() => navigate(getDashboardPath())}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-white border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2" style={{ color: GOV.text, borderColor: GOV.borderLight }}>
            Dashboard
          </button>
          <button type="button" onClick={handleEmailResults}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-white border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2" style={{ color: GOV.text, borderColor: GOV.borderLight }}>
            <Mail className="w-4 h-4" /> Email Results
          </button>
        </>
      )}
    >
      <div className="bg-white rounded-md p-6 mb-6">
        <p className="text-sm mb-4" style={{ color: GOV.textMuted }}>
          Congratulations on completing your Self-Directed Search (SDS) Career Test! Below you will find a personalized overview of your RIASEC scores, an interpretation of your Holland Codes, and tailored career recommendations based on your unique profile.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: GOV.textHint }}>
          <span>{studentName}</span>
          <span>|</span>
          <span>{completedDate}</span>
          <span>|</span>
          <span>Holland Code: <strong style={{ color: GOV.blue }}>{hollandDisplayCode}</strong></span>
        </div>
      </div>

        {/* RIASEC Profile: Radar + Score Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-white rounded-md p-6">
            <h2 className="text-sm font-bold mb-1" style={{ color: GOV.text }}>Your RIASEC Profile</h2>
            <p className="text-xs mb-4" style={{ color: GOV.textHint }}>A visual representation of your interests across the six RIASEC dimensions.</p>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke={GOV.borderLight} />
                <PolarAngleAxis dataKey="type" tick={({ x, y, payload }) => {
                  const meta = RIASEC_META[payload.value];
                  return (
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill={meta?.color || GOV.text}>
                      {payload.value}
                    </text>
                  );
                }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: GOV.textHint }} />
                <Radar name="Your Score" dataKey="score" stroke={GOV.blue} fill={GOV.blue} fillOpacity={0.25} strokeWidth={2.5} dot={{ r: 4, fill: GOV.blue }} />
                <Tooltip formatter={(v) => [v, 'Score']} labelFormatter={(l) => RIASEC_META[l]?.label || l} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score Bars */}
          <div className="bg-white rounded-md p-6">
            <h2 className="text-sm font-bold mb-1" style={{ color: GOV.text }}>Your RIASEC Scores</h2>
            <p className="text-xs mb-4" style={{ color: GOV.textHint }}>Detailed breakdown of your interest scores per dimension.</p>
            <div className="space-y-4">
              {Object.entries(scores).map(([key, score]) => (
                <ScoreBar key={key} letter={key} score={score} maxScore={maxScore} />
              ))}
            </div>
            <div className="mt-4 pt-4 border-t" style={{ borderColor: GOV.borderLight }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GOV.borderLight} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v, n, p) => [v, p.payload.label]} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Holland Code Interpretation */}
        <div className="bg-white rounded-md p-6">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-sm font-bold" style={{ color: GOV.text }}>Your Top Holland Codes</h2>
            <div className="flex gap-1.5">
              {hollandDisplayGroups.map((group, idx) => {
                const leadLetter = group[0];
                const codeText = group.join('/');
                return (
                  <span key={`${codeText}-${idx}`} className="h-8 rounded-lg px-2 flex items-center justify-center text-sm font-bold text-white shadow-sm" style={{ backgroundColor: RIASEC_META[leadLetter]?.color || GOV.blue }}>
                    {codeText}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="text-xs mb-5" style={{ color: GOV.textHint }}>
            Understanding your primary interest areas and their implications. Your Holland Code <strong style={{ color: GOV.blue }}>{hollandDisplayCode}</strong> represents:{' '}
            <strong>{hollandDisplayLabel}</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hollandLetters.slice(0, 5).map((c, i) => (
              <HollandCodeCard key={`${c}-${i}`} letter={c} rank={i + 1} />
            ))}
          </div>
        </div>

        {/* Suggested Subjects */}
        {suggestedSubjects.length > 0 && (
          <div className="bg-white rounded-md p-6">
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: GOV.text }}>
              <BookOpen className="w-4 h-4" style={{ color: '#059669' }} /> Suggested School Subjects
            </h2>
            <p className="text-xs mb-4" style={{ color: GOV.textHint }}>Subjects that align with your interests and can support your career pathway.</p>
            <div className="flex flex-wrap gap-2">
              {suggestedSubjects.map((s, i) => (
                <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Career Recommendations */}
        {occupations.length > 0 && (
          <div className="bg-white rounded-md p-6">
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: GOV.text }}>
              <Briefcase className="w-4 h-4" style={{ color: GOV.blue }} /> {focusLabel}
            </h2>
            <p className="text-xs mb-4" style={{ color: GOV.textHint }}>Explore career paths aligned with your unique RIASEC profile.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {occupations.map((occ) => {
                const riasecLetter = occ.primaryRiasec || hollandLetters[0];
                const meta = RIASEC_META[riasecLetter] || RIASEC_META.R;
                return (
                  <div key={occ.id} className="flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-[1.01] cursor-pointer" style={{ borderColor: GOV.border }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold" style={{ backgroundColor: meta.color }}>
                      {riasecLetter || <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm" style={{ color: GOV.text }}>{occ.name}</p>
                      {occ.description && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: GOV.textMuted }}>{occ.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {occ.demandLevel && <DemandBadge level={occ.demandLevel} />}
                        {occ.localDemand && occ.localDemand !== occ.demandLevel && <DemandBadge level={occ.localDemand} />}
                        {!occ.demandLevel && occ.localDemand && <DemandBadge level={occ.localDemand} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Courses & Qualifications */}
        {courses.length > 0 && (
          <div className="bg-white rounded-md p-6">
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: GOV.text }}>
              <GraduationCap className="w-4 h-4" style={{ color: GOV.blue }} /> Recommended Courses & Qualifications
            </h2>
            <p className="text-xs mb-4" style={{ color: GOV.textHint }}>
              Study programmes aligned to your profile. Click a course to see entry requirements and where to study.
            </p>
            <div className="space-y-2">
              {courses.map((course) => <CourseCard key={course.id} course={course} />)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {occupations.length === 0 && courses.length === 0 && (
          <div className="bg-white rounded-md p-10 text-center">
            <Award className="w-12 h-12 mx-auto mb-3" style={{ color: GOV.textHint }} />
            <p className="text-sm font-medium" style={{ color: GOV.text }}>No specific recommendations found for your code yet.</p>
            <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>Speak with a career counsellor for personalised guidance.</p>
          </div>
        )}

        {/* Government Funding Priority Alignment */}
        {recs?.fundingAlignment && (
          <div className="bg-white rounded-md p-6">
            <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: GOV.text }}>
              <Award className="w-4 h-4" style={{ color: GOV.blue }} /> Government Funding Priority Alignment
            </h2>
            <p className="text-xs mb-4" style={{ color: GOV.textHint }}>
              How your career interests compare with the Eswatini Government's priority programmes for scholarship funding.
            </p>

            {/* Overall Alignment Badge */}
            <div className="flex items-center gap-3 mb-5 p-4 rounded-lg border" style={{
              borderColor: recs.fundingAlignment.overall === 'HIGH' ? '#16a34a' : recs.fundingAlignment.overall === 'MEDIUM' ? '#d97706' : '#dc2626',
              backgroundColor: recs.fundingAlignment.overall === 'HIGH' ? '#f0fdf4' : recs.fundingAlignment.overall === 'MEDIUM' ? '#fffbeb' : '#fef2f2'
            }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm" style={{
                backgroundColor: recs.fundingAlignment.overall === 'HIGH' ? '#16a34a' : recs.fundingAlignment.overall === 'MEDIUM' ? '#d97706' : '#dc2626'
              }}>
                {recs.fundingAlignment.overall}
              </div>
              <div>
                <p className="text-sm font-bold" style={{
                  color: recs.fundingAlignment.overall === 'HIGH' ? '#166534' : recs.fundingAlignment.overall === 'MEDIUM' ? '#92400e' : '#991b1b'
                }}>
                  Government Funding Alignment: {recs.fundingAlignment.overall}
                </p>
                <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>
                  {(recs.fundingAlignment.priorityFieldCount ?? 0)} priority programme field{(recs.fundingAlignment.priorityFieldCount ?? 0) === 1 ? '' : 's'} match your profile
                  {(recs.fundingAlignment.nonPriorityFieldCount ?? 0) > 0
                    ? ` | ${recs.fundingAlignment.nonPriorityFieldCount ?? 0} other field${(recs.fundingAlignment.nonPriorityFieldCount ?? 0) === 1 ? '' : 's'} (not SLAS priority)`
                    : ''}
                </p>
              </div>
            </div>

            {/* Interpretation */}
            <div className="p-3 rounded-md mb-5" style={{ backgroundColor: '#f8fafc', borderLeft: `3px solid ${GOV.blue}` }}>
              <p className="text-xs leading-relaxed" style={{ color: GOV.text }}>
                {recs.fundingAlignment.interpretation}
              </p>
            </div>

            {/* Field-by-Field Alignment */}
            {recs.fundingAlignment.fields && recs.fundingAlignment.fields.length > 0 && (
              <div className="space-y-2 mb-5">
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: GOV.textMuted }}>Priority Programme Alignment</h3>
                {recs.fundingAlignment.fields.map((f, i) => (
                  <div key={i} className="p-3 rounded-md border" style={{ borderColor: GOV.borderLight }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold" style={{ color: GOV.text }}>{f.field}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                          {f.courseCount} {f.courseCount === 1 ? 'course' : 'courses'}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full shrink-0 ml-3" style={{
                        backgroundColor: f.alignment === 'HIGH' ? '#dcfce7' : '#f1f5f9',
                        color: f.alignment === 'HIGH' ? '#166534' : '#64748b'
                      }}>
                        {f.alignment === 'HIGH' ? 'SLAS PRIORITY' : 'NOT PRIORITY'}
                      </span>
                    </div>
                    {f.courses && f.courses.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {f.courses.map((c, ci) => (
                          <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f1f5f9', color: GOV.textMuted }}>
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Application Info */}
            <div className="p-3 rounded-md mb-3" style={{ backgroundColor: '#fef3c7' }}>
              <h4 className="text-xs font-semibold mb-2" style={{ color: '#92400e' }}>How to Apply for Government Funding:</h4>
              <ul className="text-xs space-y-1" style={{ color: '#78350f' }}>
                <li>- Eswatini National ID (applicant and at least one parent must be a citizen)</li>
                <li>- University/College acceptance letter from a recognized institution</li>
                <li>- Certified academic certificates and transcripts</li>
                <li>- Graded Tax Certificate</li>
                <li>- Two references (one academic, both Eswatini citizens)</li>
                <li>- Completed Scholarship Application Form</li>
              </ul>
              <p className="text-xs mt-2" style={{ color: '#78350f' }}>
                <strong>Deadlines:</strong> {recs.fundingAlignment.deadlines?.local} (local institutions) | {recs.fundingAlignment.deadlines?.southAfrica} (South Africa & Africa)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              {recs.fundingAlignment.applicationUrl && (
                <a
                  href={recs.fundingAlignment.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-md transition-colors hover:opacity-90"
                  style={{ backgroundColor: GOV.blue }}
                >
                  Apply Online at SLAS
                  <TrendingUp className="w-3.5 h-3.5" />
                </a>
              )}
              {recs.fundingAlignment.applicationFormUrl && (
                <a
                  href={recs.fundingAlignment.applicationFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md border transition-colors hover:bg-gray-50"
                  style={{ borderColor: GOV.border, color: GOV.text }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Application Form
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-center py-4" style={{ color: GOV.textHint }}>
          Kingdom of Eswatini | National Career Guidance Platform | Ministry of Labour and Social Security | {completedDate}
        </p>
    </AssessmentShell>
  );
};

export default TestResults;

