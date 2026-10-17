import type { ExecutionErrorDetail } from '../features/execution/execution.types';

export function normalizeError(err: unknown): ExecutionErrorDetail {
  if (err && typeof err === 'object') {
    const errorObj = err as Record<string, unknown>;
    const name = typeof errorObj.name === 'string' ? errorObj.name : 'RuntimeError';
    const message = typeof errorObj.message === 'string' ? errorObj.message : String(err);
    const stack = typeof errorObj.stack === 'string' ? errorObj.stack : undefined;
    const line = typeof errorObj.line === 'number' ? errorObj.line : undefined;
    const column = typeof errorObj.column === 'number' ? errorObj.column : undefined;

    return {
      name,
      message,
      stack,
      line,
      column,
    };
  }

  return {
    name: 'RuntimeError',
    message: String(err),
  };
}
