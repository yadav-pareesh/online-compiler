# Online JavaScript Compiler & Code Runner (V1)

A fast, lightweight, and secure browser-based JavaScript coding and execution platform inspired by the simplicity of modern online code runners such as Programiz.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **CodeMirror 6**, this platform executes untrusted JavaScript in an isolated, sandboxed execution environment with strict Content Security Policies, real-time formatted console output, tabular inspections, error stacks, and watchdog timeout protection.

---

## 🚀 Key Features

- **Full-featured CodeMirror 6 Editor**:
  - JavaScript syntax highlighting and bracket matching
  - Autocompletion and automatic indentation
  - Active line highlight, fold gutter, line wrapping toggle, and font size selector (12px–18px)
  - Preloaded with the official starter program:
    ```javascript
    const numbers = [10, 20, 30, 40];
    const total = numbers.reduce((sum, number) => sum + number, 0);
    console.log("Numbers:", numbers);
    console.log("Total:", total);
    console.log("JavaScript is ready!");
    ```
- **Execution & Console Output**:
  - Captures `console.log`, `console.info`, `console.warn`, `console.error`, `console.debug`, and `console.table`.
  - Visual badges for log levels, copy-to-clipboard for each line or the entire console, and log level filtering (All, Logs, Warnings, Errors).
  - Clean table formatting for array of objects or object records.
  - Cycle-safe serialization (handles circular references `[Circular]`, `BigInt`, `Symbol`, `Map`, `Set`, `Error`, and deep nesting depth limits).
  - Truncation indicator for outputs exceeding size limits without crashing the browser.
- **Defensive Sandbox Isolation**:
  - Sandboxed execution inside an isolated `<iframe>` with `sandbox="allow-scripts"` (strictly **without** `allow-same-origin`).
  - Restrictive Content Security Policy: `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none';`
  - Disabled dangerous network APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `Worker`).
  - Parent-level watchdog timer (3 seconds) that automatically terminates and recreates the iframe if an infinite loop (e.g. `while(true) {}`) or unresponsive code is executed.
  - No `eval()` or `new Function()` in the parent React application context.
- **Developer Productivity & Shortcuts**:
  - `Ctrl + Enter` (Windows/Linux) or `⌘ + Enter` (macOS) to run instantly.
  - Preloaded curated examples (Array Operations, Promises & Async/Await, Console Table & Objects, Closures & Math).
  - Reset to starter template button.
  - Dark / Light mode toggle with persistent state in `localStorage`.
- **Responsive Workspace**:
  - Desktop: Side-by-side workspace with 60% editor and 40% console panel.
  - Mobile & Tablet: Seamless tab switching between "Code Editor" and "Console Output" with badge indicators.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript (Strict Mode) |
| **Bundler** | Vite 8 |
| **Styling** | Tailwind CSS + PostCSS |
| **Editor** | CodeMirror 6 (`@uiw/react-codemirror`, `@codemirror/lang-javascript`) |
| **Icons** | Lucide React |
| **Testing** | Vitest + React Testing Library + `@testing-library/jest-dom` + JSDOM |

---

## 📂 Project Architecture

```text
src/
├── app/
│   └── App.tsx                      # Root workspace orchestrator & shortcut handler
├── components/
│   ├── editor/
│   │   ├── CodeEditor.tsx           # CodeMirror 6 wrapper with extensions
│   │   └── EditorToolbar.tsx        # File metadata, font size, and wrap toggle
│   ├── layout/
│   │   ├── Header.tsx               # Brand, language selector, snippets, run button
│   │   ├── WorkspaceLayout.tsx      # Responsive desktop split & mobile tabs
│   │   └── Footer.tsx               # Runtime status bar and security indicators
│   └── output/
│       ├── OutputPanel.tsx          # Console message list, filters, and clear button
│       ├── ConsoleMessageItem.tsx   # Per-log formatting, badge, and table view
│       └── ExecutionStatusBadge.tsx # Ready, Running, Completed, Timed out, Error badges
├── features/
│   └── execution/
│       ├── execution.constants.ts   # Execution limits (timeout, string length, depth)
│       ├── execution.protocol.ts    # postMessage payload types and validators
│       ├── execution.service.ts     # Execution lifecycle, watchdog timer, cancellation
│       ├── execution.types.ts       # Domain execution request/result interfaces
│       └── sandbox/
│           ├── sandbox-document.ts  # Isolated iframe HTML template with CSP and serializer
│           └── SandboxManager.ts    # Iframe lifecycle, creation, termination, recreation
├── languages/
│   ├── language.types.ts            # LanguageDefinition, capabilities, snippets
│   ├── language.registry.ts         # Extensible registry for language configurations
│   └── javascript/
│       ├── javascript.capabilities.ts # Declared capabilities (ES2024, async/await, no DOM)
│       └── javascript.config.ts       # Default code, snippets, and execution limits
├── lib/
│   ├── errors.ts                    # Error normalization & stack extraction
│   └── serialization.ts             # Cycle-safe serializer & console formatter
└── test/
    ├── components.test.tsx          # Component tests for Header, Output, StatusBadge
    ├── errors.test.ts               # Error normalization unit tests
    ├── execution.protocol.test.ts   # Protocol message validation tests
    ├── language-registry.test.ts    # Language registry and capability tests
    ├── serialization.test.ts        # Circular references, BigInt, symbol tests
    └── setup.ts                     # Testing Library matchers setup
```

---

## 🔒 Security Model & Isolation

Executing untrusted user code in a web application poses significant security risks. The V1 architecture implements defensive layers:

1. **Sandboxed `<iframe>` Isolation**:
   - The execution iframe is created with `sandbox="allow-scripts"` and **omits** `allow-same-origin`.
   - As a result, the sandbox has an opaque `null` origin, completely preventing it from accessing:
     - Parent document DOM, cookies, `localStorage`, `sessionStorage`, or `indexedDB`.
2. **Restrictive Content Security Policy (CSP)**:
   - `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none';">`
   - Blocks unauthorized network communication, resource loads, and form posts.
3. **API Neutralization**:
   - Inside the sandbox, `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and `Worker` are neutralized.
4. **Watchdog Timeout Protection**:
   - If user code triggers an infinite loop (`while(true) {}`), the sandbox JavaScript thread freezes.
   - The parent application runs a 3-second timeout watchdog. If execution does not complete within 3000ms, the parent terminates the frozen iframe by removing it from the DOM and creates a fresh sandboxed iframe, leaving the UI fully interactive.
5. **No Parent `eval()`**:
   - Neither `eval()` nor `new Function()` is ever invoked in the parent React application context.
6. **XSS Prevention**:
   - Console outputs are rendered as safe text nodes and tabular structures; HTML injection is prevented.

### Known Limitations
- A browser sandbox runs on the user's client machine. While it isolates the parent web app and cookies, it is not a substitute for hardened server-side containerized isolation (Docker/gVisor) when running native binaries or backend languages.

---

## 🧩 Extending to Future Languages (V2 Roadmap)

The platform is designed around a language-agnostic registry and execution abstraction:

1. **Define Language Configuration**:
   Create a new file in `src/languages/<lang>/`:
   ```typescript
   export const PYTHON_LANGUAGE_CONFIG: LanguageDefinition = {
     id: 'python',
     name: 'Python',
     extension: '.py',
     version: '3.12 (Pyodide WebAssembly)',
     defaultCode: 'print("Hello from Python!")',
     executionStrategy: 'web-worker', // or 'remote-container'
     capabilities: { ... },
     limits: { defaultTimeoutMs: 5000, maxOutputChars: 50000 },
     snippets: [ ... ]
   };
   ```
2. **Register in `LanguageRegistry`**:
   In `src/languages/language.registry.ts`:
   ```typescript
   languageRegistry.register(PYTHON_LANGUAGE_CONFIG);
   ```
3. **Add an Execution Strategy**:
   The `executionService` selects the strategy based on `language.executionStrategy`:
   - `browser-sandbox`: For JavaScript / TypeScript (transpiled).
   - `web-worker`: For WebAssembly-based interpreters (Pyodide for Python, WebAssembly Ruby).
   - `remote-container`: For compiled languages (C++, Rust, Go, Java) communicating with an isolated backend execution service.

---

## 💻 Commands

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```

### Run automated tests
```bash
npm test
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```
