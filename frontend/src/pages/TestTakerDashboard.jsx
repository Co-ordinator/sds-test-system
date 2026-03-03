import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, FileText, GraduationCap, Loader2 } from 'lucide-react';
import api from '../services/api';

const TestTakerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const res = await api.get('/api/v1/assessments');
        setAssessments(res.data?.data?.assessments || []);
      } catch {
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  const inProgress = assessments.find((a) => a.status === 'in_progress');
  const completed = assessments.filter((a) => a.status === 'completed');
  const progressPercent = inProgress ? Math.round(Number(inProgress.progress) || 0) : 0;

  const viewResults = (assessmentId) => {
    navigate('/results', { state: { assessmentId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 h-14 flex items-center px-6">
        <div className="flex-1 flex items-center gap-2 text-slate-800 font-semibold">
          <div className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center bg-white">
            <GraduationCap className="w-5 h-5 text-slate-700" />
          </div>
          <span>SDS</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/profile" className="text-slate-600 hover:text-slate-900">Profile</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.firstName || 'Student'}!</h1>
          <p className="text-slate-500 mt-2">
            {inProgress
              ? 'Continue your assessment or view past results below.'
              : 'Start a new SDS assessment or view your past results.'}
          </p>
        </div>

        {inProgress && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-slate-900">Your Test Status</h2>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">In Progress</span>
            </div>
            <p className="text-slate-500 mb-6">Current status of your Self-Directed Search assessment.</p>
            <button
              type="button"
              onClick={() => navigate('/test')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-2.5 rounded-md font-semibold shadow-sm transition-colors"
            >
              Resume Test
            </button>
            <div className="mt-8">
              <div className="h-2 rounded-full bg-indigo-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-2 font-semibold">Progress: {progressPercent}%</div>
            </div>
          </div>
        )}

        {!inProgress && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Start a new assessment</h2>
            <p className="text-slate-500 mb-6">Take the Self-Directed Search career assessment (~45 minutes).</p>
            <button
              type="button"
              onClick={() => navigate('/test')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-2.5 rounded-md font-semibold shadow-sm"
            >
              Start Test
            </button>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2 text-slate-900">
            <Clock className="w-5 h-5 text-slate-500" />
            <span className="font-semibold">Past assessments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-600 text-xs tracking-wide bg-gray-50">
                <tr>
                  <th className="pb-3 pt-3 px-4">Date</th>
                  <th className="pb-3 pt-3 px-4">Status</th>
                  <th className="pb-3 pt-3 px-4">Holland Code</th>
                  <th className="pb-3 pt-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {completed.length === 0 && !inProgress && (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center text-slate-500">
                      No assessments yet.
                    </td>
                  </tr>
                )}
                {completed.map((a) => (
                  <tr key={a.id} className="align-middle">
                    <td className="py-3 px-4 text-slate-600">
                      {a.completedAt
                        ? new Date(a.completedAt).toLocaleDateString()
                        : new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-blue-50 text-blue-600 border-blue-100">
                        Completed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{a.hollandCode || '–'}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => viewResults(a.id)}
                        className="border border-gray-300 text-slate-700 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-50"
                      >
                        View Results
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTakerDashboard;
