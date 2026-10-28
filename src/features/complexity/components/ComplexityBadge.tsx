import React from 'react';
import type { BigOValue, ComplexityClassification, ConfidenceLevel } from '../complexity.types';

interface ComplexityBadgeProps {
  label: string;
  value: BigOValue;
  classification?: ComplexityClassification;
  confidence?: ConfidenceLevel;
  subtitle?: string;
}

export const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({
  label,
  value,
  classification,
  confidence,
  subtitle,
}) => {
  // Determine color theme based on Big-O value
  const getTheme = (bigO: string) => {
    const v = bigO.toLowerCase();
    if (v.includes('1') || v.includes('log n') && !v.includes('n log n')) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-300',
        valColor: 'text-emerald-600 dark:text-emerald-400',
      };
    }
    if (v.includes('n log n')) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-300',
        valColor: 'text-amber-600 dark:text-amber-400',
      };
    }
    if (v.includes('n^2') || v.includes('n^3') || v.includes('2^n') || v.includes('n!')) {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        border: 'border-rose-200 dark:border-rose-800',
        text: 'text-rose-700 dark:text-rose-300',
        valColor: 'text-rose-600 dark:text-rose-400',
      };
    }
    if (v.includes('n') || v.includes('m')) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        valColor: 'text-blue-600 dark:text-blue-400',
      };
    }
    return {
      bg: 'bg-slate-50 dark:bg-zinc-800/40',
      border: 'border-slate-200 dark:border-zinc-700',
      text: 'text-slate-700 dark:text-zinc-300',
      valColor: 'text-slate-600 dark:text-zinc-400',
    };
  };

  const theme = getTheme(value);

  const getConfidenceBadge = (conf?: ConfidenceLevel) => {
    if (!conf) return null;
    const styles = {
      high: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
      medium: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
      low: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
    }[conf];

    return (
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${styles}`}>
        {conf} conf
      </span>
    );
  };

  return (
    <div
      className={`flex-1 p-3 rounded-xl border ${theme.border} ${theme.bg} transition-all shadow-sm`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          {label}
        </span>
        {confidence && getConfidenceBadge(confidence)}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-xl font-bold font-mono tracking-tight ${theme.valColor}`}>
          {value}
        </span>
        {classification && classification !== 'unknown' && (
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 capitalize">
            ({classification})
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-[11px] text-slate-600 dark:text-zinc-400 leading-tight">
          {subtitle}
        </p>
      )}
    </div>
  );
};
