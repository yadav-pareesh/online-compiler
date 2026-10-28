import React from 'react';
import type { PerformanceBottleneck } from '../complexity.types';
import { AlertCircle } from 'lucide-react';

interface BottleneckCardProps {
  bottleneck: PerformanceBottleneck;
}

export const BottleneckCard: React.FC<BottleneckCardProps> = ({ bottleneck }) => {
  const impactStyles = {
    high: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    medium: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    low: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  }[bottleneck.impact];

  return (
    <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-xs shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-zinc-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>{bottleneck.title}</span>
        </div>
        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${impactStyles}`}>
          {bottleneck.impact} impact
        </span>
      </div>

      <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
        {bottleneck.description}
      </p>

      {bottleneck.locationHint && (
        <div className="mt-1.5 text-[11px] font-mono text-slate-500 dark:text-zinc-500">
          📍 {bottleneck.locationHint}
        </div>
      )}
    </div>
  );
};
