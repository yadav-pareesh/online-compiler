import type { LanguageDefinition } from '../language.types';
import { JAVASCRIPT_CAPABILITIES } from './javascript.capabilities';
import { EXECUTION_DEFAULTS } from '../../features/execution/execution.constants';

export const JAVASCRIPT_DEFAULT_CODE = `const numbers = [10, 20, 30, 40];

const total = numbers.reduce(
  (sum, number) => sum + number,
  0
);

console.log("Numbers:", numbers);
console.log("Total:", total);
console.log("JavaScript is ready!");
`;

export const JAVASCRIPT_LANGUAGE_CONFIG: LanguageDefinition = {
  id: 'javascript',
  name: 'JavaScript',
  extension: '.js',
  version: 'ES2024 / V8 Sandbox',
  defaultCode: JAVASCRIPT_DEFAULT_CODE,
  executionStrategy: 'browser-sandbox',
  capabilities: JAVASCRIPT_CAPABILITIES,
  limits: {
    defaultTimeoutMs: EXECUTION_DEFAULTS.TIMEOUT_MS,
    maxOutputChars: EXECUTION_DEFAULTS.MAX_TOTAL_OUTPUT_CHARS,
  },
  snippets: [
    {
      id: 'default',
      title: 'Array Operations',
      description: 'Default sample with array reduce and console logging',
      code: JAVASCRIPT_DEFAULT_CODE,
    },
    {
      id: 'async-await',
      title: 'Promises & Async/Await',
      description: 'Demonstrating asynchronous control flow and delays',
      code: `function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTasks() {
  console.info("Starting async workflow...");
  
  for (let i = 1; i <= 3; i++) {
    await wait(400);
    console.log(\`Step \${i} completed at \${new Date().toLocaleTimeString()}\`);
  }
  
  return { status: "success", timestamp: Date.now() };
}

runTasks().then((res) => {
  console.log("Finished:", res);
});
`,
    },
    {
      id: 'console-table',
      title: 'Console Table & Objects',
      description: 'Structured tabular view of records',
      code: `const developers = [
  { id: 1, name: "Ada Lovelace", role: "Mathematician", active: true },
  { id: 2, name: "Alan Turing", role: "Computer Scientist", active: true },
  { id: 3, name: "Grace Hopper", role: "Compiler Pioneer", active: false }
];

console.table(developers);
console.info("Developer list count:", developers.length);
`,
    },
    {
      id: 'closures-math',
      title: 'Closures & Math',
      description: 'Higher-order function counter and memoization',
      code: `function createCounter(initialValue = 0) {
  let count = initialValue;
  return {
    increment: () => ++count,
    decrement: () => --count,
    get: () => count
  };
}

const counter = createCounter(10);
console.log("Initial:", counter.get());
console.log("Increment:", counter.increment());
console.log("Increment:", counter.increment());
console.log("Decrement:", counter.decrement());
`,
    },
  ],
};
