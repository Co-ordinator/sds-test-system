import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Building2, UserCheck, AlertCircle } from 'lucide-react';
import { GOV } from '../../../theme/government';
import DataTable from '../../../components/data/DataTable';
import { LoadingState, ErrorBanner, useToast } from '../../../components/ui/StatusIndicators';
import api from '../../../services/api';

const AdminTestAdministratorsPanel = () => {
  const [testAdministrators, setTestAdministrators] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institutionId: '',
    organization: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminRes, instRes] = await Promise.all([
        api.get('/api/v1/admin/test-administrators'),
        api.get('/api/v1/institutions')
      ]);
      setTestAdministrators(adminRes.data?.data?.testAdministrators || []);
      setInstitutions(instRes.data?.data?.institutions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load test administrators');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await api.post('/api/v1/admin/test-administrators', formData);
      showToast('Test administrator created successfully. Login credentials sent via email.', 'success');
      setShowCreateModal(false);
      setFormData({ firstName: '', lastName: '', email: '', institutionId: '', organization: '' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create test administrator', 'error');
    } finally {
      setCreating(false);
    }
  };

  const filteredAdministrators = testAdministrators.filter(admin => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      admin.firstName?.toLowerCase().includes(search) ||
      admin.lastName?.toLowerCase().includes(search) ||
      admin.email?.toLowerCase().includes(search) ||
      admin.testAdministratorCode?.toLowerCase().includes(search) ||
      admin.organization?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold" style={{ color: GOV.text }}>
            {row.firstName} {row.lastName}
          </div>
          <div className="text-xs" style={{ color: GOV.textMuted }}>
            {row.testAdministratorCode}
          </div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
          <span className="text-sm" style={{ color: GOV.text }}>{row.email}</span>
        </div>
      )
    },
    {
      key: 'institution',
      header: 'Institution',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5" style={{ color: GOV.textMuted }} />
          <span className="text-sm" style={{ color: GOV.text }}>
            {row.institution?.name || row.organization || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: row.isActive ? '#dcfce7' : '#fee2e2',
            color: row.isActive ? '#166534' : '#991b1b'
          }}
        >
          {row.isActive ? (
            <>
              <UserCheck className="w-3 h-3" /> Active
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3" /> Inactive
            </>
          )}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-sm" style={{ color: GOV.textMuted }}>
          {new Date(row.createdAt).toLocaleDateString('en-ZA')}
        </span>
      )
    }
  ];

  if (loading) return <LoadingState message="Loading test administrators..." />;
  if (error) return <ErrorBanner message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: GOV.text }}>
            Test Administrators
          </h2>
          <p className="text-sm mt-1" style={{ color: GOV.textMuted }}>
            Manage test administrators who can create and monitor test takers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
          style={{ backgroundColor: GOV.blue }}
        >
          <Plus className="w-4 h-4" />
          Create Test Administrator
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: GOV.textMuted }} />
        <input
          type="text"
          placeholder="Search by name, email, code, or organization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          style={{ borderColor: GOV.border, color: GOV.text }}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={filteredAdministrators}
        rowKey="id"
        pageSize={10}
        emptyTitle="No test administrators found"
        emptyMessage="Create your first test administrator to get started."
        toolbar={(
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-bold" style={{ color: GOV.text }}>
              All Test Administrators
            </h3>
            <span className="text-xs" style={{ color: GOV.textMuted }}>
              {filteredAdministrators.length} total
            </span>
          </div>
        )}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: GOV.text }}>
              Create Test Administrator
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: GOV.text }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: GOV.border, color: GOV.text }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: GOV.text }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: GOV.border, color: GOV.text }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: GOV.text }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: GOV.border, color: GOV.text }}
                />
                <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>
                  Login credentials will be sent to this email
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: GOV.text }}>
                  Institution (Optional)
                </label>
                <select
                  value={formData.institutionId}
                  onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: GOV.border, color: GOV.text }}
                >
                  <option value="">No institution</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: GOV.text }}>
                  Organization (Optional)
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  style={{ borderColor: GOV.border, color: GOV.text }}
                  placeholder="e.g., Ministry of Education"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ firstName: '', lastName: '', email: '', institutionId: '', organization: '' });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg font-semibold"
                  style={{ borderColor: GOV.border, color: GOV.text }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: GOV.blue }}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestAdministratorsPanel;
