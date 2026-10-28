import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  ComplexityAnalysisResult,
  AnalysisLifecycleState,
} from '../complexity.types';
import { complexityClient } from '../service/complexity.client';
import { ComplexityBadge } from './ComplexityBadge';
import { ComparisonBanner } from './ComparisonBanner';
import { BottleneckCard } from './BottleneckCard';
import { OptimizationCard } from './OptimizationCard';
import { StaticFindingsView } from './StaticFindingsView';
import {
  Sparkles,
  RotateCw,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Zap,
} from 'lucide-react';

interface ComplexityPanelProps {
  code: string;
  onRun?: () => void;
}

export const ComplexityPanel: React.FC<ComplexityPanelProps> = ({ code }) => {
  const [state, setState] = useState<AnalysisLifecycleState>('idle');
  const [result, setResult] = useState<ComplexityAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);

  // Keep track of the exact code string analyzed to detect staleness
  const analyzedCodeRef = useRef<string | null>(null);

  // Stale detection: if current code differs from analyzed code, mark as stale
  useEffect(() => {
    if (analyzedCodeRef.current !== null && result !== null) {
      if (code !== analyzedCodeRef.current) {
        setState('stale');
      } else {
        setState('completed');
      }
    }
  }, [code, result]);

  const handleAnalyze = useCallback(async () => {
    if (!code || code.trim().length === 0) {
      setErrorMessage('Cannot analyze empty source code. Please write or load some JavaScript code.');
      setState('failed');
      return;
    }

    setState('analyzing');
    setErrorMessage(null);

    try {
      const analysisResult = await complexityClient.analyze(code);
      setResult(analysisResult);
      analyzedCodeRef.current = code;
      setState('completed');
    } catch (err: any) {
      if (err.message === 'Analysis request was cancelled.') {
        setState('idle');
        return;
      }
      setErrorMessage(err.message || 'Failed to analyze complexity.');
      setState('failed');
    }
  }, [code]);

  const handleCancel = () => {
    complexityClient.cancel();
    setState('idle');
  };

  const handleClear = () => {
    setResult(null);
    analyzedCodeRef.current = null;
    setErrorMessage(null);
    setState('idle');
  };

  const handleCopyReport = () => {
    if (!result) return;

    const reportLines = [
      `# Complexity Analysis Report`,
      `**Time Complexity:** ${result.timeComplexity.value} (${result.timeComplexity.classification}, ${result.timeComplexity.confidence} confidence)`,
      `**Auxiliary Space Complexity:** ${result.spaceComplexity.value} (${result.spaceComplexity.classification}, ${result.spaceComplexity.confidence} confidence)`,
      result.bestCase ? `**Best Case:** ${result.bestCase.value} - ${result.bestCase.explanation}` : '',
      result.worstCase ? `**Worst Case:** ${result.worstCase.value} - ${result.worstCase.explanation}` : '',
      `\n## Summary\n${result.summary}`,
      `\n## Step-by-Step Reasoning`,
      ...result.reasoning.map((r) => `- ${r}`),
      result.bottlenecks.length > 0 ? `\n## Bottlenecks` : '',
      ...result.bottlenecks.map((b) => `- **${b.title}** (${b.impact} impact): ${b.description}`),
      result.optimizations.length > 0 ? `\n## Optimizations` : '',
      ...result.optimizations.map(
        (o) =>
          `- **${o.title}** (${o.currentComplexity || ''} -> ${o.optimizedComplexity || ''}): ${o.description}`
      ),
      result.assumptions.length > 0 ? `\n## Assumptions` : '',
      ...result.assumptions.map((a) => `- ${a}`),
      `\n## Hybrid Comparison\nStatus: ${result.staticAnalysisComparison.status}\n${result.staticAnalysisComparison.explanation}`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(reportLines);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 1500);
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-[#141417] text-slate-900 dark:text-zinc-100 overflow-hidden">
      {/* Panel Header & Action Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur text-xs shrink-0">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-slate-700 dark:text-zinc-200">
            AI Complexity Analysis
          </span>
          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
            Hybrid
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Analyze / Re-analyze button */}
          {state === 'analyzing' ? (
            <button
              onClick={handleCancel}
              className="p-1 px-2.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-100 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleAnalyze}
              className="p-1 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              title="Analyze Time & Space Complexity"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{result ? 'Re-analyze' : 'Analyze Complexity'}</span>
            </button>
          )}

          {/* Copy Report */}
          {result && (
            <button
              onClick={handleCopyReport}
              className="p-1 px-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors flex items-center gap-1"
              title="Copy analysis report as Markdown"
              aria-label="Copy report"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          )}

          {/* Clear */}
          {result && (
            <button
              onClick={handleClear}
              className="p-1 px-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
              title="Clear analysis results"
              aria-label="Clear analysis"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stale Warning Banner */}
      {state === 'stale' && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-3 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 animate-fadeIn shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Code has been modified. Results may be outdated.</span>
          </div>
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-1 font-semibold underline hover:no-underline text-amber-900 dark:text-amber-200"
          >
            <RotateCw className="w-3 h-3" />
            <span>Re-analyze now</span>
          </button>
        </div>
      )}

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* State: Idle */}
        {state === 'idle' && !result && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-zinc-600">
            <BrainCircuit className="w-12 h-12 mb-3 opacity-40 text-purple-600 dark:text-purple-400 stroke-1" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
              No Complexity Analysis Yet
            </h3>
            <p className="text-xs font-sans mt-1.5 max-w-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Click <strong className="text-purple-600 dark:text-purple-400">Analyze Complexity</strong> to estimate asymptotic Big-O time and space complexity, identify bottlenecks, and review optimization opportunities with OpenRouter AI and static AST inspection.
            </p>
            <button
              onClick={handleAnalyze}
              className="mt-4 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze Current Code</span>
            </button>
          </div>
        )}

        {/* State: Analyzing Loading */}
        {state === 'analyzing' && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-3">
              <div className="w-12 h-12 rounded-full border-2 border-purple-200 dark:border-purple-900 border-t-purple-600 dark:border-t-purple-400 animate-spin" />
              <BrainCircuit className="w-5 h-5 absolute inset-0 m-auto text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              Analyzing Code Complexity...
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs">
              Performing local AST pattern detection and querying OpenRouter AI model...
            </p>
          </div>
        )}

        {/* State: Error */}
        {state === 'failed' && errorMessage && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs">
            <div className="flex items-center gap-2 font-semibold text-sm mb-1 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>Analysis Failed</span>
            </div>
            <p className="mt-1 leading-relaxed">{errorMessage}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleAnalyze}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
              >
                Retry Analysis
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* State: Completed or Stale (Results View) */}
        {result && (
          <>
            {/* Top Cards: Time & Auxiliary Space Complexity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ComplexityBadge
                label="Time Complexity"
                value={result.timeComplexity.value}
                classification={result.timeComplexity.classification}
                confidence={result.timeComplexity.confidence}
                subtitle={result.worstCase ? `Worst: ${result.worstCase.value}` : undefined}
              />
              <ComplexityBadge
                label="Auxiliary Space"
                value={result.spaceComplexity.value}
                classification={result.spaceComplexity.classification}
                confidence={result.spaceComplexity.confidence}
                subtitle={
                  result.outputSpaceComplexity
                    ? `Output space: ${result.outputSpaceComplexity.value}`
                    : 'Excludes inputs'
                }
              />
            </div>

            {/* Hybrid Static vs AI Comparison Banner */}
            <ComparisonBanner comparison={result.staticAnalysisComparison} />

            {/* Executive Summary */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs shadow-sm">
              <span className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                Executive Summary
              </span>
              <p className="text-slate-600 dark:text-zinc-300 leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Step-by-Step Reasoning (Expandable) */}
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs shadow-sm overflow-hidden">
              <button
                onClick={() => setShowReasoning((prev) => !prev)}
                className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
                aria-expanded={showReasoning}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    Step-by-Step Asymptotic Reasoning
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    {result.reasoning.length} steps
                  </span>
                </div>
                {showReasoning ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showReasoning && (
                <div className="p-3 border-t border-slate-200 dark:border-zinc-800 space-y-2 bg-slate-50/50 dark:bg-zinc-950/20">
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-zinc-300 leading-relaxed">
                    {result.reasoning.map((step, idx) => (
                      <li key={idx} className="pl-1">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Performance Bottlenecks */}
            {result.bottlenecks.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                  Identified Bottlenecks ({result.bottlenecks.length})
                </span>
                <div className="space-y-2">
                  {result.bottlenecks.map((bottleneck, idx) => (
                    <BottleneckCard key={idx} bottleneck={bottleneck} />
                  ))}
                </div>
              </div>
            )}

            {/* Optimization Suggestions */}
            {result.optimizations.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
                  Optimization Opportunities ({result.optimizations.length})
                </span>
                <div className="space-y-2">
                  {result.optimizations.map((optimization, idx) => (
                    <OptimizationCard key={idx} optimization={optimization} />
                  ))}
                </div>
              </div>
            )}

            {/* Assumptions & Limitations */}
            {result.assumptions.length > 0 && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs shadow-sm">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                  Assumptions & Runtime Bounds
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
                  {result.assumptions.map((assumption, idx) => (
                    <li key={idx}>{assumption}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings if any */}
            {result.warnings.length > 0 && (
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-xs">
                <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1">
                  Analysis Warnings
                </span>
                <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400 text-[11px]">
                  {result.warnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Local AST Static Analysis Findings */}
            {result.staticAnalysisFindings && (
              <StaticFindingsView findings={result.staticAnalysisFindings} />
            )}

            {/* Model & Cache Metadata Footer */}
            <div className="text-[10px] text-slate-400 dark:text-zinc-600 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
              <div>
                Model: <span className="font-mono text-slate-500 dark:text-zinc-500">{result.modelMetadata.model}</span>
                {result.modelMetadata.cached && (
                  <span className="ml-1.5 px-1 rounded bg-slate-200 dark:bg-zinc-800 text-[9px]">
                    Cached
                  </span>
                )}
              </div>
              {result.modelMetadata.durationMs > 0 && (
                <div>Response time: {result.modelMetadata.durationMs}ms</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
