import React, { useEffect, useMemo, useState } from 'react';
import { Users, FileCheck, Activity, ShieldCheck, Building2, Plus, Search } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const AdminDashboard = () => {
  // Mock Data for Charts
  const riasecData = [
    { name: 'R', value: 75 }, { name: 'I', value: 68 }, { name: 'A', value: 55 },
    { name: 'S', value: 82 }, { name: 'E', value: 70 }, { name: 'C', value: 60 },
  ];

  const [activeTab, setActiveTab] = useState('users');
  const [institutions, setInstitutions] = useState([]);
  const [instSearch, setInstSearch] = useState('');
  const [newInst, setNewInst] = useState({ name: '', type: 'school', region: 'hhohho' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const res = await api.get('/api/v1/institutions');
        setInstitutions(res.data?.data?.institutions || []);
      } catch (err) {
        setInstitutions([]);
      }
    };
    loadInstitutions();
  }, []);

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
        <MetricCard title="Total Users" value="15,245" Icon={Users} />
        <MetricCard title="Tests Completed" value="8,912" Icon={FileCheck} />
        <MetricCard title="Active Users (30 Days)" value="3,100" Icon={Activity} />
        <MetricCard title="Institutions Registered" value={institutions.length.toString()} Icon={Building2} />
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
          <div className="p-6 border-b flex justify-between items-center">
            <h3 className="font-bold">Test Taker Management</h3>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Apply Filters</button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-slate-500 uppercase">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Score</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <TableRow name="Alice Johnson" email="alice.j@example.com" status="Completed" score="85%" />
              <TableRow name="Bob Williams" email="bob.w@example.com" status="In Progress" score="60%" />
            </tbody>
          </table>
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

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="RIASEC Score Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={riasecData}><Bar dataKey="value" fill="#5D5FEF" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Test Completion Rates">
            {/* Donut Chart logic here */}
        </ChartCard>
      </div>
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

const TableRow = ({ name, email, status, score }) => (
  <tr className="hover:bg-gray-50">
    <td className="p-4 font-medium">{name}</td>
    <td className="p-4 text-slate-500">{email}</td>
    <td className="p-4">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }`}>
        {status}
      </span>
    </td>
    <td className="p-4 font-medium">{score}</td>
    <td className="p-4">
      <button className="text-blue-600 hover:text-blue-700 text-sm">View Details</button>
    </td>
  </tr>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h3 className="font-bold text-slate-800 mb-4">{title}</h3>
    {children}
  </div>
);

export default AdminDashboard;
