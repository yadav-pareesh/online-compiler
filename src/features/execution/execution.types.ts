export type ExecutionStatus =
  | 'idle'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timed_out'
  | 'cancelled';

export type ConsoleLogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'table';

export interface ConsoleOutputMessage {
  id: string;
  level: ConsoleLogLevel;
  args: unknown[];
  timestamp: number;
  tableData?: {
    columns: string[];
    rows: Record<string, string>[];
  };
}

export interface ExecutionErrorDetail {
  name: string;
  message: string;
  stack?: string;
  line?: number;
  column?: number;
}

export interface ExecutionRequest {
  executionId: string;
  languageId: string;
  code: string;
  timeoutMs?: number;
}

export interface ExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  output: ConsoleOutputMessage[];
  error?: ExecutionErrorDetail;
  durationMs: number;
  completedAt: number;
}
