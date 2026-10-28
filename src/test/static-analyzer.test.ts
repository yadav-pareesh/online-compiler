import { describe, it, expect } from 'vitest';
import { analyzeJavaScriptAST } from '../features/complexity/analyzer/static-analyzer';

describe('Local AST Static Analyzer', () => {
  it('should detect constant O(1) operations for simple statements', () => {
    const code = `
      function add(a, b) {
        const sum = a + b;
        return sum * 2;
      }
    `;
    const result = analyzeJavaScriptAST(code);
    expect(result.syntaxValid).toBe(true);
    expect(result.estimatedTimeComplexity).toBe('O(1)');
    expect(result.estimatedSpaceComplexity).toBe('O(1)');
    expect(result.maxLoopDepth).toBe(0);
    expect(result.hasRecursion).toBe(false);
  });

  it('should detect linear O(n) loop', () => {
    const code = `
      function sumArray(arr) {
        let total = 0;
        for (let i = 0; i < arr.length; i++) {
          total += arr[i];
        }
        return total;
      }
    `;
    const result = analyzeJavaScriptAST(code);
    expect(result.syntaxValid).toBe(true);
    expect(result.estimatedTimeComplexity).toBe('O(n)');
    expect(result.maxLoopDepth).toBe(1);
    expect(result.detectedPatterns).toContain('single_for_loop');
  });

  it('should detect linear array method (reduce)', () => {
    const code = `
      const numbers = [10, 20, 30, 40];
      const total = numbers.reduce((sum, n) => sum + n, 0);
      console.log(total);
    `;
    const result = analyzeJavaScriptAST(code);
    expect(result.syntaxValid).toBe(true);
    expect(result.estimatedTimeComplexity).toBe('O(n)');
    expect(result.arrayMethods).toContain('reduce');
    expect(result.detectedPatterns).toContain('array_reduce');
  });

  it('should detect quadratic O(n^2) nested loops', () => {
    const code = `
      function bubbleSort(arr) {
        const n = arr.length;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
              const temp = arr[j];
              arr[j] = arr[j + 1];
              arr[j + 1] = temp;
            }
          }
        }
        return arr;
      }
    `;
    const result = analyzeJavaScriptAST(code);
    expect(result.syntaxValid).toBe(true);
    expect(result.estimatedTimeComplexity).toBe('O(n^2)');
    expect(result.maxLoopDepth).toBe(2);
    expect(result.hasNestedLoops).toBe(true);
  });

  it('should detect O(log n) logarithmic loop update (i *= 2)', () => {
    const code = `
      function logLoop(n) {
        let count = 0;
        for (let i = 1; i < n; i *= 2) {
          count++;
        }
        return count;
      }
    `;
    const result = analyzeJavaScriptAST(code);
    expect(result.syntaxValid).toBe(true);
    expect(result.hasLogarithmicLoop).toBe(true);
    expect(result.estimatedTimeComplexity).toBe('O(log n)');
  });

  it('should detect multi-variable loops over two distinct parameters', () => {
    const code = `
      function crossProduct(listA, listB) {
        const pairs = [];
        for (let i = 0; i < listA.length; i++) {
          for (let j = 0; j < listB.length; j++) {
            pairs.push([listA[i], listB[j]]);
          }
        }
        return pairs;
      }
    `;
    const result = analyzeJavaScriptAST(code);
    expect(result.syntaxValid).toBe(true);
    expect(result.maxLoopDepth).toBe(2);
    expect(result.estimatedTimeComplexity).toBe('O(n * m)');
    expect(result.allocations.inLoop).toBe(true);
  });

  it('should detect linear recursion (e.g. factorial)', () => {
    const code = `
      function factorial(n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
      }
    `;
    const result = analyzeJavaScriptAST(code);
    expect(result.syntaxValid).toBe(true);
    expect(result.hasRecursion).toBe(true);
    expect(result.recursionType).toBe('linear');
    expect(result.estimatedTimeComplexity).toBe('O(n)');
    expect(result.estimatedSpaceComplexity).toBe('O(n)');
  });

  it('should detect branching recursion (e.g. fibonacci)', () => {
    const code = `
      function fib(n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
      }
    `;
    const result = analyzeJavaScriptAST(code);
    expect(result.syntaxValid).toBe(true);
    expect(result.hasRecursion).toBe(true);
    expect(result.recursionType).toBe('branching');
    expect(result.estimatedTimeComplexity).toBe('O(2^n)');
    expect(result.estimatedSpaceComplexity).toBe('O(n)');
  });

  it('should detect array sorting O(n log n)', () => {
    const code = `
      function sortNumbers(arr) {
        return arr.slice().sort((a, b) => a - b);
      }
    `;
    const result = analyzeJavaScriptAST(code);
    expect(result.syntaxValid).toBe(true);
    expect(result.hasSorting).toBe(true);
    expect(result.estimatedTimeComplexity).toBe('O(n log n)');
  });

  it('should handle syntax errors safely without throwing', () => {
    const badCode = `
      function broken() {
        for (let i = 0;
    `;
    const result = analyzeJavaScriptAST(badCode);
    expect(result.syntaxValid).toBe(false);
    expect(result.parseError).toBeDefined();
    expect(result.estimatedTimeComplexity).toBe('unknown');
  });
});
