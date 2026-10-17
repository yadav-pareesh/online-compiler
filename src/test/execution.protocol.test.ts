import { describe, it, expect } from 'vitest';
import { isSandboxOutboundMessage } from '../features/execution/execution.protocol';

describe('Execution Protocol Validation', () => {
  it('validates correct SANDBOX_READY message', () => {
    expect(isSandboxOutboundMessage({ type: 'SANDBOX_READY' })).toBe(true);
  });

  it('validates correct CONSOLE message', () => {
    const msg = {
      type: 'CONSOLE',
      executionId: 'exec_123',
      level: 'log',
      args: ['hello'],
      timestamp: Date.now(),
    };
    expect(isSandboxOutboundMessage(msg)).toBe(true);
  });

  it('validates correct EXECUTION_COMPLETE message', () => {
    const msg = {
      type: 'EXECUTION_COMPLETE',
      executionId: 'exec_123',
      durationMs: 45,
    };
    expect(isSandboxOutboundMessage(msg)).toBe(true);
  });

  it('validates correct EXECUTION_ERROR message', () => {
    const msg = {
      type: 'EXECUTION_ERROR',
      executionId: 'exec_123',
      error: { name: 'ReferenceError', message: 'foo is not defined' },
      durationMs: 10,
    };
    expect(isSandboxOutboundMessage(msg)).toBe(true);
  });

  it('rejects malformed or untrusted messages', () => {
    expect(isSandboxOutboundMessage(null)).toBe(false);
    expect(isSandboxOutboundMessage(undefined)).toBe(false);
    expect(isSandboxOutboundMessage('invalid')).toBe(false);
    expect(isSandboxOutboundMessage({ type: 'UNKNOWN_ACTION' })).toBe(false);
    expect(isSandboxOutboundMessage({ noType: true })).toBe(false);
  });
});
