export const EXECUTION_DEFAULTS = {
  TIMEOUT_MS: 3000,
  MAX_MESSAGES: 500,
  MAX_STRING_LENGTH: 10000,
  MAX_TOTAL_OUTPUT_CHARS: 50000,
  MAX_DEPTH: 4,
} as const;

export const PROTOCOL_ORIGIN = 'null'; // Sandboxed iframe without allow-same-origin has origin 'null'
