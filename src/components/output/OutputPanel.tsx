import React, { useState } from 'react';
import type {
  ConsoleOutputMessage,
  ExecutionErrorDetail,
  ExecutionStatus,
} from '../../features/execution/execution.types';
import { ConsoleMessageItem } from './ConsoleMessageItem';
import { ExecutionStatusBadge } from './ExecutionStatusBadge';
import {
  Trash2,
  Copy,
  Check,
  AlertOctagon,
  Terminal,
  Filter,
} from 'lucide-react';

interface OutputPanelProps {
  output: ConsoleOutputMessage[];
  status: ExecutionStatus;
  error?: ExecutionErrorDetail;
  durationMs?: number;
  onClear: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  output,
  status,
  error,
  durationMs,
  onClear,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [copiedAll, setCopiedAll] = useState(false);

  const filteredOutput = output.filter((msg) => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'errors') return msg.level === 'error';
    if (filterLevel === 'warns') return msg.level === 'warn';
    if (filterLevel === 'logs') return msg.level === 'log' || msg.level === 'info';
    return true;
  });

  const handleCopyAll = () => {
    const textLines = output.map((m) =>
      `[${m.level.toUpperCase()} ${new Date(m.timestamp).toLocaleTimeString()}] ${m.args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')}`
    );
    if (error) {
      textLines.push(`[ERROR] ${error.name}: ${error.message}\n${error.stack || ''}`);
    }
    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-[#141417] text-slate-900 dark:text-zinc-100 overflow-hidden">
      {/* Console Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
          <span className="font-semibold text-slate-700 dark:text-zinc-200">
            Console Output
          </span>
          <ExecutionStatusBadge status={status} durationMs={durationMs} />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <div className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-transparent border border-slate-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label="Filter console logs"
            >
              <option value="all">All ({output.length})</option>
              <option value="logs">Logs</option>
              <option value="warns">Warnings</option>
              <option value="errors">Errors</option>
            </select>
          </div>

          {/* Copy button */}
          {(output.length > 0 || error) && (
            <button
              onClick={handleCopyAll}
              className="p-1 px-2 rounded flex items-center gap-1 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
              title="Copy all output"
              aria-label="Copy all output"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          {/* Clear button */}
          <button
            onClick={onClear}
            disabled={output.length === 0 && !error}
            className="p-1 px-2 rounded flex items-center gap-1 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Clear console"
            aria-label="Clear output"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Console Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto font-mono">
        {output.length === 0 && !error && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-zinc-600">
            <Terminal className="w-10 h-10 mb-2 opacity-40 stroke-1" />
            <p className="text-sm font-sans font-medium text-slate-500 dark:text-zinc-500">
              No output to display yet
            </p>
            <p className="text-xs font-sans mt-1 max-w-xs">
              Click <strong className="text-blue-600 dark:text-blue-400">Run</strong> or press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono text-[11px]">
                Ctrl + Enter
              </kbd>{' '}
              to execute your JavaScript code.
            </p>
          </div>
        )}

        {filteredOutput.map((msg) => (
          <ConsoleMessageItem key={msg.id} message={msg} />
        ))}

        {/* Runtime or Timeout Error Box */}
        {error && (
          <div className="p-3.5 m-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/30 text-red-900 dark:text-red-200 text-xs font-mono leading-relaxed">
            <div className="flex items-start gap-2 font-semibold text-sm mb-1 text-red-600 dark:text-red-400">
              <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {error.name}: {error.message}
              </span>
            </div>

            {error.line !== undefined && (
              <div className="text-[11px] text-red-500 dark:text-red-400/80 ml-6 mb-1">
                At line {error.line}
                {error.column !== undefined ? `, column ${error.column}` : ''}
              </div>
            )}

            {error.stack && (
              <details className="mt-2 ml-6 text-[11px] opacity-80 cursor-pointer">
                <summary className="hover:underline select-none">View Stack Trace</summary>
                <pre className="mt-1.5 p-2 rounded bg-black/10 dark:bg-black/30 overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
