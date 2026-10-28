import type { ComplexityAnalysisResult } from '../../features/complexity/complexity.types';

interface CacheEntry {
  result: ComplexityAnalysisResult;
  expiresAt: number;
}

/**
 * Fast simple 32-bit hash for cache keys
 */
export function createCacheKey(sourceCode: string, model: string, promptVersion: string): string {
  const combined = `${promptVersion}:::${model}:::${sourceCode}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `complexity_cache_${hash}_${sourceCode.length}`;
}

export class InMemoryComplexityCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = 100, ttlMs = 10 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  public get(key: string): ComplexityAnalysisResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);

    // Return cloned result with cached flag marked true
    return {
      ...entry.result,
      modelMetadata: {
        ...entry.result.modelMetadata,
        cached: true,
      },
    };
  }

  public set(key: string, result: ComplexityAnalysisResult): void {
    // Evict oldest if full
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const complexityCache = new InMemoryComplexityCache(100, 10 * 60 * 1000);
