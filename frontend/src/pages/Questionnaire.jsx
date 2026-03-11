import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Cloud, Loader2, PauseCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { GOV, TYPO } from '../theme/government';
import AssessmentShell from '../components/layout/AssessmentShell';

const SECTIONS = [
  { id: 'activities', num: 'I', label: 'Activities', description: 'Would you like to do this activity?' },
  { id: 'competencies', num: 'II', label: 'Competencies', description: 'Can you do this or have you done this?' },
  { id: 'occupations', num: 'III', label: 'Occupations', description: 'Would you like this kind of work?' },
  { id: 'self_estimates', num: 'IV', label: 'Self-Rating', description: 'Rate yourself compared to other people your age' }
];

const RATING_LABELS = [
  { value: '1', label: 'Low' },
  { value: '2', label: 'Below Average' },
  { value: '3', label: 'Average' },
  { value: '4', label: 'Above Average' },
  { value: '5', label: 'High' },
  { value: '6', label: 'Highest' }
];

const RIASEC_COLORS = {
  R: '#dc2626', I: '#2563eb', A: '#7c3aed',
  S: '#059669', E: '#d97706', C: '#1e3a5f'
};
const RIASEC_NAMES = {
  R: 'Realistic', I: 'Investigative', A: 'Artistic',
  S: 'Social', E: 'Enterprising', C: 'Conventional'
};

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
  const [startTime] = useState(Date.now());
  const [selectedAnimation, setSelectedAnimation] = useState(null);

  const sectionId = SECTIONS[currentSectionIndex]?.id;
  const sectionQuestions = questionsBySection[sectionId] || [];
  const currentQuestion = sectionQuestions[currentQuestionIndex];
  const isSelfEstimates = sectionId === 'self_estimates';
  const totalSections = SECTIONS.length;
  const totalQuestions = Object.values(questionsBySection).reduce((sum, q) => sum + q.length, 0);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQuestions > 0 && answeredCount >= totalQuestions;
  const rawProgressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const progressPercent = allAnswered ? 100 : Math.floor(rawProgressPercent);
  const currentSectionMeta = SECTIONS[currentSectionIndex];

  const loadQuestions = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/assessments/questions');
      const list = res.data?.data?.questions || [];
      if (!list.length) {
        setError('No assessment questions found. Please run backend seed/setup to load the SDS question bank.');
      }
      const bySection = {};
      SECTIONS.forEach((s) => {
        bySection[s.id] = list.filter((q) => q.section === s.id).sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      setQuestionsBySection(bySection);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load questions');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      await loadQuestions();
      try {
        const res = await api.post('/api/v1/assessments');
        const data = res.data?.data?.assessment;
        if (data) {
          setAssessment(data);
          try {
            const progRes = await api.get(`/api/v1/assessments/${data.id}/progress`);
            const saved = progRes.data?.data?.answers || {};
            if (Object.keys(saved).length) setAnswers(saved);
          } catch (_) {
            // non-fatal — start with empty answers
          }
        } else {
          setError('Failed to initialize assessment. Please try again.');
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to start assessment');
      }
      setLoading(false);
    })();
  }, [loadQuestions]);

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
    
    // Trigger selection animation
    setSelectedAnimation(value);
    setTimeout(() => setSelectedAnimation(null), 400);
    
    // Auto-advance to next question after brief feedback delay
    const isLast =
      currentSectionIndex === totalSections - 1 &&
      currentQuestionIndex === (questionsBySection[sectionId] || []).length - 1;
    if (!isLast) {
      setTimeout(() => goNext(), 400);
    }
  };

  const goNext = () => {
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    } else if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex((i) => i + 1);
      setCurrentQuestionIndex(0);
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

  // Calculate estimated time remaining
  const avgTimePerQuestion = 8; // seconds
  const remainingQuestions = totalQuestions - answeredCount;
  const estimatedMinutes = Math.ceil((remainingQuestions * avgTimePerQuestion) / 60);

  // Keyboard navigation
  useEffect(() => {
    if (!currentQuestion || loading) return;

    const handleKeyDown = (e) => {
      // Prevent keyboard nav if user is typing
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Arrow navigation
      if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight' && canAdvance && !isLastQuestion) {
        e.preventDefault();
        goNext();
      }

      // YES/NO questions: Y/N or 1/2
      if (!isSelfEstimates) {
        if (e.key === 'y' || e.key === 'Y' || e.key === '1') {
          e.preventDefault();
          setAnswer(currentQuestion.id, 'YES');
        } else if (e.key === 'n' || e.key === 'N' || e.key === '2') {
          e.preventDefault();
          setAnswer(currentQuestion.id, 'NO');
        }
      }

      // Rating questions: 1-6
      if (isSelfEstimates) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 6) {
          e.preventDefault();
          setAnswer(currentQuestion.id, String(num));
        }
      }

      // Enter to advance if answered
      if (e.key === 'Enter' && canAdvance && !isLastQuestion) {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, currentQuestionIndex, canAdvance, isLastQuestion, isSelfEstimates, loading]);

  if (loading || (!assessment && !error)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: GOV.blue }} />
          <p style={{ color: GOV.textMuted }}>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-md p-6 max-w-md text-center">
          <p className="mb-4" style={{ color: GOV.error }}>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white rounded-md"
            style={{ backgroundColor: GOV.blue }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AssessmentShell
      title="Self-Directed Search (SDS)"
      contextLabel={currentSectionMeta ? `Section ${currentSectionMeta.num}: ${currentSectionMeta.label}` : 'Assessment'}
      actions={(
        <>
          {saving && (
            <div className={`${TYPO.bodySmall} inline-flex items-center gap-1.5 px-3 py-2 rounded-md`} style={{ color: GOV.blue, backgroundColor: GOV.blueLightAlt }}>
              <Cloud className="w-4 h-4" /> Saving...
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-white"
            style={{ color: GOV.text }}
            aria-label="Pause assessment and return to dashboard"
            title="Pause and return to dashboard"
          >
            <PauseCircle className="w-4 h-4" /> Pause
          </button>
          {allAnswered && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#16a34a' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </>
      )}
    >
      {error && (
        <div className="p-3 rounded-md text-sm border" style={{ backgroundColor: GOV.errorBg, borderColor: GOV.errorBorder, color: GOV.error }}>
          {error}
        </div>
      )}

      {currentQuestion && (
        <div className="bg-white rounded-md p-6 md:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color: GOV.textMuted }}>
                {currentSectionMeta?.description} · Question {currentQuestionIndex + 1} of {sectionQuestions.length}
              </p>
              <div className="flex items-center gap-2">
                {currentQuestion.questionCode && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono"
                    style={{
                      backgroundColor: `${RIASEC_COLORS[currentQuestion.riasecType] || GOV.blue}08`,
                      color: RIASEC_COLORS[currentQuestion.riasecType] || GOV.blue
                    }}
                  >
                    {currentQuestion.questionCode}
                  </span>
                )}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: `${RIASEC_COLORS[currentQuestion.riasecType] || GOV.blue}08`,
                    color: RIASEC_COLORS[currentQuestion.riasecType] || GOV.blue
                  }}
                >
                  {RIASEC_NAMES[currentQuestion.riasecType] || currentQuestion.riasecType}
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-bold leading-relaxed" style={{ color: GOV.text }}>{currentQuestion.text}</h2>
          </div>

          {isSelfEstimates ? (
            <div className="space-y-3 mb-8">
              <p className="text-sm mb-4" style={{ color: GOV.textMuted }}>Compare yourself to other people your age and select a rating:</p>
              {RATING_LABELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAnswer(currentQuestion.id, value)}
                  className={`w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-200 ${
                    currentAnswer === value
                      ? 'font-semibold shadow-sm scale-[0.98]'
                      : 'hover:border-gray-300 hover:scale-[1.01]'
                  } ${
                    selectedAnimation === value ? 'animate-pulse' : ''
                  }`}
                  style={currentAnswer === value
                    ? { borderColor: GOV.blue, backgroundColor: GOV.blueLightAlt, color: GOV.blue }
                    : { borderColor: GOV.borderLight, backgroundColor: '#ffffff', color: GOV.text }}
                >
                  <span className="font-mono mr-3 text-base">{value}</span><span className="text-base">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {['YES', 'NO'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(currentQuestion.id, opt)}
                  className={`w-full text-center px-6 py-5 rounded-lg border-2 transition-all duration-200 text-lg font-semibold ${
                    currentAnswer === opt
                      ? 'shadow-sm scale-[0.98]'
                      : 'hover:border-gray-300 hover:scale-[1.01]'
                  } ${
                    selectedAnimation === opt ? 'animate-pulse' : ''
                  }`}
                  style={currentAnswer === opt
                    ? { borderColor: GOV.blue, backgroundColor: GOV.blueLightAlt, color: GOV.blue }
                    : { borderColor: GOV.borderLight, backgroundColor: '#ffffff', color: GOV.text }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="border-t pt-6 mt-6" style={{ borderColor: GOV.borderLight }}>
            <div className="flex items-center justify-between text-xs mb-3" style={{ color: GOV.textHint }}>
              <div className="flex items-center gap-4">
                <span>{answeredCount} of {totalQuestions} answered</span>
                {remainingQuestions > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{estimatedMinutes} min remaining
                  </span>
                )}
              </div>
              <span>{progressPercent}% complete</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-6" style={{ backgroundColor: GOV.borderLight }}>
              <div
                className="h-full transition-all duration-300"
                style={{ backgroundColor: GOV.blue, width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-md text-sm font-semibold border bg-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ borderColor: GOV.border, color: GOV.text }}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              {allAnswered && (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={submitting}
                  className="px-6 py-2 rounded-md text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  {submitting ? 'Submitting...' : 'Submit test'}
                </button>
              )}
              {!isLastQuestion && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-md text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ backgroundColor: GOV.blue }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {sectionQuestions.length === 0 && sectionId && (
        <div className="bg-white rounded-md p-8 text-center text-sm" style={{ color: GOV.textMuted }}>
          No questions in this section.
        </div>
      )}
    </AssessmentShell>
  );
};

export default Questionnaire;
