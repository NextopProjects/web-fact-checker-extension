# AGENTS.md

## Project

Chrome Extension (Manifest V3) for web page fact-checking. UI text and descriptions are in Korean.

## Commands

- `npm run dev` — start Vite dev server with hot-reload via `@crxjs/vite-plugin`
- `npm run build` — production build to `dist/`
- `npx tsc --noEmit` — TypeScript type check (no test/lint scripts yet)

## Architecture

### Entry Points (all in `src/`)

- `background.ts` — service worker (`"type": "module"`). LLM API calls, cache, history, settings, message relay.
- `content.ts` — content script injected on all URLs at `document_idle`. Extracts page body via Readability.
- `popup/index.html` + `popup/main.ts` — extension popup UI. Tab-based panels: fact-check, history, dashboard, settings.
- `options/index.html` + `options/main.ts` — extension options page for API keys and settings.

### Directory Structure

```
src/
├── types/              # Type definitions
│   ├── index.ts        # FactCheckResult, ExtractedContent, DashboardStats
│   ├── messages.ts     # Message protocol (ContentMessage, PopupMessage)
│   ├── fact-check.ts   # LLMAdapter, LLMResponse, AnalyzeOptions
│   ├── settings.ts     # AppSettings, DEFAULT_SETTINGS
│   └── cache.ts        # CacheEntry
├── lib/
│   ├── llm/            # Multi-LLM adapter system
│   │   ├── index.ts    # createLLMAdapter() factory
│   │   ├── openai.ts   # OpenAI adapter
│   │   ├── claude.ts   # Claude adapter
│   │   ├── gemini.ts   # Gemini adapter
│   │   └── prompts.ts  # Fact-check prompt templates
│   ├── extractors/     # Page content extraction
│   │   ├── index.ts    # extractPageContent()
│   │   └── readability.ts # Readability.js + heuristic fallback
│   ├── cache/          # TTL-based local cache
│   │   └── index.ts    # getCachedResult(), setCachedResult()
│   ├── storage/        # Persistent storage
│   │   ├── index.ts    # Re-exports
│   │   ├── history.ts  # Fact-check history CRUD
│   │   └── settings.ts # Settings read/write
│   └── utils/
│       ├── hash.ts     # SHA-256 text hashing
│       └── export.ts   # JSON/Markdown export
├── popup/
│   ├── index.html      # Popup entry with Pico CSS CDN
│   ├── main.ts         # Tab router
│   ├── styles/popup.css # Custom styles
│   └── components/     # Panel renderers
│       ├── fact-check-panel.ts
│       ├── history-panel.ts
│       ├── dashboard-panel.ts
│       └── settings-panel.ts
└── options/
    ├── index.html      # Options page with Pico CSS CDN
    └── main.ts         # Settings form
```

### Message Protocol

- `content.ts` ↔ `background.ts`: `EXTRACT_CONTENT` / `CONTENT_EXTRACTED`
- `popup/` ↔ `background.ts`: `START_FACT_CHECK`, `GET_HISTORY`, `GET_SETTINGS`, `UPDATE_SETTINGS`, `GET_DASHBOARD_STATS`, `DELETE_HISTORY_ITEM`, `CLEAR_HISTORY`

### Data Flow

1. Popup sends `START_FACT_CHECK` to background
2. Background sends `EXTRACT_CONTENT` to content script
3. Content extracts body via Readability.js, returns to background
4. Background checks cache (SHA-256 hash) → hit: return cached
5. Background calls LLM API via adapter (OpenAI/Claude/Gemini)
6. Background stores result in cache + history
7. Background sends `FACT_CHECK_COMPLETE` to popup

### Key Dependencies

- `@mozilla/readability` — article body extraction
- `@crxjs/vite-plugin` — Vite plugin for Chrome Extension bundling
- `@types/chrome` — Chrome API typings
- Pico CSS via CDN — lightweight CSS framework

## Conventions

- Formatter: Prettier (configured in `.vscode/settings.json` with format-on-save)
- Module system: ESM (`"type": "module"` in package.json, `verbatimModuleSyntax` in tsconfig)
- Target: ES2023 + DOM lib
- UI text: Korean (한국어)
- No comments in code unless explicitly requested
- `manifest.json`: do not rename or reorder fields; plugin depends on structure

## Known Issues

- Dynamic import warning in build for `lib/storage/history.ts` (harmless)
- Gemini free tier has quota limits; switch to OpenAI/Claude if 429 occurs
