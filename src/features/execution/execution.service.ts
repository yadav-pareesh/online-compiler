import type {
  ConsoleOutputMessage,
  ExecutionErrorDetail,
  ExecutionRequest,
  ExecutionResult,
  ExecutionStatus,
} from './execution.types';
import { SandboxManager } from './sandbox/SandboxManager';
import { EXECUTION_DEFAULTS } from './execution.constants';
import type { SandboxOutboundMessage } from './execution.protocol';

export type ExecutionServiceListener = (state: {
  status: ExecutionStatus;
  output: ConsoleOutputMessage[];
  currentError?: ExecutionErrorDetail;
  durationMs?: number;
}) => void;

export class ExecutionService {
  private sandbox: SandboxManager;
  private currentExecutionId: string | null = null;
  private currentStatus: ExecutionStatus = 'idle';
  private currentOutput: ConsoleOutputMessage[] = [];
  private currentError?: ExecutionErrorDetail;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private startTime = 0;
  private listeners: Set<ExecutionServiceListener> = new Set();
  private unsubscribeSandbox: (() => void) | null = null;

  constructor(sandboxManager?: SandboxManager) {
    this.sandbox = sandboxManager || new SandboxManager();
    this.init();
  }

  private init(): void {
    this.unsubscribeSandbox = this.sandbox.onMessage(
      this.handleSandboxMessage.bind(this)
    );
  }

  public subscribe(listener: ExecutionServiceListener): () => void {
    this.listeners.add(listener);
    listener({
      status: this.currentStatus,
      output: this.currentOutput,
      currentError: this.currentError,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener({
          status: this.currentStatus,
          output: [...this.currentOutput],
          currentError: this.currentError,
          durationMs:
            this.startTime > 0 ? Math.round(performance.now() - this.startTime) : undefined,
        });
      } catch (err) {
        console.error('Error notifying execution listener:', err);
      }
    });
  }

  private handleSandboxMessage(msg: SandboxOutboundMessage): void {
    if (msg.type === 'SANDBOX_READY') {
      return;
    }

    // Guard: ignore messages for superseded executions
    if (!this.currentExecutionId || msg.executionId !== this.currentExecutionId) {
      return;
    }

    if (msg.type === 'CONSOLE') {
      if (this.currentOutput.length < EXECUTION_DEFAULTS.MAX_MESSAGES) {
        this.currentOutput.push({
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          level: msg.level,
          args: msg.args,
          tableData: msg.tableData,
          timestamp: msg.timestamp,
        });
        this.notify();
      }
    } else if (msg.type === 'EXECUTION_COMPLETE') {
      this.clearTimeoutTimer();
      this.currentStatus = 'completed';
      this.notify();
    } else if (msg.type === 'EXECUTION_ERROR') {
      this.clearTimeoutTimer();
      this.currentStatus = 'failed';
      this.currentError = msg.error;
      this.notify();
    }
  }

  public async run(
    request: Omit<ExecutionRequest, 'executionId'>
  ): Promise<ExecutionResult> {
    // Cancel any ongoing run
    this.clearTimeoutTimer();

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.currentExecutionId = executionId;
    this.currentStatus = 'running';
    this.currentOutput = [];
    this.currentError = undefined;
    this.startTime = performance.now();
    this.notify();

    const timeoutDuration = request.timeoutMs || EXECUTION_DEFAULTS.TIMEOUT_MS;

    return new Promise<ExecutionResult>((resolve) => {
      // Set parent watchdog timeout
      this.timeoutTimer = setTimeout(async () => {
        if (this.currentExecutionId === executionId && this.currentStatus === 'running') {
          this.currentStatus = 'timed_out';
          this.currentError = {
            name: 'TimeoutError',
            message: `Execution timed out after ${timeoutDuration}ms. Check for an infinite loop or stalled operation.`,
          };
          this.notify();

          // Force terminate and recreate sandbox
          await this.sandbox.terminateAndRecreate();

          resolve({
            executionId,
            status: 'timed_out',
            output: [...this.currentOutput],
            error: this.currentError,
            durationMs: timeoutDuration,
            completedAt: Date.now(),
          });
        }
      }, timeoutDuration);

      // Listen for conclusion
      const unsubscribe = this.subscribe((state) => {
        if (this.currentExecutionId === executionId) {
          if (state.status === 'completed' || state.status === 'failed' || state.status === 'timed_out') {
            unsubscribe();
            this.clearTimeoutTimer();
            resolve({
              executionId,
              status: state.status,
              output: [...this.currentOutput],
              error: this.currentError,
              durationMs: Math.round(performance.now() - this.startTime),
              completedAt: Date.now(),
            });
          }
        }
      });

      // Send to sandbox
      this.sandbox.execute(executionId, request.code).catch(async (err) => {
        this.clearTimeoutTimer();
        this.currentStatus = 'failed';
        this.currentError = {
          name: 'SandboxInitializationError',
          message: String(err.message || err),
        };
        this.notify();
        resolve({
          executionId,
          status: 'failed',
          output: [...this.currentOutput],
          error: this.currentError,
          durationMs: 0,
          completedAt: Date.now(),
        });
      });
    });
  }

  public clearOutput(): void {
    this.currentOutput = [];
    this.currentError = undefined;
    if (this.currentStatus !== 'running') {
      this.currentStatus = 'idle';
    }
    this.notify();
  }

  public cancel(): void {
    if (this.currentStatus === 'running') {
      this.clearTimeoutTimer();
      this.currentStatus = 'cancelled';
      this.currentExecutionId = null;
      this.sandbox.terminateAndRecreate();
      this.notify();
    }
  }

  private clearTimeoutTimer(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  public destroy(): void {
    this.clearTimeoutTimer();
    if (this.unsubscribeSandbox) {
      this.unsubscribeSandbox();
    }
    this.sandbox.destroy();
    this.listeners.clear();
  }
}

export const executionService = new ExecutionService();
