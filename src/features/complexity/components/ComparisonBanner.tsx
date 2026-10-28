import React from 'react';
import type { StaticAnalysisComparison } from '../complexity.types';
import { CheckCircle2, AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface ComparisonBannerProps {
  comparison: StaticAnalysisComparison;
}

export const ComparisonBanner: React.FC<ComparisonBannerProps> = ({ comparison }) => {
  const getBannerDetails = () => {
    switch (comparison.status) {
      case 'consistent':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
          title: 'Hybrid Consensus: AI & Static Analyzer Agree',
          bg: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200',
        };
      case 'disagreement':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
          title: 'Analyzer Disagreement Identified',
          bg: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200',
        };
      case 'static_only':
        return {
          icon: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
          title: 'Local AST Static Analysis Active',
          bg: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200',
        };
      case 'ai_only':
        return {
          icon: <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />,
          title: 'AI Model Estimate (AST Parse Inconclusive)',
          bg: 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200',
        };
      case 'inconclusive':
      default:
        return {
          icon: <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />,
          title: 'Inconclusive Complexity Analysis',
          bg: 'bg-slate-50/70 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200',
        };
    }
  };

  const details = getBannerDetails();

  return (
    <div className={`p-3 rounded-xl border ${details.bg} text-xs leading-relaxed transition-all`}>
      <div className="flex items-start gap-2">
        {details.icon}
        <div className="flex-1">
          <div className="font-semibold text-xs mb-0.5">{details.title}</div>
          <p className="opacity-90">{comparison.explanation}</p>

          {/* Quick comparative values if disagreement */}
          {comparison.status === 'disagreement' && (
            <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center gap-4 text-[11px] font-mono">
              <div>
                <span className="font-sans opacity-70">Static AST: </span>
                <span className="font-bold">{comparison.staticEstimate.time}</span>
              </div>
              <div>
                <span className="font-sans opacity-70">AI Estimate: </span>
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {comparison.aiEstimate.time}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
