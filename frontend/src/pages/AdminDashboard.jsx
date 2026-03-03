import React, { useEffect, useMemo, useState } from 'react';
import { Users, FileCheck, Activity, ShieldCheck, Building2, Plus, Search } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [instSearch, setInstSearch] = useState('');
  const [newInst, setNewInst] = useState({ name: '', type: 'school', region: 'hhohho' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const res = await api.get('/api/v1/institutions');
        setInstitutions(res.data?.data?.institutions || []);
      } catch {
        setInstitutions([]);
      }
    };
    loadInstitutions();
  }, []);

  useEffect(() => {
    if (activeTab !== 'users') return;
    const loadUsers = async () => {
      try {
        const res = await api.get('/api/v1/admin/users');
        setUsers(res.data?.data?.users || []);
      } catch {
        setUsers([]);
      }
    };
    loadUsers();
  }, [activeTab]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await api.get('/api/v1/admin/analytics');
        setAnalytics(res.data?.data || null);
      } catch {
        setAnalytics(null);
      }
    };
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab !== 'settings') return;
    const loadAuditLogs = async () => {
      try {
        const res = await api.get('/api/v1/admin/audit-logs');
        setAuditLogs(res.data?.data?.logs || []);
      } catch {
        setAuditLogs([]);
      }
    };
    loadAuditLogs();
  }, [activeTab]);

  const filteredInstitutions = useMemo(() => {
    if (!instSearch) return institutions;
    return institutions.filter((i) => i.name.toLowerCase().includes(instSearch.toLowerCase()));
  }, [institutions, instSearch]);

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    if (!newInst.name) return;
    setIsSaving(true);
    try {
      const res = await api.post('/api/v1/institutions', newInst);
      setInstitutions((prev) => [...prev, res.data.data.institution]);
      setNewInst({ name: '', type: 'school', region: 'hhohho' });
    } catch (err) {
      // could add notification
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Administrator Dashboard</h1>
        <p className="text-slate-500">Comprehensive overview and management of the SDS Test System.</p>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Users" value={analytics?.totals?.users ?? users.length ?? '–'} Icon={Users} />
        <MetricCard title="Tests Completed" value={analytics?.totals?.completedAssessments ?? '–'} Icon={FileCheck} />
        <MetricCard title="Completion Rate" value={analytics?.completionRate != null ? `${analytics.completionRate}%` : '–'} Icon={Activity} />
        <MetricCard title="Institutions" value={institutions.length.toString()} Icon={Building2} />
      </div>

      {/* Tabs / Quick Actions */}
      <div className="flex border-b border-gray-200 gap-8 text-sm font-medium text-slate-500">
        {['users', 'institutions', 'reports', 'settings'].map((tab) => (
          <button
            key={tab}
            className={`pb-4 ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'hover:text-slate-700'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'users' && 'User Management'}
            {tab === 'institutions' && 'Institutions'}
            {tab === 'reports' && 'Reports & Analytics'}
            {tab === 'settings' && 'System Settings'}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-bold text-slate-800">User Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-slate-500 uppercase">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-slate-800">{u.firstName} {u.lastName}</td>
                    <td className="p-4 text-slate-600">{u.email || '–'}</td>
                    <td className="p-4"><span className="capitalize">{u.role}</span></td>
                    <td className="p-4 text-slate-600 capitalize">{u.region || '–'}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-slate-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'institutions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold">Institutions</h3>
              <div className="ml-auto flex items-center gap-2 text-sm text-slate-500">
                <Search className="w-4 h-4" />
                <input
                  className="border border-gray-200 rounded-md px-3 py-1 text-sm"
                  placeholder="Search institutions"
                  value={instSearch}
                  onChange={(e) => setInstSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-slate-500 uppercase">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInstitutions.map((inst) => (
                    <tr key={inst.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-slate-800">{inst.name}</td>
                      <td className="p-4 text-slate-500 capitalize">{inst.type}</td>
                      <td className="p-4 text-slate-500 capitalize">{inst.region || '—'}</td>
                    </tr>
                  ))}
                  {filteredInstitutions.length === 0 && (
                    <tr>
                      <td className="p-4 text-slate-400" colSpan={3}>No institutions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-slate-800">Add Institution</h4>
            </div>
            <form className="space-y-4" onSubmit={handleCreateInstitution}>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Name</label>
                <input
                  className="w-full border border-gray-200 rounded-md px-3 py-2"
                  value={newInst.name}
                  onChange={(e) => setNewInst({ ...newInst, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Type</label>
                  <select
                    className="w-full border border-gray-200 rounded-md px-3 py-2"
                    value={newInst.type}
                    onChange={(e) => setNewInst({ ...newInst, type: e.target.value })}
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
                  <label className="block text-sm text-slate-600 mb-1">Region</label>
                  <select
                    className="w-full border border-gray-200 rounded-md px-3 py-2"
                    value={newInst.region}
                    onChange={(e) => setNewInst({ ...newInst, region: e.target.value })}
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
                className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Add Institution'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'reports' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="RIASEC Averages">
            {analytics.riasecAverages && (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { name: 'R', value: Number(analytics.riasecAverages.avgR || 0) },
                    { name: 'I', value: Number(analytics.riasecAverages.avgI || 0) },
                    { name: 'A', value: Number(analytics.riasecAverages.avgA || 0) },
                    { name: 'S', value: Number(analytics.riasecAverages.avgS || 0) },
                    { name: 'E', value: Number(analytics.riasecAverages.avgE || 0) },
                    { name: 'C', value: Number(analytics.riasecAverages.avgC || 0) }
                  ]}
                >
                  <Bar dataKey="value" fill="#5D5FEF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
          <ChartCard title="Summary">
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Completion rate:</span> {analytics.completionRate}%</p>
              <p><span className="font-medium">Total assessments:</span> {analytics.totals?.assessments ?? '–'}</p>
              <p><span className="font-medium">Completed:</span> {analytics.totals?.completedAssessments ?? '–'}</p>
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-bold text-slate-800">Audit logs (latest 100)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-slate-500 uppercase">
                <tr>
                  <th className="p-4">Time</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-4 text-slate-600">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '–'}</td>
                    <td className="p-4 font-medium">{log.actionType || '–'}</td>
                    <td className="p-4 text-slate-600">{log.description || '–'}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={3} className="p-4 text-slate-400">No audit logs.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, Icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
      <div className="bg-blue-50 p-3 rounded-lg">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h3 className="font-bold text-slate-800 mb-4">{title}</h3>
    {children}
  </div>
);

export default AdminDashboard;
