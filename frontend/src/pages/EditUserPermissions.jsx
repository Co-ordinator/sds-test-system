import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Save, X, Check } from 'lucide-react';
import { GOV, TYPO } from '../theme/government';
import { RoleBadge, useToast, Toast, LoadingState, ErrorBanner } from '../components/ui/StatusIndicators';
import { adminService } from '../services/adminService';

const EditUserPermissions = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, Toast: ToastComp } = useToast();

  const [user, setUser] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialPerms, setInitialPerms] = useState(new Set());

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [permsData, userData] = await Promise.all([
          adminService.getPermissions(),
          adminService.getUserPermissions(userId),
        ]);
        setAllPermissions(permsData);
        setUser(userData);
        const userPermIds = new Set((userData?.permissions || []).map(p => p.id));
        setSelectedPerms(userPermIds);
        setInitialPerms(userPermIds);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  useEffect(() => {
    const changed = initialPerms.size !== selectedPerms.size || 
      [...initialPerms].some(id => !selectedPerms.has(id)) ||
      [...selectedPerms].some(id => !initialPerms.has(id));
    setHasChanges(changed);
  }, [selectedPerms, initialPerms]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateUserPermissions(userId, [...selectedPerms]);
      showToast('Permissions updated successfully');
      setInitialPerms(new Set(selectedPerms));
      setHasChanges(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update permissions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = (id) => {
    setSelectedPerms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedPerms(new Set(allPermissions.map(p => p.id)));
  const deselectAll = () => setSelectedPerms(new Set());

  const permsByModule = allPermissions.reduce((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});

  if (loading) return <LoadingState message="Loading permissions..." />;
  if (error) return <ErrorBanner message={error} onRetry={() => window.location.reload()} />;
  if (!user) return <ErrorBanner message="User not found" />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: GOV.bgLight }}>
      <ToastComp toast={toast} />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30" style={{ borderColor: GOV.border }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Back to Admin Dashboard"
              >
                <ArrowLeft className="w-5 h-5" style={{ color: GOV.textMuted }} />
              </button>
              <div>
                <h1 className={TYPO.pageTitle} style={{ color: GOV.text }}>
                  <Shield className="w-6 h-6 inline mr-2" style={{ color: '#7c3aed' }} />
                  Manage User Permissions
                </h1>
                <p className="text-sm mt-1" style={{ color: GOV.textMuted }}>
                  Configure granular access control for this user
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 font-semibold">
                  Unsaved changes
                </span>
              )}
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-4 py-2 border rounded-md text-sm"
                style={{ borderColor: GOV.border, color: GOV.textMuted }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#7c3aed' }}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-md border p-5 mb-6" style={{ borderColor: GOV.border }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: GOV.blueLight, color: GOV.blue }}>
              {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold" style={{ color: GOV.text }}>
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm" style={{ color: GOV.textMuted }}>{user.email}</p>
            </div>
            <RoleBadge role={user.role} />
            <div className="text-right">
              <p className="text-xs font-semibold" style={{ color: GOV.textMuted }}>User ID</p>
              <p className="text-xs font-mono" style={{ color: GOV.text }}>{user.id}</p>
            </div>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="bg-white rounded-md border" style={{ borderColor: GOV.border }}>
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: GOV.border }}>
            <div>
              <h3 className={TYPO.sectionTitle} style={{ color: GOV.text }}>Permissions</h3>
              <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>
                {selectedPerms.size} of {allPermissions.length} permissions selected
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-semibold px-3 py-1.5 border rounded-md hover:bg-gray-50 transition-colors"
                style={{ color: GOV.blue, borderColor: GOV.border }}
              >
                <Check className="w-3 h-3 inline mr-1" />
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs font-semibold px-3 py-1.5 border rounded-md hover:bg-gray-50 transition-colors"
                style={{ color: GOV.textMuted, borderColor: GOV.border }}
              >
                <X className="w-3 h-3 inline mr-1" />
                Deselect All
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {Object.entries(permsByModule).map(([module, perms]) => (
              <div key={module}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: GOV.textMuted }}>
                    {module}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100" style={{ color: GOV.textMuted }}>
                    {perms.filter(p => selectedPerms.has(p.id)).length} / {perms.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {perms.map(p => {
                    const isSelected = selectedPerms.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-md border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          checked={isSelected}
                          onChange={() => togglePerm(p.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                            {p.name}
                          </p>
                          {p.description && (
                            <p className="text-[10px] truncate" style={{ color: GOV.textMuted }}>
                              {p.description}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Save Bar (sticky) */}
        {hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30" style={{ borderColor: GOV.border }}>
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <p className="text-sm font-semibold" style={{ color: GOV.text }}>
                  You have unsaved changes
                </p>
                <span className="text-xs px-2 py-1 rounded bg-gray-100" style={{ color: GOV.textMuted }}>
                  {selectedPerms.size} permissions selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPerms(new Set(initialPerms));
                    setHasChanges(false);
                  }}
                  className="px-4 py-2 border rounded-md text-sm"
                  style={{ borderColor: GOV.border, color: GOV.textMuted }}
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 rounded-md text-sm text-white font-semibold disabled:opacity-50"
                  style={{ backgroundColor: '#7c3aed' }}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditUserPermissions;
