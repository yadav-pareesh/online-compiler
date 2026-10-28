import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import type { StaticAnalysisResult, BigOValue } from '../complexity.types';

type AnyNode = any;

const LOOP_TYPES = new Set([
  'ForStatement',
  'WhileStatement',
  'DoWhileStatement',
  'ForOfStatement',
  'ForInStatement',
]);

function isLoopNode(node: AnyNode): boolean {
  return node && LOOP_TYPES.has(node.type);
}

/**
 * Perform AST-based static complexity analysis on JavaScript code without executing it.
 */
export function analyzeJavaScriptAST(sourceCode: string): StaticAnalysisResult {
  const detectedPatterns: string[] = [];
  const notes: string[] = [];
  const arrayMethods: string[] = [];
  const externalCalls: string[] = [];
  const inputParameters: string[] = [];

  let maxLoopDepth = 0;
  let hasNestedLoops = false;
  let hasLogarithmicLoop = false;
  let hasSorting = false;
  let hasTwoPointers = false;
  let hasBinarySearch = false;
  let hasMemoization = false;

  const allocations = {
    inLoop: false,
    types: [] as string[],
    description: '',
  };

  let hasRecursion = false;
  let recursionType: 'linear' | 'branching' | 'tail' | 'none' = 'none';

  // Attempt to parse AST safely
  let ast: AnyNode = null;
  try {
    ast = acorn.parse(sourceCode, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
    });
  } catch (err: any) {
    try {
      ast = acorn.parse(sourceCode, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        locations: true,
      });
    } catch (scriptErr: any) {
      return {
        detectedPatterns: ['parse_error'],
        estimatedTimeComplexity: 'unknown',
        estimatedSpaceComplexity: 'unknown',
        maxLoopDepth: 0,
        hasRecursion: false,
        hasNestedLoops: false,
        hasLogarithmicLoop: false,
        hasSorting: false,
        arrayMethods: [],
        allocations: { inLoop: false, types: [] },
        inputParameters: [],
        externalCalls: [],
        notes: ['Syntax error encountered during AST parsing.'],
        syntaxValid: false,
        parseError: scriptErr?.message || err?.message || 'Syntax error',
      };
    }
  }

  // Track defined functions and their scopes for recursion and parameter analysis
  const definedFunctions = new Map<
    string,
    {
      params: string[];
      recursiveCallCount: number;
      isTailRecursive: boolean;
      bodyNode: AnyNode;
    }
  >();

  // Pass 1: Collect defined functions & parameters
  walk.simple(ast, {
    FunctionDeclaration(node: AnyNode) {
      if (node.id?.name) {
        const params = node.params.map((p: AnyNode) => (p.type === 'Identifier' ? p.name : 'param'));
        definedFunctions.set(node.id.name, {
          params,
          recursiveCallCount: 0,
          isTailRecursive: false,
          bodyNode: node.body,
        });
        params.forEach((p: string) => {
          if (!inputParameters.includes(p)) inputParameters.push(p);
        });
      }
    },
    VariableDeclarator(node: AnyNode) {
      if (
        node.id?.type === 'Identifier' &&
        node.init &&
        (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression')
      ) {
        const params = (node.init.params || []).map((p: AnyNode) =>
          p.type === 'Identifier' ? p.name : 'param'
        );
        definedFunctions.set(node.id.name, {
          params,
          recursiveCallCount: 0,
          isTailRecursive: false,
          bodyNode: node.init.body,
        });
        params.forEach((p: string) => {
          if (!inputParameters.includes(p)) inputParameters.push(p);
        });
      }
    },
  });

  // Pass 2: Analyze recursion within each defined function
  for (const [fnName, fnInfo] of definedFunctions.entries()) {
    let callCount = 0;
    walk.simple(fnInfo.bodyNode, {
      CallExpression(callNode: AnyNode) {
        let calleeName: string | null = null;
        if (callNode.callee.type === 'Identifier') {
          calleeName = callNode.callee.name;
        }
        if (calleeName === fnName) {
          callCount++;
        }
      },
    });

    if (callCount > 0) {
      hasRecursion = true;
      fnInfo.recursiveCallCount = callCount;
      if (callCount === 1) {
        recursionType = 'linear';
        detectedPatterns.push(`recursion_linear (${fnName})`);
      } else {
        recursionType = 'branching';
        detectedPatterns.push(`recursion_branching (${fnName}, ${callCount} branches)`);
      }
    }
  }

  // Pass 3: Detailed traversal for loops, array methods, allocations, patterns
  const knownIterativeMethods = new Set([
    'map',
    'filter',
    'reduce',
    'forEach',
    'some',
    'every',
    'flatMap',
    'find',
    'findIndex',
  ]);

  function handleLoopVisit(type: string, ancestors: AnyNode[]) {
    // Current loop is the last element in ancestors; count how many loop nodes are in the ancestor stack
    const loopAncestors = ancestors.filter(isLoopNode);
    const depth = loopAncestors.length;
    if (depth > maxLoopDepth) {
      maxLoopDepth = depth;
    }
    if (depth > 1) {
      hasNestedLoops = true;
      const tag = `nested_${type}_loop_depth_${depth}`;
      if (!detectedPatterns.includes(tag)) {
        detectedPatterns.push(tag);
      }
    } else {
      const tag = `single_${type}_loop`;
      if (!detectedPatterns.includes(tag)) {
        detectedPatterns.push(tag);
      }
    }
  }

  function recordAllocation(type: string, inLoop: boolean) {
    if (!allocations.types.includes(type)) {
      allocations.types.push(type);
    }
    if (inLoop) {
      allocations.inLoop = true;
      const tag = `allocation_in_loop_${type}`;
      if (!detectedPatterns.includes(tag)) {
        detectedPatterns.push(tag);
      }
    }
  }

  walk.ancestor(ast, {
    ForStatement(node: AnyNode, ancestors: AnyNode[]) {
      handleLoopVisit('for', ancestors);
      inspectLoopForLogarithmic(node);
    },
    WhileStatement(_node: AnyNode, ancestors: AnyNode[]) {
      handleLoopVisit('while', ancestors);
      inspectWhileCondition();
    },
    DoWhileStatement(_node: AnyNode, ancestors: AnyNode[]) {
      handleLoopVisit('do_while', ancestors);
    },
    ForOfStatement(_node: AnyNode, ancestors: AnyNode[]) {
      handleLoopVisit('for_of', ancestors);
    },
    ForInStatement(_node: AnyNode, ancestors: AnyNode[]) {
      handleLoopVisit('for_in', ancestors);
    },

    CallExpression(node: AnyNode, ancestors: AnyNode[]) {

      if (node.callee.type === 'MemberExpression') {
        const prop = node.callee.property;
        if (prop && prop.type === 'Identifier') {
          const methodName = prop.name;

          if (knownIterativeMethods.has(methodName)) {
            if (!arrayMethods.includes(methodName)) {
              arrayMethods.push(methodName);
            }
            if (!detectedPatterns.includes(`array_${methodName}`)) {
              detectedPatterns.push(`array_${methodName}`);
            }

            // Check if nested inside loop or another array method callback
            const loopDepth = ancestors.filter(isLoopNode).length;
            const isInsideAnotherIterativeMethod = ancestors.some(
              (a: AnyNode) =>
                a !== node &&
                a.type === 'CallExpression' &&
                a.callee?.type === 'MemberExpression' &&
                knownIterativeMethods.has(a.callee.property?.name)
            );

            if (loopDepth > 0 || isInsideAnotherIterativeMethod) {
              const effectiveDepth = loopDepth + (isInsideAnotherIterativeMethod ? 2 : 1);
              if (effectiveDepth > maxLoopDepth) {
                maxLoopDepth = effectiveDepth;
              }
              hasNestedLoops = true;
              if (!detectedPatterns.includes(`nested_array_${methodName}`)) {
                detectedPatterns.push(`nested_array_${methodName}`);
              }
            }
          }

          if (methodName === 'sort') {
            hasSorting = true;
            if (!detectedPatterns.includes('array_sort')) {
              detectedPatterns.push('array_sort');
            }
          }
        }
      } else if (node.callee.type === 'Identifier') {
        const callName = node.callee.name;
        const isBuiltin =
          ['Math', 'console', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'Array', 'Object', 'String', 'Number', 'Boolean'].includes(
            callName
          ) || definedFunctions.has(callName);

        if (!isBuiltin && !externalCalls.includes(callName)) {
          externalCalls.push(callName);
        }
      }
    },

    ArrayExpression(_node: AnyNode, ancestors: AnyNode[]) {
      recordAllocation('array_literal', ancestors.some(isLoopNode));
    },
    ObjectExpression(_node: AnyNode, ancestors: AnyNode[]) {
      recordAllocation('object_literal', ancestors.some(isLoopNode));
    },
    NewExpression(node: AnyNode, ancestors: AnyNode[]) {
      if (node.callee.type === 'Identifier') {
        const name = node.callee.name;
        if (['Array', 'Set', 'Map', 'WeakMap', 'WeakSet'].includes(name)) {
          recordAllocation(`new_${name}`, ancestors.some(isLoopNode));
        }
      }
    },

    BinaryExpression(node: AnyNode) {
      if (['<', '<=', '>', '>='].includes(node.operator)) {
        const leftName = node.left?.name?.toLowerCase?.() || '';
        const rightName = node.right?.name?.toLowerCase?.() || '';
        if (
          (leftName.includes('left') && rightName.includes('right')) ||
          (leftName.includes('low') && rightName.includes('high')) ||
          (leftName.includes('start') && rightName.includes('end')) ||
          (leftName === 'i' && rightName === 'j')
        ) {
          hasTwoPointers = true;
          if (!detectedPatterns.includes('two_pointers_candidate')) {
            detectedPatterns.push('two_pointers_candidate');
          }
        }
      }
    },

    MemberExpression(node: AnyNode) {
      if (
        node.object?.type === 'Identifier' &&
        node.object.name === 'Math' &&
        node.property?.type === 'Identifier' &&
        node.property.name === 'floor'
      ) {
        hasBinarySearch = true;
      }

      const objName = node.object?.name?.toLowerCase?.() || '';
      if (['memo', 'cache', 'dp', 'table', 'seen'].includes(objName)) {
        hasMemoization = true;
        if (!detectedPatterns.includes('memoization_or_dp')) {
          detectedPatterns.push('memoization_or_dp');
        }
      }
    },
  });

  function inspectLoopForLogarithmic(node: AnyNode) {
    if (!node.update) return;

    const update = node.update;
    if (update.type === 'AssignmentExpression') {
      if (['*=', '/=', '>>=', '<<='].includes(update.operator)) {
        hasLogarithmicLoop = true;
        if (!detectedPatterns.includes('logarithmic_loop_step')) {
          detectedPatterns.push('logarithmic_loop_step');
        }
      } else if (update.operator === '=') {
        const right = update.right;
        if (
          right.type === 'BinaryExpression' &&
          ['*', '/', '>>', '<<'].includes(right.operator)
        ) {
          hasLogarithmicLoop = true;
          if (!detectedPatterns.includes('logarithmic_loop_step')) {
            detectedPatterns.push('logarithmic_loop_step');
          }
        } else if (
          right.type === 'CallExpression' &&
          right.callee?.property?.name === 'floor'
        ) {
          hasLogarithmicLoop = true;
          if (!detectedPatterns.includes('logarithmic_loop_step')) {
            detectedPatterns.push('logarithmic_loop_step');
          }
        }
      }
    }
  }

  function inspectWhileCondition() {
    if (hasTwoPointers && hasBinarySearch) {
      hasLogarithmicLoop = true;
      if (!detectedPatterns.includes('binary_search_pattern')) {
        detectedPatterns.push('binary_search_pattern');
      }
    }
  }

  // Synthesize Static Time Complexity Estimate
  let estimatedTimeComplexity: BigOValue = 'O(1)';
  let estimatedSpaceComplexity: BigOValue = 'O(1)';

  // Space complexity assessment
  if (allocations.inLoop) {
    estimatedSpaceComplexity = maxLoopDepth >= 2 ? 'O(n^2)' : 'O(n)';
    notes.push('Dynamic allocations detected inside loop body.');
  } else if (allocations.types.length > 0) {
    estimatedSpaceComplexity = 'O(n)';
  }

  if (hasRecursion) {
    if (recursionType === 'branching') {
      estimatedTimeComplexity = hasMemoization ? 'O(n)' : 'O(2^n)';
      estimatedSpaceComplexity = 'O(n)'; // Call stack depth
      notes.push('Branching recursion detected (call stack auxiliary space O(n)).');
    } else {
      estimatedTimeComplexity = hasLogarithmicLoop ? 'O(log n)' : 'O(n)';
      estimatedSpaceComplexity = hasLogarithmicLoop ? 'O(log n)' : 'O(n)';
      notes.push('Linear recursive call stack identified.');
    }
  } else if (hasLogarithmicLoop && maxLoopDepth <= 1) {
    estimatedTimeComplexity = 'O(log n)';
    notes.push('Logarithmic loop step or binary search pattern detected.');
  } else if (hasSorting) {
    estimatedTimeComplexity = maxLoopDepth >= 1 ? 'O(n^2)' : 'O(n log n)';
    notes.push('Array .sort() invocation detected (typically O(n log n) comparison sort).');
  } else if (maxLoopDepth >= 3) {
    estimatedTimeComplexity = 'O(n^3)';
    notes.push(`Deeply nested loops detected (max nesting depth: ${maxLoopDepth}).`);
  } else if (maxLoopDepth === 2 || (maxLoopDepth === 1 && arrayMethods.length > 0 && hasNestedLoops)) {
    // Check multiple input parameters (e.g. n and m)
    if (inputParameters.length >= 2) {
      estimatedTimeComplexity = 'O(n * m)';
      notes.push('Nested iteration over distinct function parameters detected.');
    } else {
      estimatedTimeComplexity = 'O(n^2)';
      notes.push('Quadratic loop nesting detected.');
    }
  } else if (maxLoopDepth === 1 || arrayMethods.length > 0) {
    estimatedTimeComplexity = 'O(n)';
    notes.push('Single sequential loop or array iteration detected.');
  }

  if (externalCalls.length > 0) {
    notes.push(`Unanalyzed external function calls: ${externalCalls.join(', ')}.`);
  }

  if (detectedPatterns.length === 0) {
    detectedPatterns.push('constant_operations');
  }

  return {
    detectedPatterns,
    estimatedTimeComplexity,
    estimatedSpaceComplexity,
    maxLoopDepth,
    hasRecursion,
    recursionType,
    hasNestedLoops,
    hasLogarithmicLoop,
    hasSorting,
    arrayMethods,
    allocations,
    inputParameters,
    externalCalls,
    notes,
    syntaxValid: true,
  };
}
