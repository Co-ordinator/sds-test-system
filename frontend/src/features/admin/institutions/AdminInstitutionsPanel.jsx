import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Upload, Download, FileText } from 'lucide-react';
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

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (inst) => <span className="font-medium" style={{ color: GOV.text }}>{inst.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (inst) => <span className="capitalize text-xs" style={{ color: GOV.textMuted }}>{inst.type}</span>,
    },
    {
      key: 'region',
      header: 'Region',
      sortable: true,
      render: (inst) => <span className="capitalize text-xs" style={{ color: GOV.textMuted }}>{inst.region || '–'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      stopPropagation: true,
      render: (inst) => (
        <div className="flex gap-2">
          <PermissionGate permission="institutions.update">
            <button type="button" onClick={() => setEditingInst({ ...inst })} className="p-1 rounded hover:bg-gray-100">
              <Edit2 className="w-3.5 h-3.5" style={{ color: GOV.blue }} />
            </button>
          </PermissionGate>
          <PermissionGate permission="institutions.delete">
            <button type="button" onClick={() => handleDelete(inst.id)} className="p-1 rounded hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  const toolbar = (
    <>
      <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Institutions ({institutions.length})</h3>
      <div className="relative ml-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: GOV.textMuted }} />
        <input
          className="form-control-with-icon pl-7 text-xs w-44"
          style={{ borderBottomColor: GOV.border, color: GOV.text }}
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
          <DataTable
            columns={columns}
            rows={institutions}
            rowKey="id"
            loading={loading}
            emptyTitle="No institutions"
            toolbar={toolbar}
            pageSize={20}
          />
        </div>

        {/* Add Institution Form */}
        <PermissionGate permission="institutions.create">
        <div className="bg-white rounded-md border p-5" style={{ borderColor: GOV.border }}>
          <h4 className={`${TYPO.cardTitle} mb-4 flex items-center gap-2`} style={{ color: GOV.text }}>
            <Plus className="w-4 h-4" /> Add Institution
          </h4>
          <form className="space-y-3" onSubmit={handleCreate}>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Name *</label>
              <input
                className="form-control"
                style={{ borderBottomColor: GOV.border, color: GOV.text }}
                value={newInst.name}
                onChange={e => setNewInst({ ...newInst, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Type</label>
                <select
                  className="form-control"
                  style={{ borderBottomColor: GOV.border, color: GOV.text }}
                  value={newInst.type}
                  onChange={e => setNewInst({ ...newInst, type: e.target.value })}
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
                  value={newInst.region}
                  onChange={e => setNewInst({ ...newInst, region: e.target.value })}
                >
                  <option value="hhohho">Hhohho</option>
                  <option value="manzini">Manzini</option>
                  <option value="lubombo">Lubombo</option>
                  <option value="shiselweni">Shiselweni</option>
                  <option value="multiple">Multiple</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full text-white py-2 rounded-md text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: GOV.blue }}
            >
              {isSaving ? 'Saving…' : 'Add Institution'}
            </button>
          </form>
        </div>
        </PermissionGate>
      </div>

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
