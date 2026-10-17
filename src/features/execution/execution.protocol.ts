import type { ConsoleLogLevel, ExecutionErrorDetail } from './execution.types';

export type SandboxInboundMessage = {
  type: 'EXECUTE';
  executionId: string;
  code: string;
};

export type SandboxOutboundMessage =
  | {
      type: 'SANDBOX_READY';
    }
  | {
      type: 'CONSOLE';
      executionId: string;
      level: ConsoleLogLevel;
      args: unknown[];
      tableData?: {
        columns: string[];
        rows: Record<string, string>[];
      };
      timestamp: number;
    }
  | {
      type: 'EXECUTION_COMPLETE';
      executionId: string;
      durationMs: number;
    }
  | {
      type: 'EXECUTION_ERROR';
      executionId: string;
      error: ExecutionErrorDetail;
      durationMs: number;
    };

export function isSandboxOutboundMessage(
  data: unknown
): data is SandboxOutboundMessage {
  if (!data || typeof data !== 'object') return false;
  const msg = data as { type?: unknown };
  return (
    typeof msg.type === 'string' &&
    ['SANDBOX_READY', 'CONSOLE', 'EXECUTION_COMPLETE', 'EXECUTION_ERROR'].includes(
      msg.type
    )
  );
}
