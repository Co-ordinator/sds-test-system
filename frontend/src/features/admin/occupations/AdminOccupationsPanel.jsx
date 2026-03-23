import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Upload, Download, Edit2, Trash2, X, CheckCircle2, AlertCircle, CheckCheck } from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { useToast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { adminService } from '../../../services/adminService';
import { PermissionGate } from '../../../context/PermissionContext';

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
  const [selectedOccs, setSelectedOccs] = useState(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleBulkDelete = async () => {
    if (!selectedOccs.size) return;
    if (!window.confirm(`Delete ${selectedOccs.size} occupation(s)?`)) return;
    try {
      await adminService.bulkDeleteOccupations([...selectedOccs]);
      showToast(`${selectedOccs.size} occupation(s) deleted`);
      setSelectedOccs(new Set());
      load();
    } catch { showToast('Bulk delete failed', 'error'); }
  };

  const handleBulkApprove = async () => {
    if (!selectedOccs.size) return;
    try {
      await adminService.bulkApproveOccupations([...selectedOccs]);
      showToast(`${selectedOccs.size} occupation(s) approved`);
      setSelectedOccs(new Set());
      load();
    } catch { showToast('Bulk approve failed', 'error'); }
  };

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

  const pendingCount = occupations.filter(o => o.status === 'pending_review').length;

  const handleApprove = async (occ) => {
    try {
      await adminService.reviewOccupation(occ.id, { status: 'approved' });
      await load();
      showToast(`"${occ.name}" approved`);
    } catch { showToast('Failed to approve', 'error'); }
  };

  const columns = [
    {
      key: 'name', header: 'Name', sortable: true,
      render: (o) => <span className="text-xs font-medium" style={{ color: GOV.text }}>{o.name}</span>
    },
    { key: 'category', header: 'Category', sortable: true, render: (o) => <span className="text-xs" style={{ color: GOV.textMuted }}>{o.category || '–'}</span> },
    { key: 'primaryRiasec', header: 'RIASEC', sortable: true, width: 'w-20', render: (o) => <span className="text-xs font-mono font-bold" style={{ color: GOV.blue }}>{o.primaryRiasec || '–'}</span> },
    { key: 'demandLevel', header: 'Demand', sortable: true, render: (o) => <span className="text-xs capitalize" style={{ color: GOV.textMuted }}>{o.demandLevel || '–'}</span> },
    {
      key: 'status', header: 'Status', sortable: true, width: 'w-24',
      render: (o) => (
        o.status === 'pending_review'
          ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}><AlertCircle className="w-3 h-3" />Pending</span>
          : <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#dcfce7', color: '#166534' }}><CheckCircle2 className="w-3 h-3" />Approved</span>
      )
    },
    {
      key: 'actions', header: '', stopPropagation: true, width: 'w-10', align: 'right',
      render: (o) => (
        <ActionMenu actions={[
          o.status === 'pending_review' && { label: 'Approve', Icon: CheckCheck, onClick: () => handleApprove(o) },
          { label: 'Edit', Icon: Edit2, onClick: () => setEditingOcc({ ...o }) },
          { label: 'Delete', Icon: Trash2, onClick: () => handleDelete(o.id), danger: true },
        ]} />
      ),
    },
  ];

  const toolbar = (
    <>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: GOV.textMuted }} />
        <input className="form-control-with-icon pl-7 text-xs w-44" style={{ borderBottomColor: GOV.border, color: GOV.text }} placeholder="Search occupations…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <span className="text-xs" style={{ color: GOV.textMuted }}>{occupations.length} total{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}</span>
      <div className="ml-auto flex gap-2">
        <PermissionGate permission="occupations.import">
          <label className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold cursor-pointer" style={{ borderColor: GOV.border, color: GOV.blue }}>
            <Upload className="w-3 h-3" /> Import
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
        </PermissionGate>
        <PermissionGate permission="occupations.export">
          <button type="button" onClick={() => adminService.exportOccupations().catch(() => showToast('Export failed', 'error'))} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold" style={{ borderColor: GOV.border, color: GOV.blue }}>
            <Download className="w-3 h-3" /> Export
          </button>
        </PermissionGate>
        <PermissionGate permission="occupations.create">
          <button type="button" onClick={() => setShowCreateDialog(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white" style={{ backgroundColor: GOV.blue }}>
            <Plus className="w-3.5 h-3.5" /> Add Occupation
          </button>
        </PermissionGate>
      </div>
    </>
  );

  return (
    <>
      <ToastComp toast={toast} />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={columns} rows={filtered} rowKey="id" loading={loading}
          emptyTitle="No occupations found" toolbar={toolbar} pageSize={7} stickyHeader
          selectable selectedIds={selectedOccs} onSelectionChange={setSelectedOccs}
          bulkActions={
            <>
              <PermissionGate permission="occupations.update">
                <button type="button" onClick={handleBulkApprove} className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-white" style={{ backgroundColor: '#16a34a' }}>
                  <CheckCircle2 className="w-3 h-3" /> Approve
                </button>
              </PermissionGate>
              <PermissionGate permission="occupations.delete">
                <button type="button" onClick={handleBulkDelete} className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-white bg-red-600">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </PermissionGate>
            </>
          }
        />
      </div>

      {/* ── Add Occupation Dialog ── */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <div>
                <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Add Occupation</h3>
                <p className="text-xs mt-0.5" style={{ color: GOV.textMuted }}>Fill in the details to add a new occupation</p>
              </div>
              <button type="button" onClick={() => { setShowCreateDialog(false); setNewOcc(EMPTY_OCC); }}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <form className="flex-1 overflow-y-auto p-5 space-y-3" onSubmit={async (e) => { await handleCreate(e); setShowCreateDialog(false); }}>
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
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowCreateDialog(false); setNewOcc(EMPTY_OCC); }} className="flex-1 border rounded-md py-2 text-xs" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 text-white py-2 rounded-md text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: GOV.blue }}>
                  {isSaving ? 'Saving…' : 'Add Occupation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
