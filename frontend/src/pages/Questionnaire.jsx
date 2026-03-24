import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Cloud, Loader2, PauseCircle, Clock, BookOpen, HelpCircle } from 'lucide-react';
import api from '../services/api';
import { GOV, TYPO } from '../theme/government';
import AssessmentShell from '../components/layout/AssessmentShell';
import { QuestionTextWithGlossary, DescriptionWithGlossary } from '../components/ui/SmartTextHighlighter';
import GlossaryBottomSheet from '../components/ui/GlossaryBottomSheet';
import { useAccessibility } from '../context/AccessibilityContext';

const SECTIONS = [
  { 
    id: 'activities', 
    num: 'I', 
    label: 'Activities', 
    description: 'Click Yes for activities you like to do or would like to do. Click No for activities you are indifferent to, have never done, or do not like to do.' 
  },
  { 
    id: 'competencies', 
    num: 'II', 
    label: 'Competencies', 
    description: 'Click Yes for activities you have knowledge of or can do well or competently. Click No for activities you have little or no knowledge of, have never performed, or perform poorly.' 
  },
  { 
    id: 'occupations', 
    num: 'III', 
    label: 'Occupations', 
    description: 'Click Yes for occupations or jobs that interest or appeal to you. Click No for occupations or jobs you dislike or find uninteresting.' 
  },
  { 
    id: 'self_estimates', 
    num: 'IV', 
    label: 'Self-Rating', 
    description: 'Rate yourself on a scale of 1 to 6 compared to other people your age. Give the most accurate estimate of how you see yourself.' 
  }
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
const ASSESSMENT_RUNTIME_KEY_PREFIX = 'sds-assessment-runtime-';

const getAssessmentRuntimeKey = (assessmentId) => `${ASSESSMENT_RUNTIME_KEY_PREFIX}${assessmentId}`;

const readAssessmentRuntime = (assessmentId) => {
  if (!assessmentId) return null;
  try {
    const raw = localStorage.getItem(getAssessmentRuntimeKey(assessmentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeAssessmentRuntime = (assessmentId, runtime) => {
  if (!assessmentId) return;
  try {
    localStorage.setItem(getAssessmentRuntimeKey(assessmentId), JSON.stringify(runtime));
  } catch {
    // Ignore storage failures in private mode / quota issues
  }
};

const clearAssessmentRuntime = (assessmentId) => {
  if (!assessmentId) return;
  try {
    localStorage.removeItem(getAssessmentRuntimeKey(assessmentId));
  } catch {
    // Ignore storage cleanup failures
  }
};

const isValidResumePosition = (questionsBySection, sectionIndex, questionIndex) => {
  if (!Number.isInteger(sectionIndex) || !Number.isInteger(questionIndex)) return false;
  const section = SECTIONS[sectionIndex];
  if (!section) return false;
  const sectionQuestions = questionsBySection[section.id] || [];
  return questionIndex >= 0 && questionIndex < sectionQuestions.length;
};

const findFirstUnansweredPosition = (questionsBySection, savedAnswers) => {
  const answerMap = savedAnswers || {};

  for (let sectionIndex = 0; sectionIndex < SECTIONS.length; sectionIndex += 1) {
    const sectionId = SECTIONS[sectionIndex].id;
    const sectionQuestions = questionsBySection[sectionId] || [];

    for (let questionIndex = 0; questionIndex < sectionQuestions.length; questionIndex += 1) {
      const question = sectionQuestions[questionIndex];
      const value = answerMap[question.id];
      if (value === undefined || value === null || value === '') {
        return { sectionIndex, questionIndex };
      }
    }
  }

  for (let sectionIndex = SECTIONS.length - 1; sectionIndex >= 0; sectionIndex -= 1) {
    const sectionId = SECTIONS[sectionIndex].id;
    const sectionQuestions = questionsBySection[sectionId] || [];
    if (sectionQuestions.length > 0) {
      return { sectionIndex, questionIndex: sectionQuestions.length - 1 };
    }
  }

  return { sectionIndex: 0, questionIndex: 0 };
};

const Questionnaire = () => {
  const navigate = useNavigate();
  const { getAriaLabel, screenReaderMode, highContrast } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [questionsBySection, setQuestionsBySection] = useState({});
  const [answers, setAnswers] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState(null);
  const [sectionTransition, setSectionTransition] = useState(null);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

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
      return bySection;
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load questions');
      return {};
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const loadedQuestions = await loadQuestions();
      try {
        const res = await api.post('/api/v1/assessments');
        const data = res.data?.data?.assessment;
        if (data) {
          setAssessment(data);
          setElapsedTime(0);
          let savedAnswers = {};
          try {
            const progRes = await api.get(`/api/v1/assessments/${data.id}/progress`);
            savedAnswers = progRes.data?.data?.answers || {};
            if (Object.keys(savedAnswers).length) setAnswers(savedAnswers);
          } catch (_) {
            // non-fatal — start with empty answers
          }
          const runtimeState = readAssessmentRuntime(data.id);
          if (Number.isFinite(runtimeState?.elapsedSeconds) && runtimeState.elapsedSeconds >= 0) {
            setElapsedTime(Math.floor(runtimeState.elapsedSeconds));
          }

          if (isValidResumePosition(loadedQuestions, runtimeState?.sectionIndex, runtimeState?.questionIndex)) {
            setCurrentSectionIndex(runtimeState.sectionIndex);
            setCurrentQuestionIndex(runtimeState.questionIndex);
          } else {
            const resumePosition = findFirstUnansweredPosition(loadedQuestions, savedAnswers);
            setCurrentSectionIndex(resumePosition.sectionIndex);
            setCurrentQuestionIndex(resumePosition.questionIndex);
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
      setSectionTransition({ from: currentSectionIndex, to: currentSectionIndex + 1 });
    }
  };

  const proceedToNextSection = () => {
    if (sectionTransition) {
      setCurrentSectionIndex(sectionTransition.to);
      setCurrentQuestionIndex(0);
      setSectionTransition(null);
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
      const unanswered = totalQuestions - answeredCount;
      setError(`You must answer all questions before submitting. ${unanswered} question${unanswered > 1 ? 's' : ''} remaining (${answeredCount}/${totalQuestions} answered).`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/v1/assessments/${assessment.id}/complete`);
      clearAssessmentRuntime(assessment.id);
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

  // Update elapsed time every second while assessment is active
  useEffect(() => {
    if (isPaused || !assessment) return;
    
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPaused, assessment]);

  // Persist runtime so "Resume Test" returns to the same timer/question
  useEffect(() => {
    if (!assessment?.id) return;

    writeAssessmentRuntime(assessment.id, {
      elapsedSeconds: elapsedTime,
      sectionIndex: currentSectionIndex,
      questionIndex: currentQuestionIndex,
      updatedAt: Date.now()
    });
  }, [assessment?.id, elapsedTime, currentSectionIndex, currentQuestionIndex]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          <button
            type="button"
            onClick={() => setGlossaryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold bg-white border transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: GOV.border, color: GOV.text }}
            aria-label="Open SDS glossary"
          >
            <HelpCircle className="w-4 h-4" />
            Glossary
          </button>
          {saving && (
            <div className={`${TYPO.bodySmall} inline-flex items-center gap-1.5 px-3 py-2 rounded-md`} style={{ color: GOV.blue, backgroundColor: GOV.blueLightAlt }}>
              <Cloud className="w-4 h-4" /> Saving...
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsPaused(p => !p)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold bg-white"
            style={{ color: isPaused ? '#d97706' : GOV.text }}
            aria-label={isPaused ? 'Resume assessment' : 'Pause assessment'}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            <PauseCircle className="w-4 h-4" /> {isPaused ? 'Resume' : 'Pause'}
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

      {isPaused && !sectionTransition && (
        <div className="bg-white rounded-md p-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#fef3c7' }}>
            <PauseCircle className="w-8 h-8" style={{ color: '#d97706' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: GOV.text }}>Assessment Paused</h2>
          <p className="text-sm mb-6" style={{ color: GOV.textMuted }}>Your progress has been saved. Click Resume when you are ready to continue.</p>
          <p className="text-xs mb-6" style={{ color: GOV.textHint }}>{answeredCount} of {totalQuestions} questions answered ({progressPercent}%)</p>
          <button
            type="button"
            onClick={() => setIsPaused(false)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white"
            style={{ backgroundColor: GOV.blue }}
          >
            <ChevronRight className="w-4 h-4" /> Resume Assessment
          </button>
        </div>
      )}

      {sectionTransition && (() => {
        const completedSection = SECTIONS[sectionTransition.from];
        const nextSection = SECTIONS[sectionTransition.to];
        return (
          <div className="bg-white rounded-md p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f0fdf4' }}>
              <CheckCircle2 className="w-9 h-9" style={{ color: '#16a34a' }} />
            </div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: GOV.text }}>Section {completedSection.num} Complete!</h2>
            <p className="text-sm mb-6" style={{ color: GOV.textMuted }}>Well done — you have completed the <strong>{completedSection.label}</strong> section.</p>

            <div className="max-w-md mx-auto rounded-lg p-5 mb-8 text-left" style={{ backgroundColor: GOV.blueLightAlt }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GOV.textMuted }}>Up Next · Section {nextSection.num}</p>
              <p className="text-base font-bold mb-2" style={{ color: GOV.text }}>{nextSection.label}</p>
              <p className="text-sm" style={{ color: GOV.textMuted }}>{nextSection.description}</p>
            </div>

            <button
              type="button"
              onClick={proceedToNextSection}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-md text-sm font-semibold text-white"
              style={{ backgroundColor: GOV.blue }}
            >
              Start Section {nextSection.num}: {nextSection.label} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {!isPaused && !sectionTransition && currentQuestion && (
        <div className="bg-white rounded-md p-6 md:p-8">
          <div className="mb-6">
            <div className="p-3 rounded-md mb-3" style={{ backgroundColor: GOV.blueLightAlt }}>
              <p className="text-sm font-medium" style={{ color: GOV.blue }}>
                <DescriptionWithGlossary text={currentSectionMeta?.description} />
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: GOV.textMuted }}>
                Question {currentQuestionIndex + 1} of {sectionQuestions.length}
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
            <QuestionTextWithGlossary 
              questionText={currentQuestion.text}
              riasecType={RIASEC_NAMES[currentQuestion.riasecType] || currentQuestion.riasecType}
              showRiasecBadge={false}
            />
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
                <div className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: GOV.blue }} />
                  <span className="font-mono font-semibold" style={{ color: GOV.blue }}>
                    {formatTime(elapsedTime)}
                  </span>
                </div>
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

      {/* Glossary Bottom Sheet */}
      <GlossaryBottomSheet
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        initialTerm={currentQuestion ? RIASEC_NAMES[currentQuestion.riasecType] || currentQuestion.riasecType : null}
      />
    </AssessmentShell>
  );
};

export default Questionnaire;
