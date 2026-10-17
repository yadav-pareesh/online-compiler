import { describe, it, expect } from 'vitest';
import { normalizeError } from '../lib/errors';

describe('Error Normalization', () => {
  it('normalizes standard JavaScript Error instances', () => {
    const error = new TypeError('Cannot read properties of undefined');
    const normalized = normalizeError(error);

    expect(normalized.name).toBe('TypeError');
    expect(normalized.message).toBe('Cannot read properties of undefined');
    expect(normalized.stack).toBeDefined();
  });

  it('normalizes string error values', () => {
    const normalized = normalizeError('Something went wrong!');
    expect(normalized.name).toBe('RuntimeError');
    expect(normalized.message).toBe('Something went wrong!');
  });

  it('normalizes custom error objects with line and column numbers', () => {
    const custom = {
      name: 'SyntaxError',
      message: 'Unexpected token }',
      line: 4,
      column: 12,
    };
    const normalized = normalizeError(custom);

    expect(normalized.name).toBe('SyntaxError');
    expect(normalized.message).toBe('Unexpected token }');
    expect(normalized.line).toBe(4);
    expect(normalized.column).toBe(12);
  });
});
