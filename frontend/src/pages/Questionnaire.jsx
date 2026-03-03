import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, GraduationCap, Loader2 } from 'lucide-react';
import api from '../services/api';

const SECTIONS = [
  { id: 'activities', label: 'Activities', description: 'Do you like doing these activities?' },
  { id: 'competencies', label: 'Competencies', description: 'Can you do these things?' },
  { id: 'occupations', label: 'Occupations', description: 'Are you interested in these occupations?' },
  { id: 'self_estimates', label: 'Self-Estimates', description: 'Rate your abilities (1 = low, 6 = high)' }
];

const Questionnaire = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [questionsBySection, setQuestionsBySection] = useState({});
  const [answers, setAnswers] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sectionId = SECTIONS[currentSectionIndex]?.id;
  const sectionQuestions = questionsBySection[sectionId] || [];
  const currentQuestion = sectionQuestions[currentQuestionIndex];
  const isSelfEstimates = sectionId === 'self_estimates';
  const totalSections = SECTIONS.length;
  const totalQuestions = Object.values(questionsBySection).reduce((sum, q) => sum + q.length, 0);
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const loadQuestions = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/assessments/questions');
      const list = res.data?.data?.questions || [];
      const bySection = {};
      SECTIONS.forEach((s) => {
        bySection[s.id] = list.filter((q) => q.section === s.id).sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      setQuestionsBySection(bySection);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load questions');
    }
  }, []);

  const startOrResumeAssessment = useCallback(async () => {
    try {
      const res = await api.post('/api/v1/assessments');
      const data = res.data?.data?.assessment;
      if (data) setAssessment(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to start assessment');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      await loadQuestions();
      await startOrResumeAssessment();
      setLoading(false);
    })();
  }, [loadQuestions, startOrResumeAssessment]);

  const saveProgress = useCallback(
    async (newAnswers) => {
      if (!assessment?.id || !Object.keys(newAnswers).length) return;
      const payload = Object.entries(newAnswers).map(([qId, value]) => {
        const q = Object.values(questionsBySection)
          .flat()
          .find((x) => x.id === qId);
        return q ? { questionId: q.id, value, section: q.section, riasecType: q.riasecType } : null;
      }).filter(Boolean);
      if (!payload.length) return;
      setSaving(true);
      try {
        await api.post(`/api/v1/assessments/${assessment.id}/progress`, { answers: payload });
      } finally {
        setSaving(false);
      }
    },
    [assessment?.id, questionsBySection]
  );

  const setAnswer = (questionId, value) => {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    saveProgress({ [questionId]: value });
  };

  const goNext = () => {
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    } else if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex((i) => i + 1);
      setCurrentQuestionIndex(0);
    } else {
      handleComplete();
    }
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex((i) => i - 1);
      const prevSection = questionsBySection[SECTIONS[currentSectionIndex - 1].id] || [];
      setCurrentQuestionIndex(prevSection.length - 1);
    }
  };

  const handleComplete = async () => {
    if (!assessment?.id || totalQuestions === 0) return;
    if (answeredCount < totalQuestions) {
      setError(`Please answer all questions (${answeredCount}/${totalQuestions} answered).`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/v1/assessments/${assessment.id}/complete`);
      navigate('/test-complete', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit. You may need to answer all 228 questions.');
      setSubmitting(false);
    }
  };

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const canAdvance = isSelfEstimates ? currentAnswer != null : currentAnswer !== undefined && currentAnswer !== '';
  const isLastQuestion =
    currentSectionIndex === totalSections - 1 && currentQuestionIndex === sectionQuestions.length - 1;

  if (loading || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading assessment…</p>
        </div>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 h-14 flex items-center px-6">
        <div className="flex-1 flex items-center gap-2 text-slate-800 font-semibold">
          <div className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span>SDS</span>
        </div>
        <div className="text-sm text-slate-600">
          Progress: {progressPercent}% {saving && <span className="text-indigo-500">Saving…</span>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6">
          <p className="text-sm text-slate-500">
            Section {currentSectionIndex + 1} of {totalSections}: {SECTIONS[currentSectionIndex].label}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Question {currentQuestionIndex + 1} of {sectionQuestions.length} in this section
          </p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {currentQuestion && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 mb-8">
              <h2 className="text-xl font-bold text-slate-900 leading-relaxed">{currentQuestion.text}</h2>
            </div>

            {isSelfEstimates ? (
              <div className="space-y-2 mb-8">
                <p className="text-sm text-slate-600 mb-4">Rate from 1 (low) to 6 (high)</p>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(currentQuestion.id, String(n))}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      currentAnswer === String(n)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {['YES', 'NO'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(currentQuestion.id, opt)}
                    className={`w-full text-left px-4 py-4 rounded-lg border transition-all ${
                      currentAnswer === opt
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-6">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
                className="px-5 py-2 rounded-md text-sm font-medium border border-gray-300 bg-white text-slate-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </span>
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={!canAdvance || submitting}
                  className="px-6 py-2 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting…' : 'Submit test'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance}
                  className="px-6 py-2 rounded-md text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              )}
            </div>
          </>
        )}

        {sectionQuestions.length === 0 && sectionId && (
          <p className="text-slate-500 text-center py-8">No questions in this section.</p>
        )}
      </div>
    </div>
  );
};

export default Questionnaire;
