/**
 * In-memory sliding window rate limiter
 * Protects OpenRouter API endpoints from abuse and runaway costs.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 20, windowMs = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if client identifier has exceeded rate limits.
   * Cleans expired timestamps.
   */
  public check(clientId: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.records.get(clientId);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(clientId, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      resetMs: this.windowMs,
    };
  }

  /**
   * Clear all records (useful for testing)
   */
  public clear(): void {
    this.records.clear();
  }
}

export const complexityRateLimiter = new InMemoryRateLimiter(20, 60_000);
