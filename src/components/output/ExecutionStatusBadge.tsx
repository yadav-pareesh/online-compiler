import React from 'react';
import type { ExecutionStatus } from '../../features/execution/execution.types';
import { Loader2, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';

interface ExecutionStatusBadgeProps {
  status: ExecutionStatus;
  durationMs?: number;
}

export const ExecutionStatusBadge: React.FC<ExecutionStatusBadgeProps> = ({
  status,
  durationMs,
}) => {
  switch (status) {
    case 'running':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" />
          Running...
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Completed {durationMs !== undefined ? `(${durationMs}ms)` : ''}
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
          <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
          Error {durationMs !== undefined ? `(${durationMs}ms)` : ''}
        </span>
      );
    case 'timed_out':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Timed Out (3s limit)
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <Ban className="w-3 h-3" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500" />
          Ready
        </span>
      );
  }
};
