const STORAGE_PREFIX = 'sds:assessment-pending-progress:';
const STORAGE_VERSION = 1;
const QUEUE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const hasAnswerValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const normalizeAnswers = (answers) => {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return {};

  return Object.entries(answers).reduce((result, [questionId, value]) => {
    if (typeof questionId === 'string' && questionId && hasAnswerValue(value)) {
      result[questionId] = String(value);
    }
    return result;
  }, {});
};

export const getProgressQueueStorageKey = (assessmentId) =>
  assessmentId ? `${STORAGE_PREFIX}${assessmentId}` : null;

export const readQueuedProgress = (storageKey, storage = window.localStorage) => {
  if (!storageKey || !storage) return {};

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION) return {};
    const updatedAt = Date.parse(parsed.updatedAt);
    if (Number.isFinite(updatedAt) && Date.now() - updatedAt > QUEUE_MAX_AGE_MS) {
      storage.removeItem(storageKey);
      return {};
    }
    return normalizeAnswers(parsed.answers);
  } catch (_) {
    return {};
  }
};

export const writeQueuedProgress = (storageKey, answers, storage = window.localStorage) => {
  if (!storageKey || !storage) return;

  const normalizedAnswers = normalizeAnswers(answers);
  try {
    if (Object.keys(normalizedAnswers).length === 0) {
      storage.removeItem(storageKey);
      return;
    }
    storage.setItem(storageKey, JSON.stringify({
      version: STORAGE_VERSION,
      answers: normalizedAnswers,
      updatedAt: new Date().toISOString(),
    }));
  } catch (_) {
    // A full or disabled browser storage area must not block a learner from answering.
  }
};

export const clearQueuedProgress = (storageKey, storage = window.localStorage) => {
  if (!storageKey || !storage) return;
  try {
    storage.removeItem(storageKey);
  } catch (_) {
    // Ignore storage cleanup failures; the server remains the source of truth after completion.
  }
};

export const clearAllQueuedProgress = (storage = window.localStorage) => {
  if (!storage) return;
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) {
        storage.removeItem(key);
      }
    }
  } catch (_) {
    // Ignore storage cleanup failures; authentication still completes its local sign-out.
  }
};
