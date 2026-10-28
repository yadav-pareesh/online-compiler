# Online JavaScript Compiler & Code Runner with Hybrid AI Complexity Analysis

A fast, lightweight, and secure browser-based JavaScript coding and execution platform with hybrid AI complexity analysis powered by OpenRouter and local AST pattern recognition.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **CodeMirror 6**, this platform executes untrusted JavaScript in an isolated sandboxed iframe and provides an AI-powered code complexity analyzer estimating asymptotic Time ($O$) and Auxiliary Space complexity, performance bottlenecks, and algorithmic optimizations.

---

## 🚀 Key Features

### 1. Code Editor & Execution
- **Full-featured CodeMirror 6 Editor**:
  - JavaScript syntax highlighting and bracket matching
  - Autocompletion and automatic indentation
  - Active line highlight, fold gutter, line wrapping toggle, and font size selector (12px–18px)
- **Console Output & Formatter**:
  - Captures `console.log`, `console.info`, `console.warn`, `console.error`, `console.debug`, and `console.table`.
  - Visual badges for log levels, copy-to-clipboard for each line or the entire console, and log level filtering (All, Logs, Warnings, Errors).
  - Cycle-safe serialization (handles circular references `[Circular]`, `BigInt`, `Symbol`, `Map`, `Set`, `Error`, and depth limits).
- **Defensive Sandbox Isolation**:
  - Sandboxed execution inside an isolated `<iframe>` with `sandbox="allow-scripts"` (strictly **without** `allow-same-origin`).
  - Restrictive Content Security Policy: `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none';`
  - Disabled dangerous network APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `Worker`).
  - Parent-level watchdog timer (3 seconds) that automatically terminates and recreates the iframe if an infinite loop (e.g. `while(true) {}`) or unresponsive code is executed.
  - User code is **never** executed as part of complexity analysis.

### 2. Hybrid AI + Static AST Complexity Analysis
- **Stage A: Local Static AST Analysis**:
  - Parses JavaScript code using an AST-based parser (`acorn` + `acorn-walk`).
  - Detects single, nested, sequential, and logarithmic loops (`i *= 2`, `i /= 2`, `>>=`).
  - Analyzes recursion depth, branching factors (e.g. Fibonacci $O(2^n)$ vs Factorial $O(n)$), and call stack auxiliary space.
  - Inspects array iteration methods (`map`, `filter`, `reduce`, `forEach`, `flatMap`, etc.).
  - Detects `.sort(...)` calls ($O(n \log n)$).
  - Tracks dynamic object and array allocations inside loop iterations versus scalar outside allocations.
  - Recognizes multi-variable parameters ($O(n \cdot m)$).
  - Operates completely offline and never executes the analyzed code.
- **Stage B: OpenRouter AI Model Orchestration**:
  - Passes code and AST observations to OpenRouter (`https://openrouter.ai/api/v1/chat/completions`) via a secure backend endpoint.
  - Server-side system prompt strictly protects against prompt injections and role changes.
  - Reviews worst-case, best-case, and auxiliary space complexity separately from output space.
  - Critiques and reviews static analyzer findings—explains points of agreement or divergence.
- **Stage C: Validated Response & Fallback**:
  - Validates model response against a strict schema.
  - Gracefully falls back to local AST static analysis if the OpenRouter API key is missing or the provider is temporarily unavailable.
  - Transparently displays comparison status (`consistent`, `disagreement`, `static_only`, `ai_only`, `inconclusive`).
  - Highlights performance bottlenecks (with `low`, `medium`, `high` impact).
  - Provides concrete optimization strategies with before/after Big-O transitions, trade-offs, and copyable snippets.
  - Detects stale results whenever the editor code is modified.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript (Strict Mode) |
| **Bundler & Dev Server** | Vite 8 + Custom API Middleware Plugin |
| **Styling** | Tailwind CSS + PostCSS |
| **Editor** | CodeMirror 6 (`@uiw/react-codemirror`, `@codemirror/lang-javascript`) |
| **AST Parser** | Acorn + Acorn-Walk + `@types/estree` |
| **AI Integration** | OpenRouter Chat Completions API (`openrouter.ai`) |
| **Icons** | Lucide React |
| **Testing** | Vitest + React Testing Library + `@testing-library/jest-dom` + JSDOM |

---

## 📂 Architecture

```text
├── api/
│   └── analyze-complexity.ts       # Serverless function entry point for Vercel / Cloudflare
├── src/
│   ├── app/
│   │   └── App.tsx                 # Root workspace orchestrator & tab controller
│   ├── components/
│   │   ├── editor/                 # CodeMirror editor and toolbar
│   │   ├── layout/                 # Header, WorkspaceLayout, Footer
│   │   └── output/                 # Console Output panel & message formatters
│   ├── features/
│   │   ├── execution/              # Sandboxed iframe executor & watchdog timer
│   │   └── complexity/             # Complexity analysis domain
│   │       ├── complexity.types.ts # TypeScript interfaces, schemas & enums
│   │       ├── analyzer/
│   │       │   └── static-analyzer.ts # AST parser for loops, recursion, allocations
│   │       ├── service/
│   │       │   └── complexity.client.ts # Frontend API client with AbortController
│   │       └── components/
│   │           ├── ComplexityPanel.tsx    # Lifecycle management & results dashboard
│   │           ├── ComplexityBadge.tsx    # Color-coded Big-O badges
│   │           ├── ComparisonBanner.tsx   # Static vs AI consensus/divergence banner
│   │           ├── BottleneckCard.tsx     # Bottleneck card with impact ratings
│   │           ├── OptimizationCard.tsx   # Suggestions with Big-O transitions & snippets
│   │           └── StaticFindingsView.tsx # Expandable AST metrics breakdown
│   ├── server/                     # Backend API modules (server-side only)
│   │   ├── cache/
│   │   │   └── complexity.cache.ts # In-memory bounded LRU cache with TTL
│   │   ├── middleware/
│   │   │   └── vite-plugin-analyzer.ts # Dev server middleware for POST /api/analyze-complexity
│   │   ├── openrouter/
│   │   │   ├── openrouter.client.ts # HTTP client for OpenRouter completions
│   │   │   └── system-prompt.ts     # Protected server-side prompt
│   │   ├── rate-limit/
│   │   │   └── rate-limiter.ts      # Sliding window IP rate limiter
│   │   ├── services/
│   │   │   └── complexity.service.ts # Core orchestration, validation & caching
│   │   └── validation/
│   │       └── complexity.schema.ts  # Response validator, normalizer & fallback builder
│   └── test/
│       ├── complexity.components.test.tsx # UI component tests for complexity panel
│       ├── complexity.service.test.ts    # Backend service tests (cache, rate limit, fallback)
│       └── static-analyzer.test.ts       # AST parser unit tests (loops, recursion, Big-O)
```

---

## 🔒 Security Model & Cost Controls

1. **API Key Isolation**:
   - `OPENROUTER_API_KEY` is exclusively read on the server.
   - It is **never** prefixed with `VITE_` or included in frontend client bundles.
   - `.env` and `.env.local` are explicitly git-ignored.
2. **Payload Protection**:
   - Request source code is limited to **30,000 characters** (413 error if exceeded).
   - Only `language: "javascript"` is accepted.
3. **Abuse & Rate Limiting**:
   - In-memory sliding-window rate limiter restricts requests to 20 requests/minute per client IP.
   - Prevents automated cost exhaustion.
4. **Bounded Caching**:
   - Requests for identical code, model, and prompt version are cached in memory (10-minute TTL, max 100 entries).
   - Re-analyzing unchanged code incurs 0 AI API token cost.
5. **No Code Execution**:
   - The complexity analyzer performs static AST inspection and LLM reasoning only.
   - User code is never executed during analysis.
6. **XSS & Injection Defense**:
   - AI outputs and AST findings are rendered strictly as structured text elements.
   - `dangerouslySetInnerHTML` is never used.
   - Prompt injection attempts inside comments or strings in submitted code are treated as untrusted data by the system prompt.

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to `.env` or `.env.local`:

```bash
cp .env.example .env.local
```

Configure your OpenRouter credentials:

```env
# Required: Your OpenRouter API Key (https://openrouter.ai/keys)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Configurable OpenRouter model identifier
# Defaults to: meta-llama/llama-3.3-70b-instruct:free
# Other options: openai/gpt-4o-mini, anthropic/claude-3.5-sonnet, mistralai/mistral-small-3
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Optional OpenRouter attribution headers
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_SITE_NAME=JS Compiler
```

> **Note**: If `OPENROUTER_API_KEY` is omitted, the application automatically uses local AST static analysis without failing, allowing full offline local development.

---

## 💻 Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Starts the Vite dev server with the integrated `/api/analyze-complexity` endpoint on `http://localhost:5173`.

### 3. Run Automated Tests
```bash
npm test
```
Runs the full Vitest suite (all 55 tests across 8 test suites).

### 4. Code Quality & Linting
```bash
npm run lint
```

### 5. Production Build
```bash
npm run build
```
Type-checks with `tsc -b` and builds production bundle to `dist/`.

### 6. Preview Production Build
```bash
npm run preview
```

---

## 🚢 Deployment

### Vercel Deployment
The repository includes `api/analyze-complexity.ts`, which Vercel detects automatically as a Serverless Function:
1. Connect your repository to Vercel.
2. In Project Settings -> Environment Variables, add:
   - `OPENROUTER_API_KEY` = your secret OpenRouter API key.
   - `OPENROUTER_MODEL` = your desired model identifier.
3. Deploy. Frontend requests to `/api/analyze-complexity` resolve automatically to the serverless function.

### Node.js / Custom Server Deployment
The core service in `src/server/services/complexity.service.ts` accepts standard JSON payloads:
```typescript
import { complexityService } from './src/server/services/complexity.service';

const { status, body } = await complexityService.handleRequest(req.body, clientIp);
res.status(status).json(body);
```

---

## ⚠️ Known Limitations
1. **Asymptotic Estimation vs Real-World Runtime**: Big-O notation describes asymptotic scaling behavior as input $n \to \infty$. Actual execution time depends on V8 engine JIT optimizations, hardware architecture, and memory cache locality.
2. **Dynamic / External Dependencies**: Functions calling external APIs or unanalyzable dynamic scripts cannot be fully resolved statically; the analyzer flags these as uncertainties.
3. **Halting Problem**: Determining whether arbitrary recursive loops terminate for all possible inputs is mathematically undecidable (Turing's Halting Problem); the hybrid analyzer provides defensible estimates based on structural patterns rather than formal mathematical proofs.
