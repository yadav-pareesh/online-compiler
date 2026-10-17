import React from 'react';
import { ShieldCheck, Cpu, Command } from 'lucide-react';
import type { ExecutionStatus } from '../../features/execution/execution.types';

interface FooterProps {
  status: ExecutionStatus;
  durationMs?: number;
}

export const Footer: React.FC<FooterProps> = ({ status, durationMs }) => {
  return (
    <footer className="h-8 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] px-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5" title="Execution runtime">
          <Cpu className="w-3.5 h-3.5 text-blue-500" />
          <span>V8 / ES2024 Sandbox</span>
        </div>

        <div
          className="hidden sm:flex items-center gap-1.5"
          title="Sandbox Security: Restricted origin & CSP connect-src 'none'"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sandbox Isolated (CSP Strict)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {durationMs !== undefined && status !== 'running' && (
          <span className="font-mono">Execution time: {durationMs}ms</span>
        )}
        <div className="hidden md:flex items-center gap-1">
          <Command className="w-3 h-3 opacity-60" />
          <span>Ctrl + Enter to run</span>
        </div>
      </div>
    </footer>
  );
};
