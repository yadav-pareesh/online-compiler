import React, { useState } from 'react';
import { CodeEditor } from '../editor/CodeEditor';
import { EditorToolbar } from '../editor/EditorToolbar';
import { OutputPanel } from '../output/OutputPanel';
import { ComplexityPanel } from '../../features/complexity/components/ComplexityPanel';
import type {
  ConsoleOutputMessage,
  ExecutionErrorDetail,
  ExecutionStatus,
} from '../../features/execution/execution.types';
import { Code2, Terminal, Sparkles } from 'lucide-react';

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
  activeRightTab?: 'output' | 'complexity';
  onChangeRightTab?: (tab: 'output' | 'complexity') => void;
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
  activeRightTab: externalRightTab,
  onChangeRightTab,
}) => {
  const [internalRightTab, setInternalRightTab] = useState<'output' | 'complexity'>('output');
  const rightTab = externalRightTab !== undefined ? externalRightTab : internalRightTab;

  const handleSetRightTab = (tab: 'output' | 'complexity') => {
    if (onChangeRightTab) {
      onChangeRightTab(tab);
    } else {
      setInternalRightTab(tab);
    }
  };

  const [mobileTab, setMobileTab] = useState<'editor' | 'output' | 'complexity'>('editor');
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
          <span>Editor</span>
        </button>

        <button
          onClick={() => {
            setMobileTab('output');
            handleSetRightTab('output');
          }}
          className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            mobileTab === 'output'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          aria-label="Switch to Console output tab"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Console</span>
          {output.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {output.length}
            </span>
          )}
          {error && <span className="w-2 h-2 rounded-full bg-red-500" />}
        </button>

        <button
          onClick={() => {
            setMobileTab('complexity');
            handleSetRightTab('complexity');
          }}
          className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
            mobileTab === 'complexity'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
          aria-label="Switch to Complexity analysis tab"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complexity</span>
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

        {/* Right Pane (Output or Complexity Analysis) */}
        <div
          className={`flex-1 md:w-2/5 flex flex-col min-h-0 h-full border-t md:border-t-0 md:border-l border-slate-200 dark:border-zinc-800 ${
            mobileTab !== 'editor' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Desktop Tab Switcher */}
          <div className="hidden md:flex items-center border-b border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-[#18181b]/90 px-3 select-none">
            <button
              onClick={() => handleSetRightTab('output')}
              className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                rightTab === 'output'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console Output</span>
              {output.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {output.length}
                </span>
              )}
              {error && <span className="w-2 h-2 rounded-full bg-red-500" />}
            </button>

            <button
              onClick={() => handleSetRightTab('complexity')}
              className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                rightTab === 'complexity'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                  : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Complexity Analysis</span>
              <span className="text-[10px] px-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                AI
              </span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0">
            {/* Show Output Panel */}
            <div
              className={`h-full w-full ${
                (mobileTab === 'output' || (mobileTab !== 'complexity' && rightTab === 'output'))
                  ? 'block'
                  : 'hidden'
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

            {/* Show Complexity Panel */}
            <div
              className={`h-full w-full ${
                (mobileTab === 'complexity' || (mobileTab !== 'output' && rightTab === 'complexity'))
                  ? 'block'
                  : 'hidden'
              }`}
            >
              <ComplexityPanel code={code} onRun={onRun} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
