import React, { useState } from 'react';
import type { OptimizationSuggestion } from '../complexity.types';
import { ArrowRight, Lightbulb, Copy, Check } from 'lucide-react';

interface OptimizationCardProps {
  optimization: OptimizationSuggestion;
}

export const OptimizationCard: React.FC<OptimizationCardProps> = ({ optimization }) => {
  const [copied, setCopied] = useState(false);

  const handleCopySnippet = () => {
    if (!optimization.illustrativeSnippet) return;
    navigator.clipboard.writeText(optimization.illustrativeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-xs shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-zinc-200">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{optimization.title}</span>
        </div>

        {/* Complexity delta badge */}
        {optimization.currentComplexity && optimization.optimizedComplexity && (
          <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 shrink-0">
            <span>{optimization.currentComplexity}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {optimization.optimizedComplexity}
            </span>
          </div>
        )}
      </div>

      <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
        {optimization.description}
      </p>

      {optimization.tradeOffs && (
        <div className="p-2 rounded bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-700/60 text-[11px] text-slate-600 dark:text-zinc-300">
          <strong className="text-slate-700 dark:text-zinc-200">Trade-offs: </strong>
          {optimization.tradeOffs}
        </div>
      )}

      {optimization.illustrativeSnippet && (
        <div className="mt-2 relative">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-500 pb-1">
            <span>Illustrative snippet</span>
            <button
              onClick={handleCopySnippet}
              className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
              title="Copy snippet"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-2.5 rounded bg-slate-100 dark:bg-black/40 font-mono text-[11px] text-slate-800 dark:text-zinc-200 overflow-x-auto whitespace-pre-wrap leading-tight border border-slate-200 dark:border-zinc-800">
            {optimization.illustrativeSnippet}
          </pre>
        </div>
      )}
    </div>
  );
};
