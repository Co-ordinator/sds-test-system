import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, ChevronRight, Clock, Users, AlertCircle, Volume2 } from 'lucide-react';
import AssessmentShell from '../components/layout/AssessmentShell';
import GlossaryTooltip from '../components/ui/GlossaryTooltip';
import { GOV, TYPO } from '../theme/government';

const introSpeechText = `
About the Self-Directed Search.
The Self-Directed Search, or SDS, is a career interest questionnaire. Its purpose is to help determine your career interests, because these interests are important when you make a career decision.

Important Note.
This is a questionnaire and not a test. There are therefore no correct or incorrect answers. Your honest responses help the system give you career guidance that better reflects your real interests and abilities.

How the SDS Works.
The questionnaire looks for patterns in the kinds of activities, abilities, and work environments that fit you. Those patterns are converted into an SDS code, also called a Holland code, which is used as a starting point for career guidance.

How to Answer.
Read each instruction screen carefully before you begin that part of the questionnaire. Answer every item by clicking the response that best represents you.

Answering Rules.
All questions must be answered. Each question requires only one response. Questions should not be skipped. Answer honestly based on what is true for you, not what other people may expect.

Before You Begin.
Find a quiet place where you can focus without interruptions. The questionnaire takes approximately 30 to 40 minutes to complete. You can pause and resume at any time; your progress will be saved. Answer honestly based on your true interests and abilities. Do not worry about what others might think. Be yourself. Use the help button if you need clarification on terms.
`.trim();

const QuestionnaireIntro = () => {
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleReadAloud = useCallback(() => {
    if (!speechSupported) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(introSpeechText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, speechSupported]);

  const readAloudButton = speechSupported ? (
    <button
      type="button"
      onClick={handleReadAloud}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ borderColor: GOV.border, color: GOV.blue, backgroundColor: '#fff' }}
      aria-label={isSpeaking ? 'Stop reading questionnaire instructions aloud' : 'Read questionnaire instructions aloud'}
    >
      <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
      {isSpeaking ? 'Stop Audio' : 'Read Aloud'}
    </button>
  ) : null;

  return (
    <>
      {/* Skip to main content for screen readers */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <AssessmentShell
        title="Self-Directed Search (SDS)"
        subtitle="Career Interest Assessment"
        actions={readAloudButton}
        contentClassName="max-w-5xl mx-auto px-6 space-y-6"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 text-left space-y-6 flex-1">

        {/* Main Orientation Content */}
        <div className="bg-white rounded-md border p-6" style={{ borderColor: GOV.border }}>
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: GOV.blueLightAlt }}
            >
              <BookOpen className="w-6 h-6" style={{ color: GOV.blue }} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: GOV.text }}>
                About the Self-Directed Search
              </h2>
              <p className={TYPO.body} style={{ color: GOV.textMuted }}>
                The Self-Directed Search (SDS) is a career interest <GlossaryTooltip term="Questionnaire">questionnaire</GlossaryTooltip>.
                Its purpose is to determine your <GlossaryTooltip term="Career Interest">career interests</GlossaryTooltip>,
                because these interests are important when you make a career decision.
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="p-4 rounded-md" style={{ backgroundColor: GOV.blueLightAlt }}>
              <p className={`${TYPO.bodySmall} font-semibold mb-2 flex items-center gap-2`} style={{ color: GOV.blue }}>
                <AlertCircle className="w-4 h-4" />
                Important Note
              </p>
              <p className={TYPO.bodySmall} style={{ color: GOV.text }}>
                This is a questionnaire and not a test. There are therefore <strong>no correct or incorrect answers</strong>. 
                Your honest responses help the system provide <GlossaryTooltip term="Career Guidance">career guidance</GlossaryTooltip> that better reflects you.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3" style={{ color: GOV.text }}>
                How the SDS Works
              </h3>
              <p className={TYPO.body} style={{ color: GOV.textMuted }}>
                The SDS looks for patterns in the kinds of <GlossaryTooltip term="Activities">activities</GlossaryTooltip>, abilities,
                and work environments that fit you. Those patterns are converted into an SDS code, also called a Holland code,
                which is used as a starting point for career guidance.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3" style={{ color: GOV.text }}>
                How to Answer
              </h3>
              <p className={`${TYPO.body} mb-3`} style={{ color: GOV.textMuted }}>
                Read each instruction screen carefully before you begin that part of the questionnaire. Answer every item by clicking
                the response that best represents you.
              </p>
              <div className="p-3 rounded-md" style={{ backgroundColor: '#fef3c7' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#d97706' }}>
                  Special Requirements
                </p>
                <ul className="text-sm space-y-1" style={{ color: GOV.text }}>
                  <li>- All questions must be answered</li>
                  <li>- Each question requires only one response</li>
                  <li>- Questions should not be skipped</li>
                  <li>- Answer honestly based on what is true for you</li>
                  <li>- Each part will explain how to answer before it starts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md border p-6" style={{ borderColor: GOV.border }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: GOV.text }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#059669' }} />
            Before You Begin
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: GOV.text }}>
                <Clock className="w-4 h-4" style={{ color: GOV.blue }} />
                Time & Environment
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: GOV.blue }} />
                  <span className={TYPO.body} style={{ color: GOV.textMuted }}>
                    Find a quiet place where you can focus without interruptions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: GOV.blue }} />
                  <span className={TYPO.body} style={{ color: GOV.textMuted }}>
                    The questionnaire takes approximately 30-40 minutes to complete
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: GOV.blue }} />
                  <span className={TYPO.body} style={{ color: GOV.textMuted }}>
                    You can pause and resume at any time - your progress will be saved
                  </span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: GOV.text }}>
                <Users className="w-4 h-4" style={{ color: GOV.blue }} />
                Answering Guidelines
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: GOV.blue }} />
                  <span className={TYPO.body} style={{ color: GOV.textMuted }}>
                    Answer honestly based on your true interests and abilities
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: GOV.blue }} />
                  <span className={TYPO.body} style={{ color: GOV.textMuted }}>
                    Don't worry about what others might think - be yourself
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: GOV.blue }} />
                  <span className={TYPO.body} style={{ color: GOV.textMuted }}>
                    Use the help button (?) if you need clarification on terms
                  </span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Accessibility Notice */}
          <div className="mt-4 p-3 rounded-md" style={{ backgroundColor: GOV.blueLightAlt }}>
            <p className="text-sm" style={{ color: GOV.blue }}>
              This assessment is designed to be accessible. You can adjust accessibility settings in your Profile page.
              Screen reader users can navigate using standard keyboard controls.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => navigate('/questionnaire')}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-md text-base font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: GOV.blue }}
            aria-label="Continue to Section 1 instructions"
          >
            Next: Section I Instructions
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
          </div>
        </div>
        
        {/* Glossary section for screen reader navigation */}
        <div id="glossary-section" className="sr-only">
          <h2>Glossary</h2>
          <p>This assessment includes interactive glossary tooltips. Click on any underlined term with a book icon to see its definition.</p>
        </div>
      </AssessmentShell>
    </>
  );
};

export default QuestionnaireIntro;
