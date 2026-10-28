import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComplexityService } from '../server/services/complexity.service';
import { InMemoryRateLimiter } from '../server/rate-limit/rate-limiter';
import { InMemoryComplexityCache } from '../server/cache/complexity.cache';
import { OpenRouterClient } from '../server/openrouter/openrouter.client';

describe('Server Complexity Service', () => {
  let mockFetch: any;
  let testRateLimiter: InMemoryRateLimiter;
  let testCache: InMemoryComplexityCache;

  beforeEach(() => {
    mockFetch = vi.fn();
    testRateLimiter = new InMemoryRateLimiter(5, 60_000);
    testCache = new InMemoryComplexityCache(10, 60_000);
  });

  it('rejects unsupported languages', async () => {
    const service = new ComplexityService({
      rateLimiter: testRateLimiter,
      cache: testCache,
    });
    const response = await service.handleRequest({
      language: 'python' as any,
      sourceCode: 'print(1)',
    });
    expect(response.status).toBe(400);
    expect((response.body as any).error.code).toBe('UNSUPPORTED_LANGUAGE');
  });

  it('rejects empty source code', async () => {
    const service = new ComplexityService({
      rateLimiter: testRateLimiter,
      cache: testCache,
    });
    const response = await service.handleRequest({
      language: 'javascript',
      sourceCode: '   ',
    });
    expect(response.status).toBe(400);
    expect((response.body as any).error.code).toBe('EMPTY_SOURCE_CODE');
  });

  it('rejects oversized source code beyond 30KB', async () => {
    const service = new ComplexityService({
      rateLimiter: testRateLimiter,
      cache: testCache,
    });
    const hugeCode = 'let a = 1;\n'.repeat(4000); // > 40KB
    const response = await service.handleRequest({
      language: 'javascript',
      sourceCode: hugeCode,
    });
    expect(response.status).toBe(413);
    expect((response.body as any).error.code).toBe('SOURCE_CODE_TOO_LARGE');
  });

  it('applies rate limiting per IP', async () => {
    const mockClient = new OpenRouterClient({ apiKey: '' }, mockFetch);
    const service = new ComplexityService({
      openRouterClient: mockClient,
      rateLimiter: new InMemoryRateLimiter(2, 60_000), // Max 2 requests
      cache: testCache,
    });

    const payload = { language: 'javascript', sourceCode: 'const x = 1;' };
    const r1 = await service.handleRequest(payload, '192.168.1.1');
    expect(r1.status).toBe(200);

    const r2 = await service.handleRequest(payload, '192.168.1.1');
    expect(r2.status).toBe(200);

    const r3 = await service.handleRequest(payload, '192.168.1.1');
    expect(r3.status).toBe(429);
    expect((r3.body as any).error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('returns graceful static fallback when API key is not configured', async () => {
    const client = new OpenRouterClient({ apiKey: '' }, mockFetch);
    const service = new ComplexityService({
      openRouterClient: client,
      rateLimiter: testRateLimiter,
      cache: testCache,
    });

    const response = await service.handleRequest({
      language: 'javascript',
      sourceCode: 'for (let i = 0; i < n; i++) {}',
    });

    expect(response.status).toBe(200);
    const body = response.body as any;
    expect(body.success).toBe(true);
    expect(body.timeComplexity.value).toBe('O(n)');
    expect(body.staticAnalysisComparison.status).toBe('static_only');
    expect(body.modelMetadata.provider).toBe('Local Engine');
  });

  it('successfully invokes OpenRouter and caches identical source code requests', async () => {
    const mockModelResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              timeComplexity: {
                value: 'O(n)',
                classification: 'linear',
                confidence: 'high',
                explanation: 'Single traversal through array elements.',
              },
              spaceComplexity: {
                value: 'O(1)',
                classification: 'constant',
                confidence: 'high',
                explanation: 'Scalar accumulator storage only.',
              },
              outputSpaceComplexity: null,
              bestCase: null,
              worstCase: { value: 'O(n)', explanation: 'Linear traversal' },
              confidence: 'high',
              summary: 'Linear time O(n) and constant space O(1).',
              detectedPatterns: ['single_loop'],
              reasoning: ['Linear iteration over n items'],
              bottlenecks: [],
              optimizations: [],
              assumptions: ['n is length of array'],
              warnings: [],
              staticAnalysisComparison: {
                status: 'consistent',
                explanation: 'Agrees with static single loop analysis.',
              },
            }),
          },
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockModelResponse,
    });

    const client = new OpenRouterClient({ apiKey: 'test-key-123' }, mockFetch);
    const service = new ComplexityService({
      openRouterClient: client,
      rateLimiter: testRateLimiter,
      cache: testCache,
    });

    const payload = {
      language: 'javascript',
      sourceCode: 'function sum(arr) { return arr.reduce((a, b) => a + b, 0); }',
    };

    // First request: calls OpenRouter
    const r1 = await service.handleRequest(payload, '127.0.0.1');
    expect(r1.status).toBe(200);
    const body1 = r1.body as any;
    expect(body1.timeComplexity.value).toBe('O(n)');
    expect(body1.modelMetadata.cached).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second request with identical source code: should hit cache without calling fetch again!
    const r2 = await service.handleRequest(payload, '127.0.0.1');
    expect(r2.status).toBe(200);
    const body2 = r2.body as any;
    expect(body2.modelMetadata.cached).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1!
  });

  it('handles provider error gracefully by falling back to static analysis', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'OpenRouter Service Unavailable',
    });

    const client = new OpenRouterClient({ apiKey: 'test-key-123' }, mockFetch);
    const service = new ComplexityService({
      openRouterClient: client,
      rateLimiter: testRateLimiter,
      cache: testCache,
    });

    const response = await service.handleRequest({
      language: 'javascript',
      sourceCode: 'for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) {} }',
    });

    expect(response.status).toBe(200);
    const body = response.body as any;
    expect(body.success).toBe(true);
    expect(body.timeComplexity.value).toBe('O(n^2)');
    expect(body.warnings[0]).toContain('AI provider error');
  });
});
