import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, FileCheck, TrendingUp, Eye, Building2 } from 'lucide-react';
import api from '../services/api';

const CounsellorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [studentsRes, statsRes, instRes] = await Promise.all([
          api.get('/api/v1/counselor/students'),
          api.get('/api/v1/counselor/institution-stats').catch(() => ({ data: { data: null } })),
          api.get('/api/v1/institutions')
        ]);
        setStudents(studentsRes.data?.data?.students || []);
        setStats(statsRes.data?.data || null);
        setInstitutions(instRes.data?.data?.institutions || []);
      } catch {
        setStudents([]);
        setStats(null);
        setInstitutions([]);
      }
    };
    load();
  }, []);

  const recentTests = students.map((s) => ({
    id: s.id,
    student: `${s.firstName} ${s.lastName}`,
    email: s.email,
    latestAssessment: s.latestAssessment,
    date: s.latestAssessment?.completedAt || s.latestAssessment?.createdAt,
    status: s.latestAssessment?.status === 'completed' ? 'Completed' : s.latestAssessment?.status === 'in_progress' ? 'In Progress' : 'Pending',
    score: s.latestAssessment?.status === 'completed' ? (s.latestAssessment?.hollandCode || '–') : (s.latestAssessment?.progress != null ? `${Math.round(s.latestAssessment.progress)}%` : '–'),
    assessmentId: s.latestAssessment?.id
  })).filter((t) => t.latestAssessment).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const totalStudents = students.length;
  const completedCount = recentTests.filter((t) => t.status === 'Completed').length;
  const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
  const statCards = [
    { title: 'Total Students', value: String(totalStudents), icon: Users, color: 'bg-blue-50 text-blue-600' },
    { title: 'Tests Completed', value: String(completedCount), icon: FileCheck, color: 'bg-green-50 text-green-600' },
    { title: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800">Welcome back, {user?.firstName || 'Counsellor'}!</h1>
        <p className="text-slate-500 mt-2">Manage your students and track their progress. Last login: Today at 8:30 AM.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
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
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Recent Test Activity</h3>
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
                {recentTests.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No students with assessments yet.</td></tr>
                )}
                {recentTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{test.student}</p>
                        <p className="text-xs text-slate-400">{test.email || '–'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{test.date ? new Date(test.date).toLocaleDateString() : '–'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">SDS Assessment</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={test.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{test.score}</td>
                    <td className="px-6 py-4">
                      {test.status === 'Completed' && test.assessmentId && (
                        <button
                          type="button"
                          onClick={() => navigate('/results', { state: { assessmentId: test.assessmentId } })}
                          className="text-indigo-600 hover:text-indigo-700 text-sm"
                        >
                          View results
                        </button>
                      )}
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

        {/* Student list summary */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Your students</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-50 p-4">
            {students.slice(0, 10).map((s) => (
              <div key={s.id} className="py-2">
                <p className="text-sm font-medium text-slate-700">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-slate-500">{s.email || '–'}</p>
              </div>
            ))}
            {students.length === 0 && <p className="text-slate-500 text-sm">No students assigned.</p>}
            {students.length > 10 && <p className="text-slate-400 text-xs pt-2">+ {students.length - 10} more</p>}
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
