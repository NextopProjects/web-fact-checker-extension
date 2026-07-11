# AGENTS.md

## Project

Chrome Extension (Manifest V3) for web page fact-checking. UI text and descriptions are in Korean.

## Commands

- `npm run dev` — start Vite dev server with hot-reload via `@crxjs/vite-plugin`
- `npm run build` — production build to `dist/`
- No test, lint, or typecheck scripts exist yet. TypeScript checking happens via `tsc` (no emit) with strict-ish settings: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`.

## Architecture

- `vite.config.ts` — loads `manifest.json` and passes it to `@crxjs/vite-plugin`. The plugin processes the manifest and bundles all entry points.
- `manifest.json` — MV3 manifest. **Do not rename or reorder its fields**; the plugin depends on its structure.
- Entry points (all in `src/`):
  - `background.ts` — service worker (`"type": "module"`)
  - `content.ts` — content script injected on all URLs at `document_idle`
  - `popup/index.html` + `popup/main.ts` — extension popup UI
- `@types/chrome` is a devDependency for Chrome API typings.

## Conventions

- Formatter: Prettier (configured in `.vscode/settings.json` with format-on-save)
- Module system: ESM (`"type": "module"` in package.json, `verbatimModuleSyntax` in tsconfig)
- Target: ES2023 + DOM lib
