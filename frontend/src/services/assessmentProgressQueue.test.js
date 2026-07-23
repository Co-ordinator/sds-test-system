import {
  clearAllQueuedProgress,
  clearQueuedProgress,
  getProgressQueueStorageKey,
  readQueuedProgress,
  writeQueuedProgress,
} from './assessmentProgressQueue';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: jest.fn((key) => values.get(key) ?? null),
    setItem: jest.fn((key, value) => values.set(key, value)),
    removeItem: jest.fn((key) => values.delete(key)),
    key: jest.fn((index) => Array.from(values.keys())[index] ?? null),
    get length() { return values.size; },
  };
};

describe('assessment progress queue storage', () => {
  it('persists and restores only valid queued answers', () => {
    const storage = createStorage();
    const key = getProgressQueueStorageKey('assessment-1');

    writeQueuedProgress(key, { questionA: 'YES', questionB: 4, empty: '' }, storage);

    expect(readQueuedProgress(key, storage)).toEqual({ questionA: 'YES', questionB: '4' });
  });

  it('ignores malformed or incompatible stored data', () => {
    const storage = createStorage();
    const key = getProgressQueueStorageKey('assessment-2');
    storage.setItem(key, '{not-json');
    expect(readQueuedProgress(key, storage)).toEqual({});

    storage.setItem(key, JSON.stringify({ version: 999, answers: { questionA: 'YES' } }));
    expect(readQueuedProgress(key, storage)).toEqual({});
  });

  it('removes the queue after all answers have been synchronized', () => {
    const storage = createStorage();
    const key = getProgressQueueStorageKey('assessment-3');
    writeQueuedProgress(key, { questionA: 'YES' }, storage);

    clearQueuedProgress(key, storage);

    expect(readQueuedProgress(key, storage)).toEqual({});
  });

  it('removes every pending assessment queue during explicit sign-out', () => {
    const storage = createStorage();
    const firstQueue = getProgressQueueStorageKey('assessment-4');
    const secondQueue = getProgressQueueStorageKey('assessment-5');
    writeQueuedProgress(firstQueue, { questionA: 'YES' }, storage);
    writeQueuedProgress(secondQueue, { questionB: 'NO' }, storage);
    storage.setItem('unrelated-setting', 'keep');

    clearAllQueuedProgress(storage);

    expect(storage.getItem(firstQueue)).toBeNull();
    expect(storage.getItem(secondQueue)).toBeNull();
    expect(storage.getItem('unrelated-setting')).toBe('keep');
  });
});
