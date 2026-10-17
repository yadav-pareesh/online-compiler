import type { LanguageCapabilities } from '../language.types';

export const JAVASCRIPT_CAPABILITIES: LanguageCapabilities = {
  asyncAwait: true,
  promises: true,
  domAccess: false,
  networkAccess: false,
  filesystem: false,
  npmModules: false,
  consoleMethods: ['log', 'info', 'warn', 'error', 'debug', 'table'],
  featuresDescription: [
    'ES2024 modern syntax (const/let, arrow functions, destructuring)',
    'Async/await, Promises, microtasks',
    'Higher-order array methods (map, filter, reduce, find, flatMap)',
    'Closures and lexical scoping',
    'Object manipulations & prototype inspection',
    'Formatted console methods (log, info, warn, error, debug, table)',
    'Strict CSP-sandboxed execution with 3-second timeout protection',
  ],
};
