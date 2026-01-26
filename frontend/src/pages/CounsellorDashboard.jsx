import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, FileCheck, Calendar, TrendingUp, Search, Filter, Download, Eye, Building2 } from 'lucide-react';
import api from '../services/api';

const CounsellorDashboard = () => {
  const { user } = useAuth();

  // Mock data for the dashboard
  const stats = [
    { title: 'Total Students', value: '156', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { title: 'Tests Completed', value: '89', icon: FileCheck, color: 'bg-green-50 text-green-600' },
    { title: 'Appointments Today', value: '4', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { title: 'Completion Rate', value: '78%', icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
  ];

  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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

  const recentTests = [
    { id: 1, student: 'Alice Johnson', date: '2024-01-25', status: 'Completed', score: '85%', type: 'SDS Assessment', institutionId: 'inst-1', institutionName: 'UNESWA' },
    { id: 2, student: 'Bob Smith', date: '2024-01-24', status: 'In Progress', score: '45%', type: 'SDS Assessment', institutionId: 'inst-2', institutionName: 'ECOT' },
    { id: 3, student: 'Carol Davis', date: '2024-01-24', status: 'Completed', score: '92%', type: 'SDS Assessment', institutionId: 'inst-1', institutionName: 'UNESWA' },
    { id: 4, student: 'David Wilson', date: '2024-01-23', status: 'Pending', score: '-', type: 'SDS Assessment', institutionId: 'inst-3', institutionName: 'SANU' },
  ];

  const filteredTests = useMemo(() => {
    if (!selectedInstitution) return recentTests;
    return recentTests.filter((t) => t.institutionId === selectedInstitution);
  }, [recentTests, selectedInstitution]);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const res = await api.get('/api/v1/results/export', {
        params: { institutionId: selectedInstitution || undefined, format: format.toLowerCase() },
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: format === 'CSV' ? 'text/csv' : 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report${selectedInstitution ? `-${selectedInstitution}` : ''}.${format === 'CSV' ? 'csv' : 'pdf'}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // optional: add toast/notification
    } finally {
      setIsExporting(false);
    }
  };

  const appointments = [
    { id: 1, student: 'Emma Thompson', time: '09:00 AM', type: 'Career Guidance', status: 'Confirmed' },
    { id: 2, student: 'Frank Miller', time: '10:30 AM', type: 'Results Review', status: 'Confirmed' },
    { id: 3, student: 'Grace Lee', time: '02:00 PM', type: 'Career Guidance', status: 'Pending' },
    { id: 4, student: 'Henry Brown', time: '03:30 PM', type: 'Follow-up', status: 'Confirmed' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800">Welcome back, {user?.firstName || 'Counsellor'}!</h1>
        <p className="text-slate-500 mt-2">Manage your students and track their progress. Last login: Today at 8:30 AM.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Tests - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-800">Recent Test Activity</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Building2 className="w-4 h-4" />
                  <select
                    className="border border-gray-200 rounded-md px-3 py-1 text-sm"
                    value={selectedInstitution}
                    onChange={(e) => setSelectedInstitution(e.target.value)}
                  >
                    <option value="">All institutions</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1 text-slate-600"
                    onClick={() => handleExport('CSV')}
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-xs">CSV</span>
                  </button>
                  <button
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1 text-slate-600"
                    onClick={() => handleExport('PDF')}
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-xs">PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{test.student}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" /> {test.institutionName || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{test.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{test.type}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={test.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{test.score}</td>
                    <td className="px-6 py-4">
                      <button className="text-slate-600 hover:text-slate-700 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50/50 text-xs text-slate-400 italic text-center">
            Showing recent test activity from your assigned students
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Today's Appointments</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{appointment.student}</p>
                    <p className="text-xs text-slate-500 mt-1">{appointment.time}</p>
                    <p className="text-xs text-slate-400 mt-1">{appointment.type}</p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50/50 text-center">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All Appointments</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    'Completed': 'bg-green-50 text-green-600 border-green-100',
    'In Progress': 'bg-blue-50 text-blue-600 border-blue-100',
    'Pending': 'bg-yellow-50 text-yellow-600 border-yellow-100',
    'Confirmed': 'bg-green-50 text-green-600 border-green-100',
  };
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {status}
    </span>
  );
};

export default CounsellorDashboard;
