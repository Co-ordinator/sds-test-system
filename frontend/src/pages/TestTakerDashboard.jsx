import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Play,
  Settings,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { GOV } from '../theme/government';
import AppShell from '../components/layout/AppShell';

const HERO_IMAGE = '/1299-1750835531.webp';

const getHollandDisplayCode = (assessment) =>
  assessment?.hollandCodeDisplay || assessment?.hollandCode || '-';

const assessmentTime = (assessment) => {
  const raw = assessment?.completedAt || assessment?.updatedAt || assessment?.createdAt;
  return raw ? new Date(raw).getTime() : 0;
};

const clampPercent = (value) =>
  Math.max(0, Math.min(Math.round(Number(value) || 0), 100));

const sameId = (left, right) => String(left) === String(right);

const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', options);
};

const formatHollandCode = (code) => {
  if (!code || code === '-') return '-';
  return String(code)
    .replace(/\s+/g, '')
    .replace(/\//g, ' / ')
    .replace(/([A-Z])(?=[A-Z])/g, '$1 ')
    .trim();
};

const formatLabel = (value, fallback = '-') => {
  if (!value) return fallback;
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const profileTypeLabel = (userType) => {
  if (userType === 'school_student') return 'High School Student';
  if (userType === 'university_student') return 'Tertiary Student';
  if (userType === 'professional') return 'Professional';
  return formatLabel(userType, 'Test Taker');
};

function InfoRow({ label, value, badge }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      {badge ? (
        <span className="mt-1 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          {value || '-'}
        </span>
      ) : (
        <p className="mt-1 text-sm font-medium text-gray-900">{value || '-'}</p>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, iconClass, title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-bold text-gray-900">
          <Icon className={`h-5 w-5 ${iconClass}`} />
          {title}
        </h3>
        <Link to="/profile" className="text-sm font-medium" style={{ color: GOV.blue }}>
          Edit
        </Link>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function ActionButton({ children, primary = false, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-60 ${className}`}
      style={{
        backgroundColor: primary ? GOV.blue : '#ffffff',
        border: `1px solid ${primary ? GOV.blue : GOV.border}`,
        color: primary ? '#ffffff' : GOV.text,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function CertificateAction({
  assessment,
  downloadingCert,
  onDownload,
}) {
  const busy = sameId(downloadingCert, assessment.id);
  return (
    <button
      type="button"
      onClick={() => onDownload(assessment)}
      disabled={busy}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:shadow-sm disabled:pointer-events-none disabled:opacity-60"
      style={{ backgroundColor: GOV.blue }}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
      {busy ? 'Downloading...' : 'Download Certificate'}
    </button>
  );
}

const TestTakerDashboard = () => {
  const { user, setSession } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [profileUser, setProfileUser] = useState(user || null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loadingAssessmentDetail, setLoadingAssessmentDetail] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(null);

  useEffect(() => {
    setProfileUser(user || null);
  }, [user?.id, user]);

  useEffect(() => {
    let alive = true;

    const fetchDashboardData = async () => {
      try {
        const [assessmentsRes, meRes, certsRes] = await Promise.all([
          api.get('/api/v1/assessments'),
          api.get('/api/v1/auth/me').catch(() => null),
          api.get('/api/v1/assessments/my/certificates').catch(() => null),
        ]);

        if (!alive) return;

        setAssessments(assessmentsRes.data?.data?.assessments || []);
        setCertificates(certsRes?.data?.data?.certificates || []);

        const freshUser = meRes?.data?.data?.user ?? meRes?.data?.user;
        if (freshUser) {
          setProfileUser(freshUser);
          setSession(null, freshUser);
        }
      } catch {
        if (alive) setAssessments([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      alive = false;
    };
  }, [user?.id, setSession]);

  const inProgress = assessments.find((assessment) => assessment.status === 'in_progress');
  const completed = useMemo(
    () => assessments
      .filter((assessment) => assessment.status === 'completed')
      .sort((a, b) => assessmentTime(b) - assessmentTime(a)),
    [assessments],
  );
  const allAssessments = useMemo(
    () => [...assessments].sort((a, b) => assessmentTime(b) - assessmentTime(a)),
    [assessments],
  );
  const latestCompleted = completed[0] || null;
  const latestCode = formatHollandCode(getHollandDisplayCode(latestCompleted));
  const fullName = [profileUser?.firstName, profileUser?.lastName].filter(Boolean).join(' ').trim();
  const displayName = fullName || profileUser?.studentCode || 'Test Taker';
  const institutionName = profileUser?.institution?.name
    || profileUser?.currentInstitution
    || profileUser?.workplaceName
    || '-';
  const institutionLabel = profileUser?.userType === 'professional' ? 'WORKPLACE / EMPLOYER' : 'INSTITUTION';
  const highestQualification = [
    profileUser?.gradeLevel,
    profileUser?.degreeProgram,
  ].filter(Boolean).join(' - ')
    || profileUser?.highestQualification
    || profileUser?.educationLevel?.name
    || '-';

  const goToAssessment = () => {
    if (inProgress) {
      navigate('/questionnaire', { state: { resumeAssessment: true } });
      return;
    }
    navigate('/test');
  };

  const viewResults = (id) => navigate('/results', { state: { assessmentId: id } });

  const viewAssessmentDetail = async (id) => {
    setLoadingAssessmentDetail(true);
    setSelectedAssessment(null);
    try {
      const res = await api.get(`/api/v1/assessments/${id}`);
      setSelectedAssessment(res.data?.data?.assessment || null);
    } catch {
      setSelectedAssessment(assessments.find((assessment) => assessment.id === id) || null);
    } finally {
      setLoadingAssessmentDetail(false);
    }
  };

  const handleDownloadCertificate = async (assessment) => {
    const assessmentId = assessment.id || assessment.assessmentId;
    setDownloadingCert(assessmentId);
    try {
      const res = await api.get(`/api/v1/assessments/${assessmentId}/certificate/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `SDS_Certificate_${String(assessmentId).replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setCertificates((prev) => prev.some((item) => sameId(item.assessmentId, assessmentId))
        ? prev
        : [{ assessmentId, available: true }, ...prev]);
    } catch {
      // Keep the dashboard stable; certificate failures are handled by the API logs.
    } finally {
      setDownloadingCert(null);
    }
  };

  const closeAssessmentModal = () => {
    setSelectedAssessment(null);
    setLoadingAssessmentDetail(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-9 w-9 animate-spin" style={{ color: GOV.blue }} />
      </div>
    );
  }

  return (
    <AppShell hideBreadcrumbs>
      {(loadingAssessmentDetail || selectedAssessment) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[82vh] w-full max-w-3xl flex-col rounded-xl border bg-white shadow-2xl" style={{ borderColor: GOV.border }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: GOV.border }}>
              <h3 className="m-0 text-base font-extrabold" style={{ color: GOV.text }}>Assessment Details</h3>
              <button
                type="button"
                onClick={closeAssessmentModal}
                className="rounded-md p-1.5 transition hover:bg-gray-100"
                style={{ color: GOV.textMuted }}
                aria-label="Close assessment details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loadingAssessmentDetail && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: GOV.blue }} />
                </div>
              )}
              {!loadingAssessmentDetail && selectedAssessment && (
                <div className="space-y-5">
                  <div className="rounded-xl border p-4" style={{ borderColor: GOV.border, backgroundColor: '#f8fafc' }}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="m-0 text-sm font-extrabold" style={{ color: GOV.text }}>Assessment #{selectedAssessment.id}</p>
                        <p className="m-0 mt-1 text-xs" style={{ color: GOV.textMuted }}>
                          Started {selectedAssessment.createdAt ? new Date(selectedAssessment.createdAt).toLocaleString() : '-'}
                        </p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}>
                        {formatLabel(selectedAssessment.status, 'Unknown')}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <InfoMetric label="Progress" value={`${clampPercent(selectedAssessment.progress)}%`} />
                    <InfoMetric label="Holland Code" value={formatHollandCode(getHollandDisplayCode(selectedAssessment))} />
                    <InfoMetric label="Completed" value={selectedAssessment.completedAt ? formatDate(selectedAssessment.completedAt) : 'Not yet'} />
                    <InfoMetric label="Updated" value={formatDate(selectedAssessment.updatedAt)} />
                  </div>
                  <div className="rounded-xl border p-4" style={{ borderColor: GOV.border }}>
                    <p className="m-0 text-sm font-bold" style={{ color: GOV.text }}>Response Summary</p>
                    <p className="m-0 mt-2 text-sm" style={{ color: GOV.textMuted }}>
                      Saved answers: {Array.isArray(selectedAssessment.answers) ? selectedAssessment.answers.length : 0}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ backgroundColor: GOV.borderLight }}>
                      <div className="h-full rounded-full" style={{ width: `${clampPercent(selectedAssessment.progress)}%`, backgroundColor: GOV.blue }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!loadingAssessmentDetail && selectedAssessment && (
              <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4" style={{ borderColor: GOV.border }}>
                {selectedAssessment.status === 'in_progress' && (
                  <ActionButton primary onClick={() => { closeAssessmentModal(); navigate('/questionnaire', { state: { resumeAssessment: true } }); }}>
                    <Play className="h-4 w-4" /> Resume assessment
                  </ActionButton>
                )}
                {selectedAssessment.status === 'completed' && (
                  <ActionButton primary onClick={() => { closeAssessmentModal(); viewResults(selectedAssessment.id); }}>
                    <BarChart3 className="h-4 w-4" /> View results
                  </ActionButton>
                )}
                <ActionButton onClick={closeAssessmentModal}>Close</ActionButton>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="min-h-[calc(100vh-4.5rem)] bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="relative min-h-[10.5rem] overflow-hidden rounded-2xl sm:h-40">
            <img
              src={HERO_IMAGE}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-right"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="relative z-10 flex min-h-[10.5rem] flex-col justify-center p-5 sm:h-full sm:p-7">
              <h1 className="max-w-2xl text-2xl font-bold leading-tight text-white sm:text-[1.7rem]">
                Welcome back, {displayName}!
              </h1>
              <p className="mt-2 text-sm font-medium text-white/90">
                Ready to discover your career path?
              </p>
              <button
                type="button"
                onClick={goToAssessment}
                className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow-md sm:mt-3"
                style={{ backgroundColor: GOV.blue }}
              >
                <Play className="h-4 w-4" />
                {inProgress ? 'Resume Assessment' : 'Take New Assessment'}
              </button>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <InfoCard icon={User} iconClass="text-blue-500" title="Personal Info">
              <InfoRow label="FULL NAME" value={displayName} />
              <InfoRow label="DATE OF BIRTH" value={formatDate(profileUser?.dateOfBirth)} />
              <InfoRow label="NATIONAL ID" value={profileUser?.nationalId || '-'} />
            </InfoCard>

            <InfoCard icon={MapPin} iconClass="text-green-500" title="Address Info">
              <InfoRow label="PRIMARY RESIDENCE" value={profileUser?.address || profileUser?.town || '-'} />
              <InfoRow label="REGION" value={formatLabel(profileUser?.region, '-')} />
              <InfoRow label="CONTACT" value={profileUser?.phoneNumber || '-'} />
            </InfoCard>

            <InfoCard icon={GraduationCap} iconClass="text-purple-500" title="Education & Career">
              <InfoRow label="CURRENT STATUS" value={profileTypeLabel(profileUser?.userType)} badge />
              <InfoRow label="HIGHEST QUALIFICATION" value={highestQualification} />
              <InfoRow label={institutionLabel} value={institutionName} />
            </InfoCard>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {allAssessments.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900">All Assessments (0)</h3>
                  <p className="mx-auto max-w-md text-sm leading-6 text-gray-500">
                    You have not completed any career assessments yet. Start your journey today to discover your RIASEC code and potential career matches.
                  </p>
                  <ActionButton primary className="mt-5" onClick={goToAssessment}>
                    <Play className="h-4 w-4" /> Start Assessment
                  </ActionButton>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-gray-900">All Assessments ({allAssessments.length})</h3>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Latest first</span>
                  </div>
                  <div className="space-y-3">
                    {allAssessments.slice(0, 4).map((assessment) => {
                      const completedAssessment = assessment.status === 'completed';
                      return (
                        <article key={assessment.id} className="rounded-xl border border-gray-100 p-4 transition hover:border-blue-100 hover:bg-blue-50/30">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase"
                                  style={{
                                    backgroundColor: completedAssessment ? '#dcfce7' : GOV.blueLightAlt,
                                    color: completedAssessment ? '#047857' : GOV.blue,
                                  }}
                                >
                                  {formatLabel(assessment.status, 'Unknown')}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(assessment.completedAt || assessment.updatedAt || assessment.createdAt)}
                                </span>
                              </div>
                              <p className="mt-2 text-lg font-black tracking-[0.16em] text-gray-900">
                                {completedAssessment ? formatHollandCode(getHollandDisplayCode(assessment)) : `${clampPercent(assessment.progress)}% COMPLETE`}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {completedAssessment ? (
                                <>
                                  <AssessmentAction onClick={() => viewResults(assessment.id)}>
                                    <BarChart3 className="h-3.5 w-3.5" /> Results
                                  </AssessmentAction>
                                  <AssessmentAction onClick={() => viewAssessmentDetail(assessment.id)}>
                                    <FileText className="h-3.5 w-3.5" /> Details
                                  </AssessmentAction>
                                  <CertificateAction
                                    assessment={assessment}
                                    downloadingCert={downloadingCert}
                                    onDownload={handleDownloadCertificate}
                                  />
                                </>
                              ) : (
                                <>
                                  <AssessmentAction onClick={goToAssessment}>
                                    <Play className="h-3.5 w-3.5" /> Resume
                                  </AssessmentAction>
                                  <AssessmentAction onClick={() => viewAssessmentDetail(assessment.id)}>
                                    <FileText className="h-3.5 w-3.5" /> Details
                                  </AssessmentAction>
                                </>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-bold text-gray-900">
                  <Award className="h-5 w-5 text-orange-500" />
                  Top Career Recommendations
                </h3>
                <button type="button" className="rounded-md p-1.5 hover:bg-gray-100" aria-label="Recommendation settings">
                  <Settings className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {!latestCompleted ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center">
                  <BookOpen className="mx-auto mb-3 h-7 w-7 text-gray-400" />
                  <p className="text-sm italic leading-6 text-gray-500">
                    Complete your first assessment to unlock personalized recommendations based on your unique personality profile.
                  </p>
                  <Link to="/help" className="mt-2 inline-block text-sm font-medium uppercase" style={{ color: GOV.blue }}>
                    Learn more about RIASEC
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Latest Holland Code</p>
                    <p className="mt-2 text-4xl font-black tracking-[0.2em] text-gray-900">{latestCode}</p>
                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      Open your results to view career options, priority fields, study pathways, and recommendations generated from this completed assessment.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ActionButton primary onClick={() => viewResults(latestCompleted.id)}>
                      <BarChart3 className="h-4 w-4" /> View Results
                    </ActionButton>
                    <ActionButton onClick={() => viewAssessmentDetail(latestCompleted.id)}>
                      <FileText className="h-4 w-4" /> Details
                    </ActionButton>
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    </AppShell>
  );
};

function AssessmentAction({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
    >
      {children}
    </button>
  );
}

function InfoMetric({ label, value }) {
  return (
    <div className="rounded-lg border bg-white p-4" style={{ borderColor: GOV.border }}>
      <p className="m-0 text-[0.68rem] font-bold uppercase tracking-wide" style={{ color: GOV.textMuted }}>{label}</p>
      <p className="m-0 mt-1 text-lg font-extrabold" style={{ color: GOV.text }}>{value}</p>
    </div>
  );
}

export default TestTakerDashboard;
