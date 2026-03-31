import React, { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Download, Edit2, Trash2, Eye, X, Plus, Shield, Mail, ChevronRight, CheckCircle2, XCircle, UserX, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GOV, TYPO } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { RoleBadge, useToast, ErrorBanner } from '../../../components/ui/StatusIndicators';
import ActionMenu from '../../../components/ui/ActionMenu';
import { useAdminUsers } from '../../../hooks/useAdminUsers';
import { adminService } from '../../../services/adminService';
import { usePermissions, PermissionGate } from '../../../context/PermissionContext';
import InstitutionSearchInput from '../../../components/ui/InstitutionSearchInput';
import { adminUserDisplayName, adminUserInitials } from '../../../utils/adminUserDisplay';

const AdminUsersPanel = ({ institutions = [] }) => {
  const navigate = useNavigate();
  const {
    users, loading, error, search, setSearch, roleFilter, setRoleFilter,
    load, deleteUser, updateUserLocal,
  } = useAdminUsers();
  const { toast, showToast, Toast: ToastComp } = useToast();
  const { hasPermission } = usePermissions();

  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', role: 'Test Taker', institutionId: '', institutionName: '', organization: '' });
  const [creating, setCreating] = useState(false);
  const [createPerms, setCreatePerms] = useState(new Set());
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedUsers.size) return;
    if (!window.confirm(`Delete ${selectedUsers.size} user(s) permanently?`)) return;
    try {
      const res = await adminService.bulkDeleteUsers([...selectedUsers]);
      showToast(`${res.data?.deleted || selectedUsers.size} user(s) deleted`);
      setSelectedUsers(new Set());
      load();
    } catch { showToast('Bulk delete failed', 'error'); }
  }, [selectedUsers, load, showToast]);

  const handleBulkActivate = useCallback(async () => {
    if (!selectedUsers.size) return;
    try {
      await adminService.bulkUpdateUsers([...selectedUsers], { isActive: true });
      showToast(`${selectedUsers.size} user(s) activated`);
      setSelectedUsers(new Set());
      load();
    } catch { showToast('Bulk activate failed', 'error'); }
  }, [selectedUsers, load, showToast]);

  const handleBulkDeactivate = useCallback(async () => {
    if (!selectedUsers.size) return;
    if (!window.confirm(`Deactivate ${selectedUsers.size} user(s)?`)) return;
    try {
      await adminService.bulkUpdateUsers([...selectedUsers], { isActive: false });
      showToast(`${selectedUsers.size} user(s) deactivated`);
      setSelectedUsers(new Set());
      load();
    } catch { showToast('Bulk deactivate failed', 'error'); }
  }, [selectedUsers, load, showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { load(); }, [search, roleFilter, load]);

  // Load all permissions for create form
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const perms = await adminService.getPermissions();
        setAllPermissions(perms);
      } catch { /* silent */ }
    };
    loadPermissions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await deleteUser(id);
      showToast('User deleted');
    } catch { showToast('Failed to delete user', 'error'); }
  };

  const handleViewUser = (u) => {
    navigate(`/admin/users/${u.id}`);
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...createForm,
        institutionId: createForm.institutionId || undefined,
        permissionIds: [...createPerms]
      };
      const res = await adminService.createUser(payload);
      showToast(res.message || 'User created. Login credentials sent via email.');
      setShowCreateDialog(false);
      setCreateForm({ firstName: '', lastName: '', email: '', role: 'Test Taker', institutionId: '', institutionName: '', organization: '' });
      setCreatePerms(new Set());
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally { setCreating(false); }
  };

  const toggleCreatePerm = (id) => {
    setCreatePerms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const columns = [
    {
      key: 'name', header: 'Name', sortable: true,
      render: (u) => (
        <p className="font-medium text-sm" style={{ color: GOV.text }}>{adminUserDisplayName(u)}</p>
      ),
    },
    {
      key: 'role', header: 'Role', sortable: true,
      render: (u) => <RoleBadge role={u.role} />,
    },
    {
      key: 'region', header: 'Region', sortable: true,
      render: (u) => <span className="capitalize text-xs" style={{ color: GOV.textMuted }}>{u.region || '–'}</span>,
    },
    {
      key: 'institution', header: 'Institution',
      render: (u) => <span className="text-xs" style={{ color: GOV.textMuted }}>{institutions.find(i => i.id === u.institutionId)?.name || u.institution?.name || '–'}</span>,
    },
    {
      key: 'isActive', header: 'Status', sortable: true,
      render: (u) => (
        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${u.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {u.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', stopPropagation: true, width: 'w-10', align: 'right',
      render: (u) => (
        <ActionMenu actions={[
          { label: 'View Details', Icon: Eye, onClick: () => handleViewUser(u) },
          hasPermission('users.update') && { label: 'Edit User', Icon: Edit2, onClick: () => setEditingUser({ ...u }) },
          hasPermission('permissions.manage') && { label: 'Permissions', Icon: Shield, onClick: () => navigate(`/admin/users/${u.id}/permissions`) },
          hasPermission('users.delete') && { label: 'Delete', Icon: Trash2, onClick: () => handleDelete(u.id), danger: true },
        ]} />
      ),
    },
  ];

  const toolbar = (
    <>
      <div className="flex items-center gap-2 py-1.5">
        <Search className="w-4 h-4" style={{ color: GOV.textMuted }} />
        <input className="form-control text-sm" style={{ borderBottomColor: GOV.border, color: GOV.text }} placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <button type="button" onClick={() => setShowFilterDialog(true)} className={`flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs bg-white ${roleFilter ? 'border-blue-300 bg-blue-50' : ''}`} style={{ borderColor: roleFilter ? GOV.blue : GOV.border, color: roleFilter ? GOV.blue : GOV.textMuted }}>
        <Filter className="w-3 h-3" /> {roleFilter || 'Filter'}
      </button>
      <button type="button" onClick={load} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs bg-white" style={{ borderColor: GOV.border, color: GOV.blue }}>
        <RefreshCw className="w-3 h-3" /> Refresh
      </button>
      <PermissionGate permission="users.export">
        <button type="button" onClick={() => adminService.exportUsers().catch(() => showToast('Export failed', 'error'))} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs bg-white" style={{ borderColor: GOV.border, color: GOV.blue }}>
          <Download className="w-3 h-3" /> Export
        </button>
      </PermissionGate>
      <span className="text-xs" style={{ color: GOV.textMuted }}>{users.length} users</span>
      <PermissionGate permission="users.create">
        <button type="button" onClick={() => setShowCreateDialog(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white ml-auto" style={{ backgroundColor: GOV.blue }}>
          <Plus className="w-3.5 h-3.5" /> Create User
        </button>
      </PermissionGate>
    </>
  );

  // Permission grid grouped by module
  const permsByModule = allPermissions.reduce((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});

  const PermissionGrid = ({ selected, onToggle, selectAll, deselectAll }) => (
    <div className="space-y-3 max-h-[40vh] overflow-y-auto">
      <div className="flex gap-2 mb-2">
        {selectAll && <button type="button" onClick={selectAll} className="text-[10px] font-semibold px-2 py-0.5 border rounded" style={{ color: GOV.blue, borderColor: GOV.border }}>Select All</button>}
        {deselectAll && <button type="button" onClick={deselectAll} className="text-[10px] font-semibold px-2 py-0.5 border rounded" style={{ color: GOV.textMuted, borderColor: GOV.border }}>Deselect All</button>}
      </div>
      {Object.entries(permsByModule).map(([mod, perms]) => (
        <div key={mod}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: GOV.textMuted }}>{mod}</p>
          <div className="flex flex-wrap gap-1.5">
            {perms.map(p => (
              <label key={p.id} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] cursor-pointer transition-colors ${selected.has(p.id) ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'bg-white border-gray-200 text-gray-500'}`}>
                <input type="checkbox" className="sr-only" checked={selected.has(p.id)} onChange={() => onToggle(p.id)} />
                {p.name}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <ToastComp toast={toast} />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-3" />}

      {/* Main Table — full width */}
      <div className="bg-white rounded-md border overflow-hidden" style={{ borderColor: GOV.border }}>
        <DataTable
          columns={columns} rows={users} rowKey="id" loading={loading}
          emptyTitle="No users found" emptyMessage="Try adjusting your search or role filter."
          toolbar={toolbar} pageSize={7}
          selectable selectedIds={selectedUsers} onSelectionChange={setSelectedUsers}
          bulkActions={
            <>
              <PermissionGate permission="users.update">
                <button type="button" onClick={handleBulkActivate} className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-white" style={{ backgroundColor: '#16a34a' }}>
                  <CheckCircle2 className="w-3 h-3" /> Activate
                </button>
                <button type="button" onClick={handleBulkDeactivate} className="flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-semibold" style={{ borderColor: '#f59e0b', color: '#92400e', backgroundColor: '#fef3c7' }}>
                  <XCircle className="w-3 h-3" /> Deactivate
                </button>
              </PermissionGate>
              <PermissionGate permission="users.delete">
                <button type="button" onClick={handleBulkDelete} className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-white bg-red-600">
                  <UserX className="w-3 h-3" /> Delete
                </button>
              </PermissionGate>
            </>
          }
        />
      </div>

      {/* ── Create User Dialog ── */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: GOV.border }}>
              <div>
                <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Create New User</h3>
                <p className="text-xs mt-0.5" style={{ color: GOV.textMuted }}>Fill in the details to create a new user account</p>
              </div>
              <button type="button" onClick={() => setShowCreateDialog(false)}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>First Name *</label>
                  <input required className="form-control w-full text-sm" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={createForm.firstName} onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} />
                </div>
                <div>
                  <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Last Name *</label>
                  <input required className="form-control w-full text-sm" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={createForm.lastName} onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Email *</label>
                <input type="email" required className="form-control w-full text-sm" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
                <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: GOV.textHint }}><Mail className="w-3 h-3" /> Credentials will be emailed</p>
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Role *</label>
                <select required className="form-control w-full text-sm" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="Test Taker">Test Taker</option>
                  <option value="Test Administrator">Test Administrator</option>
                  <option value="System Administrator">System Administrator</option>
                </select>
              </div>
              <div>
                <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Institution</label>
                <InstitutionSearchInput
                  value={createForm.institutionName}
                  institutionId={createForm.institutionId}
                  onChange={(name, id) => setCreateForm({ ...createForm, institutionName: name, institutionId: id || '' })}
                  placeholder="Search for institution..."
                  inputClassName="w-full text-sm"
                />
              </div>
              {createForm.role === 'Test Administrator' && (
                <div>
                  <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Organization</label>
                  <input className="form-control w-full text-sm" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={createForm.organization} onChange={e => setCreateForm({ ...createForm, organization: e.target.value })} placeholder="e.g., Ministry of Education" />
                </div>
              )}
              {(createForm.role === 'Test Administrator' || createForm.role === 'System Administrator') && allPermissions.length > 0 && (
                <div>
                  <label className={`block ${TYPO.label} mb-2`} style={{ color: GOV.text }}>
                    <Shield className="w-3.5 h-3.5 inline mr-1" style={{ color: '#7c3aed' }} />
                    Permissions {createForm.role === 'System Administrator' && <span className="text-[10px] font-normal" style={{ color: GOV.textHint }}>(all by default)</span>}
                  </label>
                  <PermissionGrid
                    selected={createPerms}
                    onToggle={toggleCreatePerm}
                    selectAll={() => setCreatePerms(new Set(allPermissions.map(p => p.id)))}
                    deselectAll={() => setCreatePerms(new Set())}
                  />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setCreateForm({ firstName: '', lastName: '', email: '', role: 'Test Taker', institutionId: '', institutionName: '', organization: '' }); setCreatePerms(new Set()); }} className="flex-1 border rounded-md py-2 text-xs" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Clear</button>
                <button type="submit" disabled={creating} className="flex-1 text-white rounded-md py-2 text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: GOV.blue }}>
                  {creating ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Filter Dialog ── */}
      {showFilterDialog && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: GOV.border }}>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Filter Users</h3>
              <button type="button" onClick={() => setShowFilterDialog(false)}>
                <X className="w-4 h-4" style={{ color: GOV.textMuted }} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className={`block ${TYPO.label} mb-2`} style={{ color: GOV.text }}>Role</label>
                <div className="space-y-2">
                  {[
                    { value: '', label: 'All roles' },
                    { value: 'Test Taker', label: 'Test Takers' },
                    { value: 'Test Administrator', label: 'Test Administrators' },
                    { value: 'System Administrator', label: 'System Administrators' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="roleFilter"
                        value={option.value}
                        checked={roleFilter === option.value}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm" style={{ color: GOV.text }}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter('');
                    setShowFilterDialog(false);
                  }}
                  className="flex-1 border rounded-md py-2 text-xs"
                  style={{ borderColor: GOV.border, color: GOV.textMuted }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterDialog(false)}
                  className="flex-1 text-white rounded-md py-2 text-xs font-semibold"
                  style={{ backgroundColor: GOV.blue }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Edit User</h3>
              <button type="button" onClick={() => setEditingUser(null)}><X className="w-4 h-4" style={{ color: GOV.textMuted }} /></button>
            </div>
            <p className="text-sm font-medium" style={{ color: GOV.text }}>{adminUserDisplayName(editingUser)}</p>
            <div>
              <label className={`block ${TYPO.label} mb-1`} style={{ color: GOV.text }}>Role</label>
              <select className="form-control" style={{ borderBottomColor: GOV.border, color: GOV.text }} value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                <option value="Test Taker">Test Taker</option>
                <option value="Test Administrator">Test Administrator</option>
                <option value="System Administrator">System Administrator</option>
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


      {/* ── View User Detail Modal ── */}
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
                  {adminUserInitials(viewingUser)}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: GOV.text }}>{adminUserDisplayName(viewingUser)}</p>
                  <p className="text-xs" style={{ color: GOV.textMuted }}>{viewingUser.email || '–'}</p>
                </div>
                <RoleBadge role={viewingUser.role} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['User ID', <span className="font-mono">{viewingUser.id}</span>],
                  ['Role', <RoleBadge role={viewingUser.role} />],
                  ['Status', <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${viewingUser.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{viewingUser.isActive !== false ? 'Active' : 'Inactive'}</span>],
                  ['Email Verified', viewingUser.isEmailVerified ? 'Yes' : 'No'],
                  ['Region', <span className="capitalize">{viewingUser.region || '–'}</span>],
                  ['Institution', institutions.find(i => i.id === viewingUser.institutionId)?.name || viewingUser.institution?.name || '–'],
                  ['Phone', viewingUser.phoneNumber || '–'],
                  ['User Type', <span className="capitalize">{viewingUser.userType?.replace(/_/g, ' ') || '–'}</span>],
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
              <PermissionGate permission="permissions.manage">
                <button type="button" onClick={() => { setViewingUser(null); navigate(`/admin/users/${viewingUser.id}/permissions`); }} className="flex items-center gap-1 px-4 py-2 rounded-md text-xs font-semibold text-white" style={{ backgroundColor: '#7c3aed' }}>
                  <Shield className="w-3 h-3" /> Permissions <ChevronRight className="w-3 h-3" />
                </button>
              </PermissionGate>
              <PermissionGate permission="users.update">
                <button type="button" onClick={() => { setViewingUser(null); setEditingUser({ ...viewingUser }); }} className="flex items-center gap-1 px-4 py-2 rounded-md text-xs font-semibold text-white" style={{ backgroundColor: GOV.blue }}>
                  <Edit2 className="w-3 h-3" /> Edit User
                </button>
              </PermissionGate>
              <button type="button" onClick={() => setViewingUser(null)} className="px-4 py-2 border rounded-md text-xs" style={{ borderColor: GOV.border, color: GOV.textMuted }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUsersPanel;
