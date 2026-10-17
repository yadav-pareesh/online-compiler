import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutionStatusBadge } from '../components/output/ExecutionStatusBadge';
import { ConsoleMessageItem } from '../components/output/ConsoleMessageItem';
import { OutputPanel } from '../components/output/OutputPanel';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

describe('UI Components', () => {
  describe('ExecutionStatusBadge', () => {
    it('renders Ready state', () => {
      render(<ExecutionStatusBadge status="idle" />);
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('renders Running state', () => {
      render(<ExecutionStatusBadge status="running" />);
      expect(screen.getByText('Running...')).toBeInTheDocument();
    });

    it('renders Completed state with duration', () => {
      render(<ExecutionStatusBadge status="completed" durationMs={42} />);
      expect(screen.getByText(/Completed \(42ms\)/)).toBeInTheDocument();
    });

    it('renders Timed Out state', () => {
      render(<ExecutionStatusBadge status="timed_out" />);
      expect(screen.getByText(/Timed Out/)).toBeInTheDocument();
    });

    it('renders Error state', () => {
      render(<ExecutionStatusBadge status="failed" durationMs={15} />);
      expect(screen.getByText(/Error \(15ms\)/)).toBeInTheDocument();
    });
  });

  describe('ConsoleMessageItem', () => {
    it('renders log message content', () => {
      const msg = {
        id: '1',
        level: 'log' as const,
        args: ['Numbers:', [10, 20]],
        timestamp: Date.now(),
      };
      render(<ConsoleMessageItem message={msg} />);
      expect(screen.getByText(/Numbers:/)).toBeInTheDocument();
    });

    it('renders table data when provided', () => {
      const msg = {
        id: '2',
        level: 'table' as const,
        args: [[{ name: 'Ada', role: 'Dev' }]],
        tableData: {
          columns: ['(index)', 'name', 'role'],
          rows: [{ '(index)': '0', name: 'Ada', role: 'Dev' }],
        },
        timestamp: Date.now(),
      };
      render(<ConsoleMessageItem message={msg} />);
      expect(screen.getByText('Ada')).toBeInTheDocument();
      expect(screen.getByText('Dev')).toBeInTheDocument();
    });
  });

  describe('OutputPanel', () => {
    it('shows empty state instructions when no output exists', () => {
      render(
        <OutputPanel
          output={[]}
          status="idle"
          onClear={() => {}}
        />
      );
      expect(screen.getByText('No output to display yet')).toBeInTheDocument();
    });

    it('invokes onClear when Clear button is clicked', () => {
      const handleClear = vi.fn();
      render(
        <OutputPanel
          output={[
            {
              id: '1',
              level: 'log',
              args: ['test log'],
              timestamp: Date.now(),
            },
          ]}
          status="completed"
          onClear={handleClear}
        />
      );

      const clearBtn = screen.getByRole('button', { name: /clear output/i });
      fireEvent.click(clearBtn);
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('displays error details with name and message when error is passed', () => {
      render(
        <OutputPanel
          output={[]}
          status="failed"
          error={{
            name: 'ReferenceError',
            message: 'x is not defined',
            line: 5,
            stack: 'ReferenceError: x is not defined at eval',
          }}
          onClear={() => {}}
        />
      );
      const matches = screen.getAllByText(/ReferenceError: x is not defined/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/At line 5/)).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('invokes onRun when Run button is clicked', () => {
      const handleRun = vi.fn();
      render(
        <Header
          status="idle"
          onRun={handleRun}
          onStop={() => {}}
          onReset={() => {}}
          onSelectSnippet={() => {}}
          isDark={true}
          onToggleTheme={() => {}}
        />
      );

      const runBtn = screen.getByRole('button', { name: /run code/i });
      fireEvent.click(runBtn);
      expect(handleRun).toHaveBeenCalledTimes(1);
    });

    it('renders Stop button when running', () => {
      const handleStop = vi.fn();
      render(
        <Header
          status="running"
          onRun={() => {}}
          onStop={handleStop}
          onReset={() => {}}
          onSelectSnippet={() => {}}
          isDark={true}
          onToggleTheme={() => {}}
        />
      );

      const stopBtn = screen.getByRole('button', { name: /stop execution/i });
      expect(stopBtn).toBeInTheDocument();
      fireEvent.click(stopBtn);
      expect(handleStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Footer', () => {
    it('renders sandbox isolated indicator', () => {
      render(<Footer status="idle" />);
      expect(screen.getByText('Sandbox Isolated (CSP Strict)')).toBeInTheDocument();
      expect(screen.getByText('V8 / ES2024 Sandbox')).toBeInTheDocument();
    });
  });
});
