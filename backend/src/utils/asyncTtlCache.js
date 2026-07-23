'use strict';

/**
 * Bounded in-process cache that coalesces identical work already in flight.
 * Rejections are never cached.
 */
class AsyncTtlCache {
  constructor({ ttlMs = 30000, maxEntries = 200 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  async get(key, loader) {
    const now = Date.now();
    const existing = this.entries.get(key);
    if (existing && (existing.inFlight || existing.expiresAt > now)) {
      return existing.promise;
    }
    if (existing) this.entries.delete(key);

    const entry = { inFlight: true, expiresAt: 0, promise: null };
    entry.promise = Promise.resolve()
      .then(loader)
      .then((value) => {
        entry.inFlight = false;
        entry.expiresAt = Date.now() + this.ttlMs;
        return value;
      })
      .catch((error) => {
        if (this.entries.get(key) === entry) this.entries.delete(key);
        throw error;
      });

    this.entries.set(key, entry);
    this.prune();
    return entry.promise;
  }

  prune() {
    if (this.entries.size <= this.maxEntries) return;
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (!entry.inFlight && entry.expiresAt <= now) this.entries.delete(key);
    }
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      this.entries.delete(oldestKey);
    }
  }

  clear() {
    this.entries.clear();
  }
}

module.exports = AsyncTtlCache;
