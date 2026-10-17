import React, { useState } from 'react';
import { CodeEditor } from '../editor/CodeEditor';
import { EditorToolbar } from '../editor/EditorToolbar';
import { OutputPanel } from '../output/OutputPanel';
import type {
  ConsoleOutputMessage,
  ExecutionErrorDetail,
  ExecutionStatus,
} from '../../features/execution/execution.types';
import { Code2, Terminal } from 'lucide-react';

interface WorkspaceLayoutProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  onRun: () => void;
  status: ExecutionStatus;
  output: ConsoleOutputMessage[];
  error?: ExecutionErrorDetail;
  durationMs?: number;
  onClearOutput: () => void;
  isDark: boolean;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  code,
  onChangeCode,
  onRun,
  status,
  output,
  error,
  durationMs,
  onClearOutput,
  isDark,
}) => {
  const [mobileTab, setMobileTab] = useState<'editor' | 'output'>('editor');
  const [fontSize, setFontSize] = useState<number>(14);
  const [lineWrapping, setLineWrapping] = useState<boolean>(false);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-100 dark:bg-[#121215]">
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] px-3">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            mobileTab === 'editor'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          aria-label="Switch to Code editor tab"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code Editor</span>
        </button>

        <button
          onClick={() => setMobileTab('output')}
          className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            mobileTab === 'output'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          aria-label="Switch to Console output tab"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Console Output</span>
          {output.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {output.length}
            </span>
          )}
          {error && (
            <span className="w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {/* Main Workspace: Side-by-side on desktop, tab-based on mobile */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Editor Pane */}
        <div
          className={`flex-1 md:w-3/5 flex flex-col min-h-0 h-full ${
            mobileTab === 'editor' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <EditorToolbar
            code={code}
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
            lineWrapping={lineWrapping}
            onToggleLineWrapping={() => setLineWrapping((prev) => !prev)}
          />
          <div className="flex-1 min-h-0">
            <CodeEditor
              code={code}
              onChange={onChangeCode}
              onRun={onRun}
              isDark={isDark}
              fontSize={fontSize}
              lineWrapping={lineWrapping}
            />
          </div>
        </div>

        {/* Output Console Pane */}
        <div
          className={`flex-1 md:w-2/5 flex flex-col min-h-0 h-full border-t md:border-t-0 md:border-l border-slate-200 dark:border-zinc-800 ${
            mobileTab === 'output' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <OutputPanel
            output={output}
            status={status}
            error={error}
            durationMs={durationMs}
            onClear={onClearOutput}
          />
        </div>
      </div>
    </div>
  );
};
