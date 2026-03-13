import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, GraduationCap } from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { useToast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';
import { PermissionGate } from '../../../context/PermissionContext';

const EMPTY = { level: '', description: '' };

const LevelForm = ({ value, onChange, onSubmit, submitLabel, saving }) => (
  <form className="space-y-3" onSubmit={onSubmit}>
    <div>
      <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Level Number *</label>
      <input type="number" className="form-control" min={1} max={20}
        value={value.level} onChange={e => onChange({ ...value, level: e.target.value })}
        required placeholder="e.g. 1 = Grade 1, 12 = Grade 12, 13 = Certificate…" />
      <p className="text-xs mt-1" style={{ color: GOV.textHint }}>Integer used for sorting and matching (e.g. 12 = SGCSE, 16 = Bachelor's)</p>
    </div>
    <div>
      <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Description *</label>
      <input className="form-control" value={value.description}
        onChange={e => onChange({ ...value, description: e.target.value })}
        required placeholder="e.g. Grade 12 / SGCSE Level" />
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

const AdminEducationLevelsPanel = () => {
  const { toast } = useToast();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setLevels(await adminService.getEducationLevels()); }
    catch { setError('Failed to load education levels'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (l) => { setForm({ level: l.level, description: l.description }); setEditing(l); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) {
        await adminService.updateEducationLevel(editing.id, { level: Number(form.level), description: form.description });
        toast('Education level updated', 'success');
      } else {
        await adminService.createEducationLevel({ level: Number(form.level), description: form.description });
        toast('Education level created', 'success');
      }
      closeForm(); load();
    } catch (err) { toast(err.response?.data?.message || 'Save failed', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id, desc) => {
    if (!window.confirm(`Delete education level "${desc}"? This cannot be undone.`)) return;
    try { await adminService.deleteEducationLevel(id); toast('Deleted', 'success'); load(); }
    catch (err) { toast(err.response?.data?.message || 'Delete failed', 'error'); }
  };

  return (
    <>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>
                {editing ? 'Edit Education Level' : 'New Education Level'}
              </h3>
              <button type="button" onClick={closeForm}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <div className="p-5">
              <LevelForm value={form} onChange={setForm} onSubmit={handleSubmit}
                submitLabel={editing ? 'Save Changes' : 'Create Level'} saving={saving} />
            </div>
          </div>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={[
            {
              key: 'level', header: 'Level', sortable: true,
              render: l => (
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: GOV.blue, color: '#fff' }}>{l.level}</span>
              )
            },
            {
              key: 'description', header: 'Description',
              render: l => <span className="text-xs font-medium" style={{ color: GOV.text }}>{l.description}</span>
            },
            {
              key: 'id', header: 'ID',
              render: l => <span className="text-[10px] font-mono" style={{ color: GOV.textMuted }}>{l.id?.slice(0, 8)}…</span>
            },
            {
              key: 'actions', header: '', stopPropagation: true, width: 'w-10', align: 'right',
              render: l => (
                <ActionMenu actions={[
                  { label: 'Edit', Icon: Edit2, onClick: () => openEdit(l) },
                  { label: 'Delete', Icon: Trash2, onClick: () => handleDelete(l.id, l.description), danger: true },
                ]} />
              )
            }
          ]}
          rows={levels}
          rowKey="id"
          loading={loading}
          emptyTitle="No education levels"
          emptyMessage="Education levels map grade/qualification text to numeric tiers used across the knowledge graph."
          pageSize={20}
          toolbar={
            <div className="flex items-center gap-2 w-full">
              <GraduationCap className="w-4 h-4" style={{ color: GOV.blue }} />
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Education Levels</h3>
              <div className="ml-auto">
                <PermissionGate permission="courses.create">
                  <button type="button" onClick={openCreate}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold text-white" style={{ backgroundColor: GOV.blue }}>
                    <Plus className="w-3 h-3 inline mr-1" />Add Level
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

export default AdminEducationLevelsPanel;
