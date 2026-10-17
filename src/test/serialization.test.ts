import { describe, it, expect } from 'vitest';
import { safeSerialize, formatConsoleArg } from '../lib/serialization';

describe('Serialization and Formatting', () => {
  it('serializes primitives correctly', () => {
    expect(safeSerialize(42)).toBe(42);
    expect(safeSerialize('hello world')).toBe('hello world');
    expect(safeSerialize(true)).toBe(true);
    expect(safeSerialize(null)).toBe(null);
    expect(safeSerialize(undefined)).toBe('__UNDEFINED__');
  });

  it('handles special numeric values', () => {
    expect(safeSerialize(NaN)).toBe('NaN');
    expect(safeSerialize(Infinity)).toBe('Infinity');
    expect(safeSerialize(-Infinity)).toBe('-Infinity');
  });

  it('handles BigInt and Symbol without throwing', () => {
    expect(safeSerialize(BigInt(100))).toBe('100n');
    expect(safeSerialize(Symbol('testSymbol'))).toBe('Symbol(testSymbol)');
  });

  it('handles circular references safely', () => {
    const parent: Record<string, unknown> = { name: 'parent' };
    const child: Record<string, unknown> = { name: 'child', parent };
    parent.child = child;

    const serialized = safeSerialize(parent) as Record<string, unknown>;
    expect(serialized.name).toBe('parent');
    expect(typeof serialized.child).toBe('object');
    const childObj = serialized.child as Record<string, unknown>;
    expect(childObj.parent).toBe('[Circular]');
  });

  it('truncates excessively long strings gracefully', () => {
    const longString = 'a'.repeat(20000);
    const serialized = safeSerialize(longString) as string;
    expect(serialized).toContain('[truncated: output exceeded limit]');
    expect(serialized.length).toBeLessThan(longString.length);
  });

  it('enforces maximum depth for deeply nested objects', () => {
    let deep: Record<string, unknown> = { val: 'base' };
    for (let i = 0; i < 10; i++) {
      deep = { next: deep };
    }
    const serialized = safeSerialize(deep);
    const str = JSON.stringify(serialized);
    expect(str).toContain('[Max Depth Reached]');
  });

  it('formats console arguments cleanly', () => {
    expect(formatConsoleArg('simple text')).toBe('simple text');
    expect(formatConsoleArg('__UNDEFINED__')).toBe('undefined');
    expect(formatConsoleArg(null)).toBe('null');
    expect(formatConsoleArg(123)).toBe('123');
    expect(formatConsoleArg({ a: 1, b: 2 })).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
  });
});
