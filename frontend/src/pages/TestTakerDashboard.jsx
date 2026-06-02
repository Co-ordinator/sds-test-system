import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  ClipboardList,
  Clock,
  FileText,
  Info,
  Loader2,
  Play,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { GOV } from '../theme/government';
import AppShell from '../components/layout/AppShell';

const getHollandDisplayCode = (assessment) =>
  assessment?.hollandCodeDisplay || assessment?.hollandCode || '-';

const clampPercent = (value) =>
  Math.max(0, Math.min(Math.round(Number(value) || 0), 100));

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
  return String(code).replace(/\s+/g, '').replace(/([A-Z])(?=[A-Z])/g, '$1 ').trim();
};

/* ── Flat progress ring ── */
function ProgressRing({ percent }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <div style={{ position: 'relative', width: 112, height: 112, flexShrink: 0 }}>
      <svg width="112" height="112" viewBox="0 0 112 112" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="56" cy="56" r={r} fill="none" stroke={GOV.borderLight} strokeWidth="10" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={GOV.blue} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1, color: GOV.text }}>{percent}%</span>
        <span style={{ fontSize: '0.62rem', fontWeight: 600, color: GOV.textMuted, marginTop: 2 }}>Complete</span>
      </div>
    </div>
  );
}

/* ── Detail tile for modal ── */
const DetailTile = ({ label, value }) => (
  <div style={{ border: `1px solid ${GOV.border}`, borderRadius: 8, padding: '0.85rem 1rem', background: '#fff' }}>
    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: GOV.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: GOV.text, margin: '6px 0 0' }}>{value}</p>
  </div>
);

/* ── Certificate button ── */
const CertificateAction = ({ assessment, certificate, downloadingCert, generatingCert, onDownload, onGenerate }) => {
  const busy = downloadingCert === assessment.id || generatingCert === assessment.id;
  return (
    <button
      type="button"
      onClick={() => certificate ? onDownload(certificate) : onGenerate(assessment.id)}
      disabled={busy}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        height: 34, minWidth: 120, padding: '0 12px',
        background: GOV.blue, color: GOV.ministryBarText,
        border: 'none', borderRadius: 6,
        fontSize: '0.75rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy
        ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
        : <Award style={{ width: 14, height: 14 }} />}
      {certificate
        ? (downloadingCert === assessment.id ? 'Downloading…' : 'Certificate')
        : (generatingCert === assessment.id ? 'Generating…' : 'Certificate')}
    </button>
  );
};

/* ── Flat outline button ── */
const FlatBtn = ({ children, primary, ...props }) => (
  <button
    type="button"
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      height: 38, padding: '0 16px',
      background: primary ? GOV.blue : '#fff',
      color: primary ? GOV.ministryBarText : GOV.text,
      border: `1px solid ${primary ? GOV.blue : GOV.border}`,
      borderRadius: 6, fontSize: '0.82rem', fontWeight: 700,
      cursor: 'pointer',
    }}
    {...props}
  >
    {children}
  </button>
);

/* ══════════════════════════════════════════════════════════ */
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

  useEffect(() => { setProfileUser(user || null); }, [user?.id]);

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
        if (freshUser) { setProfileUser(freshUser); setSession(null, freshUser); }
      } catch { setAssessments([]); }
      finally { setLoading(false); }
    };
    fetchAssessments();
  }, [user?.id, setSession]);

  const inProgress = assessments.find((a) => a.status === 'in_progress');
  const completed = useMemo(
    () => assessments.filter((a) => a.status === 'completed').sort((a, b) => assessmentTime(b) - assessmentTime(a)),
    [assessments],
  );
  const progressPercent = clampPercent(inProgress?.progress);
  const fullName = [profileUser?.firstName, profileUser?.lastName].filter(Boolean).join(' ').trim();
  const displayName = fullName || profileUser?.studentCode || 'Student';

  const viewResults = (id) => navigate('/results', { state: { assessmentId: id } });

  const viewAssessmentDetail = async (id) => {
    setLoadingAssessmentDetail(true);
    setSelectedAssessment(null);
    try {
      const res = await api.get(`/api/v1/assessments/${id}`);
      setSelectedAssessment(res.data?.data?.assessment || null);
    } catch {
      setSelectedAssessment(assessments.find((a) => a.id === id) || null);
    } finally { setLoadingAssessmentDetail(false); }
  };

  const handleDownloadCertificate = async (cert) => {
    setDownloadingCert(cert.assessmentId);
    try {
      const res = await api.get(`/api/v1/assessments/${cert.assessmentId}/certificate/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `SDS_Certificate_${(cert.certNumber || cert.assessmentId).replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {} finally { setDownloadingCert(null); }
  };

  const handleGenerateCertificate = async (assessmentId) => {
    setGeneratingCert(assessmentId);
    try {
      const res = await api.post(`/api/v1/assessments/${assessmentId}/certificate/generate`);
      const cert = { ...(res.data?.data || {}), assessmentId };
      setCertificates((prev) => [cert, ...prev.filter((i) => i.assessmentId !== assessmentId)]);
      await handleDownloadCertificate(cert);
    } catch {} finally { setGeneratingCert(null); }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: GOV.borderLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <Loader2 className="animate-spin" style={{ width: 36, height: 36, color: GOV.blue }} />
      </div>
    );
  }

  return (
    <AppShell hideBreadcrumbs>

      {/* ── Detail modal ── */}
      {(loadingAssessmentDetail || selectedAssessment) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 720,
            maxHeight: '82vh', display: 'flex', flexDirection: 'column',
            border: `1px solid ${GOV.border}`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem', borderBottom: `1px solid ${GOV.border}`,
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: GOV.text, margin: 0 }}>Assessment Details</h3>
              <button type="button"
                onClick={() => { setSelectedAssessment(null); setLoadingAssessmentDetail(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: GOV.textMuted }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {loadingAssessmentDetail && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
                  <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: GOV.blue }} />
                </div>
              )}
              {!loadingAssessmentDetail && selectedAssessment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: GOV.borderLight, borderRadius: 8, padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '0.95rem', margin: 0, color: GOV.text }}>Assessment #{selectedAssessment.id}</p>
                        <p style={{ fontSize: '0.78rem', color: GOV.textMuted, margin: '4px 0 0' }}>
                          Started {selectedAssessment.createdAt ? new Date(selectedAssessment.createdAt).toLocaleString() : '-'}
                        </p>
                      </div>
                      <span style={{
                        background: GOV.blueLightAlt, color: GOV.blue, border: `1px solid ${GOV.blueLight}`,
                        borderRadius: 99, padding: '3px 12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                      }}>
                        {selectedAssessment.status?.replace('_', ' ') || 'unknown'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '0.75rem' }}>
                    <DetailTile label="Progress" value={`${clampPercent(selectedAssessment.progress)}%`} />
                    <DetailTile label="Holland Code" value={formatHollandCode(getHollandDisplayCode(selectedAssessment))} />
                    <DetailTile label="Completed" value={selectedAssessment.completedAt ? new Date(selectedAssessment.completedAt).toLocaleDateString() : 'Not yet'} />
                    <DetailTile label="Updated" value={selectedAssessment.updatedAt ? new Date(selectedAssessment.updatedAt).toLocaleDateString() : '-'} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.75rem', color: GOV.text }}>Response Summary</p>
                    <div style={{ border: `1px solid ${GOV.border}`, borderRadius: 8, padding: '1rem' }}>
                      <p style={{ fontSize: '0.82rem', color: GOV.textMuted, margin: 0 }}>
                        Saved answers: {Array.isArray(selectedAssessment.answers) ? selectedAssessment.answers.length : 0}
                      </p>
                      <div style={{ marginTop: 12, height: 8, borderRadius: 99, background: GOV.borderLight, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${clampPercent(selectedAssessment.progress)}%`, background: GOV.blue, borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!loadingAssessmentDetail && selectedAssessment && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '1rem 1.5rem', borderTop: `1px solid ${GOV.border}` }}>
                {selectedAssessment.status === 'in_progress' && (
                  <FlatBtn primary onClick={() => { setSelectedAssessment(null); navigate('/questionnaire', { state: { resumeAssessment: true } }); }}>
                    Resume Assessment
                  </FlatBtn>
                )}
                {selectedAssessment.status === 'completed' && (
                  <FlatBtn primary onClick={() => { setSelectedAssessment(null); viewResults(selectedAssessment.id); }}>
                    View Results
                  </FlatBtn>
                )}
                <FlatBtn onClick={() => setSelectedAssessment(null)}>Close</FlatBtn>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="mx-0 mt-0 w-full"
        style={{ fontFamily: 'sans-serif', color: GOV.text, background: 'transparent', padding: 0 }}
      >
        <section className="mx-auto w-full max-w-[1100px] px-4 pt-8 pb-2 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
          <h1
            className="mb-2 text-[1.65rem] font-extrabold leading-tight sm:text-[1.85rem] lg:text-[2.05rem]"
            style={{ color: GOV.text }}
          >
            Welcome back, {displayName}
          </h1>
          <p className="m-0 max-w-[640px] text-[0.9rem] leading-relaxed sm:text-[0.92rem]" style={{ color: GOV.textMuted }}>
            Continue your Self-Directed Search, review results, and download certificates from this page.
          </p>
        </section>

        <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:pb-12">
          <div
            style={{
              border: `1px solid ${GOV.border}`,
              borderRadius: 10,
              background: '#fff',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: GOV.blueLightAlt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ClipboardList style={{ width: 18, height: 18, color: GOV.blue }} />
              </div>
              <h2 className="text-lg font-extrabold sm:text-xl" style={{ color: GOV.text, margin: 0 }}>
                Your test status
              </h2>
              <span
                style={{
                  background: inProgress ? GOV.blueLightAlt : '#e8f7ef',
                  color: inProgress ? GOV.blue : '#15803d',
                  borderRadius: 99,
                  padding: '2px 10px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                {inProgress ? 'In progress' : 'Ready'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <ProgressRing percent={progressPercent} />
              <div style={{ flex: 1, minWidth: 220 }}>
                <p
                  className="text-[0.85rem] sm:text-[0.88rem]"
                  style={{ color: GOV.textMuted, margin: '0 0 0.75rem', lineHeight: 1.6, maxWidth: 520 }}
                >
                  {inProgress
                    ? "You're making progress — each step brings you closer to valuable insights about your strengths and interests."
                    : 'You can begin your Self-Directed Search assessment when you are ready.'}
                </p>
                <div style={{ height: 6, borderRadius: 99, background: GOV.borderLight, overflow: 'hidden', maxWidth: 400 }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: GOV.blue, borderRadius: 99 }} />
                </div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: GOV.blue, margin: '6px 0 1rem' }}>
                  {progressPercent}% complete
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {inProgress ? (
                    <FlatBtn primary onClick={() => navigate('/questionnaire', { state: { resumeAssessment: true } })}>
                      <Play style={{ width: 14, height: 14 }} /> Resume test
                    </FlatBtn>
                  ) : (
                    <FlatBtn primary onClick={() => navigate('/test')}>
                      <Play style={{ width: 14, height: 14 }} /> Start test
                    </FlatBtn>
                  )}
                  <FlatBtn onClick={() => navigate('/questionnaire-intro')}>
                    <Info style={{ width: 14, height: 14 }} /> Instructions
                  </FlatBtn>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              border: `1px solid ${GOV.border}`,
              borderRadius: 10,
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '1.1rem 1.5rem',
                borderBottom: `1px solid ${GOV.border}`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: GOV.blueLightAlt,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Clock style={{ width: 16, height: 16, color: GOV.blue }} />
              </div>
              <h2 className="text-lg font-extrabold sm:text-xl" style={{ color: GOV.text, margin: 0 }}>
                Past assessments
              </h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: GOV.borderLight }}>
                    {['Date', 'Status', 'Holland code', 'Actions'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.7rem 1.25rem',
                          textAlign: 'left',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: GOV.textMuted,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {completed.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ padding: '2.5rem', textAlign: 'center', color: GOV.textMuted, fontSize: '0.85rem' }}
                      >
                        No completed assessments yet.
                      </td>
                    </tr>
                  )}
                  {completed.map((assessment, idx) => {
                    const cert = certificates.find((c) => c.assessmentId === assessment.id);
                    return (
                      <tr
                        key={assessment.id}
                        style={{
                          borderTop: `1px solid ${GOV.border}`,
                          background: idx % 2 === 1 ? GOV.borderLight : '#fff',
                        }}
                      >
                        <td style={{ padding: '0.85rem 1.25rem', color: GOV.textMuted, fontWeight: 500 }}>
                          {formatDate(assessment.completedAt || assessment.createdAt)}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem' }}>
                          <span
                            style={{
                              background: GOV.blueLightAlt,
                              color: GOV.blue,
                              borderRadius: 99,
                              padding: '2px 10px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            Completed
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, letterSpacing: '0.08em', color: GOV.text }}>
                          {formatHollandCode(getHollandDisplayCode(assessment))}
                        </td>
                        <td style={{ padding: '0.7rem 1.25rem' }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button type="button" onClick={() => viewResults(assessment.id)} style={tableActionBtn}>
                              <BarChart3 style={{ width: 13, height: 13 }} /> View results
                            </button>
                            <button type="button" onClick={() => viewAssessmentDetail(assessment.id)} style={tableActionBtn}>
                              <FileText style={{ width: 13, height: 13 }} /> View details
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
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default TestTakerDashboard;

const tableActionBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  height: 32, padding: '0 10px',
  background: '#fff', color: GOV.text,
  border: `1px solid ${GOV.border}`,
  borderRadius: 6, fontSize: '0.73rem', fontWeight: 700, cursor: 'pointer',
};