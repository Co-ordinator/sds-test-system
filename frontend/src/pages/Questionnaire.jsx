import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Cloud, Loader2, PauseCircle, Clock, BookOpen, HelpCircle, LayoutDashboard, Volume2 } from 'lucide-react';
import api from '../services/api';
import { GOV, TYPO } from '../theme/government';
import AssessmentShell from '../components/layout/AssessmentShell';
import { QuestionTextWithGlossary, DescriptionWithGlossary } from '../components/ui/SmartTextHighlighter';
import { useAccessibility } from '../context/AccessibilityContext';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
  { 
    id: 'activities', 
    num: 'I', 
    label: 'Activities', 
    description: 'Click Yes for activities you like to do or would like to do. Click No for activities you are indifferent to, have never done, or do not like to do.',
    transitionNarrative: [
      'Section I asks about activities. In the printed SDS booklet, the instruction is to shade YES or NO. In this system, the same action means clicking the YES or NO button.',
      'Click YES for the activities you LIKE TO DO or think you WOULD LIKE TO DO.',
      'Click NO for the activities you are INDIFFERENT TO, HAVE NEVER DONE, or DO NOT LIKE TO DO.',
      'There are no correct or incorrect answers. Answer according to your honest interests, not according to what other people may expect.'
    ]
  },
  { 
    id: 'competencies', 
    num: 'II', 
    label: 'Competencies', 
    description: 'Click Yes for activities you have knowledge of or can do well or competently. Click No for activities you have little or no knowledge of, have never performed, or perform poorly.',
    transitionNarrative: [
      'The next section changes from what you like to do to what you know about or can do well.',
      'Choose YES for activities that you have knowledge of, or that you can do well or competently. Choose NO for activities that you have little or no knowledge of, have never performed, or perform poorly.',
      'Answer honestly based on your current knowledge and ability. This helps the assessment compare your interests with the skills and competencies you already recognize in yourself.'
    ]
  },
  { 
    id: 'occupations', 
    num: 'III', 
    label: 'Occupations', 
    description: 'Click Yes for occupations or jobs that interest or appeal to you. Click No for occupations or jobs you dislike or find uninteresting.',
    transitionNarrative: [
      'The next section is about your feelings and attitudes toward many kinds of work.',
      'Choose YES for occupations or jobs that interest or appeal to you. Choose NO for occupations or jobs you dislike or find uninteresting.',
      'Focus on your own reaction to the occupation itself. You do not need to know everything about the job before deciding whether it interests you.'
    ]
  },
  { 
    id: 'self_estimates', 
    num: 'IV', 
    label: 'Rating of Your Abilities and Skills',
    description: 'Rate yourself on a scale of 1 to 6 compared to other people your age. Give the most accurate estimate of how you see yourself.',
    transitionNarrative: [
      'This section consists of two groups, GROUP I and GROUP II, of six abilities or skills each on which you must rate yourself.',
      'Rate yourself on a scale of 1 to 6 on each of these abilities or skills. Rate yourself as you really think you are when compared with other persons of your own age.',
      'Give the most accurate estimate of how you see yourself.',
      'Avoid giving yourself the same rating for each ability or skill.',
      'In this system, select the number you give yourself for each ability or skill. Your response will be saved automatically before you move to the next item.',
      'Examples: If someone rates mechanical ability as low in comparison with people of the same age, they should choose 2. If someone rates scientific ability as high, but not quite as high as some other people of the same age, they should choose 5.'
    ]
  }
];

const ROMAN_LABEL_SPEECH_VALUES = [
  ['IV', '4'],
  ['III', '3'],
  ['II', '2'],
  ['I', '1']
];

const getSectionSpeechNumber = (section) =>
  ROMAN_LABEL_SPEECH_VALUES.find(([roman]) => roman === section?.num)?.[1] || section?.num || '';

const normalizeRomanLabelsForSpeech = (text = '') =>
  ROMAN_LABEL_SPEECH_VALUES.reduce(
    (value, [roman, number]) =>
      value
        .replace(new RegExp(`\\b(Section)\\s+${roman}\\b`, 'gi'), `$1 ${number}`)
        .replace(new RegExp(`\\b(Group)\\s+${roman}\\b`, 'gi'), `$1 ${number}`),
    String(text)
  );

const RATING_LABELS = [
  { value: '1', label: 'Very Low' },
  { value: '2', label: 'Low' },
  { value: '3', label: 'Low Average' },
  { value: '4', label: 'High Average' },
  { value: '5', label: 'High' },
  { value: '6', label: 'Very High' }
];

const SECTION_IV_GROUP_I_ROWS = [
  {
    number: '1.',
    text: 'I rate my mechanical ability (fixing things, using tools and machines) as:',
    code: 'R'
  },
  {
    number: '2.',
    text: 'I rate my scientific ability (biology, chemistry and problem solving) as:',
    code: 'I'
  },
  {
    number: '3.',
    text: 'I rate my artistic ability (music, art and drama) as:',
    code: 'A'
  },
  {
    number: '4.',
    text: 'I rate my teaching ability (helping others learn) as:',
    code: 'S'
  },
  {
    number: '5.',
    text: 'I rate my sales ability (selling or managing) as:',
    code: 'E'
  },
  {
    number: '6.',
    text: 'I rate my clerical ability (numbers, spelling and filing papers) as:',
    code: 'C'
  }
];

const SECTION_IV_GROUP_II_ROWS = [
  {
    number: '7.',
    text: 'I rate my manual skills as:',
    code: 'R'
  },
  {
    number: '8.',
    text: 'I rate my mathematical ability as:',
    code: 'I'
  },
  {
    number: '9.',
    text: 'I rate my musical ability as:',
    code: 'A'
  },
  {
    number: '10.',
    text: 'I rate my friendliness as:',
    code: 'S'
  },
  {
    number: '11.',
    text: 'I rate my managerial skills as:',
    code: 'E'
  },
  {
    number: '12.',
    text: 'I rate my office skills as:',
    code: 'C'
  }
];

const SECTION_IV_RATING_GROUPS = [
  { label: 'GROUP I', rows: SECTION_IV_GROUP_I_ROWS },
  { label: 'GROUP II', rows: SECTION_IV_GROUP_II_ROWS }
];

const RIASEC_COLORS = {
  R: '#F44336', I: '#2563eb', A: '#7c3aed',
  S: '#059669', E: '#d97706', C: '#2D8BC4'
};
const RIASEC_NAMES = {
  R: 'Realistic', I: 'Investigative', A: 'Artistic',
  S: 'Social', E: 'Enterprising', C: 'Conventional'
};

/** AppShell desktop nav: text-only links, no border (admin / test-taker menu). */
const NAV_TEXT_ACTION =
  'inline-flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium transition-colors rounded-md hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent';

const TEST_NAV_BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

const SECTION_NEXT_BUTTON =
  'w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm sm:text-base font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const ExampleChoice = ({ label, selected }) => (
  <span
    className="inline-flex min-w-12 items-center justify-center rounded-full border px-3 py-1 text-xs font-bold"
    style={{
      backgroundColor: selected ? GOV.text : '#ffffff',
      borderColor: selected ? GOV.text : GOV.border,
      color: selected ? '#ffffff' : GOV.text
    }}
  >
    {label}
  </span>
);

const SectionOneInstructionExample = () => (
  <div className="mt-5 rounded-md border bg-white p-4 sm:p-5" style={{ borderColor: GOV.borderLight }}>
    <h3 className="text-sm font-bold tracking-wide mb-4" style={{ color: GOV.text }}>
      SECTION I: ACTIVITIES
    </h3>
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <p className="text-sm leading-relaxed font-semibold" style={{ color: GOV.text }}>
          Click <strong>YES</strong> for the activities you LIKE TO DO or think you WOULD LIKE TO DO.
        </p>
        <div className="flex items-center gap-2 md:justify-end" aria-label="Example yes selected">
          <span className="text-xs font-semibold" style={{ color: GOV.textMuted }}>Example:</span>
          <ExampleChoice label="YES" selected />
          <ExampleChoice label="NO" selected={false} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <p className="text-sm leading-relaxed font-semibold" style={{ color: GOV.text }}>
          Click <strong>NO</strong> for the activities you are INDIFFERENT TO, HAVE NEVER DONE, or DO NOT LIKE TO DO.
        </p>
        <div className="flex items-center gap-2 md:justify-end" aria-label="Example no selected">
          <span className="text-xs font-semibold" style={{ color: GOV.textMuted }}>Example:</span>
          <ExampleChoice label="YES" selected={false} />
          <ExampleChoice label="NO" selected />
        </div>
      </div>
    </div>
  </div>
);

const SectionFourRatingGuide = () => (
  <div className="mt-5 rounded-md border bg-white overflow-hidden" style={{ borderColor: GOV.borderLight }}>
    <div className="px-4 py-3 border-b" style={{ borderColor: GOV.borderLight }}>
      <p className="text-sm font-bold" style={{ color: GOV.text }}>Section IV Rating Guide</p>
      <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>
        Use this guide when selecting your rating in the system.
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm" aria-label="Section 4 rating scale for Group 1 and Group 2">
        <thead>
          <tr className="border-b" style={{ borderColor: GOV.borderLight }}>
            <th className="px-4 py-3 text-left font-semibold" style={{ color: GOV.textMuted }} scope="col">
              Item
            </th>
            {RATING_LABELS.map(({ value, label }) => (
              <th key={`section-iv-scale-${value}`} className="px-3 py-3 text-center font-semibold" style={{ color: GOV.text }} scope="col">
                <span className="block leading-tight">{label}</span>
                <span className="block mt-1 font-mono text-xs" style={{ color: GOV.textMuted }}>{value}</span>
              </th>
            ))}
            <th className="px-3 py-3 text-center font-semibold" style={{ color: GOV.textMuted }} scope="col">
              Code
            </th>
          </tr>
        </thead>
        <tbody>
          {SECTION_IV_RATING_GROUPS.map((group) => (
            <React.Fragment key={group.label}>
              <tr style={{ backgroundColor: GOV.blueLightAlt }}>
                <th
                  colSpan={RATING_LABELS.length + 2}
                  className="px-4 py-2 text-left text-xs font-bold tracking-wide"
                  style={{ color: GOV.text }}
                  scope="colgroup"
                >
                  {group.label}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.number} className="border-b last:border-b-0" style={{ borderColor: GOV.borderLight }}>
                  <th className="px-4 py-3 text-left font-medium align-top" style={{ color: GOV.text }} scope="row">
                    <span className="mr-3 font-mono" style={{ color: GOV.textMuted }}>{row.number}</span>
                    <span>{row.text}</span>
                  </th>
                  {RATING_LABELS.map(({ value }) => (
                    <td key={`${row.number}-${value}`} className="px-3 py-3 text-center font-mono font-semibold" style={{ color: GOV.text }}>
                      {value}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center font-bold" style={{ color: RIASEC_COLORS[row.code] || GOV.text }}>
                    ({row.code})
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    <div className="px-4 py-3 border-t" style={{ borderColor: GOV.borderLight }}>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: GOV.text }}>Example 1</p>
          <p className="text-xs leading-relaxed" style={{ color: GOV.textMuted }}>
            If mechanical ability feels low compared with people of your age, select <strong>2</strong>.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: GOV.text }}>Example 2</p>
          <p className="text-xs leading-relaxed" style={{ color: GOV.textMuted }}>
            If scientific ability feels high, but not the very highest, select <strong>5</strong>.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const SectionGuideSupplement = ({ sectionId }) => {
  if (sectionId === 'activities') return <SectionOneInstructionExample />;
  if (sectionId === 'self_estimates') return <SectionFourRatingGuide />;
  return null;
};

const getTimerStorageKey = (assessmentId) => `sds_assessment_timer_${assessmentId}`;
const getPositionStorageKey = (assessmentId) => `sds_assessment_position_${assessmentId}`;

const getResumePosition = (savedAnswers = {}, sectionQuestionMap = {}) => {
  for (let sectionIndex = 0; sectionIndex < SECTIONS.length; sectionIndex += 1) {
    const sectionQuestions = sectionQuestionMap[SECTIONS[sectionIndex].id] || [];
    for (let questionIndex = 0; questionIndex < sectionQuestions.length; questionIndex += 1) {
      const questionId = sectionQuestions[questionIndex]?.id;
      const answer = savedAnswers[questionId];
      if (answer === undefined || answer === null || answer === '') {
        return { sectionIndex, questionIndex };
      }
    }
  }

  for (let sectionIndex = SECTIONS.length - 1; sectionIndex >= 0; sectionIndex -= 1) {
    const sectionQuestions = sectionQuestionMap[SECTIONS[sectionIndex].id] || [];
    if (sectionQuestions.length > 0) {
      return { sectionIndex, questionIndex: sectionQuestions.length - 1 };
    }
  }

  return { sectionIndex: 0, questionIndex: 0 };
};

const hasAnswerValue = (value) => value !== undefined && value !== null && value !== '';

const buildQuestionReviewItems = (questionsBySection = {}) => {
  let globalNumber = 0;
  return SECTIONS.flatMap((section, sectionIndex) => (
    (questionsBySection[section.id] || []).map((question, questionIndex) => {
      globalNumber += 1;
      return {
        section,
        sectionIndex,
        question,
        questionIndex,
        globalNumber
      };
    })
  ));
};

const SkippedQuestionsPanel = ({ skippedQuestions, onJump }) => {
  if (!skippedQuestions.length) return null;

  return (
    <aside
      className="fixed inset-x-3 top-20 z-50 max-h-[34vh] overflow-hidden rounded-md border bg-white shadow-2xl sm:inset-x-4 sm:top-24 md:inset-x-auto md:bottom-4 md:right-4 md:top-28 md:w-72 md:max-h-none"
      style={{ borderColor: GOV.border }}
      role="complementary"
      aria-label="Skipped questions review panel"
    >
      <div className="flex items-start gap-2 border-b px-3 py-2.5" style={{ borderColor: GOV.borderLight }}>
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: '#fef3c7' }}>
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#d97706' }} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold" style={{ color: GOV.text }}>Skipped questions</h2>
            <p className="mt-0.5 text-[11px] leading-snug" style={{ color: GOV.textMuted }}>
              {skippedQuestions.length} question{skippedQuestions.length === 1 ? '' : 's'} need an answer before you submit.
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[calc(34vh-5.75rem)] overflow-y-auto px-2.5 py-2.5 md:max-h-[calc(100vh-13rem)]">
        <div className="space-y-1.5">
          {skippedQuestions.map((item) => {
            const color = RIASEC_COLORS[item.question.riasecType] || GOV.blue;
            const sectionLabel = `Section ${item.section.num}`;
            const questionText = item.question.text || 'Question text unavailable';
            return (
              <button
                key={item.question.id}
                type="button"
                onClick={() => onJump(item)}
                className="w-full rounded-md border bg-white p-2.5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                style={{ borderColor: GOV.borderLight }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold" style={{ color: GOV.text }}>
                    Question {item.globalNumber}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: `${color}14`, color }}
                  >
                    {item.question.questionCode || item.question.riasecType || sectionLabel}
                  </span>
                </div>
                <p className="text-[11px] font-semibold" style={{ color: GOV.textMuted }}>
                  {sectionLabel}: {item.section.label}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug" style={{ color: GOV.text }}>
                  {questionText}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t px-3 py-2 text-[11px]" style={{ borderColor: GOV.borderLight, color: GOV.textMuted }}>
        Tap a question to jump back and answer it.
      </div>
    </aside>
  );
};

const Questionnaire = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getAriaLabel, screenReaderMode, highContrast } = useAccessibility();
  const dashboardPath = user?.role === 'System Administrator'
    ? '/admin/dashboard'
    : user?.role === 'Test Administrator'
      ? '/test-administrator'
      : '/dashboard';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [questionsBySection, setQuestionsBySection] = useState({});
  const [answers, setAnswers] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState(null);
  const [sectionTransition, setSectionTransition] = useState(null);
  const [showInitialSectionIntro, setShowInitialSectionIntro] = useState(true);
  const [showResumeSectionIntro, setShowResumeSectionIntro] = useState(false);
  const [showSkippedReviewPanel, setShowSkippedReviewPanel] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [activeNarrationKey, setActiveNarrationKey] = useState(null);
  const hasRestoredPositionRef = useRef(false);

  const sectionId = SECTIONS[currentSectionIndex]?.id;
  const sectionQuestions = questionsBySection[sectionId] || [];
  const currentQuestion = sectionQuestions[currentQuestionIndex];
  const questionReviewItems = useMemo(
    () => buildQuestionReviewItems(questionsBySection),
    [questionsBySection]
  );
  const skippedQuestions = useMemo(
    () => questionReviewItems.filter(({ question }) => !hasAnswerValue(answers[question.id])),
    [answers, questionReviewItems]
  );
  const isSelfEstimates = sectionId === 'self_estimates';
  const totalSections = SECTIONS.length;
  const totalQuestions = questionReviewItems.length;
  const answeredCount = questionReviewItems.reduce(
    (sum, { question }) => sum + (hasAnswerValue(answers[question.id]) ? 1 : 0),
    0
  );
  const allAnswered = totalQuestions > 0 && answeredCount >= totalQuestions;
  const rawProgressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const progressPercent = allAnswered ? 100 : Math.floor(rawProgressPercent);
  const currentSectionMeta = SECTIONS[currentSectionIndex];
  const timerStorageKey = assessment?.id ? getTimerStorageKey(assessment.id) : null;
  const positionStorageKey = assessment?.id ? getPositionStorageKey(assessment.id) : null;
  const isDashboardResume = Boolean(location.state?.resumeAssessment);
  const shouldShowInitialSectionIntro =
    showInitialSectionIntro &&
    !isPaused &&
    !sectionTransition &&
    currentSectionIndex === 0 &&
    currentQuestionIndex === 0 &&
    answeredCount === 0;
  const shouldShowResumeSectionIntro =
    showResumeSectionIntro &&
    !isPaused &&
    !sectionTransition &&
    !shouldShowInitialSectionIntro &&
    Boolean(currentQuestion);

  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopNarration = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setActiveNarrationKey(null);
  }, []);

  const handleNarrationToggle = useCallback((section) => {
    if (!speechSupported || !section) return;

    if (activeNarrationKey === section.id) {
      stopNarration();
      return;
    }

    stopNarration();
    const sectionSpeechNumber = getSectionSpeechNumber(section);
    const speechText = [
      `Up next. Section ${sectionSpeechNumber}: ${section.label}.`,
      ...(section.transitionNarrative || [section.description])
    ].map(normalizeRomanLabelsForSpeech).join(' ');

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setActiveNarrationKey(null);
    utterance.onerror = () => setActiveNarrationKey(null);

    setActiveNarrationKey(section.id);
    window.speechSynthesis.speak(utterance);
  }, [activeNarrationKey, speechSupported, stopNarration]);

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
      setProgressLoaded(false);
      await loadQuestions();
      try {
        const res = await api.post('/api/v1/assessments');
        const data = res.data?.data?.assessment;
        if (data) {
          setAssessment(data);
          try {
            const progRes = await api.get(`/api/v1/assessments/${data.id}/progress`);
            const saved = progRes.data?.data?.answers || {};
            setAnswers(saved);
          } catch (_) {
            setAnswers({});
          } finally {
            setProgressLoaded(true);
          }
        } else {
          setError('Failed to initialize assessment. Please try again.');
          setProgressLoaded(true);
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to start assessment');
        setProgressLoaded(true);
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
      } catch (err) {
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [assessment?.id, questionsBySection]
  );

  const setAnswer = async (questionId, value) => {
    if (saving || isAdvancing || submitting) return;

    const previousValue = answers[questionId];
    setError(null);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setSelectedAnimation(value);
    setIsAdvancing(true);

    try {
      await saveProgress({ [questionId]: value });

      // Only move forward after the response is persisted.
      const isLast =
        currentSectionIndex === totalSections - 1 &&
        currentQuestionIndex === (questionsBySection[sectionId] || []).length - 1;
      if (!isLast) {
        setTimeout(() => {
          goNext();
        }, 200);
      }
    } catch (e) {
      setAnswers((prev) => {
        const restored = { ...prev };
        if (previousValue === undefined) {
          delete restored[questionId];
        } else {
          restored[questionId] = previousValue;
        }
        return restored;
      });
      setError('Could not save your response. Please try again.');
    } finally {
      setTimeout(() => setSelectedAnimation(null), 300);
      setIsAdvancing(false);
    }
  };

  const goNext = () => {
    setError(null);
    if (currentQuestionIndex < sectionQuestions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    } else if (currentSectionIndex < totalSections - 1) {
      setSectionTransition({ from: currentSectionIndex, to: currentSectionIndex + 1 });
    }
  };

  const proceedToNextSection = () => {
    if (sectionTransition) {
      stopNarration();
      setCurrentSectionIndex(sectionTransition.to);
      setCurrentQuestionIndex(0);
      setSectionTransition(null);
    }
  };

  const proceedToInitialSection = () => {
    stopNarration();
    setShowInitialSectionIntro(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const proceedFromResumeSectionIntro = () => {
    stopNarration();
    setShowResumeSectionIntro(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resumeFromPause = () => {
    stopNarration();
    setIsPaused(false);
    setShowResumeSectionIntro(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setError(null);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex((i) => i - 1);
      const prevSection = questionsBySection[SECTIONS[currentSectionIndex - 1].id] || [];
      setCurrentQuestionIndex(prevSection.length - 1);
    }
  };

  const openSkippedReviewPanel = () => {
    if (!skippedQuestions.length) return false;
    stopNarration();
    setError(null);
    setShowSkippedReviewPanel(true);
    return true;
  };

  const jumpToSkippedQuestion = (item) => {
    if (!item) return;
    stopNarration();
    setIsPaused(false);
    setSectionTransition(null);
    setShowInitialSectionIntro(false);
    setShowResumeSectionIntro(false);
    setError(null);
    setCurrentSectionIndex(item.sectionIndex);
    setCurrentQuestionIndex(item.questionIndex);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleComplete = async () => {
    if (!assessment?.id || totalQuestions === 0) return;
    if (skippedQuestions.length > 0) {
      openSkippedReviewPanel();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/v1/assessments/${assessment.id}/complete`);
      if (timerStorageKey) {
        try { localStorage.removeItem(timerStorageKey); } catch (_) {}
      }
      if (positionStorageKey) {
        try { localStorage.removeItem(positionStorageKey); } catch (_) {}
      }
      navigate('/test-complete', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit. You may need to answer all 228 questions.');
      setSubmitting(false);
    }
  };

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const currentRiasecColor = currentQuestion ? (RIASEC_COLORS[currentQuestion.riasecType] || GOV.blue) : GOV.blue;
  const currentRiasecName = currentQuestion ? (RIASEC_NAMES[currentQuestion.riasecType] || currentQuestion.riasecType) : '';
  const canAdvance = isSelfEstimates ? currentAnswer != null : currentAnswer !== undefined && currentAnswer !== '';
  const isLastQuestion =
    currentSectionIndex === totalSections - 1 && currentQuestionIndex === sectionQuestions.length - 1;

  useEffect(() => {
    hasRestoredPositionRef.current = false;
    setShowInitialSectionIntro(true);
    setShowResumeSectionIntro(false);
    setShowSkippedReviewPanel(false);
  }, [assessment?.id]);

  useEffect(() => {
    if (showSkippedReviewPanel && skippedQuestions.length === 0) {
      setShowSkippedReviewPanel(false);
    }
  }, [showSkippedReviewPanel, skippedQuestions.length]);

  // Restore last viewed question for in-progress assessments.
  useEffect(() => {
    if (loading || !progressLoaded || !assessment?.id || hasRestoredPositionRef.current) return;
    const hasQuestions = SECTIONS.some((section) => (questionsBySection[section.id] || []).length > 0);
    if (!hasQuestions) return;

    let restored = false;
    let targetPosition = { sectionIndex: 0, questionIndex: 0 };
    if (positionStorageKey) {
      try {
        const raw = localStorage.getItem(positionStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const parsedSectionIndex = Number(parsed?.sectionIndex);
          const parsedQuestionIndex = Number(parsed?.questionIndex);
          if (Number.isInteger(parsedSectionIndex) && parsedSectionIndex >= 0 && parsedSectionIndex < SECTIONS.length) {
            const targetSectionQuestions = questionsBySection[SECTIONS[parsedSectionIndex].id] || [];
            if (targetSectionQuestions.length > 0) {
              const clampedQuestionIndex = Math.min(
                Math.max(parsedQuestionIndex, 0),
                targetSectionQuestions.length - 1
              );
              setCurrentSectionIndex(parsedSectionIndex);
              setCurrentQuestionIndex(clampedQuestionIndex);
              targetPosition = { sectionIndex: parsedSectionIndex, questionIndex: clampedQuestionIndex };
              restored = true;
            }
          }
        }
      } catch (_) {
        // Ignore malformed local position data.
      }
    }

    if (!restored) {
      const fallbackPosition = getResumePosition(answers, questionsBySection);
      setCurrentSectionIndex(fallbackPosition.sectionIndex);
      setCurrentQuestionIndex(fallbackPosition.questionIndex);
      targetPosition = fallbackPosition;
    }

    const hasSavedAnswers = Object.keys(answers || {}).length > 0;
    const isResumingProgress = hasSavedAnswers || targetPosition.sectionIndex > 0 || targetPosition.questionIndex > 0;
    setShowResumeSectionIntro(isResumingProgress);
    if (isResumingProgress) {
      setShowInitialSectionIntro(false);
    }

    hasRestoredPositionRef.current = true;
  }, [loading, progressLoaded, assessment?.id, answers, questionsBySection, positionStorageKey]);

  // Restore timer state for the active assessment (if previously saved in this browser).
  useEffect(() => {
    if (!timerStorageKey) return;
    try {
      const raw = localStorage.getItem(timerStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Number.isFinite(parsed?.elapsedSeconds)) {
        setElapsedTime(Math.max(0, Math.floor(parsed.elapsedSeconds)));
      }
      if (typeof parsed?.isPaused === 'boolean') {
        setIsPaused(isDashboardResume ? false : parsed.isPaused);
      }
    } catch (_) {
      // Ignore malformed local timer data.
    }
  }, [timerStorageKey, isDashboardResume]);

  // Persist timer state locally so pause/resume survives page reloads.
  useEffect(() => {
    if (!timerStorageKey) return;
    try {
      localStorage.setItem(timerStorageKey, JSON.stringify({
        elapsedSeconds: elapsedTime,
        isPaused,
        updatedAt: new Date().toISOString(),
      }));
    } catch (_) {
      // Ignore storage write failures.
    }
  }, [timerStorageKey, elapsedTime, isPaused]);

  // Persist current section/question so reopening the test returns the user to the same point.
  useEffect(() => {
    if (!positionStorageKey || !assessment || sectionTransition || !hasRestoredPositionRef.current) return;
    try {
      localStorage.setItem(positionStorageKey, JSON.stringify({
        sectionIndex: currentSectionIndex,
        questionIndex: currentQuestionIndex,
        updatedAt: new Date().toISOString(),
      }));
    } catch (_) {
      // Ignore storage write failures.
    }
  }, [positionStorageKey, assessment, sectionTransition, currentSectionIndex, currentQuestionIndex]);

  // Tick elapsed timer every second while the assessment is active.
  useEffect(() => {
    if (isPaused || !assessment) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, assessment]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard navigation
  useEffect(() => {
    if (!currentQuestion || loading || isPaused || sectionTransition || shouldShowInitialSectionIntro || shouldShowResumeSectionIntro) return;

    const handleKeyDown = (e) => {
      // Prevent keyboard nav if user is typing
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (saving || isAdvancing || submitting) return;

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
  }, [currentQuestion, currentQuestionIndex, canAdvance, isLastQuestion, isSelfEstimates, loading, saving, isAdvancing, submitting, isPaused, sectionTransition, shouldShowInitialSectionIntro, shouldShowResumeSectionIntro]);

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
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={NAV_TEXT_ACTION}
              style={{ color: GOV.blue, fontWeight: 600 }}
            >
              Retry
            </button>
            <Link
              to={dashboardPath}
              className="text-sm font-medium hover:underline rounded-md px-1 py-0.5"
              style={{ color: GOV.blue }}
            >
              Back to dashboard
            </Link>
          </div>
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
          <Link
            to={dashboardPath}
            className={`${NAV_TEXT_ACTION} whitespace-nowrap`}
            style={{ color: GOV.textMuted }}
            aria-label="Go to dashboard"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden />
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => navigate('/glossary')}
            className={`${NAV_TEXT_ACTION} whitespace-nowrap`}
            style={{ color: GOV.textMuted }}
            aria-label="Open SDS glossary"
          >
            <HelpCircle className="w-4 h-4 shrink-0" aria-hidden />
            Glossary
          </button>
          {saving && (
            <span className={`${NAV_TEXT_ACTION} pointer-events-none whitespace-nowrap`} style={{ color: GOV.blue }}>
              <Cloud className="w-4 h-4 shrink-0" aria-hidden /> Saving...
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsPaused(p => !p)}
            className={`${NAV_TEXT_ACTION} whitespace-nowrap`}
            style={{ color: isPaused ? '#d97706' : GOV.textMuted }}
            aria-label={isPaused ? 'Resume assessment' : 'Pause assessment'}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            <PauseCircle className="w-4 h-4 shrink-0" aria-hidden /> {isPaused ? 'Resume' : 'Pause'}
          </button>
          {allAnswered && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={submitting}
              className={`${NAV_TEXT_ACTION} whitespace-nowrap`}
              style={{ color: '#16a34a', fontWeight: 700 }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
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

      {showSkippedReviewPanel && !isPaused && skippedQuestions.length > 0 && (
        <SkippedQuestionsPanel
          skippedQuestions={skippedQuestions}
          onJump={jumpToSkippedQuestion}
        />
      )}

      {isPaused && !sectionTransition && (
        <div className="bg-white rounded-lg border p-6 md:p-8 shadow-sm" style={{ borderColor: GOV.border }}>
          <div className="mx-auto max-w-xl text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#fef3c7' }}>
              <PauseCircle className="w-8 h-8" style={{ color: '#d97706' }} />
            </div>

            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#d97706' }}>
              Paused
            </p>
            <h2 className="text-2xl font-bold mb-2" style={{ color: GOV.text }}>
              Assessment Paused
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: GOV.textMuted }}>
              Your progress has been saved. When you resume, you will first review this section's instructions, then continue from where you stopped.
            </p>

            <div className="rounded-md border bg-white p-4 mb-6 text-left" style={{ borderColor: GOV.borderLight }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-semibold" style={{ color: GOV.text }}>Saved progress</span>
                <span className="text-sm font-bold" style={{ color: GOV.blue }}>{progressPercent}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: GOV.blueLightAlt }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(progressPercent, 100)}%`, backgroundColor: GOV.blue }}
                />
              </div>
              <p className="mt-2 text-xs" style={{ color: GOV.textMuted }}>
                {answeredCount} of {totalQuestions} questions answered
              </p>
            </div>

            <button
              type="button"
              onClick={resumeFromPause}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: GOV.blue }}
            >
              Resume assessment
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {shouldShowInitialSectionIntro && (() => {
        const firstSection = SECTIONS[0];
        const firstSectionNarrative = firstSection.transitionNarrative || [firstSection.description];
        const isNarratingFirstSection = activeNarrationKey === firstSection.id;
        const firstSectionSpeechNumber = getSectionSpeechNumber(firstSection);
        return (
          <div className="bg-white rounded-md p-8 md:p-12 text-center">
            <div className="max-w-4xl mx-auto rounded-lg p-5 md:p-6 text-left" style={{ backgroundColor: GOV.blueLightAlt }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#ffffff' }}
                    aria-hidden="true"
                  >
                    <BookOpen className="w-5 h-5" style={{ color: GOV.blue }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GOV.textMuted }}>
                      Before You Begin
                    </p>
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: GOV.text }}>
                      Section {firstSection.num}: {firstSection.label}
                    </h2>
                  </div>
                </div>

                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => handleNarrationToggle(firstSection)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ backgroundColor: '#ffffff', borderColor: GOV.border, color: GOV.blue }}
                    aria-label={isNarratingFirstSection ? `Stop reading Section ${firstSectionSpeechNumber} instructions aloud` : `Read Section ${firstSectionSpeechNumber} instructions aloud`}
                  >
                    <Volume2 className={`w-4 h-4 ${isNarratingFirstSection ? 'animate-pulse' : ''}`} aria-hidden="true" />
                    {isNarratingFirstSection ? 'Stop Audio' : 'Read Aloud'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {firstSectionNarrative.map((paragraph, index) => (
                  <p key={`${firstSection.id}-initial-${index}`} className="text-sm leading-relaxed" style={{ color: GOV.textMuted }}>
                    <DescriptionWithGlossary text={paragraph} maxHighlights={4} />
                  </p>
                ))}
              </div>

              <SectionOneInstructionExample />
            </div>

            <button
              type="button"
              onClick={proceedToInitialSection}
              className={`${SECTION_NEXT_BUTTON} mt-8`}
              style={{ backgroundColor: GOV.blue, borderColor: GOV.blue }}
            >
              <span>Start section {firstSection.num}: {firstSection.label}</span>
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            </button>
          </div>
        );
      })()}

      {shouldShowResumeSectionIntro && (() => {
        const resumeSection = currentSectionMeta;
        const resumeSectionNarrative = resumeSection.transitionNarrative || [resumeSection.description];
        const isNarratingResumeSection = activeNarrationKey === resumeSection.id;
        const resumeSectionSpeechNumber = getSectionSpeechNumber(resumeSection);
        return (
          <div className="bg-white rounded-md p-8 md:p-12 text-center">
            <div className="max-w-4xl mx-auto rounded-lg p-5 md:p-6 text-left" style={{ backgroundColor: GOV.blueLightAlt }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#ffffff' }}
                    aria-hidden="true"
                  >
                    <BookOpen className="w-5 h-5" style={{ color: GOV.blue }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GOV.textMuted }}>
                      Resume Your Assessment
                    </p>
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: GOV.text }}>
                      Section {resumeSection.num}: {resumeSection.label}
                    </h2>
                    <p className="text-xs mt-2" style={{ color: GOV.textMuted }}>
                      Review these instructions, then continue from Question {currentQuestionIndex + 1} of {sectionQuestions.length}.
                    </p>
                  </div>
                </div>

                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => handleNarrationToggle(resumeSection)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ backgroundColor: '#ffffff', borderColor: GOV.border, color: GOV.blue }}
                    aria-label={isNarratingResumeSection ? `Stop reading Section ${resumeSectionSpeechNumber} instructions aloud` : `Read Section ${resumeSectionSpeechNumber} instructions aloud`}
                  >
                    <Volume2 className={`w-4 h-4 ${isNarratingResumeSection ? 'animate-pulse' : ''}`} aria-hidden="true" />
                    {isNarratingResumeSection ? 'Stop Audio' : 'Read Aloud'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {resumeSectionNarrative.map((paragraph, index) => (
                  <p key={`${resumeSection.id}-resume-${index}`} className="text-sm leading-relaxed" style={{ color: GOV.textMuted }}>
                    <DescriptionWithGlossary text={paragraph} maxHighlights={4} />
                  </p>
                ))}
              </div>

              <SectionGuideSupplement sectionId={resumeSection.id} />
            </div>

            <button
              type="button"
              onClick={proceedFromResumeSectionIntro}
              className={`${SECTION_NEXT_BUTTON} mt-8`}
              style={{ backgroundColor: GOV.blue, borderColor: GOV.blue }}
            >
              <span>Resume at Question {currentQuestionIndex + 1}</span>
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            </button>
          </div>
        );
      })()}

      {sectionTransition && (() => {
        const completedSection = SECTIONS[sectionTransition.from];
        const nextSection = SECTIONS[sectionTransition.to];
        const nextSectionNarrative = nextSection.transitionNarrative || [nextSection.description];
        const isNarratingNextSection = activeNarrationKey === nextSection.id;
        const nextSectionSpeechNumber = getSectionSpeechNumber(nextSection);
        return (
          <div className="bg-white rounded-md p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#f0fdf4' }}>
              <CheckCircle2 className="w-9 h-9" style={{ color: '#16a34a' }} />
            </div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: GOV.text }}>Section {completedSection.num} Complete!</h2>
            <p className="text-sm mb-6" style={{ color: GOV.textMuted }}>You have completed the <strong>{completedSection.label}</strong> section.</p>

            <div className="max-w-4xl mx-auto rounded-lg p-5 md:p-6 mb-8 text-left" style={{ backgroundColor: GOV.blueLightAlt }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#ffffff' }}
                    aria-hidden="true"
                  >
                    <BookOpen className="w-5 h-5" style={{ color: GOV.blue }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GOV.textMuted }}>
                      Up Next - Section {nextSection.num}
                    </p>
                    <p className="text-base font-bold" style={{ color: GOV.text }}>{nextSection.label}</p>
                  </div>
                </div>

                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => handleNarrationToggle(nextSection)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ backgroundColor: '#ffffff', borderColor: GOV.border, color: GOV.blue }}
                    aria-label={isNarratingNextSection ? `Stop reading Section ${nextSectionSpeechNumber} instructions aloud` : `Read Section ${nextSectionSpeechNumber} instructions aloud`}
                  >
                    <Volume2 className={`w-4 h-4 ${isNarratingNextSection ? 'animate-pulse' : ''}`} aria-hidden="true" />
                    {isNarratingNextSection ? 'Stop Audio' : 'Read Aloud'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {nextSectionNarrative.map((paragraph, index) => (
                  <p key={`${nextSection.id}-transition-${index}`} className="text-sm leading-relaxed" style={{ color: GOV.textMuted }}>
                    <DescriptionWithGlossary text={paragraph} maxHighlights={4} />
                  </p>
                ))}
              </div>

              {nextSection.id === 'self_estimates' && (
                <div className="mt-5 rounded-md border bg-white overflow-hidden" style={{ borderColor: GOV.borderLight }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: GOV.borderLight }}>
                    <p className="text-sm font-bold" style={{ color: GOV.text }}>Section IV Rating Guide</p>
                    <p className="text-xs mt-1" style={{ color: GOV.textMuted }}>
                      Use this guide when selecting your rating in the system.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm" aria-label="Section 4 rating scale for Group 1 and Group 2">
                      <thead>
                        <tr className="border-b" style={{ borderColor: GOV.borderLight }}>
                          <th className="px-4 py-3 text-left font-semibold" style={{ color: GOV.textMuted }} scope="col">
                            Item
                          </th>
                          {RATING_LABELS.map(({ value, label }) => (
                            <th key={`section-iv-scale-${value}`} className="px-3 py-3 text-center font-semibold" style={{ color: GOV.text }} scope="col">
                              <span className="block leading-tight">{label}</span>
                              <span className="block mt-1 font-mono text-xs" style={{ color: GOV.textMuted }}>{value}</span>
                            </th>
                          ))}
                          <th className="px-3 py-3 text-center font-semibold" style={{ color: GOV.textMuted }} scope="col">
                            Code
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {SECTION_IV_RATING_GROUPS.map((group) => (
                          <React.Fragment key={group.label}>
                            <tr style={{ backgroundColor: GOV.blueLightAlt }}>
                              <th
                                colSpan={RATING_LABELS.length + 2}
                                className="px-4 py-2 text-left text-xs font-bold tracking-wide"
                                style={{ color: GOV.text }}
                                scope="colgroup"
                              >
                                {group.label}
                              </th>
                            </tr>
                            {group.rows.map((row) => (
                              <tr key={row.number} className="border-b last:border-b-0" style={{ borderColor: GOV.borderLight }}>
                                <th className="px-4 py-3 text-left font-medium align-top" style={{ color: GOV.text }} scope="row">
                                  <span className="mr-3 font-mono" style={{ color: GOV.textMuted }}>{row.number}</span>
                                  <span>{row.text}</span>
                                </th>
                                {RATING_LABELS.map(({ value }) => (
                                  <td key={`${row.number}-${value}`} className="px-3 py-3 text-center font-mono font-semibold" style={{ color: GOV.text }}>
                                    {value}
                                  </td>
                                ))}
                                <td className="px-3 py-3 text-center font-bold" style={{ color: RIASEC_COLORS[row.code] || GOV.text }}>
                                  ({row.code})
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t" style={{ borderColor: GOV.borderLight }}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: GOV.text }}>Example 1</p>
                        <p className="text-xs leading-relaxed" style={{ color: GOV.textMuted }}>
                          If mechanical ability feels low compared with people of your age, select <strong>2</strong>.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold mb-1" style={{ color: GOV.text }}>Example 2</p>
                        <p className="text-xs leading-relaxed" style={{ color: GOV.textMuted }}>
                          If scientific ability feels high, but not the very highest, select <strong>5</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={proceedToNextSection}
              className={SECTION_NEXT_BUTTON}
              style={{ backgroundColor: GOV.blue, borderColor: GOV.blue }}
            >
              <span>Start section {nextSection.num}: {nextSection.label}</span>
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            </button>
          </div>
        );
      })()}

      {!isPaused && !sectionTransition && !shouldShowInitialSectionIntro && !shouldShowResumeSectionIntro && currentQuestion && (
        <div className="bg-white rounded-md p-6 md:p-8">
          <div className="mb-6">
            <div
              className="mb-4 rounded-md border bg-white px-4 py-3"
              style={{ borderColor: GOV.borderLight, borderLeft: `4px solid ${currentRiasecColor}` }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: GOV.textMuted }}>
                Section {currentSectionMeta?.num} Instruction
              </p>
              <p className="text-sm leading-relaxed" style={{ color: GOV.textMuted }}>
                <DescriptionWithGlossary text={currentSectionMeta?.description} />
              </p>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: GOV.text }}>
                Question {currentQuestionIndex + 1} of {sectionQuestions.length}
              </span>
              {currentQuestion.questionCode && (
                <span
                  className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold font-mono"
                  style={{
                    backgroundColor: `${currentRiasecColor}14`,
                    borderColor: `${currentRiasecColor}66`,
                    color: currentRiasecColor
                  }}
                >
                  {currentQuestion.questionCode}
                </span>
              )}
              <span
                className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold"
                style={{
                  backgroundColor: `${currentRiasecColor}14`,
                  borderColor: `${currentRiasecColor}66`,
                  color: currentRiasecColor
                }}
              >
                {currentRiasecName}
              </span>
            </div>
            <QuestionTextWithGlossary 
              questionText={currentQuestion.text}
              riasecType={currentRiasecName}
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
                  disabled={saving || isAdvancing || submitting}
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
                  disabled={saving || isAdvancing || submitting}
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={saving || isAdvancing || submitting || (currentSectionIndex === 0 && currentQuestionIndex === 0)}
              className={`${TEST_NAV_BUTTON_BASE} flex-1 sm:flex-none border bg-white`}
              style={{ color: GOV.textMuted, borderColor: GOV.border }}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden /> Back
            </button>

            <div className="flex flex-1 items-center justify-end gap-2">
              {(allAnswered || isLastQuestion) && canAdvance && (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={saving || isAdvancing || submitting}
                  className={`${TEST_NAV_BUTTON_BASE} flex-1 sm:flex-none text-white`}
                  style={{ backgroundColor: '#16a34a' }}
                >
                  {submitting ? 'Submitting...' : 'Submit test'}
                </button>
              )}
              {!allAnswered && !isLastQuestion && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance || saving || isAdvancing || submitting}
                  className={`${TEST_NAV_BUTTON_BASE} flex-1 sm:flex-none text-white`}
                  style={{ backgroundColor: GOV.blue }}
                >
                  Next <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
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

