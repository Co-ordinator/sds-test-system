'use strict';

const AsyncTtlCache = require('../src/utils/asyncTtlCache');

describe('AsyncTtlCache', () => {
  test('coalesces identical work already in flight', async () => {
    const cache = new AsyncTtlCache({ ttlMs: 1000 });
    let resolveLoader;
    const loader = jest.fn(() => new Promise((resolve) => {
      resolveLoader = resolve;
    }));

    const first = cache.get('same', loader);
    const second = cache.get('same', loader);
    await Promise.resolve();

    expect(loader).toHaveBeenCalledTimes(1);
    resolveLoader('value');
    await expect(Promise.all([first, second])).resolves.toEqual(['value', 'value']);
  });

  test('does not cache rejected work', async () => {
    const cache = new AsyncTtlCache({ ttlMs: 1000 });
    const loader = jest.fn()
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce('recovered');

    await expect(cache.get('key', loader)).rejects.toThrow('failed');
    await expect(cache.get('key', loader)).resolves.toBe('recovered');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  test('bounds the number of cached keys', async () => {
    const cache = new AsyncTtlCache({ ttlMs: 1000, maxEntries: 2 });
    await cache.get('one', async () => 1);
    await cache.get('two', async () => 2);
    await cache.get('three', async () => 3);
    expect(cache.entries.size).toBeLessThanOrEqual(2);
  });
});
