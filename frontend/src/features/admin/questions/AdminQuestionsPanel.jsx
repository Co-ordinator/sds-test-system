import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Upload, Download, Edit2, Trash2, X } from 'lucide-react';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { useToast, Toast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';

const EMPTY_Q = { text: '', section: 'activities', riasecType: 'R', order: '' };

const AdminQuestionsPanel = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState(EMPTY_Q);
  const [isSaving, setIsSaving] = useState(false);
  const { toast, showToast, Toast: ToastComp } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setQuestions(await adminService.getQuestions());
    } catch { setError('Failed to load questions'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newQuestion.text.trim()) return;
    setIsSaving(true);
    try {
      await adminService.createQuestion({
        text: newQuestion.text.trim(),
        section: newQuestion.section,
        riasecType: newQuestion.riasecType,
        order: newQuestion.order ? Number(newQuestion.order) : undefined,
      });
      setNewQuestion(EMPTY_Q);
      await load();
      showToast('Question added');
    } catch { showToast('Failed to add question', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleSave = async () => {
    if (!editingQuestion) return;
    setIsSaving(true);
    try {
      await adminService.updateQuestion(editingQuestion.id, {
        text: editingQuestion.text,
        section: editingQuestion.section,
        riasecType: editingQuestion.riasecType,
        order: editingQuestion.order ? Number(editingQuestion.order) : undefined,
      });
      setEditingQuestion(null);
      await load();
      showToast('Question updated');
    } catch { showToast('Failed to update question', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await adminService.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      showToast('Question deleted');
    } catch { showToast('Failed to delete question', 'error'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      await adminService.importQuestions(text);
      await load();
      showToast('Questions imported successfully');
    } catch (err) { showToast(err.response?.data?.message || 'Import failed', 'error'); }
    e.target.value = '';
  };

  const columns = [
    { key: 'order', header: '#', sortable: true, width: 'w-12', render: (q, idx) => <span className="text-xs" style={{ color: GOV.textMuted }}>{q.order ?? '–'}</span> },
    { key: 'section', header: 'Section', sortable: true, render: (q) => <span className="text-xs capitalize" style={{ color: GOV.textMuted }}>{q.section?.replace('_', ' ')}</span> },
    { key: 'riasecType', header: 'RIASEC', sortable: true, width: 'w-20', render: (q) => <span className="text-xs font-mono font-bold" style={{ color: GOV.blue }}>{q.riasecType}</span> },
    { key: 'text', header: 'Text', render: (q) => <span className="text-xs" style={{ color: GOV.text }}>{q.text}</span> },
    {
      key: 'actions', header: 'Actions', stopPropagation: true,
      render: (q) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setEditingQuestion({ ...q })} className="p-1 rounded hover:bg-blue-50"><Edit2 className="w-3 h-3" style={{ color: GOV.blue }} /></button>
          <button type="button" onClick={() => handleDelete(q.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-500" /></button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <>
      <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Question Bank ({questions.length} total)</h3>
      <div className="ml-auto flex items-center gap-2">
        <label className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold cursor-pointer" style={{ borderColor: GOV.border, color: GOV.blue }}>
          <Upload className="w-3 h-3" /> Import CSV
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </label>
        <button type="button" onClick={() => adminService.exportQuestions().catch(() => showToast('Export failed', 'error'))} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold" style={{ borderColor: GOV.border, color: GOV.blue }}>
          <Download className="w-3 h-3" /> Export CSV
        </button>
      </div>
    </>
  );

  return (
    <>
      <ToastComp toast={toast} />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
          <DataTable columns={columns} rows={questions} rowKey="id" loading={loading} emptyTitle="No questions loaded" toolbar={toolbar} pageSize={30} stickyHeader />
        </div>

        {/* Add Question Panel */}
        <div className="bg-white rounded-md border p-5" style={{ borderColor: GOV.border }}>
          <h4 className={`${TYPO.cardTitle} mb-4 flex items-center gap-2`} style={{ color: GOV.text }}><Plus className="w-4 h-4" /> Add Question</h4>
          <form className="space-y-3" onSubmit={handleCreate}>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Question Text *</label>
              <textarea className="form-control resize-none" rows={3} style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newQuestion.text} onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Section</label>
                <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newQuestion.section} onChange={e => setNewQuestion({ ...newQuestion, section: e.target.value })}>
                  <option value="activities">Activities</option>
                  <option value="competencies">Competencies</option>
                  <option value="occupations">Occupations</option>
                  <option value="self_estimates">Self Estimates</option>
                </select>
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>RIASEC Type</label>
                <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newQuestion.riasecType} onChange={e => setNewQuestion({ ...newQuestion, riasecType: e.target.value })}>
                  {['R', 'I', 'A', 'S', 'E', 'C'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Order (optional)</label>
              <input type="number" className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newQuestion.order} onChange={e => setNewQuestion({ ...newQuestion, order: e.target.value })} placeholder="e.g. 42" />
            </div>
            <button type="submit" disabled={isSaving} className="w-full text-white py-2 rounded-md text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: GOV.blue }}>
              {isSaving ? 'Saving…' : 'Add Question'}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Edit Question</h3>
              <button type="button" onClick={() => setEditingQuestion(null)}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Question Text *</label>
              <textarea className="form-control resize-none" rows={3} style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingQuestion.text} onChange={e => setEditingQuestion({ ...editingQuestion, text: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Section</label>
                <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingQuestion.section} onChange={e => setEditingQuestion({ ...editingQuestion, section: e.target.value })}>
                  <option value="activities">Activities</option>
                  <option value="competencies">Competencies</option>
                  <option value="occupations">Occupations</option>
                  <option value="self_estimates">Self Estimates</option>
                </select>
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>RIASEC</label>
                <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingQuestion.riasecType} onChange={e => setEditingQuestion({ ...editingQuestion, riasecType: e.target.value })}>
                  {['R', 'I', 'A', 'S', 'E', 'C'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Order</label>
                <input type="number" className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingQuestion.order || ''} onChange={e => setEditingQuestion({ ...editingQuestion, order: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingQuestion(null)} className="flex-1 border rounded-md py-2 text-sm" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Cancel</button>
              <button type="button" onClick={handleSave} disabled={isSaving} className="flex-1 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: GOV.blue }}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminQuestionsPanel;
