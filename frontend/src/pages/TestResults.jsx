import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';

const RIASEC_LABELS = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional'
};

const TestResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const assessmentIdFromState = location.state?.assessmentId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let assessmentId = assessmentIdFromState;

    const fetchResults = async () => {
      try {
        if (!assessmentId) {
          const listRes = await api.get('/api/v1/assessments');
          const list = listRes.data?.data?.assessments || [];
          const completed = list.find((a) => a.status === 'completed');
          if (!completed) {
            setError('No completed assessment found. Complete a test first.');
            setLoading(false);
            return;
          }
          assessmentId = completed.id;
        }

        const res = await api.get(`/api/v1/results/${assessmentId}`);
        const payload = res.data?.data;
        if (payload) setData(payload);
        else setError('Results not found.');
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [assessmentIdFromState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <p className="text-slate-700 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-100 text-slate-700 rounded-lg hover:bg-gray-200"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/test')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Take test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const assessment = data?.assessment || {};
  const recommendations = data?.recommendations || [];
  const scores = {
    R: assessment.scoreR ?? 0,
    I: assessment.scoreI ?? 0,
    A: assessment.scoreA ?? 0,
    S: assessment.scoreS ?? 0,
    E: assessment.scoreE ?? 0,
    C: assessment.scoreC ?? 0
  };
  const maxScore = Math.max(...Object.values(scores), 1);
  const hollandCode = assessment.hollandCode || '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">Your SDS Career Test Results</h1>
          <p className="text-slate-600 leading-relaxed max-w-4xl text-sm">
            Congratulations on completing your Self-Directed Search (SDS) Career Test! Below you will find your RIASEC scores, Holland Code, and career recommendations.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 text-sm font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Your RIASEC Scores</h3>
            <p className="text-xs text-slate-500 mb-4">Your interests across the six RIASEC dimensions.</p>
            <div className="space-y-3">
              {Object.entries(scores).map(([key, score]) => (
                <div key={key} className="space-y-1">
                  <div className="text-xs text-slate-500">{RIASEC_LABELS[key]}</div>
                  <div className="w-full bg-gray-100 rounded-full h-7 flex items-center overflow-hidden">
                    <div
                      className="bg-indigo-600 h-7 text-white text-xs font-semibold px-3 flex items-center"
                      style={{ width: `${Math.min((score / maxScore) * 100, 100)}%` }}
                    >
                      {score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Your Holland Code</h3>
            <p className="text-xs text-slate-500 mb-4">Your top three interest areas.</p>
            <p className="text-2xl font-bold text-indigo-700">
              {hollandCode.split('').map((c) => RIASEC_LABELS[c] || c).join(' – ')}
            </p>
            <p className="text-sm text-slate-600 mt-2">Code: {hollandCode}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-2">Career Recommendations</h3>
          <p className="text-xs text-slate-500 mb-4">Careers aligned with your profile.</p>
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((occ) => (
                <div key={occ.id} className="flex items-start gap-3">
                  <div className="bg-indigo-50 text-indigo-700 w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{occ.name}</p>
                    {occ.description && (
                      <p className="text-slate-600 text-sm leading-relaxed mt-1">{occ.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No specific recommendations in the database for this code. Discuss options with a career counselor.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResults;
