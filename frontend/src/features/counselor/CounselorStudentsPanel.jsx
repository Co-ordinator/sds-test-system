import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, Download, FileText, X } from 'lucide-react';
import { GOV, TYPO } from '../../theme/government';
import DataTable from '../../components/data/DataTable';
import { useToast, ErrorBanner } from '../../components/ui/StatusIndicators';
import { counselorService } from '../../services/counselorService';

const RIASEC_COLORS = ['#1e3a5f', '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];

const SBadge = ({ status }) => {
  const map = {
    completed: 'bg-green-50 text-green-700 border-green-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    expired: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  if (!status) return <span className="text-xs" style={{ color: GOV.textHint }}>No test</span>;
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${map[status] || map.in_progress}`}>{status.replace('_', ' ')}</span>;
};

const CounselorStudentsPanel = ({ students, isAdmin, loading, error, onRefresh, onStudentUpdated, onStudentDeleted }) => {
  const navigate = useNavigate();
  const { toast, showToast, Toast: ToastComp } = useToast();
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudentId, setViewingStudentId] = useState(null);
  const [studentResults, setStudentResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveStudent = async () => {
    if (!editingStudent) return;
    setIsSaving(true);
    try {
      await counselorService.updateStudent(editingStudent.id, {
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        email: editingStudent.email,
        gradeLevel: editingStudent.gradeLevel,
        className: editingStudent.className,
        studentNumber: editingStudent.studentNumber,
      });
      setEditingStudent(null);
      onStudentUpdated?.(editingStudent);
      showToast('Student updated');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update student', 'error');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student permanently?')) return;
    try {
      await counselorService.deleteStudent(id);
      onStudentDeleted?.(id);
      showToast('Student deleted');
    } catch { showToast('Failed to delete student', 'error'); }
  };

  const loadStudentResults = async (studentId) => {
    setLoadingResults(true);
    setViewingStudentId(studentId);
    setStudentResults(null);
    try {
      const data = await counselorService.getStudentResults(studentId);
      setStudentResults(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load results', 'error');
      setViewingStudentId(null);
    } finally { setLoadingResults(false); }
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true, render: (s) => <span className="font-medium text-sm" style={{ color: GOV.text }}>{s.firstName} {s.lastName}</span> },
    { key: 'email', header: 'Email', sortable: true, render: (s) => <span className="text-xs" style={{ color: GOV.textMuted }}>{s.email || '–'}</span> },
    { key: 'gradeLevel', header: 'Grade', sortable: true, render: (s) => <span className="text-xs" style={{ color: GOV.textMuted }}>{s.gradeLevel || '–'}</span> },
    ...(isAdmin ? [{ key: 'institutionName', header: 'Institution', sortable: true, render: (s) => <span className="text-xs" style={{ color: GOV.textMuted }}>{s.institutionName || '–'}</span> }] : []),
    { key: 'status', header: 'Latest Test', render: (s) => <SBadge status={s.latestAssessment?.status} /> },
    { key: 'hollandCode', header: 'Holland Code', sortable: true, render: (s) => <span className="font-mono font-semibold text-sm" style={{ color: GOV.text }}>{s.latestAssessment?.hollandCode || '–'}</span> },
    {
      key: 'actions', header: 'Actions', stopPropagation: true,
      render: (s) => (
        <div className="flex gap-1">
          {s.latestAssessment?.status === 'completed' && (
            <>
              <button type="button" onClick={() => navigate('/results', { state: { assessmentId: s.latestAssessment.id } })} className="p-1 rounded hover:bg-gray-100" title="View Results">
                <Eye className="w-3.5 h-3.5" style={{ color: GOV.blue }} />
              </button>
              <button type="button" onClick={() => counselorService.downloadResultPdf(s.latestAssessment.id, s.id).catch(() => {})} className="p-1 rounded hover:bg-gray-100" title="Download PDF">
                <Download className="w-3.5 h-3.5 text-green-600" />
              </button>
            </>
          )}
          <button type="button" onClick={() => setEditingStudent({ ...s })} className="p-1 rounded hover:bg-blue-50" title="Edit Student">
            <Edit2 className="w-3.5 h-3.5" style={{ color: GOV.blue }} />
          </button>
          <button type="button" onClick={() => loadStudentResults(s.id)} className="p-1 rounded hover:bg-gray-100" title="View All Results">
            <FileText className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
          </button>
          <button type="button" onClick={() => handleDelete(s.id)} className="p-1 rounded hover:bg-red-50" title="Delete Student">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <>
      <button type="button" onClick={onRefresh} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.blue }}>
        Refresh
      </button>
      <span className="text-xs ml-auto" style={{ color: GOV.textMuted }}>{students.length} students</span>
    </>
  );

  return (
    <>
      <ToastComp toast={toast} />
      {error && <ErrorBanner message={error} onRetry={onRefresh} className="mb-3" />}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable columns={columns} rows={students} rowKey="id" loading={loading} emptyTitle="No students found" toolbar={toolbar} pageSize={7} />
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Edit Student</h3>
              <button type="button" onClick={() => setEditingStudent(null)}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>First Name</label>
                <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingStudent.firstName || ''} onChange={e => setEditingStudent({ ...editingStudent, firstName: e.target.value })} />
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Last Name</label>
                <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingStudent.lastName || ''} onChange={e => setEditingStudent({ ...editingStudent, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Email</label>
              <input type="email" className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingStudent.email || ''} onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Grade / Level</label>
                <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingStudent.gradeLevel || ''} onChange={e => setEditingStudent({ ...editingStudent, gradeLevel: e.target.value })} placeholder="e.g. 11" />
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Class</label>
                <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingStudent.className || ''} onChange={e => setEditingStudent({ ...editingStudent, className: e.target.value })} placeholder="e.g. A" />
              </div>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Student Number</label>
              <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingStudent.studentNumber || ''} onChange={e => setEditingStudent({ ...editingStudent, studentNumber: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 border rounded-md py-2 text-sm" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Cancel</button>
              <button type="button" onClick={handleSaveStudent} disabled={isSaving} className="flex-1 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: GOV.blue }}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Results Modal */}
      {viewingStudentId && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Student Assessment Results</h3>
              <button type="button" onClick={() => { setViewingStudentId(null); setStudentResults(null); }}>
                <X className="w-4 h-4" style={{ color: GOV.textMuted }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {loadingResults && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: GOV.blue }} />
                </div>
              )}
              {!loadingResults && !studentResults && (
                <p className="text-sm text-center py-8" style={{ color: GOV.textHint }}>No results available.</p>
              )}
              {!loadingResults && studentResults && (
                <div className="space-y-5">
                  <div className="p-4 rounded-md" style={{ backgroundColor: GOV.blueLightAlt }}>
                    <p className="font-semibold text-sm" style={{ color: GOV.text }}>{studentResults.user?.firstName} {studentResults.user?.lastName}</p>
                    <p className="text-xs mt-0.5" style={{ color: GOV.textMuted }}>{studentResults.user?.email || '–'} · {studentResults.user?.institution?.name || '–'}</p>
                  </div>
                  {(studentResults.assessments || []).map(a => (
                    <div key={a.id} className="border rounded-md overflow-hidden" style={{ borderColor: GOV.border }}>
                      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: GOV.blueLightAlt }}>
                        <div>
                          <span className="font-mono font-bold text-sm" style={{ color: GOV.blue }}>{a.hollandCode || 'In Progress'}</span>
                          <span className="ml-3 text-xs" style={{ color: GOV.textMuted }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <SBadge status={a.status} />
                          {a.status === 'completed' && (
                            <button type="button" onClick={() => navigate('/results', { state: { assessmentId: a.id } })} className="flex items-center gap-1 px-2 py-1 border rounded text-xs" style={{ borderColor: GOV.border, color: GOV.blue }}>
                              <Eye className="w-3 h-3" /> View
                            </button>
                          )}
                        </div>
                      </div>
                      {a.hollandCode && (
                        <div className="px-4 py-3">
                          <div className="grid grid-cols-6 gap-2">
                            {['R', 'I', 'A', 'S', 'E', 'C'].map((k, i) => (
                              <div key={k} className="text-center">
                                <div className="text-xs font-bold" style={{ color: RIASEC_COLORS[i] }}>{k}</div>
                                <div className="text-sm font-semibold mt-0.5" style={{ color: GOV.text }}>{a.scores ? (a.scores[k] ?? '–') : '–'}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!studentResults.assessments || studentResults.assessments.length === 0) && (
                    <p className="text-sm text-center" style={{ color: GOV.textHint }}>No assessments taken yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CounselorStudentsPanel;
