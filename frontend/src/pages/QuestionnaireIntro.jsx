import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, ChevronRight } from 'lucide-react';
import AssessmentShell from '../components/layout/AssessmentShell';
import { GOV, TYPO } from '../theme/government';

const QuestionnaireIntro = () => {
  const navigate = useNavigate();

  return (
    <AssessmentShell
      title="Self-Directed Search (SDS)"
      subtitle="Career Interest Assessment"
    >
      <div className="max-w-4xl mx-auto space-y-6">
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
                Purpose of this Questionnaire
              </h2>
              <p className={TYPO.body} style={{ color: GOV.textMuted }}>
                The purpose of this questionnaire is to determine your interests, as they will be of importance when you make a career decision.
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="p-4 rounded-md" style={{ backgroundColor: GOV.blueLightAlt }}>
              <p className={`${TYPO.bodySmall} font-semibold mb-2`} style={{ color: GOV.blue }}>
                Important Note
              </p>
              <p className={TYPO.bodySmall} style={{ color: GOV.text }}>
                This is a questionnaire and not a test. There are therefore <strong>no correct or incorrect answers</strong>. 
                Your honest responses will help us provide you with the most accurate career guidance.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3" style={{ color: GOV.text }}>
                What This Questionnaire Contains
              </h3>
              <p className={TYPO.body} style={{ color: GOV.textMuted }}>
                This questionnaire contains a number of questions relating to your activities, competencies, interests in occupations, 
                as well as questions in which you are asked to rate your abilities/skills.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3" style={{ color: GOV.text }}>
                How to Answer
              </h3>
              <p className={`${TYPO.body} mb-3`} style={{ color: GOV.textMuted }}>
                The instructions for answering the questions are given at the top of each section. Read the instructions carefully 
                and then answer the questions that follow. Answer all questions on the questionnaire page by clicking the specific 
                answer you choose.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md border p-6" style={{ borderColor: GOV.border }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: GOV.text }}>
            Section Instructions
          </h2>

          <div className="space-y-5">
            <div className="border-l-4 pl-4" style={{ borderColor: '#dc2626' }}>
              <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: GOV.text }}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#dc2626' }}>I</span>
                Section I: Activities
              </h3>
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                Click <strong>YES</strong> for the activities you <strong>LIKE TO DO</strong> or think you <strong>WOULD LIKE TO DO</strong>.
                <br />
                Click <strong>NO</strong> for the activities you are <strong>INDIFFERENT TO</strong>, <strong>HAVE NEVER DONE</strong>, or <strong>DO NOT LIKE TO DO</strong>.
              </p>
            </div>

            <div className="border-l-4 pl-4" style={{ borderColor: '#2563eb' }}>
              <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: GOV.text }}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#2563eb' }}>II</span>
                Section II: Competencies
              </h3>
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                Click <strong>YES</strong> for those activities that you <strong>HAVE KNOWLEDGE of</strong> or that you <strong>CAN DO WELL</strong> or <strong>COMPETENTLY</strong>.
                <br />
                Click <strong>NO</strong> for those activities that you <strong>HAVE LITTLE or NO KNOWLEDGE of</strong> or that you <strong>HAVE NEVER PERFORMED</strong> or <strong>PERFORM POORLY</strong>.
              </p>
            </div>

            <div className="border-l-4 pl-4" style={{ borderColor: '#7c3aed' }}>
              <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: GOV.text }}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#7c3aed' }}>III</span>
                Section III: Occupations
              </h3>
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                This section concerns your feelings and attitudes regarding many kinds of work. Show the occupations/jobs that <strong>INTEREST or APPEAL TO you</strong> by clicking <strong>YES</strong>.
                <br />
                Show the occupations/jobs that you <strong>DISLIKE or FIND UNINTERESTING</strong> by clicking <strong>NO</strong>.
              </p>
            </div>

            <div className="border-l-4 pl-4" style={{ borderColor: '#059669' }}>
              <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: GOV.text }}>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#059669' }}>IV</span>
                Section IV: Rating of Your Abilities and Skills
              </h3>
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                This section consists of two groups (GROUP I and GROUP II) of six abilities/skills each on which you must rate yourself.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1" style={{ color: GOV.textMuted }}>
                <li className={TYPO.bodySmall}>Rate yourself on a scale of <strong>1 to 6</strong> on each of these abilities or skills</li>
                <li className={TYPO.bodySmall}>Rate yourself as you really think you are when <strong>compared with other persons of your own age</strong></li>
                <li className={TYPO.bodySmall}>Give the most <strong>accurate estimate</strong> of how you see yourself</li>
                <li className={TYPO.bodySmall}>Avoid giving yourself the same rating for each ability/skill</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md border p-6" style={{ borderColor: GOV.border }}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: GOV.text }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: '#059669' }} />
            Before You Begin
          </h2>
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
                The questionnaire takes approximately 30-45 minutes to complete
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: GOV.blue }} />
              <span className={TYPO.body} style={{ color: GOV.textMuted }}>
                You can pause and resume at any time - your progress will be saved
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: GOV.blue }} />
              <span className={TYPO.body} style={{ color: GOV.textMuted }}>
                Answer honestly based on your true interests and abilities
              </span>
            </li>
          </ul>
        </div>

        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => navigate('/questionnaire')}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-md text-base font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: GOV.blue }}
          >
            Begin Questionnaire
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </AssessmentShell>
  );
};

export default QuestionnaireIntro;
