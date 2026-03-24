import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Loader2, User, LogOut, Eye, X, FileText, Award, Download } from 'lucide-react';
import api from '../services/api';
import { GOV, TYPO } from '../theme/government';
import AppShell from '../components/layout/AppShell';

const TestTakerDashboard = () => {
  const { user, setSession, logout } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loadingAssessmentDetail, setLoadingAssessmentDetail] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [downloadingCert, setDownloadingCert] = useState(null);

  useEffect(() => {
    setProfileUser(user || null);
  }, [user?.id]);

  // Redirect to onboarding if user has incomplete profile
  useEffect(() => {
    if (profileUser && !loading) {
      const fullName = [profileUser?.firstName, profileUser?.lastName].filter(Boolean).join(' ').trim();
      const isPendingPlaceholder = fullName.toLowerCase() === 'pending user'
        || (profileUser?.firstName || '').toLowerCase() === 'pending';
      
      if (isPendingPlaceholder || !profileUser?.userType) {
        navigate('/onboarding');
      }
    }
  }, [profileUser, loading, navigate]);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const [assessmentsRes, meRes, certsRes] = await Promise.all([
          api.get('/api/v1/assessments'),
          api.get('/api/v1/auth/me').catch(() => null),
          api.get('/api/v1/assessments/my/certificates').catch(() => null)
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
  }, [user?.id]);

  const handleDownloadCertificate = async (cert) => {
    setDownloadingCert(cert.assessmentId);
    try {
      const res = await api.get(`/api/v1/assessments/${cert.assessmentId}/certificate/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `SDS_Certificate_${(cert.certNumber || cert.assessmentId).replace(/\//g, '-')}.pdf`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setDownloadingCert(null); }
  };

  const inProgress = assessments.find((a) => a.status === 'in_progress');
  const completed = assessments.filter((a) => a.status === 'completed');
  const progressPercent = inProgress ? Math.round(Number(inProgress.progress) || 0) : 0;
  const fullName = [profileUser?.firstName, profileUser?.lastName].filter(Boolean).join(' ').trim();
  const isPendingPlaceholder = fullName.toLowerCase() === 'pending user'
    || (profileUser?.firstName || '').toLowerCase() === 'pending';
  const displayName = (!isPendingPlaceholder && fullName)
    || profileUser?.firstName
    || 'Student';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: GOV.blue }} />
      </div>
    );
  }

  return (
    <AppShell>
      {/* Certificate Notification Banner */}
      {certificates.length > 0 && (
        <div className="border-b" style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}>
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
            <Award className="w-5 h-5 flex-shrink-0" style={{ color: '#d97706' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                {certificates.length === 1
                  ? 'Your SDS Certificate is ready for download!'
                  : `You have ${certificates.length} SDS Certificates ready for download!`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>Generated by the Ministry of Labour & Social Security</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {certificates.map(cert => (
                <button
                  key={cert.id}
                  type="button"
                  onClick={() => handleDownloadCertificate(cert)}
                  disabled={downloadingCert === cert.assessmentId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#d97706', color: '#fff' }}
                >
                  <Download className="w-3 h-3" />
                  {downloadingCert === cert.assessmentId ? 'Downloading…' : `Download ${cert.certNumber || 'Certificate'}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(loadingAssessmentDetail || selectedAssessment) && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Assessment Details</h3>
              <button type="button" onClick={() => { setSelectedAssessment(null); setLoadingAssessmentDetail(false); }}
                className="p-1 rounded-md transition-all duration-150 hover:bg-gray-100 active:scale-95">
                <X className="w-4 h-4" style={{ color: GOV.textMuted }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loadingAssessmentDetail && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOV.blue }} />
                </div>
              )}
              {!loadingAssessmentDetail && selectedAssessment && (
                <div className="space-y-5">
                  <div className="rounded-md p-4" style={{ backgroundColor: GOV.blueLightAlt }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: GOV.text }}>
                          Assessment #{selectedAssessment.id}
                        </p>
                        <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>
                          Started {selectedAssessment.createdAt ? new Date(selectedAssessment.createdAt).toLocaleString() : '–'}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border" style={{ backgroundColor: '#ffffff', color: GOV.blue, borderColor: GOV.border }}>
                        {selectedAssessment.status?.replace('_', ' ') || 'unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border rounded-md p-3" style={{ borderColor: GOV.border }}>
                      <p className="text-[11px] font-semibold" style={{ color: GOV.textMuted }}>Progress</p>
                      <p className="text-lg font-bold mt-1" style={{ color: GOV.text }}>{Math.round(Number(selectedAssessment.progress || 0))}%</p>
                    </div>
                    <div className="border rounded-md p-3" style={{ borderColor: GOV.border }}>
                      <p className="text-[11px] font-semibold" style={{ color: GOV.textMuted }}>Holland Code</p>
                      <p className="text-lg font-bold mt-1 font-mono" style={{ color: GOV.text }}>{selectedAssessment.hollandCode || '–'}</p>
                    </div>
                    <div className="border rounded-md p-3" style={{ borderColor: GOV.border }}>
                      <p className="text-[11px] font-semibold" style={{ color: GOV.textMuted }}>Completed</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: GOV.text }}>{selectedAssessment.completedAt ? new Date(selectedAssessment.completedAt).toLocaleString() : 'Not yet'}</p>
                    </div>
                    <div className="border rounded-md p-3" style={{ borderColor: GOV.border }}>
                      <p className="text-[11px] font-semibold" style={{ color: GOV.textMuted }}>Updated</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: GOV.text }}>{selectedAssessment.updatedAt ? new Date(selectedAssessment.updatedAt).toLocaleString() : '–'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: GOV.text }}>Response Summary</p>
                    <div className="border rounded-md p-4" style={{ borderColor: GOV.border }}>
                      <p className="text-xs" style={{ color: GOV.textMuted }}>
                        Saved answers: {Array.isArray(selectedAssessment.answers) ? selectedAssessment.answers.length : 0}
                      </p>
                      <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: GOV.blueLightAlt }}>
                        <div className="h-full" style={{ width: `${Math.min(Math.round(Number(selectedAssessment.progress || 0)), 100)}%`, backgroundColor: GOV.blue }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!loadingAssessmentDetail && selectedAssessment && (
              <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: GOV.border }}>
                {selectedAssessment.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => { setSelectedAssessment(null); navigate('/test'); }}
                    className="px-4 py-2 rounded-md text-xs font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ backgroundColor: GOV.blue }}
                  >
                    Resume Assessment
                  </button>
                )}
                {selectedAssessment.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => { setSelectedAssessment(null); viewResults(selectedAssessment.id); }}
                    className="px-4 py-2 rounded-md text-xs font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ backgroundColor: GOV.blue }}
                  >
                    View Results
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedAssessment(null)}
                  className="px-4 py-2 border rounded-md text-xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ borderColor: GOV.border, color: GOV.textMuted }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="rounded-lg p-6 shadow-sm border" style={{ borderColor: GOV.border }}>
          <h1 className="text-3xl font-bold" style={{ color: GOV.text }}>Welcome back, {displayName}!</h1>
          <p className="mt-2" style={{ color: GOV.textMuted }}>
            {inProgress
              ? 'Continue your assessment or view past results below.'
              : 'Start a new SDS assessment or view your past results.'}
          </p>
        </div>

        {inProgress && (
          <div className="bg-white border rounded-lg shadow-sm p-10 text-center" style={{ borderColor: GOV.border }}>
            <div className="flex justify-center items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold" style={{ color: GOV.text }}>Your Test Status</h2>
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue }}>In Progress</span>
            </div>
            <p className="mb-6" style={{ color: GOV.textMuted }}>Current status of your Self-Directed Search assessment.</p>
            <button
              type="button"
              onClick={() => navigate('/test')}
              className="text-white px-10 py-2.5 rounded-md font-semibold shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: GOV.blue }}
            >
              Resume Test
            </button>
            <div className="mt-8">
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: GOV.blueLightAlt }}>
                <div
                  className="h-full transition-all"
                  style={{ width: `${Math.min(progressPercent, 100)}%`, backgroundColor: GOV.blue }}
                />
              </div>
              <div className="text-xs mt-2 font-semibold" style={{ color: GOV.textMuted }}>Progress: {progressPercent}%</div>
            </div>
          </div>
        )}

        {!inProgress && (
          <div className="bg-white border rounded-lg shadow-sm p-10 text-center" style={{ borderColor: GOV.border }}>
            <h2 className="text-xl font-semibold mb-2" style={{ color: GOV.text }}>Start a new assessment</h2>
            <p className="mb-6" style={{ color: GOV.textMuted }}>Take the Self-Directed Search career assessment (~45 minutes).</p>
            <button
              type="button"
              onClick={() => navigate('/test')}
              className="text-white px-10 py-2.5 rounded-md font-semibold shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: GOV.blue }}
            >
              Start Test
            </button>
          </div>
        )}

        <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: GOV.border }}>
          <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: GOV.borderLight, color: GOV.text }}>
            <Clock className="w-5 h-5" style={{ color: GOV.textMuted }} />
            <span className="font-semibold">Past assessments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs tracking-wide" style={{ color: GOV.textMuted, backgroundColor: GOV.blueLightAlt }}>
                <tr>
                  <th className="pb-3 pt-3 px-4">Date</th>
                  <th className="pb-3 pt-3 px-4">Status</th>
                  <th className="pb-3 pt-3 px-4">Holland Code</th>
                  <th className="pb-3 pt-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completed.length === 0 && !inProgress && (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center" style={{ color: GOV.textMuted }}>
                      No assessments yet.
                    </td>
                  </tr>
                )}
                {completed.map((a) => (
                  <tr key={a.id} className="align-middle border-b" style={{ borderColor: GOV.borderLight }}>
                    <td className="py-3 px-4" style={{ color: GOV.textMuted }}>
                      {a.completedAt
                        ? new Date(a.completedAt).toLocaleDateString()
                        : new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border" style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue, borderColor: GOV.border }}>
                        Completed
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium" style={{ color: GOV.text }}>{a.hollandCode || '–'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => viewResults(a.id)}
                          className="border px-3 py-1 rounded text-xs font-semibold transition-all duration-150 hover:scale-[1.05] active:scale-[0.95] hover:shadow-sm"
                          style={{ borderColor: GOV.border, color: GOV.text }}
                        >
                          View Results
                        </button>
                        <button
                          type="button"
                          onClick={() => viewAssessmentDetail(a.id)}
                          className="border px-3 py-1 rounded text-xs font-semibold transition-all duration-150 hover:scale-[1.05] active:scale-[0.95] hover:shadow-sm"
                          style={{ borderColor: GOV.border, color: GOV.text }}
                        >
                          View Details
                        </button>
                        {certificates.find(c => c.assessmentId === a.id) && (
                          <button
                            type="button"
                            onClick={() => handleDownloadCertificate(certificates.find(c => c.assessmentId === a.id))}
                            disabled={downloadingCert === a.id}
                            className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold disabled:opacity-50 transition-all"
                            style={{ backgroundColor: '#d97706', color: '#fff', border: 'none' }}
                          >
                            <Award className="w-3 h-3" />
                            {downloadingCert === a.id ? '…' : 'Certificate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default TestTakerDashboard;
