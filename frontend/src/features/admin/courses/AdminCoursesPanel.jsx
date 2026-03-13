import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Search, Upload, Download, Edit2, Trash2, X,
  Link, Unlink, BookOpen, Building2, Briefcase, ChevronDown, ChevronUp
} from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { useToast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';
import { PermissionGate } from '../../../context/PermissionContext';

const QUAL_TYPES = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'honours', label: 'Honours' },
  { value: 'postgrad_diploma', label: 'Postgrad Diploma' },
  { value: 'masters', label: "Master's" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'short_course', label: 'Short Course' },
  { value: 'tvet', label: 'TVET' },
  { value: 'other', label: 'Other' },
];

const RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'];

const EMPTY_COURSE = {
  name: '', nameSwati: '', qualificationType: 'bachelor', durationYears: '',
  description: '', riasecCodes: [], suggestedSubjects: '', fieldOfStudy: '', isActive: true
};

const CodePills = ({ codes = [], onChange }) => (
  <div className="flex flex-wrap gap-1.5 mt-1">
    {RIASEC.map(c => (
      <button key={c} type="button"
        onClick={() => onChange(codes.includes(c) ? codes.filter(x => x !== c) : [...codes, c])}
        className="w-7 h-7 rounded-full text-xs font-bold border-2 transition-colors"
        style={codes.includes(c)
          ? { backgroundColor: GOV.blue, borderColor: GOV.blue, color: '#fff' }
          : { backgroundColor: '#fff', borderColor: GOV.border, color: GOV.textMuted }}
      >{c}</button>
    ))}
  </div>
);

const QualBadge = ({ type }) => {
  const label = QUAL_TYPES.find(q => q.value === type)?.label || type;
  const colors = {
    bachelor: { bg: '#eff6ff', text: '#1d4ed8' }, masters: { bg: '#f5f3ff', text: '#7c3aed' },
    doctorate: { bg: '#fdf4ff', text: '#9d174d' }, diploma: { bg: '#ecfdf5', text: '#065f46' },
    certificate: { bg: '#fff7ed', text: '#c2410c' }, honours: { bg: '#f0f9ff', text: '#0369a1' },
    tvet: { bg: '#fef9c3', text: '#854d0e' }, short_course: { bg: '#f0fdf4', text: '#166534' },
  };
  const s = colors[type] || { bg: GOV.surface, text: GOV.textMuted };
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}>{label}</span>
  );
};

/* ── Course Form ─────────────────────────────────────────────────────────── */
const CourseForm = ({ value, onChange, onSubmit, submitLabel, saving }) => (
  <form className="space-y-3" onSubmit={onSubmit}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Name *</label>
        <input className="form-control" value={value.name}
          onChange={e => onChange({ ...value, name: e.target.value })}
          required placeholder="e.g. Bachelor of Computer Science" />
      </div>
      <div>
        <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Name (Swati)</label>
        <input className="form-control" value={value.nameSwati}
          onChange={e => onChange({ ...value, nameSwati: e.target.value })}
          placeholder="siSwati name (optional)" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Qualification Type *</label>
        <select className="form-control" value={value.qualificationType}
          onChange={e => onChange({ ...value, qualificationType: e.target.value })} required>
          {QUAL_TYPES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
        </select>
      </div>
      <div>
        <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Duration (years)</label>
        <input type="number" className="form-control" value={value.durationYears} min="0" max="10" step="0.5"
          onChange={e => onChange({ ...value, durationYears: e.target.value })} placeholder="e.g. 4" />
      </div>
    </div>
    <div>
      <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Field of Study</label>
      <input className="form-control" value={value.fieldOfStudy}
        onChange={e => onChange({ ...value, fieldOfStudy: e.target.value })}
        placeholder="e.g. Computer Science, Engineering" />
    </div>
    <div>
      <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Description</label>
      <textarea className="form-control" rows={2} value={value.description}
        onChange={e => onChange({ ...value, description: e.target.value })}
        placeholder="Brief description of this course" />
    </div>
    <div>
      <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>RIASEC Codes</label>
      <CodePills codes={value.riasecCodes || []} onChange={codes => onChange({ ...value, riasecCodes: codes })} />
      <p className="text-xs mt-1" style={{ color: GOV.textHint }}>Select which RIASEC types this course suits</p>
    </div>
    <div>
      <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Suggested Subjects (pipe-separated)</label>
      <input className="form-control" value={value.suggestedSubjects}
        onChange={e => onChange({ ...value, suggestedSubjects: e.target.value })}
        placeholder="e.g. Mathematics|Physics|Computer Studies" />
    </div>
    <div className="flex items-center gap-2 pt-1">
      <input type="checkbox" id="isActiveCourse" checked={value.isActive}
        onChange={e => onChange({ ...value, isActive: e.target.checked })} className="w-4 h-4" />
      <label htmlFor="isActiveCourse" className={TYPO.label} style={{ color: GOV.text }}>Active</label>
    </div>
    <div className="flex justify-end pt-2">
      <button type="submit" disabled={saving}
        className="px-5 py-2 rounded-md text-sm font-semibold text-white"
        style={{ backgroundColor: GOV.blue, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : submitLabel}
      </button>
    </div>
  </form>
);

/* ── Course Detail Drawer ─────────────────────────────────────────────────── */
const CourseDetailDrawer = ({ course, onClose, onRefresh }) => {
  const { toast } = useToast();
  const [tab, setTab] = useState('requirements');
  const [institutions, setInstitutions] = useState([]);
  const [occupations, setOccupations] = useState([]);
  const [reqForm, setReqForm] = useState({ subject: '', minimumGrade: '', isMandatory: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getInstitutions().then(setInstitutions).catch(() => {});
    adminService.getOccupations().then(setOccupations).catch(() => {});
  }, []);

  const addReq = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.addCourseRequirement(course.id, reqForm);
      setReqForm({ subject: '', minimumGrade: '', isMandatory: true });
      toast('Requirement added', 'success');
      onRefresh();
    } catch { toast('Failed to add requirement', 'error'); }
    setSaving(false);
  };

  const removeReq = async (reqId) => {
    try {
      await adminService.removeCourseRequirement(course.id, reqId);
      toast('Requirement removed', 'success');
      onRefresh();
    } catch { toast('Failed to remove requirement', 'error'); }
  };

  const linkInst = async (institutionId) => {
    try {
      await adminService.linkCourseInstitution(course.id, { institutionId });
      toast('Institution linked', 'success');
      onRefresh();
    } catch { toast('Failed to link institution', 'error'); }
  };

  const unlinkInst = async (institutionId) => {
    try {
      await adminService.unlinkCourseInstitution(course.id, institutionId);
      toast('Institution unlinked', 'success');
      onRefresh();
    } catch { toast('Failed to unlink institution', 'error'); }
  };

  const linkOcc = async (occupationId) => {
    try {
      await adminService.linkCourseOccupation(course.id, { occupationId, isPrimaryPathway: false });
      toast('Occupation linked', 'success');
      onRefresh();
    } catch { toast('Failed to link occupation', 'error'); }
  };

  const unlinkOcc = async (occupationId) => {
    try {
      await adminService.unlinkCourseOccupation(course.id, occupationId);
      toast('Occupation unlinked', 'success');
      onRefresh();
    } catch { toast('Failed to unlink occupation', 'error'); }
  };

  const linkedInstIds = new Set((course.institutions || []).map(i => i.id));
  const linkedOccIds = new Set((course.occupations || []).map(o => o.id));
  const tabs = [
    { key: 'requirements', label: 'Requirements', icon: BookOpen },
    { key: 'institutions', label: 'Institutions', icon: Building2 },
    { key: 'occupations', label: 'Occupations', icon: Briefcase },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
          <div>
            <p className="text-sm font-bold" style={{ color: GOV.text }}>{course.name}</p>
            <div className="mt-1"><QualBadge type={course.qualificationType} /></div>
          </div>
          <button type="button" onClick={onClose}><X className="w-5 h-5" style={{ color: GOV.textMuted }} /></button>
        </div>
        <div className="flex border-b" style={{ borderColor: GOV.border }}>
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors"
              style={{ borderBottomColor: tab === t.key ? GOV.blue : 'transparent', color: tab === t.key ? GOV.blue : GOV.textMuted }}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'requirements' && (
            <>
              <form onSubmit={addReq} className="flex gap-2 flex-wrap">
                <input className="form-control flex-1 min-w-[120px]" placeholder="Subject" required
                  value={reqForm.subject} onChange={e => setReqForm(f => ({ ...f, subject: e.target.value }))} />
                <input className="form-control w-24" placeholder="Min. Grade" required
                  value={reqForm.minimumGrade} onChange={e => setReqForm(f => ({ ...f, minimumGrade: e.target.value }))} />
                <button type="submit" disabled={saving}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: GOV.blue }}>
                  <Plus className="w-3.5 h-3.5 inline mr-1" />Add
                </button>
              </form>
              <div className="space-y-1.5">
                {(course.requirements || []).length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: GOV.textMuted }}>No requirements defined</p>
                )}
                {(course.requirements || []).map(r => (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded border text-xs"
                    style={{ borderColor: GOV.border }}>
                    <span style={{ color: GOV.text }}><strong>{r.subject}</strong> — min. {r.minimumGrade}
                      {r.isMandatory && <span className="ml-2 text-red-600">(mandatory)</span>}
                    </span>
                    <button type="button" onClick={() => removeReq(r.id)} title="Remove">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: GOV.danger || '#dc2626' }} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === 'institutions' && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold mb-2" style={{ color: GOV.textMuted }}>Linked institutions</p>
              {(course.institutions || []).map(inst => (
                <div key={inst.id} className="flex items-center justify-between px-3 py-2 rounded border text-xs"
                  style={{ borderColor: GOV.border }}>
                  <span style={{ color: GOV.text }}>{inst.name}</span>
                  <button type="button" onClick={() => unlinkInst(inst.id)} title="Unlink">
                    <Unlink className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
                  </button>
                </div>
              ))}
              {(course.institutions || []).length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: GOV.textMuted }}>No institutions linked</p>
              )}
              <p className="text-xs font-semibold mt-4 mb-2" style={{ color: GOV.textMuted }}>Available institutions</p>
              {institutions.filter(i => !linkedInstIds.has(i.id)).map(inst => (
                <div key={inst.id} className="flex items-center justify-between px-3 py-2 rounded border text-xs"
                  style={{ borderColor: GOV.border, backgroundColor: GOV.surface }}>
                  <span style={{ color: GOV.text }}>{inst.name}</span>
                  <button type="button" onClick={() => linkInst(inst.id)} title="Link"
                    className="text-xs font-semibold" style={{ color: GOV.blue }}>
                    <Link className="w-3.5 h-3.5 inline mr-0.5" />Link
                  </button>
                </div>
              ))}
            </div>
          )}
          {tab === 'occupations' && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold mb-2" style={{ color: GOV.textMuted }}>Linked occupations</p>
              {(course.occupations || []).map(occ => (
                <div key={occ.id} className="flex items-center justify-between px-3 py-2 rounded border text-xs"
                  style={{ borderColor: GOV.border }}>
                  <span style={{ color: GOV.text }}>{occ.name}
                    <span className="ml-1.5 text-[10px] font-mono" style={{ color: GOV.textMuted }}>({occ.primaryRiasec})</span>
                  </span>
                  <button type="button" onClick={() => unlinkOcc(occ.id)} title="Unlink">
                    <Unlink className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
                  </button>
                </div>
              ))}
              {(course.occupations || []).length === 0 && (
                <p className="text-xs text-center py-3" style={{ color: GOV.textMuted }}>No occupations linked</p>
              )}
              <p className="text-xs font-semibold mt-4 mb-2" style={{ color: GOV.textMuted }}>Available occupations</p>
              {occupations.filter(o => !linkedOccIds.has(o.id)).slice(0, 50).map(occ => (
                <div key={occ.id} className="flex items-center justify-between px-3 py-2 rounded border text-xs"
                  style={{ borderColor: GOV.border, backgroundColor: GOV.surface }}>
                  <span style={{ color: GOV.text }}>{occ.name}</span>
                  <button type="button" onClick={() => linkOcc(occ.id)}
                    className="text-xs font-semibold" style={{ color: GOV.blue }}>
                    <Link className="w-3.5 h-3.5 inline mr-0.5" />Link
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main Panel ──────────────────────────────────────────────────────────── */
const AdminCoursesPanel = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [qualFilter, setQualFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [drawerCourse, setDrawerCourse] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminService.getCourses({ search, qualificationType: qualFilter });
      setCourses(data);
    } catch { setError('Failed to load courses'); }
    setLoading(false);
  }, [search, qualFilter]);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (id) => {
    try {
      const c = await adminService.getCourse(id);
      setDrawerCourse(c);
    } catch { toast('Could not load course details', 'error'); }
  };

  const openCreate = () => { setForm(EMPTY_COURSE); setEditingCourse(null); setShowForm(true); };
  const openEdit = (c) => {
    setForm({ ...c, suggestedSubjects: (c.suggestedSubjects || []).join('|'), durationYears: c.durationYears || '' });
    setEditingCourse(c);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingCourse(null); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...form,
        durationYears: form.durationYears !== '' ? Number(form.durationYears) : null,
        suggestedSubjects: typeof form.suggestedSubjects === 'string'
          ? form.suggestedSubjects.split('|').map(s => s.trim()).filter(Boolean)
          : form.suggestedSubjects
      };
      if (editingCourse) {
        await adminService.updateCourse(editingCourse.id, payload);
        toast('Course updated', 'success');
      } else {
        await adminService.createCourse(payload);
        toast('Course created', 'success');
      }
      closeForm(); load();
    } catch (err) { toast(err.response?.data?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try { await adminService.deleteCourse(id); toast('Course deactivated', 'success'); load(); }
    catch { toast('Delete failed', 'error'); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Deactivate ${selectedIds.size} selected courses?`)) return;
    try { await adminService.bulkDeleteCourses([...selectedIds]); toast('Deactivated', 'success'); setSelectedIds(new Set()); load(); }
    catch { toast('Bulk delete failed', 'error'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const result = await adminService.importCourses(text);
      toast(`Import done: ${result.data?.created || 0} created, ${result.data?.updated || 0} updated`, 'success');
      load();
    } catch { toast('Import failed', 'error'); }
    setImporting(false); e.target.value = '';
  };

  return (
    <>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>
                {editingCourse ? 'Edit Course' : 'New Course'}
              </h3>
              <button type="button" onClick={closeForm}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <CourseForm value={form} onChange={setForm} onSubmit={handleSubmit} submitLabel={editingCourse ? 'Save Changes' : 'Create Course'} saving={saving} />
            </div>
          </div>
        </div>
      )}

      {drawerCourse && (
        <CourseDetailDrawer
          course={drawerCourse}
          onClose={() => setDrawerCourse(null)}
          onRefresh={() => loadDetail(drawerCourse.id)}
        />
      )}

      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={[
            {
              key: 'name', header: 'Course', sortable: true,
              render: c => (
                <div>
                  <p className="text-xs font-semibold" style={{ color: GOV.text }}>{c.name}</p>
                  {c.fieldOfStudy && <p className="text-[11px]" style={{ color: GOV.textMuted }}>{c.fieldOfStudy}</p>}
                </div>
              )
            },
            {
              key: 'qualificationType', header: 'Qualification',
              render: c => <QualBadge type={c.qualificationType} />
            },
            {
              key: 'durationYears', header: 'Duration',
              render: c => c.durationYears ? <span className="text-xs" style={{ color: GOV.text }}>{c.durationYears} yr{c.durationYears !== 1 ? 's' : ''}</span> : <span className="text-xs" style={{ color: GOV.textMuted }}>—</span>
            },
            {
              key: 'riasecCodes', header: 'RIASEC',
              render: c => (
                <div className="flex gap-0.5">
                  {(c.riasecCodes || []).map(r => (
                    <span key={r} className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: GOV.blue, color: '#fff' }}>{r}</span>
                  ))}
                  {!(c.riasecCodes || []).length && <span className="text-xs" style={{ color: GOV.textMuted }}>—</span>}
                </div>
              )
            },
            {
              key: 'links', header: 'Links',
              render: c => (
                <div className="flex gap-2 text-[11px]" style={{ color: GOV.textMuted }}>
                  <span><Building2 className="w-3 h-3 inline mr-0.5" />{(c.institutions || []).length}</span>
                  <span><Briefcase className="w-3 h-3 inline mr-0.5" />{(c.occupations || []).length}</span>
                </div>
              )
            },
            {
              key: 'isActive', header: 'Status',
              render: c => <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${c.isActive ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
            },
            {
              key: 'actions', header: '', stopPropagation: true, width: 'w-10', align: 'right',
              render: c => (
                <ActionMenu actions={[
                  { label: 'View Details', Icon: BookOpen, onClick: () => loadDetail(c.id) },
                  { label: 'Edit', Icon: Edit2, onClick: () => openEdit(c) },
                  { label: 'Delete', Icon: Trash2, onClick: () => handleDelete(c.id, c.name), danger: true },
                ]} />
              )
            }
          ]}
          rows={courses}
          rowKey="id"
          loading={loading}
          emptyTitle="No courses"
          emptyMessage="Create your first course or import from CSV."
          pageSize={10}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          toolbar={
            <div className="flex flex-wrap items-center gap-2 w-full">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Courses</h3>
              <div className="relative ml-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
                <input
                  className="pl-7 pr-3 py-1.5 border rounded-md text-xs"
                  style={{ borderColor: GOV.border, color: GOV.text, width: 200 }}
                  placeholder="Search courses…" value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="px-2 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.text }}
                value={qualFilter} onChange={e => setQualFilter(e.target.value)}>
                <option value="">All types</option>
                {QUAL_TYPES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
              <div className="ml-auto flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <button type="button" onClick={handleBulkDelete}
                    className="px-3 py-1.5 border rounded-md text-xs font-semibold"
                    style={{ borderColor: '#fca5a5', color: '#dc2626', backgroundColor: '#fef2f2' }}>
                    <Trash2 className="w-3 h-3 inline mr-1" />Delete ({selectedIds.size})
                  </button>
                )}
                <PermissionGate permission="courses.import">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={importing}
                    className="px-3 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.blue }}>
                    <Upload className="w-3 h-3 inline mr-1" />{importing ? 'Importing…' : 'Import'}
                  </button>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
                </PermissionGate>
                <PermissionGate permission="courses.export">
                  <button type="button" onClick={() => adminService.exportCourses()}
                    className="px-3 py-1.5 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.blue }}>
                    <Download className="w-3 h-3 inline mr-1" />Export
                  </button>
                </PermissionGate>
                <PermissionGate permission="courses.create">
                  <button type="button" onClick={openCreate}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold text-white" style={{ backgroundColor: GOV.blue }}>
                    <Plus className="w-3 h-3 inline mr-1" />Add Course
                  </button>
                </PermissionGate>
              </div>
            </div>
          }
        />
      </div>
    </>
  );
};

export default AdminCoursesPanel;
