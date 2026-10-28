import React, { useState } from 'react';
import type { StaticAnalysisResult } from '../complexity.types';
import { ChevronDown, ChevronRight, Cpu } from 'lucide-react';

interface StaticFindingsViewProps {
  findings: StaticAnalysisResult;
}

export const StaticFindingsView: React.FC<StaticFindingsViewProps> = ({ findings }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs overflow-hidden">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <span className="font-semibold text-slate-700 dark:text-zinc-300">
            Local AST Static Analysis Breakdown
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-mono">
            Depth {findings.maxLoopDepth}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-3 border-t border-slate-200 dark:border-zinc-800 space-y-3 bg-slate-50/50 dark:bg-zinc-950/20">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase">Max Loop Depth</span>
              <div className="text-sm font-bold font-mono text-slate-800 dark:text-zinc-200">
                {findings.maxLoopDepth}
              </div>
            </div>

            <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase">Recursion</span>
              <div className="text-sm font-bold font-mono text-slate-800 dark:text-zinc-200 capitalize">
                {findings.hasRecursion ? findings.recursionType : 'None'}
              </div>
            </div>

            <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase">Allocations</span>
              <div className="text-sm font-bold font-mono text-slate-800 dark:text-zinc-200">
                {findings.allocations.inLoop ? 'Loop-Allocated' : findings.allocations.types.length > 0 ? 'Standard' : 'O(1) Scalar'}
              </div>
            </div>

            <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase">Array Methods</span>
              <div className="text-sm font-bold font-mono text-slate-800 dark:text-zinc-200">
                {findings.arrayMethods.length > 0 ? findings.arrayMethods.length : '0'}
              </div>
            </div>
          </div>

          {/* Patterns Tags */}
          <div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
              Detected AST Patterns
            </span>
            <div className="flex flex-wrap gap-1">
              {findings.detectedPatterns.map((pat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono text-slate-700 dark:text-zinc-300"
                >
                  {pat}
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          {findings.notes.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                Static Observations
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-zinc-400 text-[11px]">
                {findings.notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Unanalyzed external calls if any */}
          {findings.externalCalls.length > 0 && (
            <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300">
              <strong>External dependencies: </strong>
              The static analyzer detected calls to {findings.externalCalls.join(', ')} which may affect runtime complexity.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
