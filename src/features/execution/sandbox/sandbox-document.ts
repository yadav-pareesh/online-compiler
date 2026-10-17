export function createSandboxHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none';">
  <title>JS Isolated Sandbox</title>
</head>
<body>
<script>
(function() {
  'use strict';

  // 1. Defensively disable network and worker APIs
  try {
    window.fetch = function() { throw new Error('Network requests (fetch) are disabled in this sandbox.'); };
    window.XMLHttpRequest = function() { throw new Error('Network requests (XMLHttpRequest) are disabled in this sandbox.'); };
    window.WebSocket = function() { throw new Error('WebSockets are disabled in this sandbox.'); };
    if (window.EventSource) window.EventSource = function() { throw new Error('EventSource is disabled in this sandbox.'); };
    if (window.Worker) window.Worker = function() { throw new Error('Web Workers are disabled in this sandbox.'); };
    if (window.SharedWorker) window.SharedWorker = function() { throw new Error('SharedWorkers are disabled in this sandbox.'); };
    if (navigator.sendBeacon) navigator.sendBeacon = function() { return false; };
  } catch (e) {}

  var currentExecutionId = null;

  // 2. Cycle-safe serialization
  function serializeValue(val, depth, seen) {
    if (depth === undefined) depth = 0;
    if (seen === undefined) seen = [];

    if (depth > 4) return '[Max Depth Reached]';
    if (val === null) return null;
    if (val === undefined) return '__UNDEFINED__';
    if (typeof val === 'number') {
      if (isNaN(val)) return 'NaN';
      if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';
      return val;
    }
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      if (val.length > 8000) {
        return val.slice(0, 8000) + ' ... [truncated: output exceeded limit]';
      }
      return val;
    }
    if (typeof val === 'bigint') return val.toString() + 'n';
    if (typeof val === 'symbol') return val.toString();
    if (typeof val === 'function') return '[Function: ' + (val.name || 'anonymous') + ']';

    if (typeof val === 'object') {
      for (var s = 0; s < seen.length; s++) {
        if (seen[s] === val) return '[Circular]';
      }
      seen.push(val);

      try {
        if (val instanceof Error) {
          return {
            __type: 'Error',
            name: val.name,
            message: val.message,
            stack: val.stack
          };
        }
        if (val instanceof Date) {
          return { __type: 'Date', value: val.toISOString() };
        }
        if (val instanceof RegExp) {
          return val.toString();
        }
        if (val instanceof Map) {
          var mapEntries = [];
          var mapCount = 0;
          val.forEach(function(v, k) {
            if (mapCount++ < 50) {
              mapEntries.push([serializeValue(k, depth + 1, seen), serializeValue(v, depth + 1, seen)]);
            }
          });
          return { __type: 'Map', size: val.size, entries: mapEntries };
        }
        if (val instanceof Set) {
          var setItems = [];
          var setCount = 0;
          val.forEach(function(item) {
            if (setCount++ < 50) {
              setItems.push(serializeValue(item, depth + 1, seen));
            }
          });
          return { __type: 'Set', size: val.size, items: setItems };
        }
        if (Array.isArray(val)) {
          var arr = [];
          var maxItems = Math.min(val.length, 300);
          for (var i = 0; i < maxItems; i++) {
            arr.push(serializeValue(val[i], depth + 1, seen));
          }
          if (val.length > 300) {
            arr.push('... ' + (val.length - 300) + ' more items');
          }
          return arr;
        }

        var obj = {};
        var keys = Object.keys(val);
        var maxKeys = Math.min(keys.length, 100);
        for (var k = 0; k < maxKeys; k++) {
          var key = keys[k];
          try {
            obj[key] = serializeValue(val[key], depth + 1, seen);
          } catch (propErr) {
            obj[key] = '[Unreadable property]';
          }
        }
        if (keys.length > 100) {
          obj['__truncated__'] = (keys.length - 100) + ' more properties';
        }
        return obj;
      } finally {
        seen.pop();
      }
    }

    return String(val);
  }

  function formatTableData(val) {
    try {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
        var columnSet = new Set();
        val.forEach(function(row) {
          if (row && typeof row === 'object') {
            Object.keys(row).forEach(function(col) { columnSet.add(col); });
          }
        });
        var columns = Array.from(columnSet);
        var rows = val.slice(0, 50).map(function(item, idx) {
          var rowObj = { '(index)': String(idx) };
          columns.forEach(function(col) {
            var cellVal = item ? item[col] : undefined;
            rowObj[col] = cellVal === undefined ? '' : typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal);
          });
          return rowObj;
        });
        return { columns: ['(index)'].concat(columns), rows: rows };
      }
    } catch (e) {}
    return undefined;
  }

  function emitConsole(level, originalArgs) {
    if (!currentExecutionId) return;
    try {
      var serialized = [];
      for (var i = 0; i < originalArgs.length; i++) {
        serialized.push(serializeValue(originalArgs[i]));
      }

      var tableData = undefined;
      if (level === 'table' && originalArgs.length > 0) {
        tableData = formatTableData(originalArgs[0]);
      }

      window.parent.postMessage({
        type: 'CONSOLE',
        executionId: currentExecutionId,
        level: level,
        args: serialized,
        tableData: tableData,
        timestamp: Date.now()
      }, '*');
    } catch (e) {}
  }

  // Intercept console methods
  var originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
    table: console.table ? console.table.bind(console) : console.log.bind(console)
  };

  console.log = function() { emitConsole('log', arguments); };
  console.info = function() { emitConsole('info', arguments); };
  console.warn = function() { emitConsole('warn', arguments); };
  console.error = function() { emitConsole('error', arguments); };
  console.debug = function() { emitConsole('debug', arguments); };
  console.table = function() { emitConsole('table', arguments); };

  // Global error listeners
  window.onerror = function(message, source, lineno, colno, error) {
    if (!currentExecutionId) return false;
    window.parent.postMessage({
      type: 'EXECUTION_ERROR',
      executionId: currentExecutionId,
      error: {
        name: error && error.name ? error.name : 'UncaughtError',
        message: String(message),
        line: lineno,
        column: colno,
        stack: error && error.stack ? error.stack : undefined
      },
      durationMs: 0
    }, '*');
    return true;
  };

  window.addEventListener('unhandledrejection', function(event) {
    if (!currentExecutionId) return;
    var reason = event.reason;
    var name = 'UnhandledPromiseRejection';
    var message = reason ? (reason.message || String(reason)) : 'Promise rejected without reason';
    var stack = reason && reason.stack ? reason.stack : undefined;
    window.parent.postMessage({
      type: 'EXECUTION_ERROR',
      executionId: currentExecutionId,
      error: { name: name, message: message, stack: stack },
      durationMs: 0
    }, '*');
  });

  // Listen for execution commands from parent
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'EXECUTE') {
      currentExecutionId = data.executionId;
      var startTime = performance.now();
      try {
        // Execute inside the sandbox context
        var result = (0, eval)(data.code);

        // Check if user returned a promise or async expression
        if (result && typeof result.then === 'function') {
          result.then(function() {
            var duration = Math.round(performance.now() - startTime);
            window.parent.postMessage({
              type: 'EXECUTION_COMPLETE',
              executionId: currentExecutionId,
              durationMs: duration
            }, '*');
          }).catch(function(err) {
            var duration = Math.round(performance.now() - startTime);
            window.parent.postMessage({
              type: 'EXECUTION_ERROR',
              executionId: currentExecutionId,
              error: {
                name: err && err.name ? err.name : 'AsyncError',
                message: err && err.message ? err.message : String(err),
                stack: err && err.stack ? err.stack : undefined
              },
              durationMs: duration
            }, '*');
          });
        } else {
          var duration = Math.round(performance.now() - startTime);
          window.parent.postMessage({
            type: 'EXECUTION_COMPLETE',
            executionId: currentExecutionId,
            durationMs: duration
          }, '*');
        }
      } catch (err) {
        var duration = Math.round(performance.now() - startTime);
        window.parent.postMessage({
          type: 'EXECUTION_ERROR',
          executionId: currentExecutionId,
          error: {
            name: err && err.name ? err.name : 'RuntimeError',
            message: err && err.message ? err.message : String(err),
            stack: err && err.stack ? err.stack : undefined
          },
          durationMs: duration
        }, '*');
      }
    }
  });

  // Signal ready to parent
  window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');
})();
</script>
</body>
</html>`;
}
