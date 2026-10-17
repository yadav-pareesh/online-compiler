import { EXECUTION_DEFAULTS } from '../features/execution/execution.constants';

/**
 * Safely serializes any JavaScript value for transmission across postMessage
 * and for rendering in the terminal console.
 * Handles circular references, symbols, BigInt, Map, Set, Errors, and depth limits.
 */
export function safeSerialize(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): unknown {
  if (depth > EXECUTION_DEFAULTS.MAX_DEPTH) {
    return '[Max Depth Reached]';
  }

  if (value === null) return null;
  if (value === undefined) return '__UNDEFINED__';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
    return value;
  }
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.length > EXECUTION_DEFAULTS.MAX_STRING_LENGTH) {
      return (
        value.slice(0, EXECUTION_DEFAULTS.MAX_STRING_LENGTH) +
        ' ... [truncated: output exceeded limit]'
      );
    }
    return value;
  }
  if (typeof value === 'bigint') {
    return `${value.toString()}n`;
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }
    seen.add(value);

    try {
      if (value instanceof Error) {
        return {
          __type: 'Error',
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      }

      if (value instanceof Date) {
        return {
          __type: 'Date',
          value: value.toISOString(),
        };
      }

      if (value instanceof RegExp) {
        return value.toString();
      }

      if (value instanceof Map) {
        const entries: [unknown, unknown][] = [];
        let count = 0;
        for (const [k, v] of value.entries()) {
          if (count++ > 100) {
            entries.push(['...', '[truncated extra entries]']);
            break;
          }
          entries.push([
            safeSerialize(k, depth + 1, seen),
            safeSerialize(v, depth + 1, seen),
          ]);
        }
        return {
          __type: 'Map',
          size: value.size,
          entries,
        };
      }

      if (value instanceof Set) {
        const items: unknown[] = [];
        let count = 0;
        for (const item of value) {
          if (count++ > 100) {
            items.push('[truncated extra items]');
            break;
          }
          items.push(safeSerialize(item, depth + 1, seen));
        }
        return {
          __type: 'Set',
          size: value.size,
          items,
        };
      }

      if (Array.isArray(value)) {
        if (value.length > 500) {
          const sliced = value
            .slice(0, 500)
            .map((item) => safeSerialize(item, depth + 1, seen));
          sliced.push(`... ${value.length - 500} more items`);
          return sliced;
        }
        return value.map((item) => safeSerialize(item, depth + 1, seen));
      }

      // Plain or custom object
      const obj: Record<string, unknown> = {};
      const keys = Object.keys(value);
      const maxKeys = 200;
      for (let i = 0; i < Math.min(keys.length, maxKeys); i++) {
        const key = keys[i];
        try {
          obj[key] = safeSerialize((value as Record<string, unknown>)[key], depth + 1, seen);
        } catch (err) {
          obj[key] = `[Unreadable Property: ${String(err)}]`;
        }
      }
      if (keys.length > maxKeys) {
        obj['__truncated__'] = `${keys.length - maxKeys} more properties`;
      }
      return obj;
    } finally {
      // Allow the same object in other sibling branches
      seen.delete(value);
    }
  }

  return String(value);
}

/**
 * Formats a serialized argument into a human-readable string for console output.
 */
export function formatConsoleArg(arg: unknown): string {
  if (arg === '__UNDEFINED__') return 'undefined';
  if (arg === null) return 'null';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);

  if (typeof arg === 'object' && arg !== null) {
    const record = arg as Record<string, unknown>;
    if (record.__type === 'Error') {
      return `${record.name}: ${record.message}`;
    }
    if (record.__type === 'Date') {
      return `Date: ${record.value}`;
    }
    if (record.__type === 'Map') {
      return `Map(${record.size}) { ${JSON.stringify(record.entries)} }`;
    }
    if (record.__type === 'Set') {
      return `Set(${record.size}) { ${JSON.stringify(record.items)} }`;
    }
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return '[Unserializable Object]';
    }
  }

  return String(arg);
}
