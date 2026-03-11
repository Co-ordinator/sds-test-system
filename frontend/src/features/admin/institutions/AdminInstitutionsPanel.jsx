import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { useToast, Toast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { useInstitutions } from '../../../hooks/useInstitutions';

const EMPTY_INST = { name: '', type: 'school', region: 'hhohho' };

const AdminInstitutionsPanel = () => {
  const { institutions, loading, error, search, setSearch, load, create, update, remove } = useInstitutions();
  const { toast, showToast, Toast: ToastComp } = useToast();

  const [editingInst, setEditingInst] = useState(null);
  const [newInst, setNewInst] = useState(EMPTY_INST);
  const [isSaving, setIsSaving] = useState(false);

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
          <button type="button" onClick={() => setEditingInst({ ...inst })} className="p-1 rounded hover:bg-gray-100">
            <Edit2 className="w-3.5 h-3.5" style={{ color: GOV.blue }} />
          </button>
          <button type="button" onClick={() => handleDelete(inst.id)} className="p-1 rounded hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <>
      <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Institutions ({institutions.length})</h3>
      <div className="ml-auto flex items-center gap-2">
        <Search className="w-4 h-4" style={{ color: GOV.textMuted }} />
        <input
          className="form-control text-sm w-44"
          style={{ borderBottomColor: GOV.border, color: GOV.text }}
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
    </>
  );

  return (
    <>
      <ToastComp toast={toast} />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

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
