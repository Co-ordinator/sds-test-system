import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Upload, Download, Edit2, Trash2, X } from 'lucide-react';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { useToast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';

const EMPTY_OCC = { name: '', category: '', primaryRiasec: 'R', demandLevel: 'medium', description: '' };

const AdminOccupationsPanel = () => {
  const [occupations, setOccupations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [editingOcc, setEditingOcc] = useState(null);
  const [newOcc, setNewOcc] = useState(EMPTY_OCC);
  const [isSaving, setIsSaving] = useState(false);
  const { toast, showToast, Toast: ToastComp } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOccupations(await adminService.getOccupations());
    } catch { setError('Failed to load occupations'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? occupations.filter(o => `${o.name} ${o.category || ''}`.toLowerCase().includes(search.toLowerCase()))
    : occupations;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newOcc.name.trim()) return;
    setIsSaving(true);
    try {
      await adminService.createOccupation(newOcc);
      setNewOcc(EMPTY_OCC);
      await load();
      showToast('Occupation created');
    } catch { showToast('Failed to create occupation', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleSave = async () => {
    if (!editingOcc) return;
    setIsSaving(true);
    try {
      await adminService.updateOccupation(editingOcc.id, editingOcc);
      setEditingOcc(null);
      await load();
      showToast('Occupation updated');
    } catch { showToast('Failed to update occupation', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this occupation?')) return;
    try {
      await adminService.deleteOccupation(id);
      setOccupations(prev => prev.filter(o => o.id !== id));
      showToast('Occupation deleted');
    } catch { showToast('Failed to delete occupation', 'error'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      await adminService.importOccupations(text);
      await load();
      showToast('Occupations imported');
    } catch (err) { showToast(err.response?.data?.message || 'Import failed', 'error'); }
    e.target.value = '';
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true, render: (o) => <span className="text-xs font-medium" style={{ color: GOV.text }}>{o.name}</span> },
    { key: 'category', header: 'Category', sortable: true, render: (o) => <span className="text-xs" style={{ color: GOV.textMuted }}>{o.category || '–'}</span> },
    { key: 'primaryRiasec', header: 'RIASEC', sortable: true, width: 'w-20', render: (o) => <span className="text-xs font-mono font-bold" style={{ color: GOV.blue }}>{o.primaryRiasec || '–'}</span> },
    { key: 'demandLevel', header: 'Demand', sortable: true, render: (o) => <span className="text-xs capitalize" style={{ color: GOV.textMuted }}>{o.demandLevel || '–'}</span> },
    {
      key: 'actions', header: 'Actions', stopPropagation: true,
      render: (o) => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setEditingOcc({ ...o })} className="p-1 rounded hover:bg-blue-50"><Edit2 className="w-3 h-3" style={{ color: GOV.blue }} /></button>
          <button type="button" onClick={() => handleDelete(o.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-3 h-3 text-red-500" /></button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <>
      <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Occupations ({occupations.length} total)</h3>
      <div className="relative ml-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: GOV.textMuted }} />
        <input className="form-control-with-icon pl-7 text-xs w-44" style={{ borderBottomColor: GOV.border, color: GOV.text }} placeholder="Search occupations…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="ml-auto flex gap-2">
        <label className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold cursor-pointer" style={{ borderColor: GOV.border, color: GOV.blue }}>
          <Upload className="w-3 h-3" /> Import
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </label>
        <button type="button" onClick={() => adminService.exportOccupations().catch(() => showToast('Export failed', 'error'))} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold" style={{ borderColor: GOV.border, color: GOV.blue }}>
          <Download className="w-3 h-3" /> Export
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
          <DataTable columns={columns} rows={filtered} rowKey="id" loading={loading} emptyTitle="No occupations found" toolbar={toolbar} pageSize={25} stickyHeader />
        </div>

        {/* Add Occupation Panel */}
        <div className="bg-white rounded-md border p-5" style={{ borderColor: GOV.border }}>
          <h4 className={`${TYPO.cardTitle} mb-4 flex items-center gap-2`} style={{ color: GOV.text }}><Plus className="w-4 h-4" /> Add Occupation</h4>
          <form className="space-y-3" onSubmit={handleCreate}>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Name *</label>
              <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newOcc.name} onChange={e => setNewOcc({ ...newOcc, name: e.target.value })} required placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Category</label>
              <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newOcc.category} onChange={e => setNewOcc({ ...newOcc, category: e.target.value })} placeholder="e.g. Technology" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Primary RIASEC</label>
                <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newOcc.primaryRiasec} onChange={e => setNewOcc({ ...newOcc, primaryRiasec: e.target.value })}>
                  {['R', 'I', 'A', 'S', 'E', 'C'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Demand Level</label>
                <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newOcc.demandLevel} onChange={e => setNewOcc({ ...newOcc, demandLevel: e.target.value })}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Description</label>
              <textarea className="form-control resize-none" rows={2} style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newOcc.description} onChange={e => setNewOcc({ ...newOcc, description: e.target.value })} placeholder="Brief description…" />
            </div>
            <button type="submit" disabled={isSaving} className="w-full text-white py-2 rounded-md text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: GOV.blue }}>
              {isSaving ? 'Saving…' : 'Add Occupation'}
            </button>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      {editingOcc && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Edit Occupation</h3>
              <button type="button" onClick={() => setEditingOcc(null)}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Name *</label>
              <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingOcc.name || ''} onChange={e => setEditingOcc({ ...editingOcc, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Category</label>
                <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingOcc.category || ''} onChange={e => setEditingOcc({ ...editingOcc, category: e.target.value })} />
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Primary RIASEC</label>
                <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingOcc.primaryRiasec || 'R'} onChange={e => setEditingOcc({ ...editingOcc, primaryRiasec: e.target.value })}>
                  {['R', 'I', 'A', 'S', 'E', 'C'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Demand Level</label>
              <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingOcc.demandLevel || 'medium'} onChange={e => setEditingOcc({ ...editingOcc, demandLevel: e.target.value })}>
                <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Description</label>
              <textarea className="form-control resize-none" rows={2} style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingOcc.description || ''} onChange={e => setEditingOcc({ ...editingOcc, description: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingOcc(null)} className="flex-1 border rounded-md py-2 text-sm" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Cancel</button>
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

export default AdminOccupationsPanel;
