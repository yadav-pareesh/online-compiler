import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Footer } from '../components/layout/Footer';
import { languageRegistry } from '../languages/language.registry';
import { executionService } from '../features/execution/execution.service';
import type {
  ConsoleOutputMessage,
  ExecutionErrorDetail,
  ExecutionStatus,
} from '../features/execution/execution.types';

export const App: React.FC = () => {
  const defaultLanguage = languageRegistry.getDefault();
  const [code, setCode] = useState<string>(defaultLanguage.defaultCode);

  // Execution state
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [output, setOutput] = useState<ConsoleOutputMessage[]>([]);
  const [error, setError] = useState<ExecutionErrorDetail | undefined>();
  const [durationMs, setDurationMs] = useState<number | undefined>();
  // Right panel tab state ('output' | 'complexity')
  const [rightPanelTab, setRightPanelTab] = useState<'output' | 'complexity'>('output');

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Apply dark mode class to root HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Subscribe to execution service
  useEffect(() => {
    const unsubscribe = executionService.subscribe((state) => {
      setStatus(state.status);
      setOutput(state.output);
      setError(state.currentError);
      if (state.durationMs !== undefined) {
        setDurationMs(state.durationMs);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRun = useCallback(() => {
    if (status === 'running') return;
    executionService.run({
      languageId: defaultLanguage.id,
      code,
    });
  }, [code, defaultLanguage.id, status]);

  const handleStop = useCallback(() => {
    executionService.cancel();
  }, []);

  const handleReset = useCallback(() => {
    if (
      code === defaultLanguage.defaultCode ||
      window.confirm('Reset code to initial JavaScript starter code?')
    ) {
      setCode(defaultLanguage.defaultCode);
      executionService.clearOutput();
    }
  }, [code, defaultLanguage.defaultCode]);

  const handleClearOutput = useCallback(() => {
    executionService.clearOutput();
  }, []);

  const handleSelectSnippet = useCallback((snippetCode: string) => {
    setCode(snippetCode);
    executionService.clearOutput();
  }, []);

  // Global keyboard shortcut: Ctrl+Enter or Cmd+Enter to run
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleRun]);

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-[#121215] text-slate-900 dark:text-zinc-100 overflow-hidden font-sans">
      <Header
        status={status}
        onRun={handleRun}
        onStop={handleStop}
        onReset={handleReset}
        onSelectSnippet={handleSelectSnippet}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onAnalyzeComplexity={() => setRightPanelTab('complexity')}
      />

      <WorkspaceLayout
        code={code}
        onChangeCode={setCode}
        onRun={handleRun}
        status={status}
        output={output}
        error={error}
        durationMs={durationMs}
        onClearOutput={handleClearOutput}
        isDark={isDark}
        activeRightTab={rightPanelTab}
        onChangeRightTab={setRightPanelTab}
      />

      <Footer status={status} durationMs={durationMs} />
    </div>
  );
};

export default App;
