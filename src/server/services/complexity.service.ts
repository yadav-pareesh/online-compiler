import { analyzeJavaScriptAST } from '../../features/complexity/analyzer/static-analyzer';
import { OpenRouterClient } from '../openrouter/openrouter.client';
import { SYSTEM_PROMPT_VERSION } from '../openrouter/system-prompt';
import {
  validateAndNormalizeAIResponse,
  buildStaticAnalysisFallback,
} from '../validation/complexity.schema';
import { complexityCache, createCacheKey } from '../cache/complexity.cache';
import { complexityRateLimiter } from '../rate-limit/rate-limiter';
import type {
  AnalyzeComplexityRequest,
  ComplexityAnalysisResult,
  AnalyzeComplexityErrorResponse,
} from '../../features/complexity/complexity.types';

export const MAX_SOURCE_CODE_BYTES = 30_000;

export interface ComplexityServiceOptions {
  openRouterClient?: OpenRouterClient;
  rateLimiter?: typeof complexityRateLimiter;
  cache?: typeof complexityCache;
}

export class ComplexityService {
  private openRouter: OpenRouterClient;
  private rateLimiter: typeof complexityRateLimiter;
  private cache: typeof complexityCache;

  constructor(options?: ComplexityServiceOptions) {
    this.openRouter = options?.openRouterClient || new OpenRouterClient();
    this.rateLimiter = options?.rateLimiter || complexityRateLimiter;
    this.cache = options?.cache || complexityCache;
  }

  /**
   * Process a complexity analysis request
   */
  public async handleRequest(
    payload: any,
    clientIp: string = '127.0.0.1'
  ): Promise<{ status: number; body: ComplexityAnalysisResult | AnalyzeComplexityErrorResponse }> {
    // 1. Rate limiting check
    const rateCheck = this.rateLimiter.check(clientIp);
    if (!rateCheck.allowed) {
      const waitSeconds = Math.ceil(rateCheck.resetMs / 1000);
      return {
        status: 429,
        body: {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Please wait ${waitSeconds} seconds before trying again.`,
          },
        },
      };
    }

    // 2. Validate payload format
    if (!payload || typeof payload !== 'object') {
      return {
        status: 400,
        body: {
          success: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Request payload must be a JSON object.',
          },
        },
      };
    }

    const { language, sourceCode } = payload as AnalyzeComplexityRequest;

    // Validate language
    if (language !== 'javascript') {
      return {
        status: 400,
        body: {
          success: false,
          error: {
            code: 'UNSUPPORTED_LANGUAGE',
            message: `Unsupported language "${language}". Only "javascript" is supported in V1.`,
          },
        },
      };
    }

    // Validate source code
    if (typeof sourceCode !== 'string' || sourceCode.trim().length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          error: {
            code: 'EMPTY_SOURCE_CODE',
            message: 'Source code cannot be empty.',
          },
        },
      };
    }

    if (sourceCode.length > MAX_SOURCE_CODE_BYTES) {
      return {
        status: 413,
        body: {
          success: false,
          error: {
            code: 'SOURCE_CODE_TOO_LARGE',
            message: `Source code exceeds maximum permitted size of ${MAX_SOURCE_CODE_BYTES} characters.`,
          },
        },
      };
    }

    // 3. Server-side static AST analysis (never blindly trust client hints)
    const serverStaticAnalysis = analyzeJavaScriptAST(sourceCode);

    // 4. Check in-memory bounded cache
    const model = this.openRouter.getModel();
    const cacheKey = createCacheKey(sourceCode, model, SYSTEM_PROMPT_VERSION);
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      return {
        status: 200,
        body: cachedResult,
      };
    }

    // 5. Check if OpenRouter API Key is available
    if (!this.openRouter.hasApiKey()) {
      const fallbackResult = buildStaticAnalysisFallback(
        serverStaticAnalysis,
        'Server missing OPENROUTER_API_KEY environment variable'
      );
      return {
        status: 200,
        body: fallbackResult,
      };
    }

    // 6. Call OpenRouter AI
    try {
      const { rawData, durationMs, usedModel } = await this.openRouter.analyzeComplexity(
        sourceCode,
        serverStaticAnalysis
      );

      // 7. Validate and normalize the AI output
      const validation = validateAndNormalizeAIResponse(rawData, {
        analysisId: `analysis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        model: usedModel || model,
        durationMs,
        cached: false,
        staticAnalysis: serverStaticAnalysis,
      });

      if (!validation.valid || !validation.result) {
        // Fallback to static analysis if AI response is malformed
        const fallback = buildStaticAnalysisFallback(
          serverStaticAnalysis,
          `AI returned malformed schema: ${validation.error || 'Unknown schema error'}`
        );
        return {
          status: 200,
          body: fallback,
        };
      }

      // Save to cache
      this.cache.set(cacheKey, validation.result);

      return {
        status: 200,
        body: validation.result,
      };
    } catch (err: any) {
      // Gracefully fall back to local AST analysis with warning rather than destroying user experience
      const fallback = buildStaticAnalysisFallback(
        serverStaticAnalysis,
        `AI provider error: ${err.message || 'Unknown network error'}`
      );
      return {
        status: 200,
        body: fallback,
      };
    }
  }
}

export const complexityService = new ComplexityService();
