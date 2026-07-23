import { shouldAutoOpenAssessmentCompletion } from './questionnaireCompletion';

const readyState = {
  allAnswered: false,
  isLastQuestion: true,
  canAdvance: true,
  assessmentId: 'assessment-1',
  progressLoaded: true,
  positionRestored: true,
  loading: false,
  isPaused: false,
  hasSectionTransition: false,
  showInitialSectionIntro: false,
  showResumeSectionIntro: false,
  submitting: false,
  dialogOpen: false,
  alreadyPrompted: false,
};

describe('assessment completion prompt', () => {
  it('opens automatically at the final answered question even when earlier questions were skipped', () => {
    expect(shouldAutoOpenAssessmentCompletion(readyState)).toBe(true);
  });

  it('opens automatically when every question is answered', () => {
    expect(shouldAutoOpenAssessmentCompletion({
      ...readyState,
      allAnswered: true,
      isLastQuestion: false,
      canAdvance: false,
    })).toBe(true);
  });

  it('does not open before the assessment end or while another flow is active', () => {
    expect(shouldAutoOpenAssessmentCompletion({
      ...readyState,
      isLastQuestion: false,
      canAdvance: false,
    })).toBe(false);
    expect(shouldAutoOpenAssessmentCompletion({ ...readyState, isPaused: true })).toBe(false);
    expect(shouldAutoOpenAssessmentCompletion({ ...readyState, alreadyPrompted: true })).toBe(false);
  });
});
