export interface CacheEnvelope<T> {
  timestamp: number;
  data: T;
}

const CACHE_PREFIX = 'alexhd_tmdb_cache_';

export const LocalStorageCache = {
  /**
   * Save item to localStorage with timestamp and error safety
   */
  set<T>(key: string, data: T): void {
    if (!data) return;
    const storageKey = `${CACHE_PREFIX}${key}`;
    const envelope: CacheEnvelope<T> = {
      timestamp: Date.now(),
      data
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(envelope));
    } catch (e) {
      console.warn('[LocalStorageCache] Storage limit reached, purging old entries and retrying...', e);
      this.purgeOldEntries();
      try {
        localStorage.setItem(storageKey, JSON.stringify(envelope));
      } catch (retryErr) {
        console.error('[LocalStorageCache] Critical storage failure:', retryErr);
      }
    }
  },

  /**
   * Retrieve item from localStorage with optional maxAgeMs check
   */
  get<T>(key: string, maxAgeMs?: number): T | null {
    try {
      const storageKey = `${CACHE_PREFIX}${key}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;

      const parsed: CacheEnvelope<T> = JSON.parse(raw);
      if (!parsed || !parsed.data) return null;

      if (maxAgeMs && Date.now() - parsed.timestamp > maxAgeMs) {
        // Expired
        return null;
      }

      return parsed.data;
    } catch (e) {
      return null;
    }
  },

  /**
   * Remove a single cache item by key
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (e) {}
  },

  /**
   * Purge older cache entries to free up space
   */
  purgeOldEntries(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      console.log(`[LocalStorageCache] Cleared ${keysToRemove.length} cache items to release quota.`);
    } catch (e) {}
  }
};
