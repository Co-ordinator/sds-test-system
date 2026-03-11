import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, Download, Edit2, Trash2, Eye, X } from 'lucide-react';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { RoleBadge, StatusBadge, useToast, Toast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import { useAdminUsers } from '../../../hooks/useAdminUsers';
import { adminService } from '../../../services/adminService';

const AdminUsersPanel = ({ institutions = [] }) => {
  const {
    users, loading, error, search, setSearch, roleFilter, setRoleFilter,
    load, deleteUser, updateUserLocal,
  } = useAdminUsers();
  const { toast, showToast, Toast: ToastComp } = useToast();

  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { load(); }, [search, roleFilter, load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await deleteUser(id);
      showToast('User deleted');
    } catch { showToast('Failed to delete user', 'error'); }
  };

  const handleViewUser = async (u) => {
    try {
      const detail = await adminService.getUser(u.id);
      setViewingUser(detail || u);
    } catch { setViewingUser(u); }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      await adminService.updateUser(editingUser.id, {
        role: editingUser.role,
        institutionId: editingUser.institutionId || null,
        isActive: editingUser.isActive,
      });
      updateUserLocal(editingUser);
      setEditingUser(null);
      showToast('User updated');
    } catch { showToast('Failed to update user', 'error'); }
    finally { setIsSaving(false); }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (u) => (
        <span className="font-medium text-sm" style={{ color: GOV.text }}>{u.firstName} {u.lastName}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (u) => <span className="text-xs" style={{ color: GOV.textMuted }}>{u.email || '–'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (u) => <RoleBadge role={u.role} />,
    },
    {
      key: 'region',
      header: 'Region',
      sortable: true,
      render: (u) => <span className="capitalize text-xs" style={{ color: GOV.textMuted }}>{u.region || '–'}</span>,
    },
    {
      key: 'institution',
      header: 'Institution',
      render: (u) => (
        <span className="text-xs" style={{ color: GOV.textMuted }}>
          {institutions.find(i => i.id === u.institutionId)?.name || '–'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (u) => (
        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${u.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {u.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      stopPropagation: true,
      render: (u) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => handleViewUser(u)} className="p-1 rounded hover:bg-gray-100" title="View Details">
            <Eye className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
          </button>
          <button type="button" onClick={() => setEditingUser({ ...u })} className="p-1 rounded hover:bg-gray-100" title="Edit">
            <Edit2 className="w-3.5 h-3.5" style={{ color: GOV.blue }} />
          </button>
          <button type="button" onClick={() => handleDelete(u.id)} className="p-1 rounded hover:bg-red-50" title="Delete">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <>
      <div className="flex items-center gap-2 px-0 py-1.5 bg-white">
        <Search className="w-4 h-4" style={{ color: GOV.textMuted }} />
        <input
          className="form-control text-sm"
          style={{ borderBottomColor: GOV.border, color: GOV.text }}
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <select
        className="form-control text-sm bg-white"
        style={{ borderBottomColor: GOV.border, color: GOV.text }}
        value={roleFilter}
        onChange={e => setRoleFilter(e.target.value)}
      >
        <option value="">All roles</option>
        <option value="user">Students</option>
        <option value="counselor">Counselors</option>
        <option value="admin">Admins</option>
      </select>
      <button type="button" onClick={load} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs bg-white" style={{ borderColor: GOV.border, color: GOV.blue }}>
        <RefreshCw className="w-3 h-3" /> Refresh
      </button>
      <button type="button" onClick={() => adminService.exportUsers().catch(() => showToast('Export failed', 'error'))} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs bg-white" style={{ borderColor: GOV.border, color: GOV.blue }}>
        <Download className="w-3 h-3" /> Export CSV
      </button>
      <span className="text-xs ml-auto" style={{ color: GOV.textMuted }}>{users.length} users</span>
    </>
  );

  return (
    <>
      <ToastComp toast={toast} />

      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={columns}
          rows={users}
          rowKey="id"
          loading={loading}
          emptyTitle="No users found"
          emptyMessage="Try adjusting your search or role filter."
          toolbar={toolbar}
          pageSize={25}
        />
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Edit User</h3>
              <button type="button" onClick={() => setEditingUser(null)}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <p className="text-sm font-medium" style={{ color: GOV.text }}>{editingUser.firstName} {editingUser.lastName}</p>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Role</label>
              <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                <option value="user">User (Student)</option>
                <option value="counselor">Counselor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Institution</label>
              <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingUser.institutionId || ''} onChange={e => setEditingUser({ ...editingUser, institutionId: e.target.value || null })}>
                <option value="">— None —</option>
                {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={editingUser.isActive !== false} onChange={e => setEditingUser({ ...editingUser, isActive: e.target.checked })} />
              <label htmlFor="isActive" className="text-sm" style={{ color: GOV.text }}>Active</label>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 border rounded-md py-2 text-sm" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Cancel</button>
              <button type="button" onClick={handleSaveUser} disabled={isSaving} className="flex-1 text-white rounded-md py-2 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: GOV.blue }}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Detail Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>User Details</h3>
              <button type="button" onClick={() => setViewingUser(null)}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-md" style={{ backgroundColor: GOV.blueLightAlt }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: GOV.blueLight, color: GOV.blue }}>
                  {(viewingUser.firstName?.[0] || '').toUpperCase()}{(viewingUser.lastName?.[0] || '').toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: GOV.text }}>{viewingUser.firstName} {viewingUser.lastName}</p>
                  <p className="text-xs" style={{ color: GOV.textMuted }}>{viewingUser.email || '–'}</p>
                </div>
                <RoleBadge role={viewingUser.role} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['User ID', <span className="font-mono">{viewingUser.id}</span>],
                  ['Role', <span className="capitalize">{viewingUser.role}</span>],
                  ['Status', <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${viewingUser.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{viewingUser.isActive !== false ? 'Active' : 'Inactive'}</span>],
                  ['Email Verified', viewingUser.isEmailVerified ? 'Yes' : 'No'],
                  ['Region', <span className="capitalize">{viewingUser.region || '–'}</span>],
                  ['Institution', institutions.find(i => i.id === viewingUser.institutionId)?.name || viewingUser.institution?.name || '–'],
                  ['Phone', viewingUser.phoneNumber || '–'],
                  ['User Type', <span className="capitalize">{viewingUser.userType?.replace(/_/g, ' ') || '–'}</span>],
                  ['Education Level', <span className="capitalize">{viewingUser.educationLevel?.replace(/_/g, ' ') || '–'}</span>],
                  ['Employment', <span className="capitalize">{viewingUser.employmentStatus?.replace(/_/g, ' ') || '–'}</span>],
                  ['Student Number', <span className="font-mono">{viewingUser.studentNumber || '–'}</span>],
                  ['Language', viewingUser.preferredLanguage === 'ss' ? 'SiSwati' : 'English'],
                  ['Registered', viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString() : '–'],
                  ['Last Login', viewingUser.lastLoginAt ? new Date(viewingUser.lastLoginAt).toLocaleString() : '–'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <span className="font-semibold block mb-0.5" style={{ color: GOV.textMuted }}>{label}</span>
                    <span style={{ color: GOV.text }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: GOV.border }}>
              <button type="button"
                onClick={() => { setViewingUser(null); setEditingUser({ ...viewingUser }); }}
                className="flex items-center gap-1 px-4 py-2 rounded-md text-xs font-semibold text-white"
                style={{ backgroundColor: GOV.blue }}>
                <Edit2 className="w-3 h-3" /> Edit User
              </button>
              <button type="button" onClick={() => setViewingUser(null)} className="px-4 py-2 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsersPanel;
