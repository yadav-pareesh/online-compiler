/**
 * Complexity Analysis Type Definitions
 * Covers AST static analysis, AI response contracts, comparison states, and UI states.
 */

export type BigOValue =
  | 'O(1)'
  | 'O(log n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n^2)'
  | 'O(n^3)'
  | 'O(2^n)'
  | 'O(n!)'
  | 'O(n * m)'
  | 'unknown'
  | string;

export type ComplexityClassification =
  | 'constant'
  | 'logarithmic'
  | 'linear'
  | 'linearithmic'
  | 'quadratic'
  | 'cubic'
  | 'exponential'
  | 'factorial'
  | 'multivariable'
  | 'unknown';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type ComparisonStatus =
  | 'consistent'
  | 'disagreement'
  | 'static_only'
  | 'ai_only'
  | 'inconclusive';

export type AnalysisLifecycleState =
  | 'idle'
  | 'validating'
  | 'analyzing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'stale';

/**
 * Local Static Analysis AST Findings
 */
export interface StaticAnalysisResult {
  detectedPatterns: string[];
  estimatedTimeComplexity: BigOValue;
  estimatedSpaceComplexity: BigOValue;
  maxLoopDepth: number;
  hasRecursion: boolean;
  recursionType?: 'linear' | 'branching' | 'tail' | 'none';
  hasNestedLoops: boolean;
  hasLogarithmicLoop: boolean;
  hasSorting: boolean;
  arrayMethods: string[];
  allocations: {
    inLoop: boolean;
    types: string[];
    description?: string;
  };
  inputParameters: string[];
  externalCalls: string[];
  notes: string[];
  syntaxValid: boolean;
  parseError?: string;
}

/**
 * Bottleneck identified in the code
 */
export interface PerformanceBottleneck {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  locationHint?: string;
}

/**
 * Proposed algorithmic or structural optimization
 */
export interface OptimizationSuggestion {
  title: string;
  description: string;
  currentComplexity?: string;
  optimizedComplexity?: string;
  tradeOffs?: string;
  illustrativeSnippet?: string;
}

/**
 * Comparison between Static Analysis and AI Analysis
 */
export interface StaticAnalysisComparison {
  status: ComparisonStatus;
  explanation: string;
  staticEstimate: {
    time: BigOValue;
    space: BigOValue;
  };
  aiEstimate: {
    time: BigOValue;
    space: BigOValue;
  };
}

/**
 * Complexity detail entry
 */
export interface ComplexityDetail {
  value: BigOValue;
  classification: ComplexityClassification;
  confidence: ConfidenceLevel;
  explanation: string;
}

/**
 * Case analysis (best/worst)
 */
export interface CaseComplexity {
  value: BigOValue;
  explanation: string;
}

/**
 * Sanitized model metadata
 */
export interface ModelMetadata {
  model: string;
  provider: string;
  cached: boolean;
  durationMs: number;
}

/**
 * Complete Validated Complexity Analysis Result
 */
export interface ComplexityAnalysisResult {
  success: boolean;
  analysisId: string;
  timeComplexity: ComplexityDetail;
  spaceComplexity: ComplexityDetail;
  outputSpaceComplexity: CaseComplexity | null;
  bestCase: CaseComplexity | null;
  worstCase: CaseComplexity | null;
  confidence: ConfidenceLevel;
  summary: string;
  detectedPatterns: string[];
  reasoning: string[];
  bottlenecks: PerformanceBottleneck[];
  optimizations: OptimizationSuggestion[];
  assumptions: string[];
  warnings: string[];
  staticAnalysisComparison: StaticAnalysisComparison;
  modelMetadata: ModelMetadata;
  staticAnalysisFindings?: StaticAnalysisResult;
}

/**
 * Request payload sent to backend /api/analyze-complexity
 */
export interface AnalyzeComplexityRequest {
  language: 'javascript';
  sourceCode: string;
  staticAnalysis?: StaticAnalysisResult;
}

/**
 * Error response payload from backend
 */
export interface AnalyzeComplexityErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fallbackStaticAnalysis?: StaticAnalysisResult;
  };
}
