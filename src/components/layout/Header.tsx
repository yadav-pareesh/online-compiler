import React from 'react';
import {
  Play,
  RotateCcw,
  Sun,
  Moon,
  Code2,
  Square,
  Sparkles,
} from 'lucide-react';
import type { ExecutionStatus } from '../../features/execution/execution.types';
import { languageRegistry } from '../../languages/language.registry';

interface HeaderProps {
  status: ExecutionStatus;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onSelectSnippet: (code: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onRun,
  onStop,
  onReset,
  onSelectSnippet,
  isDark,
  onToggleTheme,
}) => {
  const currentLang = languageRegistry.getDefault();
  const isRunning = status === 'running';

  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutHint = isMac ? '⌘ + Enter' : 'Ctrl + Enter';

  return (
    <header className="h-14 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] px-4 flex items-center justify-between select-none">
      {/* Brand & Language */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-400 dark:bg-amber-500 flex items-center justify-center shadow-sm">
            <span className="font-black text-black text-sm">JS</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Online JS Compiler
              </h1>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                V1
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block mx-1" />

        {/* Language selector */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Code2 className="w-4 h-4 text-slate-400" />
          <select
            value={currentLang.id}
            disabled
            className="bg-transparent text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-default focus:outline-none"
            aria-label="Language selector"
          >
            <option value="javascript">JavaScript (ES2024)</option>
          </select>
        </div>

        {/* Example snippets */}
        <div className="hidden md:flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <select
            onChange={(e) => {
              const snippet = currentLang.snippets.find((s) => s.id === e.target.value);
              if (snippet) onSelectSnippet(snippet.code);
            }}
            defaultValue="default"
            className="text-xs bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Load code example snippet"
          >
            <option disabled value="">
              Load Example...
            </option>
            {currentLang.snippets.map((snip) => (
              <option key={snip.id} value={snip.id}>
                {snip.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Reset button */}
        <button
          onClick={onReset}
          className="p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Reset code to starter template"
          aria-label="Reset code to initial template"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Run / Stop Button */}
        {isRunning ? (
          <button
            onClick={onStop}
            className="p-1.5 px-3.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            aria-label="Stop execution"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            className="p-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            aria-label={`Run code (${shortcutHint})`}
            title={`Run (${shortcutHint})`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
            <span className="hidden lg:inline-block text-[11px] font-normal opacity-80 px-1 rounded bg-blue-700/60">
              {shortcutHint}
            </span>
          </button>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
