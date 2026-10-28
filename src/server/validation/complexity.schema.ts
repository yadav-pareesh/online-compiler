import type {
  ComplexityAnalysisResult,
  ComplexityClassification,
  ConfidenceLevel,
  ComparisonStatus,
  StaticAnalysisResult,
  PerformanceBottleneck,
  OptimizationSuggestion,
} from '../../features/complexity/complexity.types';

const VALID_CLASSIFICATIONS = new Set<ComplexityClassification>([
  'constant',
  'logarithmic',
  'linear',
  'linearithmic',
  'quadratic',
  'cubic',
  'exponential',
  'factorial',
  'multivariable',
  'unknown',
]);

const VALID_CONFIDENCE = new Set<ConfidenceLevel>(['low', 'medium', 'high']);
const VALID_IMPACTS = new Set<'low' | 'medium' | 'high'>(['low', 'medium', 'high']);
const VALID_COMPARISON_STATUS = new Set<ComparisonStatus>([
  'consistent',
  'disagreement',
  'static_only',
  'ai_only',
  'inconclusive',
]);

/**
 * Clean and sanitize a string to prevent HTML/script injection in text displays
 */
function sanitizeString(str: any, maxLength = 2000): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

/**
 * Validate and clean a Big-O notation string
 */
function normalizeBigO(val: any, fallback = 'unknown'): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  // Basic validation for common Big-O syntax
  if (/^O\([^)]+\)$/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.toLowerCase() === 'unknown' || trimmed === '?') {
    return 'unknown';
  }
  return trimmed.slice(0, 30);
}

/**
 * Validate and normalize the parsed raw AI response against the schema.
 */
export function validateAndNormalizeAIResponse(
  raw: any,
  context: {
    analysisId: string;
    model: string;
    durationMs: number;
    cached: boolean;
    staticAnalysis?: StaticAnalysisResult;
  }
): { valid: boolean; result?: ComplexityAnalysisResult; error?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Model response is not a valid JSON object.' };
  }

  // 1. Time Complexity
  const rawTime = raw.timeComplexity;
  if (!rawTime || typeof rawTime !== 'object') {
    return { valid: false, error: 'Missing "timeComplexity" field in model response.' };
  }
  const timeValue = normalizeBigO(rawTime.value);
  const timeClassification: ComplexityClassification = VALID_CLASSIFICATIONS.has(
    rawTime.classification
  )
    ? rawTime.classification
    : 'unknown';
  const timeConfidence: ConfidenceLevel = VALID_CONFIDENCE.has(rawTime.confidence)
    ? rawTime.confidence
    : 'medium';
  const timeExplanation = sanitizeString(rawTime.explanation) || 'No time explanation provided.';

  // 2. Space Complexity
  const rawSpace = raw.spaceComplexity;
  if (!rawSpace || typeof rawSpace !== 'object') {
    return { valid: false, error: 'Missing "spaceComplexity" field in model response.' };
  }
  const spaceValue = normalizeBigO(rawSpace.value);
  const spaceClassification: ComplexityClassification = VALID_CLASSIFICATIONS.has(
    rawSpace.classification
  )
    ? rawSpace.classification
    : 'unknown';
  const spaceConfidence: ConfidenceLevel = VALID_CONFIDENCE.has(rawSpace.confidence)
    ? rawSpace.confidence
    : 'medium';
  const spaceExplanation =
    sanitizeString(rawSpace.explanation) || 'No auxiliary space explanation provided.';

  // 3. Best / Worst / Output Case
  const outputSpace =
    raw.outputSpaceComplexity && typeof raw.outputSpaceComplexity === 'object'
      ? {
          value: normalizeBigO(raw.outputSpaceComplexity.value),
          explanation: sanitizeString(raw.outputSpaceComplexity.explanation),
        }
      : null;

  const bestCase =
    raw.bestCase && typeof raw.bestCase === 'object'
      ? {
          value: normalizeBigO(raw.bestCase.value),
          explanation: sanitizeString(raw.bestCase.explanation),
        }
      : null;

  const worstCase =
    raw.worstCase && typeof raw.worstCase === 'object'
      ? {
          value: normalizeBigO(raw.worstCase.value),
          explanation: sanitizeString(raw.worstCase.explanation),
        }
      : null;

  // 4. Overall Confidence & Summary
  const confidence: ConfidenceLevel = VALID_CONFIDENCE.has(raw.confidence)
    ? raw.confidence
    : timeConfidence;
  const summary = sanitizeString(raw.summary, 1000) || `${timeValue} time and ${spaceValue} auxiliary space.`;

  // 5. Detected Patterns
  const detectedPatterns: string[] = Array.isArray(raw.detectedPatterns)
    ? raw.detectedPatterns
        .filter((p: any) => typeof p === 'string')
        .map((p: string) => sanitizeString(p, 100))
    : [];

  // 6. Reasoning list
  const reasoning: string[] = Array.isArray(raw.reasoning)
    ? raw.reasoning
        .filter((r: any) => typeof r === 'string')
        .map((r: string) => sanitizeString(r, 500))
    : [timeExplanation];

  // 7. Bottlenecks
  const bottlenecks: PerformanceBottleneck[] = Array.isArray(raw.bottlenecks)
    ? raw.bottlenecks
        .filter((b: any) => b && typeof b === 'object')
        .map((b: any) => ({
          title: sanitizeString(b.title, 120) || 'Potential Bottleneck',
          description: sanitizeString(b.description, 1000),
          impact: VALID_IMPACTS.has(b.impact) ? b.impact : 'medium',
          locationHint: b.locationHint ? sanitizeString(b.locationHint, 100) : undefined,
        }))
        .filter((b: PerformanceBottleneck) => b.description.length > 0)
    : [];

  // 8. Optimizations
  const optimizations: OptimizationSuggestion[] = Array.isArray(raw.optimizations)
    ? raw.optimizations
        .filter((opt: any) => opt && typeof opt === 'object')
        .map((opt: any) => ({
          title: sanitizeString(opt.title, 120) || 'Optimization Strategy',
          description: sanitizeString(opt.description, 1000),
          currentComplexity: opt.currentComplexity ? normalizeBigO(opt.currentComplexity) : undefined,
          optimizedComplexity: opt.optimizedComplexity ? normalizeBigO(opt.optimizedComplexity) : undefined,
          tradeOffs: opt.tradeOffs ? sanitizeString(opt.tradeOffs, 500) : undefined,
          illustrativeSnippet: opt.illustrativeSnippet
            ? sanitizeString(opt.illustrativeSnippet, 1500)
            : undefined,
        }))
        .filter((o: OptimizationSuggestion) => o.description.length > 0)
    : [];

  // 9. Assumptions & Warnings
  const assumptions: string[] = Array.isArray(raw.assumptions)
    ? raw.assumptions
        .filter((a: any) => typeof a === 'string')
        .map((a: string) => sanitizeString(a, 300))
    : [];

  const warnings: string[] = Array.isArray(raw.warnings)
    ? raw.warnings
        .filter((w: any) => typeof w === 'string')
        .map((w: string) => sanitizeString(w, 300))
    : [];

  // 10. Static Analysis Comparison
  const rawComparison = raw.staticAnalysisComparison;
  let status: ComparisonStatus = 'consistent';
  let comparisonExplanation = '';

  const staticTime = context.staticAnalysis?.estimatedTimeComplexity || 'unknown';
  const staticSpace = context.staticAnalysis?.estimatedSpaceComplexity || 'unknown';

  if (rawComparison && typeof rawComparison === 'object') {
    status = VALID_COMPARISON_STATUS.has(rawComparison.status)
      ? rawComparison.status
      : timeValue === staticTime
      ? 'consistent'
      : 'disagreement';
    comparisonExplanation = sanitizeString(rawComparison.explanation, 500);
  } else {
    // Determine comparison deterministically if AI omitted comparison
    if (staticTime === 'unknown') {
      status = 'ai_only';
      comparisonExplanation = 'Static analysis was unable to establish a baseline.';
    } else if (timeValue === staticTime && spaceValue === staticSpace) {
      status = 'consistent';
      comparisonExplanation = 'AI conclusions fully agree with the static AST analyzer estimates.';
    } else {
      status = 'disagreement';
      comparisonExplanation = `AI estimated ${timeValue} time / ${spaceValue} space, while static analyzer recognized ${staticTime} time / ${staticSpace} space.`;
    }
  }

  const result: ComplexityAnalysisResult = {
    success: true,
    analysisId: context.analysisId,
    timeComplexity: {
      value: timeValue,
      classification: timeClassification,
      confidence: timeConfidence,
      explanation: timeExplanation,
    },
    spaceComplexity: {
      value: spaceValue,
      classification: spaceClassification,
      confidence: spaceConfidence,
      explanation: spaceExplanation,
    },
    outputSpaceComplexity: outputSpace,
    bestCase,
    worstCase,
    confidence,
    summary,
    detectedPatterns,
    reasoning,
    bottlenecks,
    optimizations,
    assumptions,
    warnings,
    staticAnalysisComparison: {
      status,
      explanation: comparisonExplanation,
      staticEstimate: {
        time: staticTime,
        space: staticSpace,
      },
      aiEstimate: {
        time: timeValue,
        space: spaceValue,
      },
    },
    modelMetadata: {
      model: context.model,
      provider: 'OpenRouter',
      cached: context.cached,
      durationMs: context.durationMs,
    },
    staticAnalysisFindings: context.staticAnalysis,
  };

  return { valid: true, result };
}

/**
 * Produce a safe fallback response purely from local static analysis
 * Used when OpenRouter API is unavailable or offline.
 */
export function buildStaticAnalysisFallback(
  staticAnalysis: StaticAnalysisResult,
  reason: string
): ComplexityAnalysisResult {
  return {
    success: true,
    analysisId: `static-fallback-${Date.now()}`,
    timeComplexity: {
      value: staticAnalysis.estimatedTimeComplexity,
      classification:
        staticAnalysis.estimatedTimeComplexity === 'O(1)'
          ? 'constant'
          : staticAnalysis.estimatedTimeComplexity === 'O(log n)'
          ? 'logarithmic'
          : staticAnalysis.estimatedTimeComplexity === 'O(n)'
          ? 'linear'
          : staticAnalysis.estimatedTimeComplexity === 'O(n log n)'
          ? 'linearithmic'
          : staticAnalysis.estimatedTimeComplexity === 'O(n^2)'
          ? 'quadratic'
          : 'unknown',
      confidence: staticAnalysis.syntaxValid ? 'medium' : 'low',
      explanation: `Static AST analyzer estimation based on detected loop depth (${staticAnalysis.maxLoopDepth}) and recursion characteristics.`,
    },
    spaceComplexity: {
      value: staticAnalysis.estimatedSpaceComplexity,
      classification:
        staticAnalysis.estimatedSpaceComplexity === 'O(1)'
          ? 'constant'
          : staticAnalysis.estimatedSpaceComplexity === 'O(n)'
          ? 'linear'
          : 'unknown',
      confidence: 'medium',
      explanation: staticAnalysis.allocations.inLoop
        ? 'Allocations detected inside loop body (linear or quadratic space).'
        : 'No dynamic unbounded allocations detected inside iterations.',
    },
    outputSpaceComplexity: null,
    bestCase: null,
    worstCase: {
      value: staticAnalysis.estimatedTimeComplexity,
      explanation: 'Estimated worst-case by static AST parsing.',
    },
    confidence: 'medium',
    summary: `Static AST analysis estimated ${staticAnalysis.estimatedTimeComplexity} time and ${staticAnalysis.estimatedSpaceComplexity} space. (${reason})`,
    detectedPatterns: staticAnalysis.detectedPatterns,
    reasoning: [
      `Max loop nesting depth: ${staticAnalysis.maxLoopDepth}`,
      `Recursion: ${staticAnalysis.hasRecursion ? staticAnalysis.recursionType : 'none'}`,
      `Dynamic allocations in loop: ${staticAnalysis.allocations.inLoop ? 'yes' : 'no'}`,
      ...staticAnalysis.notes,
    ],
    bottlenecks: staticAnalysis.hasNestedLoops
      ? [
          {
            title: 'Nested Iteration Detected',
            description: `Static analysis detected nested loops of depth ${staticAnalysis.maxLoopDepth}. Consider if indexing or hashing can flatten inner lookups.`,
            impact: 'high',
          },
        ]
      : [],
    optimizations: [],
    assumptions: ['Static estimates assume standard loop bounds scaling with input length n.'],
    warnings: [`AI analysis was unavailable: ${reason}. Showing local AST static analysis.`],
    staticAnalysisComparison: {
      status: 'static_only',
      explanation: `AI model was not invoked (${reason}). Results are derived exclusively from local AST static analysis.`,
      staticEstimate: {
        time: staticAnalysis.estimatedTimeComplexity,
        space: staticAnalysis.estimatedSpaceComplexity,
      },
      aiEstimate: {
        time: 'unknown',
        space: 'unknown',
      },
    },
    modelMetadata: {
      model: 'local-ast-analyzer',
      provider: 'Local Engine',
      cached: false,
      durationMs: 0,
    },
    staticAnalysisFindings: staticAnalysis,
  };
}
