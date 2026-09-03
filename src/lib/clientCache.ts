/**
 * In-memory client cache with Stale-While-Revalidate (SWR) behavior
 * Provides instant 0ms transitions when switching between tabs
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry<any>>();

export function getCached<T = any>(key: string, maxAgeMs = 60000): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) {
    return null;
  }
  return entry.data;
}

export function setCached<T = any>(key: string, data: T): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function invalidateCache(): void {
  memoryCache.clear();
}