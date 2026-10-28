import type {
  AnalyzeComplexityRequest,
  ComplexityAnalysisResult,
  AnalyzeComplexityErrorResponse,
} from '../complexity.types';
import { analyzeJavaScriptAST } from '../analyzer/static-analyzer';

export class ComplexityClient {
  private currentAbortController: AbortController | null = null;

  /**
   * Run local AST static analysis immediately in the browser
   */
  public analyzeLocalAST(sourceCode: string) {
    return analyzeJavaScriptAST(sourceCode);
  }

  /**
   * Request full hybrid AI analysis from backend endpoint /api/analyze-complexity
   */
  public async analyze(
    sourceCode: string,
    options?: { onLocalAnalyzed?: (local: ReturnType<typeof analyzeJavaScriptAST>) => void }
  ): Promise<ComplexityAnalysisResult> {
    // 1. Immediate local AST analysis
    const localFindings = this.analyzeLocalAST(sourceCode);
    if (options?.onLocalAnalyzed) {
      options.onLocalAnalyzed(localFindings);
    }

    // Cancel any previous in-flight request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    this.currentAbortController = new AbortController();

    const requestPayload: AnalyzeComplexityRequest = {
      language: 'javascript',
      sourceCode,
      staticAnalysis: localFindings,
    };

    try {
      const response = await fetch('/api/analyze-complexity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: this.currentAbortController.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorResponse = data as AnalyzeComplexityErrorResponse;
        const msg = errorResponse.error?.message || `Request failed with status ${response.status}`;
        throw new Error(msg);
      }

      return data as ComplexityAnalysisResult;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Analysis request was cancelled.');
      }
      throw err;
    } finally {
      this.currentAbortController = null;
    }
  }

  /**
   * Cancel an ongoing analysis request
   */
  public cancel(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }
}

export const complexityClient = new ComplexityClient();
