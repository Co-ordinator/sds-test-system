import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Hand,
  Info,
  Loader2,
  Play,
  Star,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { GOV, TYPO } from '../theme/government';
import AppShell from '../components/layout/AppShell';

const HOLLAND_LABELS = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

const getHollandDisplayCode = (assessment) => assessment?.hollandCodeDisplay || assessment?.hollandCode || '-';

const clampPercent = (value) => Math.max(0, Math.min(Math.round(Number(value) || 0), 100));

const assessmentTime = (assessment) => {
  const raw = assessment?.completedAt || assessment?.updatedAt || assessment?.createdAt;
  return raw ? new Date(raw).getTime() : 0;
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB');
};

const formatHollandCode = (code) => {
  if (!code || code === '-') return '-';
  return String(code)
    .replace(/\s+/g, '')
    .replace(/([A-Z])(?=[A-Z])/g, '$1 ')
    .trim();
};

const hollandDescription = (code) => {
  if (!code || code === '-') return 'Complete an assessment to see your Holland profile.';
  const letters = String(code).replace(/[^A-Z]/g, '').split('').slice(0, 3);
  return letters.map((letter) => HOLLAND_LABELS[letter]).filter(Boolean).join(' - ') || 'Holland Code profile';
};

function WelcomeIllustration() {
  return (
    <div aria-hidden="true" className="relative hidden h-20 min-w-[300px] xl:block">
      <div className="absolute bottom-2 right-5 h-2 w-[250px] rounded-full bg-[#c8ddf4]" />
      <div className="absolute bottom-5 right-32 h-14 w-24 rounded-t-lg border-2 border-[#b7d2ef] bg-[#eaf5ff]" />
      <div className="absolute bottom-2 right-[6.5rem] h-4 w-40 rounded-b-xl bg-[#cfe2f7]" />
      <div className="absolute bottom-4 right-5 h-11 w-16 rounded-md bg-[#d7e9fb]" />
      <div className="absolute bottom-14 right-8 h-2 w-12 rounded-full bg-[#b7d2ef]" />
      <div className="absolute bottom-5 right-[220px] h-10 w-8 rounded-b-lg border-2 border-[#b7d2ef]" />
      <div className="absolute bottom-[3.8rem] right-[222px] h-10 w-2 -rotate-12 rounded-full bg-[#b7d2ef]" />
      <div className="absolute bottom-16 right-[206px] h-11 w-2 rotate-[35deg] rounded-full bg-[#c7dff7]" />
      <CheckCircle2 className="absolute right-[128px] top-0 h-7 w-7 rounded-full bg-[#eef7ff] p-1.5 text-[#98bbe3]" strokeWidth={1.5} />
    </div>
  );
}

function ProgressRing({ percent }) {
  return (
    <div
      className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(${GOV.blue} ${percent * 3.6}deg, #e9edf2 0deg)` }}
      aria-label={`${percent}% complete`}
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-white">
        <div className="text-center">
          <p className="text-2xl font-extrabold leading-none text-[#111827]">{percent}%</p>
          <p className="mt-1 text-xs font-medium text-[#6b7280]">Complete</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ iconBg, iconColor, Icon, title, value, subtitle }) {
  return (
    <section className="flex min-h-[112px] items-center gap-4 rounded-lg border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg }}>
        <Icon className="h-8 w-8" style={{ color: iconColor }} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-[#4b5563]">{title}</h3>
        <p className="mt-1.5 text-2xl font-extrabold leading-none tracking-normal text-[#111827]">{value}</p>
        <p className="mt-1.5 text-xs font-medium leading-5 text-[#6b7280]">{subtitle}</p>
      </div>
    </section>
  );
}

function StatusButton({ children, variant = 'primary', ...props }) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      className="inline-flex h-10 min-w-[150px] items-center justify-center gap-2 rounded-md border px-4 text-sm font-bold transition-all duration-150 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      style={isPrimary ? { backgroundColor: GOV.blue, borderColor: GOV.blue, color: '#fff' } : { backgroundColor: '#fff', borderColor: '#9fc4e4', color: '#4b5563' }}
      {...props}
    >
      {children}
    </button>
  );
}

const DetailTile = ({ label, value }) => (
  <div className="rounded-lg border border-[#dfe8f1] bg-white p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">{label}</p>
    <p className="mt-2 text-lg font-extrabold text-[#111827]">{value}</p>
  </div>
);

const CertificateAction = ({
  assessment,
  certificate,
  downloadingCert,
  generatingCert,
  onDownload,
  onGenerate,
}) => {
  const busy = downloadingCert === assessment.id || generatingCert === assessment.id;
  const label = certificate
    ? downloadingCert === assessment.id ? 'Downloading...' : 'Certificate'
    : generatingCert === assessment.id ? 'Generating...' : 'Certificate';

  return (
    <button
      type="button"
      onClick={() => certificate ? onDownload(certificate) : onGenerate(assessment.id)}
      disabled={busy}
      className="inline-flex h-9 min-w-[128px] items-center justify-center gap-2 rounded-md bg-[#e87505] px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#c95f00] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Award className="h-4 w-4" aria-hidden="true" />}
      {label}
    </button>
  );
};

const TestTakerDashboard = () => {
  const { user, setSession } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loadingAssessmentDetail, setLoadingAssessmentDetail] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [downloadingCert, setDownloadingCert] = useState(null);
  const [generatingCert, setGeneratingCert] = useState(null);

  useEffect(() => {
    setProfileUser(user || null);
  }, [user?.id]);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const [assessmentsRes, meRes, certsRes] = await Promise.all([
          api.get('/api/v1/assessments'),
          api.get('/api/v1/auth/me').catch(() => null),
          api.get('/api/v1/assessments/my/certificates').catch(() => null),
        ]);

        setAssessments(assessmentsRes.data?.data?.assessments || []);
        setCertificates(certsRes?.data?.data?.certificates || []);

        const freshUser = meRes?.data?.data?.user ?? meRes?.data?.user;
        if (freshUser) {
          setProfileUser(freshUser);
          setSession(null, freshUser);
        }
      } catch {
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, [user?.id, setSession]);

  const inProgress = assessments.find((a) => a.status === 'in_progress');
  const completed = useMemo(
    () => assessments
      .filter((assessment) => assessment.status === 'completed')
      .sort((a, b) => assessmentTime(b) - assessmentTime(a)),
    [assessments],
  );
  const progressPercent = clampPercent(inProgress?.progress);
  const latestCompleted = completed[0];
  const latestCode = formatHollandCode(getHollandDisplayCode(latestCompleted));
  const fullName = [profileUser?.firstName, profileUser?.lastName].filter(Boolean).join(' ').trim();
  const displayName = fullName || profileUser?.studentCode || 'Student';

  const viewResults = (assessmentId) => {
    navigate('/results', { state: { assessmentId } });
  };

  const viewAssessmentDetail = async (assessmentId) => {
    setLoadingAssessmentDetail(true);
    setSelectedAssessment(null);
    try {
      const res = await api.get(`/api/v1/assessments/${assessmentId}`);
      setSelectedAssessment(res.data?.data?.assessment || null);
    } catch {
      setSelectedAssessment(assessments.find((assessment) => assessment.id === assessmentId) || null);
    } finally {
      setLoadingAssessmentDetail(false);
    }
  };

  const handleDownloadCertificate = async (cert) => {
    setDownloadingCert(cert.assessmentId);
    try {
      const res = await api.get(`/api/v1/assessments/${cert.assessmentId}/certificate/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `SDS_Certificate_${(cert.certNumber || cert.assessmentId).replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Certificate failures are surfaced by the disabled/busy state only on this dashboard.
    } finally {
      setDownloadingCert(null);
    }
  };

  const handleGenerateCertificate = async (assessmentId) => {
    setGeneratingCert(assessmentId);
    try {
      const res = await api.post(`/api/v1/assessments/${assessmentId}/certificate/generate`);
      const cert = {
        ...(res.data?.data || {}),
        assessmentId,
      };
      setCertificates((prev) => {
        const withoutExisting = prev.filter((item) => item.assessmentId !== assessmentId);
        return [cert, ...withoutExisting];
      });
      await handleDownloadCertificate(cert);
    } catch {
      // Keep dashboard flow uninterrupted if certificate generation fails.
    } finally {
      setGeneratingCert(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: GOV.blue }} />
      </div>
    );
  }

  return (
    <AppShell hideBreadcrumbs>
      {(loadingAssessmentDetail || selectedAssessment) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[82vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-6" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Assessment Details</h3>
              <button
                type="button"
                onClick={() => { setSelectedAssessment(null); setLoadingAssessmentDetail(false); }}
                className="rounded-md p-2 transition-colors hover:bg-gray-100"
                aria-label="Close assessment details"
              >
                <X className="h-5 w-5" style={{ color: GOV.textMuted }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingAssessmentDetail && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: GOV.blue }} />
                </div>
              )}
              {!loadingAssessmentDetail && selectedAssessment && (
                <div className="space-y-6">
                  <div className="rounded-xl bg-[#f2f8fd] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-bold text-[#111827]">Assessment #{selectedAssessment.id}</p>
                        <p className="mt-1 text-sm text-[#6b7280]">
                          Started {selectedAssessment.createdAt ? new Date(selectedAssessment.createdAt).toLocaleString() : '-'}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#cfe2f7] bg-white px-3 py-1 text-xs font-bold uppercase text-[#2d8bc4]">
                        {selectedAssessment.status?.replace('_', ' ') || 'unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailTile label="Progress" value={`${clampPercent(selectedAssessment.progress)}%`} />
                    <DetailTile label="Holland Code" value={formatHollandCode(getHollandDisplayCode(selectedAssessment))} />
                    <DetailTile label="Completed" value={selectedAssessment.completedAt ? new Date(selectedAssessment.completedAt).toLocaleString() : 'Not yet'} />
                    <DetailTile label="Updated" value={selectedAssessment.updatedAt ? new Date(selectedAssessment.updatedAt).toLocaleString() : '-'} />
                  </div>

                  <div>
                    <p className="mb-3 text-base font-bold text-[#111827]">Response Summary</p>
                    <div className="rounded-xl border border-[#dfe8f1] p-5">
                      <p className="text-sm text-[#6b7280]">
                        Saved answers: {Array.isArray(selectedAssessment.answers) ? selectedAssessment.answers.length : 0}
                      </p>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e9edf2]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${clampPercent(selectedAssessment.progress)}%`, backgroundColor: GOV.blue }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!loadingAssessmentDetail && selectedAssessment && (
              <div className="flex flex-wrap justify-end gap-3 border-t p-5" style={{ borderColor: GOV.border }}>
                {selectedAssessment.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => { setSelectedAssessment(null); navigate('/questionnaire', { state: { resumeAssessment: true } }); }}
                    className="rounded-md px-5 py-2.5 text-sm font-bold text-white transition-all hover:shadow-md"
                    style={{ backgroundColor: GOV.blue }}
                  >
                    Resume Assessment
                  </button>
                )}
                {selectedAssessment.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => { setSelectedAssessment(null); viewResults(selectedAssessment.id); }}
                    className="rounded-md px-5 py-2.5 text-sm font-bold text-white transition-all hover:shadow-md"
                    style={{ backgroundColor: GOV.blue }}
                  >
                    View Results
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedAssessment(null)}
                  className="rounded-md border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-gray-50"
                  style={{ borderColor: GOV.border, color: GOV.textMuted }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="flex min-h-[112px] items-center justify-between gap-5 rounded-lg border border-[#e5e7eb] bg-white px-5 py-5 shadow-sm">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf6ff]">
              <Hand className="h-7 w-7 text-[#f2b632]" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight tracking-normal text-[#111827] sm:text-2xl">
                Welcome back, {displayName}!
              </h1>
              <p className="mt-2 text-sm font-medium leading-5 text-[#6b7280]">
                {inProgress
                  ? 'Continue your assessment or view your past results below.'
                  : 'Start a new SDS assessment or view your past results below.'}
              </p>
            </div>
          </div>
          <WelcomeIllustration />
        </section>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
          <section className="rounded-lg border border-[#e5e7eb] bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf6ff]">
                <ClipboardList className="h-5 w-5" style={{ color: GOV.blue }} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <h2 className="text-base font-bold text-[#111827]">Your Test Status</h2>
              <span className="rounded-full bg-[#e8f3fc] px-3 py-1 text-xs font-bold text-[#2d8bc4]">
                {inProgress ? 'In Progress' : 'Ready'}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center">
              <ProgressRing percent={progressPercent} />
              <div className="min-w-0 flex-1">
                <p className="max-w-2xl text-sm font-medium leading-6 text-[#4b5563]">
                  {inProgress
                    ? "You're doing great! Keep going - each step brings you closer to valuable insights about your strengths and interests."
                    : 'You can begin your Self-Directed Search assessment when you are ready.'}
                </p>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e9edf2]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progressPercent}%`, backgroundColor: GOV.blue }}
                  />
                </div>
                <p className="mt-2 text-sm font-bold text-[#2d8bc4]">{progressPercent}% Complete</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {inProgress ? (
                    <StatusButton onClick={() => navigate('/questionnaire', { state: { resumeAssessment: true } })}>
                      <Play className="h-4 w-4" aria-hidden="true" />
                      Resume Test
                    </StatusButton>
                  ) : (
                    <StatusButton onClick={() => navigate('/test')}>
                      <Play className="h-4 w-4" aria-hidden="true" />
                      Start Test
                    </StatusButton>
                  )}
                  <StatusButton variant="secondary" onClick={() => navigate('/questionnaire-intro')}>
                    <Info className="h-4 w-4" aria-hidden="true" />
                    View Instructions
                  </StatusButton>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <SummaryCard
              Icon={CheckCircle2}
              iconBg="#e8f7ef"
              iconColor="#17a67b"
              title="Assessments Completed"
              value={completed.length}
              subtitle={completed.length === 1 ? 'Great job completing your assessment!' : 'Great job staying consistent!'}
            />
            <SummaryCard
              Icon={Star}
              iconBg="#f0e7ff"
              iconColor="#8f4bd9"
              title="Latest Holland Code"
              value={latestCode}
              subtitle={hollandDescription(latestCode)}
            />
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#edf6ff]">
              <Clock className="h-5 w-5" style={{ color: GOV.blue }} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-[#111827]">Past assessments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#f0f6fc] text-xs font-bold uppercase text-[#374151]">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Holland Code</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2f7] text-sm">
                {completed.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm font-medium text-[#6b7280]">
                      No completed assessments yet.
                    </td>
                  </tr>
                )}
                {completed.map((assessment) => {
                  const cert = certificates.find((item) => item.assessmentId === assessment.id);
                  return (
                    <tr key={assessment.id} className="align-middle">
                      <td className="px-5 py-4 font-medium text-[#6b7280]">
                        {formatDate(assessment.completedAt || assessment.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-[#e8f3fc] px-2.5 py-1 text-[10px] font-extrabold uppercase text-[#2d8bc4]">
                          Completed
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold tracking-[0.08em] text-[#111827]">
                        {formatHollandCode(getHollandDisplayCode(assessment))}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() => viewResults(assessment.id)}
                            className="inline-flex h-9 min-w-[120px] items-center justify-center gap-2 rounded-md border border-[#c7d3df] bg-white px-3 text-xs font-bold text-[#374151] transition-colors hover:bg-[#f8fafc]"
                          >
                            <BarChart3 className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
                            View Results
                          </button>
                          <button
                            type="button"
                            onClick={() => viewAssessmentDetail(assessment.id)}
                            className="inline-flex h-9 min-w-[120px] items-center justify-center gap-2 rounded-md border border-[#c7d3df] bg-white px-3 text-xs font-bold text-[#374151] transition-colors hover:bg-[#f8fafc]"
                          >
                            <FileText className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
                            View Details
                          </button>
                          <CertificateAction
                            assessment={assessment}
                            certificate={cert}
                            downloadingCert={downloadingCert}
                            generatingCert={generatingCert}
                            onDownload={handleDownloadCertificate}
                            onGenerate={handleGenerateCertificate}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AppShell>
  );
};

export default TestTakerDashboard;
