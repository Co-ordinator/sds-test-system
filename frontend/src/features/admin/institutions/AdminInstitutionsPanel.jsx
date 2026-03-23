import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Upload, Download, Edit2, Trash2, X, FileText, CheckCircle2, AlertCircle, CheckCheck } from 'lucide-react';
import ActionMenu from '../../../components/ui/ActionMenu';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { useToast, Toast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { useInstitutions } from '../../../hooks/useInstitutions';
import { adminService } from '../../../services/adminService';
import { PermissionGate } from '../../../context/PermissionContext';

const EMPTY_INST = { name: '', type: 'school', region: 'hhohho' };

const AdminInstitutionsPanel = () => {
  const { institutions, loading, error, search, setSearch, load, create, update, remove } = useInstitutions();
  const { toast, showToast, Toast: ToastComp } = useToast();

  const [editingInst, setEditingInst] = useState(null);
  const [newInst, setNewInst] = useState(EMPTY_INST);
  const [isSaving, setIsSaving] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedInsts, setSelectedInsts] = useState(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleBulkDelete = async () => {
    if (!selectedInsts.size) return;
    if (!window.confirm(`Delete ${selectedInsts.size} institution(s)? All linked users will be unlinked.`)) return;
    try {
      await adminService.bulkDeleteInstitutions([...selectedInsts]);
      showToast(`${selectedInsts.size} institution(s) deleted`);
      setSelectedInsts(new Set());
      load();
    } catch { showToast('Bulk delete failed', 'error'); }
  };

  const handleBulkApprove = async () => {
    if (!selectedInsts.size) return;
    try {
      await adminService.bulkApproveInstitutions([...selectedInsts]);
      showToast(`${selectedInsts.size} institution(s) approved`);
      setSelectedInsts(new Set());
      load();
    } catch { showToast('Bulk approve failed', 'error'); }
  };

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newInst.name) return;
    setIsSaving(true);
    try {
      await create(newInst);
      setNewInst(EMPTY_INST);
      showToast('Institution created');
    } catch { showToast('Failed to create institution', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleSave = async () => {
    if (!editingInst) return;
    setIsSaving(true);
    try {
      await update(editingInst.id, { name: editingInst.name, type: editingInst.type, region: editingInst.region });
      setEditingInst(null);
      showToast('Institution updated');
    } catch { showToast('Failed to update institution', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const result = await adminService.importInstitutions(text);
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
    try { await adminService.exportInstitutions(); }
    catch { showToast('Export failed', 'error'); }
  };

  const downloadTemplate = () => {
    const csv = 'name,type,region,district,email,phoneNumber,website,accredited\nSt. Michael\'s High School,school,hhohho,Mbabane,,,,true';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'institutions_template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete institution? All linked users will be unlinked.')) return;
    try {
      await remove(id);
      showToast('Institution deleted');
    } catch { showToast('Failed to delete institution', 'error'); }
  };

  const pendingCount = institutions.filter(i => i.status === 'pending_review').length;

  const filteredInstitutions = institutions.filter(i => {
    if (typeFilter && i.type !== typeFilter) return false;
    if (regionFilter && i.region !== regionFilter) return false;
    if (statusFilter === 'pending' && i.status !== 'pending_review') return false;
    if (statusFilter === 'approved' && i.status === 'pending_review') return false;
    return true;
  });

  const handleApprove = async (inst) => {
    try {
      await adminService.reviewInstitution(inst.id, { status: 'approved' });
      await load();
      showToast(`"${inst.name}" approved`);
    } catch { showToast('Failed to approve', 'error'); }
  };

  const columns = [
    {
      key: 'name', header: 'Name', sortable: true,
      render: (inst) => <span className="font-medium text-xs" style={{ color: GOV.text }}>{inst.name}</span>,
    },
    {
      key: 'type', header: 'Type', sortable: true,
      render: (inst) => <span className="capitalize text-xs" style={{ color: GOV.textMuted }}>{inst.type}</span>,
    },
    {
      key: 'region', header: 'Region', sortable: true,
      render: (inst) => <span className="capitalize text-xs" style={{ color: GOV.textMuted }}>{inst.region || '–'}</span>,
    },
    {
      key: 'status', header: 'Status', sortable: true, width: 'w-24',
      render: (inst) => (
        inst.status === 'pending_review'
          ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}><AlertCircle className="w-3 h-3" />Pending</span>
          : <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#dcfce7', color: '#166534' }}><CheckCircle2 className="w-3 h-3" />Approved</span>
      ),
    },
    {
      key: 'actions', header: '', stopPropagation: true, width: 'w-10', align: 'right',
      render: (inst) => (
        <ActionMenu actions={[
          inst.status === 'pending_review' && { label: 'Approve', Icon: CheckCheck, onClick: () => handleApprove(inst) },
          { label: 'Edit', Icon: Edit2, onClick: () => setEditingInst({ ...inst }) },
          { label: 'Delete', Icon: Trash2, onClick: () => handleDelete(inst.id), danger: true },
        ]} />
      ),
    },
  ];

  const toolbar = (
    <>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: GOV.textMuted }} />
        <input
          className="form-control-with-icon pl-7 text-xs w-40"
          style={{ borderBottomColor: GOV.border, color: GOV.text }}
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <select className="text-xs border rounded-md px-2 py-1.5" style={{ borderColor: GOV.border, color: typeFilter ? GOV.blue : GOV.textMuted }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
        <option value="">All Types</option>
        <option value="school">School</option>
        <option value="college">College</option>
        <option value="tvet">TVET</option>
        <option value="university">University</option>
        <option value="vocational">Vocational</option>
        <option value="other">Other</option>
      </select>
      <select className="text-xs border rounded-md px-2 py-1.5" style={{ borderColor: GOV.border, color: regionFilter ? GOV.blue : GOV.textMuted }} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
        <option value="">All Regions</option>
        <option value="hhohho">Hhohho</option>
        <option value="manzini">Manzini</option>
        <option value="lubombo">Lubombo</option>
        <option value="shiselweni">Shiselweni</option>
      </select>
      <select className="text-xs border rounded-md px-2 py-1.5" style={{ borderColor: GOV.border, color: statusFilter ? GOV.blue : GOV.textMuted }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="">All Statuses</option>
        <option value="approved">Approved</option>
        <option value="pending">Pending</option>
      </select>
      <span className="text-xs" style={{ color: GOV.textMuted }}>{filteredInstitutions.length}{filteredInstitutions.length !== institutions.length ? ` / ${institutions.length}` : ''}{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}</span>
      <div className="ml-auto flex gap-2">
        <PermissionGate permission="institutions.import">
          <button type="button" onClick={downloadTemplate}
            className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold"
            style={{ borderColor: GOV.border, color: GOV.textMuted }}>
            <FileText className="w-3 h-3" /> Template
          </button>
          <label className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold cursor-pointer"
            style={{ borderColor: GOV.border, color: GOV.blue }}>
            <Upload className="w-3 h-3" /> Import
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
        </PermissionGate>
        <PermissionGate permission="institutions.export">
          <button type="button" onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-semibold"
            style={{ borderColor: GOV.border, color: GOV.blue }}>
            <Download className="w-3 h-3" /> Export
          </button>
        </PermissionGate>
        <PermissionGate permission="institutions.create">
          <button type="button" onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white"
            style={{ backgroundColor: GOV.blue }}>
            <Plus className="w-3.5 h-3.5" /> Add Institution
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
        <DataTable
          columns={columns}
          rows={filteredInstitutions}
          rowKey="id"
          loading={loading}
          emptyTitle="No institutions"
          toolbar={toolbar}
          pageSize={7}
          selectable selectedIds={selectedInsts} onSelectionChange={setSelectedInsts}
          bulkActions={
            <>
              <PermissionGate permission="institutions.update">
                <button type="button" onClick={handleBulkApprove} className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-white" style={{ backgroundColor: '#16a34a' }}>
                  <CheckCircle2 className="w-3 h-3" /> Approve
                </button>
              </PermissionGate>
              <PermissionGate permission="institutions.delete">
                <button type="button" onClick={handleBulkDelete} className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-white bg-red-600">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </PermissionGate>
            </>
          }
        />
      </div>

      {/* ── Add Institution Dialog ── */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <div>
                <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Add Institution</h3>
                <p className="text-xs mt-0.5" style={{ color: GOV.textMuted }}>Register a new school, college or institution</p>
              </div>
              <button type="button" onClick={() => { setShowCreateDialog(false); setNewInst(EMPTY_INST); }}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <form className="flex-1 overflow-y-auto p-5 space-y-3" onSubmit={async (e) => { await handleCreate(e); setShowCreateDialog(false); }}>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Name *</label>
                <input className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newInst.name} onChange={e => setNewInst({ ...newInst, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Type</label>
                  <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newInst.type} onChange={e => setNewInst({ ...newInst, type: e.target.value })}>
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="tvet">TVET</option>
                    <option value="university">University</option>
                    <option value="vocational">Vocational</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Region</label>
                  <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={newInst.region} onChange={e => setNewInst({ ...newInst, region: e.target.value })}>
                    <option value="hhohho">Hhohho</option>
                    <option value="manzini">Manzini</option>
                    <option value="lubombo">Lubombo</option>
                    <option value="shiselweni">Shiselweni</option>
                    <option value="multiple">Multiple</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowCreateDialog(false); setNewInst(EMPTY_INST); }} className="flex-1 border rounded-md py-2 text-xs" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 text-white py-2 rounded-md text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: GOV.blue }}>
                  {isSaving ? 'Saving…' : 'Add Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingInst && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Edit Institution</h3>
              <button type="button" onClick={() => setEditingInst(null)}>
                <X className="w-4 h-4" style={{ color: GOV.textMuted }} />
              </button>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Name</label>
              <input
                className="form-control"
                style={{ borderBottomColor: GOV.border, color: GOV.text }}
                value={editingInst.name || ''}
                onChange={e => setEditingInst({ ...editingInst, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Type</label>
                <select
                  className="form-control"
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                  value={editingInst.type}
                  onChange={e => setEditingInst({ ...editingInst, type: e.target.value })}
                >
                  <option value="school">School</option>
                  <option value="college">College</option>
                  <option value="tvet">TVET</option>
                  <option value="university">University</option>
                  <option value="vocational">Vocational</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Region</label>
                <select
                  className="form-control"
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                  value={editingInst.region || ''}
                  onChange={e => setEditingInst({ ...editingInst, region: e.target.value })}
                >
                  <option value="hhohho">Hhohho</option>
                  <option value="manzini">Manzini</option>
                  <option value="lubombo">Lubombo</option>
                  <option value="shiselweni">Shiselweni</option>
                  <option value="multiple">Multiple</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingInst(null)}
                className="flex-1 border rounded-md py-2 text-sm"
                style={{ borderColor: GOV.border, color: GOV.textMuted }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: GOV.blue }}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminInstitutionsPanel;
