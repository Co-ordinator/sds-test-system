export const shouldAutoOpenAssessmentCompletion = ({
  allAnswered,
  isLastQuestion,
  canAdvance,
  assessmentId,
  progressLoaded,
  positionRestored,
  loading,
  isPaused,
  hasSectionTransition,
  showInitialSectionIntro,
  showResumeSectionIntro,
  submitting,
  dialogOpen,
  alreadyPrompted,
}) => {
  const reachedAssessmentEnd = (isLastQuestion && canAdvance) || allAnswered;
  return Boolean(
    reachedAssessmentEnd &&
    assessmentId &&
    progressLoaded &&
    positionRestored &&
    !loading &&
    !isPaused &&
    !hasSectionTransition &&
    !showInitialSectionIntro &&
    !showResumeSectionIntro &&
    !submitting &&
    !dialogOpen &&
    !alreadyPrompted
  );
};
