import { COMPLEXITY_SYSTEM_PROMPT } from './system-prompt';

export const FALLBACK_FREE_MODEL = 'nvidia/nemotron-3.5-lightning:free';

export interface OpenRouterConfig {
  apiKey?: string;
  model?: string;
  siteUrl?: string;
  siteName?: string;
  timeoutMs?: number;
  maxTokens?: number;
}

export class OpenRouterClient {
  private config: OpenRouterConfig;
  private fetchFn: typeof fetch;

  constructor(config?: Partial<OpenRouterConfig>, customFetch?: typeof fetch) {
    this.config = {
      apiKey: config?.apiKey,
      model: config?.model,
      siteUrl: config?.siteUrl || process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
      siteName: config?.siteName || process.env.OPENROUTER_SITE_NAME || 'JS Compiler',
      timeoutMs: config?.timeoutMs || 30_000,
      maxTokens: config?.maxTokens || 2500,
    };
    this.fetchFn = customFetch || globalThis.fetch;
  }

  public getApiKey(): string | undefined {
    return this.config.apiKey || process.env.OPENROUTER_API_KEY;
  }

  public getModel(): string {
    return (
      this.config.model ||
      process.env.OPENROUTER_MODEL ||
      FALLBACK_FREE_MODEL
    );
  }

  public hasApiKey(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 0);
  }

  /**
   * Request complexity analysis completion from OpenRouter
   */
  public async analyzeComplexity(
    sourceCode: string,
    staticHints: any
  ): Promise<{ rawData: any; rawContent: string; durationMs: number; usedModel: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY is not configured on the server. Please configure it in your environment or .env file.'
      );
    }

    const primaryModel = this.getModel();
    return this.attemptModelRequest(sourceCode, staticHints, primaryModel, apiKey, true);
  }

  private async attemptModelRequest(
    sourceCode: string,
    staticHints: any,
    model: string,
    apiKey: string,
    allowFallback: boolean
  ): Promise<{ rawData: any; rawContent: string; durationMs: number; usedModel: string }> {
    const userPrompt = `Analyze the following JavaScript source code.

STATIC ANALYSIS FINDINGS (treated as untrusted preliminary hints):
${JSON.stringify(staticHints, null, 2)}

JAVASCRIPT SOURCE CODE:
\`\`\`javascript
${sourceCode}
\`\`\`

Remember to respond ONLY with raw, valid JSON matching the exact required schema, without markdown code fences.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const startTime = Date.now();

    try {
      const response = await this.fetchFn('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': this.config.siteUrl || 'http://localhost:5173',
          'X-Title': this.config.siteName || 'JS Compiler',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: COMPLEXITY_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          max_tokens: this.config.maxTokens,
          temperature: 0.1,
          reasoning: { effort: 'none' },
        }),
        signal: controller.signal,
      });

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        let errorBody = '';
        try {
          const errJson = (await response.json()) as any;
          errorBody = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errorBody = await response.text();
        }

        // If the model was retired / not found (404) or bad request on model (400), try fallback model
        if ((response.status === 404 || response.status === 400) && allowFallback && model !== FALLBACK_FREE_MODEL) {
          console.warn(`Model ${model} returned ${response.status} (${errorBody}). Retrying with active fallback: ${FALLBACK_FREE_MODEL}`);
          return this.attemptModelRequest(sourceCode, staticHints, FALLBACK_FREE_MODEL, apiKey, false);
        }

        if (response.status === 401) {
          throw new Error('Authentication failed: Invalid OpenRouter API key.');
        } else if (response.status === 429) {
          throw new Error(`OpenRouter rate limit or credit limit exceeded: ${errorBody}`);
        } else if (response.status >= 500) {
          throw new Error(`OpenRouter service error (${response.status}): ${errorBody}`);
        } else {
          throw new Error(`OpenRouter request failed (${response.status}): ${errorBody}`);
        }
      }

      const json = (await response.json()) as any;
      const choice = json.choices?.[0];
      if (!choice || !choice.message) {
        throw new Error('Empty or invalid completion returned by OpenRouter.');
      }

      // Extract content from message.content or reasoning if content is null
      let content = choice.message.content ? String(choice.message.content).trim() : '';
      if (!content && choice.message.reasoning) {
        content = String(choice.message.reasoning).trim();
      }

      if (!content) {
        throw new Error('OpenRouter model returned empty content.');
      }

      const parsed = this.extractAndParseJSON(content);

      return {
        rawData: parsed,
        rawContent: content,
        durationMs,
        usedModel: model,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(
          `OpenRouter request timed out after ${this.config.timeoutMs! / 1000} seconds.`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Safely extract and parse JSON even if surrounded by markdown code fences or reasoning
   */
  private extractAndParseJSON(content: string): any {
    let clean = content.trim();

    // Remove markdown code fences if model returned ```json ... ```
    if (clean.startsWith('```')) {
      const firstNewline = clean.indexOf('\n');
      const lastFence = clean.lastIndexOf('```');
      if (firstNewline !== -1 && lastFence > firstNewline) {
        clean = clean.substring(firstNewline + 1, lastFence).trim();
      }
    }

    try {
      return JSON.parse(clean);
    } catch {
      // Find first { and matching last }
      const startIdx = clean.indexOf('{');
      const endIdx = clean.lastIndexOf('}');
      if (startIdx !== -1 && endIdx > startIdx) {
        const candidate = clean.substring(startIdx, endIdx + 1);
        try {
          return JSON.parse(candidate);
        } catch {}
      }
      throw new Error('Failed to parse AI response as valid JSON.');
    }
  }
}
