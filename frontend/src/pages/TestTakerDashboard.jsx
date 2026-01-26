import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, FileText, GraduationCap } from 'lucide-react';

const TestTakerDashboard = () => {
  const { user } = useAuth();

  const testHistory = [
    { id: 1, name: 'SDS Career Assessment', date: '2023-09-15', status: 'Completed', riasec: 'R+I+A (Realistic, Investigative, Artistic)' },
    { id: 2, name: 'SDS Career Assessment', date: '2023-10-20', status: 'In Progress', riasec: 'N/A' },
    { id: 3, name: 'SDS Career Assessment', date: '2023-08-01', status: 'Completed', riasec: 'S+E+C (Social, Enterprising, Conventional)' },
    { id: 4, name: 'SDS Career Assessment', date: '2023-07-01', status: 'Expired', riasec: 'N/A' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-200 h-14 flex items-center px-6">
        <div className="flex-1 flex items-center gap-2 text-slate-800 font-semibold">
          <div className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center bg-white">
            <GraduationCap className="w-5 h-5 text-slate-700" />
          </div>
          <span>SDS</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-blue-200" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.firstName || 'Sibusiso'}!</h1>
          <p className="text-slate-500 mt-2">Continue your assessment where you left off. Last accessed on 2023-10-26.</p>
        </div>

        {/* Test Status */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-slate-900">Your Test Status</h2>
            <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-semibold">In Progress</span>
          </div>
          <p className="text-slate-500 mb-6">Current status of your Self-Directed Search assessment.</p>
          <button className="bg-indigo-500/90 hover:bg-indigo-600 text-white px-10 py-2.5 rounded-md font-semibold shadow-sm transition-colors">Resume Test</button>

          <div className="mt-8">
            <div className="h-2 rounded-full bg-indigo-100 overflow-hidden">
              <div className="h-full" style={{ width: '65%', backgroundColor: '#6f6af8' }}></div>
            </div>
            <div className="text-xs text-slate-500 mt-2 font-semibold">Progress: 65%</div>
          </div>
        </div>

        {/* Past Test History */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-slate-900">
            <Clock className="w-5 h-5 text-slate-500" />
            <span className="font-semibold">Past Test History</span>
          </div>
          <div className="px-4 pt-3 text-sm text-slate-500">
            Review your previous Self-Directed Search assessment attempts and results.
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-600 text-xs tracking-wide">
                <tr>
                  <th className="pb-3">Test Name</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">RIASEC Summary</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {testHistory.map((test) => (
                  <tr key={test.id} className="align-middle">
                    <td className="py-3 flex items-center gap-2 text-slate-800 font-medium">
                      <FileText className="w-4 h-4 text-blue-500" />
                      {test.name}
                    </td>
                    <td className="py-3 text-slate-600">{test.date}</td>
                    <td className="py-3"><StatusBadge status={test.status} /></td>
                    <td className="py-3 text-slate-700 text-sm">{test.riasec}</td>
                    <td className="py-3">
                      {test.status === 'Completed' && (
                        <button className="border border-gray-300 text-slate-700 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-50">View Results</button>
                      )}
                      {test.status === 'In Progress' && (
                        <button className="border border-pink-300 text-pink-600 px-3 py-1 rounded text-xs font-semibold hover:bg-pink-50">Resume</button>
                      )}
                      {test.status === 'Expired' && (
                        <span className="text-slate-300 text-xs font-medium">Expired</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 text-xs text-slate-400">This table displays a history of your past Self-Directed Search assessments.</div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    Completed: 'bg-blue-50 text-blue-600 border-blue-100',
    'In Progress': 'bg-pink-50 text-pink-600 border-pink-100',
    Expired: 'bg-gray-100 text-gray-400 border-gray-200',
  };
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${styles[status]}`}>
      {status}
    </span>
  );
};

export default TestTakerDashboard;
