import React, { useState } from 'react';
import type { ConsoleOutputMessage } from '../../features/execution/execution.types';
import { formatConsoleArg } from '../../lib/serialization';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Terminal,
  Table as TableIcon,
  Copy,
  Check,
} from 'lucide-react';

interface ConsoleMessageItemProps {
  message: ConsoleOutputMessage;
}

export const ConsoleMessageItem: React.FC<ConsoleMessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const getBadge = () => {
    switch (message.level) {
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-semibold text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            error
          </span>
        );
      case 'warn':
        return (
          <span className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400 font-semibold text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            warn
          </span>
        );
      case 'info':
        return (
          <span className="inline-flex items-center gap-1 text-blue-500 dark:text-sky-400 font-semibold text-xs">
            <Info className="w-3.5 h-3.5" />
            info
          </span>
        );
      case 'debug':
        return (
          <span className="inline-flex items-center gap-1 text-purple-500 dark:text-purple-400 font-semibold text-xs">
            <Terminal className="w-3.5 h-3.5" />
            debug
          </span>
        );
      case 'table':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-semibold text-xs">
            <TableIcon className="w-3.5 h-3.5" />
            table
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-500 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            log
          </span>
        );
    }
  };

  const getContainerStyle = () => {
    switch (message.level) {
      case 'error':
        return 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200';
      case 'warn':
        return 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200';
      case 'info':
        return 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/30 text-blue-900 dark:text-blue-200';
      default:
        return 'bg-white dark:bg-zinc-900/60 border-slate-100 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-200';
    }
  };

  const formattedContent = message.args.map((arg) => formatConsoleArg(arg)).join(' ');

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={`group relative border-b p-2.5 px-3 font-mono text-[13px] leading-relaxed transition-colors ${getContainerStyle()}`}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          {getBadge()}
          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-200/60 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
          title="Copy output"
          aria-label="Copy output line"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {message.level === 'table' && message.tableData ? (
        <div className="my-1.5 overflow-x-auto rounded border border-slate-200 dark:border-zinc-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-left text-xs">
            <thead className="bg-slate-100 dark:bg-zinc-800/80">
              <tr>
                {message.tableData.columns.map((col) => (
                  <th
                    key={col}
                    className="px-2.5 py-1.5 font-semibold text-slate-700 dark:text-zinc-300 border-r border-slate-200 dark:border-zinc-800 last:border-r-0"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
              {message.tableData.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                  {message.tableData!.columns.map((col) => (
                    <td
                      key={col}
                      className="px-2.5 py-1 text-slate-600 dark:text-zinc-300 border-r border-slate-100 dark:border-zinc-800/50 last:border-r-0 whitespace-pre"
                    >
                      {row[col] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="whitespace-pre-wrap break-words">{formattedContent}</div>
      )}
    </div>
  );
};
