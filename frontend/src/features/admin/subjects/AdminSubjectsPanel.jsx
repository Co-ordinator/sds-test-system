import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Upload, Download, Edit2, Trash2, X, FileText } from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { useToast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';
import { PermissionGate } from '../../../context/PermissionContext';

const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'];
const LEVELS = [
  { value: 'high_school', label: 'High School' },
  { value: 'tertiary', label: 'Tertiary' },
  { value: 'both', label: 'Both' },
];

const EMPTY = { name: '', riasecCodes: [], description: '', level: 'high_school', isActive: true, displayOrder: 0 };

const CodePills = ({ codes, onChange }) => (
  <div className="flex flex-wrap gap-1.5 mt-1">
    {RIASEC.map(c => (
      <button
        key={c}
        type="button"
        onClick={() => onChange(codes.includes(c) ? codes.filter(x => x !== c) : [...codes, c])}
        className="w-7 h-7 rounded-full text-xs font-bold border-2 transition-colors"
        style={codes.includes(c)
          ? { backgroundColor: GOV.blue, borderColor: GOV.blue, color: '#fff' }
          : { backgroundColor: '#fff', borderColor: GOV.border, color: GOV.textMuted }}
      >{c}</button>
    ))}
  </div>
);

const SubjectForm = ({ value, onChange, onSubmit, submitLabel, saving }) => (
  <form className="space-y-3" onSubmit={onSubmit}>
    <div>
      <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Name *</label>
      <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }}
        value={value.name} onChange={e => onChange({ ...value, name: e.target.value })}
        required placeholder="e.g. Mathematics" />
    </div>
    <div>
      <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>RIASEC Codes</label>
      <CodePills codes={value.riasecCodes || []} onChange={codes => onChange({ ...value, riasecCodes: codes })} />
      <p className="text-xs mt-1" style={{ color: GOV.textHint }}>Select codes this subject maps to</p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Level</label>
        <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }}
          value={value.level} onChange={e => onChange({ ...value, level: e.target.value })}>
          {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
      <div>
        <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Display Order</label>
        <input type="number" className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }}
          value={value.displayOrder} onChange={e => onChange({ ...value, displayOrder: Number(e.target.value) })}
          min={0} />
      </div>
    </div>
    <div>
      <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Description</label>
      <textarea className="form-control resize-none" rows={2}
        style={{ borderBottomColor: GOV.border, color: GOV.text }}
        value={value.description} onChange={e => onChange({ ...value, description: e.target.value })}
        placeholder="Optional description…" />
    </div>
    <div className="flex items-center gap-2">
      <input type="checkbox" id="isActive" checked={value.isActive}
        onChange={e => onChange({ ...value, isActive: e.target.checked })} />
      <label htmlFor="isActive" className={TYPO.label} style={{ color: GOV.text }}>Active</label>
    </div>
    <button type="submit" disabled={saving}
      className="w-full text-white py-2 rounded-md text-sm font-semibold disabled:opacity-50"
      style={{ backgroundColor: GOV.blue }}>
      {saving ? 'Saving…' : submitLabel}
    </button>
  </form>
);

const AdminSubjectsPanel = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  const [newSubject, setNewSubject] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast, showToast, Toast: ToastComp } = useToast();

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSubjects(await adminService.getSubjects()); }
    catch { setError('Failed to load subjects'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? subjects.filter(s => `${s.name} ${(s.riasecCodes || []).join('')}`.toLowerCase().includes(search.toLowerCase()))
    : subjects;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    setIsSaving(true);
    try {
      await adminService.createSubject(newSubject);
      setNewSubject(EMPTY);
      await load();
      showToast('Subject created');
    } catch { showToast('Failed to create subject', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;
    setIsSaving(true);
    try {
      await adminService.updateSubject(editingSubject.id, editingSubject);
      setEditingSubject(null);
      await load();
      showToast('Subject updated');
    } catch { showToast('Failed to update subject', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await adminService.deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      showToast('Subject deleted');
    } catch { showToast('Failed to delete subject', 'error'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const result = await adminService.importSubjects(text);
      const { created = 0, updated = 0, skipped = 0 } = result?.data || {};
      setImportResult({ created, updated, skipped });
      await load();
      showToast(`Import complete: ${created} created, ${updated} updated`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Import failed', 'error');
    }
    e.target.value = '';
  };

  const handleExport = async () => {
    try { await adminService.exportSubjects(); }
    catch { showToast('Export failed', 'error'); }
  };

  const downloadTemplate = () => {
    const csv = 'name,riasecCodes,description,level,isActive,displayOrder\nMathematics,R|I|E|C,,high_school,true,1\nBiology,I|S,,both,true,2';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'subjects_template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'name', header: 'Subject', sortable: true,
      render: s => <span className="text-xs font-medium" style={{ color: GOV.text }}>{s.name}</span>
    },
    {
      key: 'riasecCodes', header: 'RIASEC', sortable: false,
      render: s => (
        <div className="flex gap-1">
          {(s.riasecCodes || []).map(c => (
            <span key={c} className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: GOV.blue, fontSize: '10px' }}>{c}</span>
          ))}
          {(!s.riasecCodes?.length) && <span className="text-xs" style={{ color: GOV.textHint }}>–</span>}
        </div>
      )
    },
    {
      key: 'level', header: 'Level', sortable: true,
      render: s => <span className="text-xs capitalize" style={{ color: GOV.textMuted }}>{(s.level || '').replace('_', ' ')}</span>
    },
    {
      key: 'isActive', header: 'Status', sortable: true, width: 'w-20',
      render: s => s.isActive
        ? <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Active</span>
        : <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>Inactive</span>
    },
    { key: 'displayOrder', header: 'Order', sortable: true, width: 'w-16', render: s => <span className="text-xs" style={{ color: GOV.textMuted }}>{s.displayOrder}</span> },
    {
      key: 'actions', header: '', stopPropagation: true, width: 'w-10', align: 'right',
      render: s => (
        <ActionMenu actions={[
          { label: 'Edit', Icon: Edit2, onClick: () => setEditingSubject({ ...s, riasecCodes: s.riasecCodes || [] }) },
          { label: 'Delete', Icon: Trash2, onClick: () => handleDelete(s.id), danger: true },
        ]} />
      )
    },
  ];

  const toolbar = (
    <>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: GOV.textMuted }} />
        <input className="form-control-with-icon pl-7 text-xs w-44"
          style={{ borderBottomColor: GOV.border, color: GOV.text }}
          placeholder="Search subjects…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <span className="text-xs" style={{ color: GOV.textMuted }}>{subjects.length} total</span>
      <div className="ml-auto flex gap-2">
        <PermissionGate permission="subjects.import">
          <button type="button" onClick={downloadTemplate}
            className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold"
            style={{ borderColor: GOV.border, color: GOV.textMuted }}>
            <FileText className="w-3 h-3" /> Template
          </button>
          <label className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold cursor-pointer"
            style={{ borderColor: GOV.border, color: GOV.blue }}>
            <Upload className="w-3 h-3" /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
        </PermissionGate>
        <PermissionGate permission="subjects.export">
          <button type="button" onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold"
            style={{ borderColor: GOV.border, color: GOV.blue }}>
            <Download className="w-3 h-3" /> Export
          </button>
        </PermissionGate>
        <PermissionGate permission="subjects.create">
          <button type="button" onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white"
            style={{ backgroundColor: GOV.blue }}>
            <Plus className="w-3.5 h-3.5" /> Add Subject
          </button>
        </PermissionGate>
      </div>
    </>
  );

  return (
    <>
      <ToastComp toast={toast} />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      {importResult && (
        <div className="mb-4 p-3 rounded-md border text-xs flex items-center gap-4"
          style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}>
          <span className="font-semibold">Import complete:</span>
          <span>{importResult.created} created</span>
          <span>{importResult.updated} updated</span>
          {importResult.skipped > 0 && <span>{importResult.skipped} skipped</span>}
          <button type="button" onClick={() => setImportResult(null)} className="ml-auto">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable columns={columns} rows={filtered} rowKey="id" loading={loading}
          emptyTitle="No subjects found" toolbar={toolbar} pageSize={7} stickyHeader />
      </div>

      {/* ── Add Subject Dialog ── */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <div>
                <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Add Subject</h3>
                <p className="text-xs mt-0.5" style={{ color: GOV.textMuted }}>Map a new subject to RIASEC career codes</p>
              </div>
              <button type="button" onClick={() => { setShowCreateDialog(false); setNewSubject(EMPTY); }}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <SubjectForm
                value={newSubject}
                onChange={setNewSubject}
                onSubmit={async (e) => { await handleCreate(e); setShowCreateDialog(false); }}
                submitLabel="Add Subject"
                saving={isSaving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Edit Subject</h3>
              <button type="button" onClick={() => setEditingSubject(null)}>
                <X className="w-4 h-4" style={{ color: GOV.textMuted }} />
              </button>
            </div>
            <SubjectForm value={editingSubject} onChange={setEditingSubject} onSubmit={handleSave}
              submitLabel="Save Changes" saving={isSaving} />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSubjectsPanel;
