# Orkestrix (AI Screen Builder)

Frontend for **AI Screen Builder**: a Vite + React app that turns natural-language prompts into **Angular** screens via a backend agent API. It streams generation progress (SSE), previews built UIs, supports chat-based iteration, saving screens, version rollback, and a Monaco-based editor.

## Features

- **Create** (`/create`): Submit prompts, watch live logs, preview the generated screen, chat to refine, save, and publish drafts so they appear under Apps.
- **Apps** (`/apps`): List saved screens, rename, open preview, jump to Create for edits, or open the full **Editor**.
- **App view** (`/apps/:projectId/:screenId`): Focused preview with links to edit or editor.
- **Editor** (`/apps/:projectId/:screenId/editor`): File tree, Monaco code editing, preview, backend function listing/testing, credentials sheet, rollback.
- **Credits** in the sidebar (TanStack Query + health/credits API).
- **Docs** (`/docs`) and placeholder **Settings** (`/settings`).

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A running **AI Screen Builder / ai-agent** HTTP API (see [Environment](#environment))

## Quick start

```sh
git clone <repository-url>
cd prompt-builder-pro
cp .env.example .env
# Edit .env — set VITE_API_URL, VITE_API_CONTEXT_PATH, VITE_SUBSCRIBER_ID, and optionally VITE_LIBERTY_FS_BASE_URL
npm install
npm run dev
```

The dev server listens on **port 8080** (see `vite.config.ts`). Open `http://localhost:8080` — the app redirects `/` to `/create`.

## Environment

Variables are read at build time via Vite (`import.meta.env`). Copy `.env.example` to `.env` and adjust.

| Variable | Description |
| -------- | ----------- |
| `VITE_API_URL` | Base URL of the backend (no trailing path segment for the agent). Example: `http://localhost:5010` |
| `VITE_API_CONTEXT_PATH` | Path segment before `ai-agent/...` (e.g. `dev`). **Use `KEY=value` with no spaces around `=`** |
| `VITE_SUBSCRIBER_ID` | Subscriber ID sent on generate/update/list/save requests and used when formatting IDs for the API |
| `VITE_LIBERTY_FS_BASE_URL` | Optional. Base URL where built screen folders are served for the preview iframe. If unset, the client defaults to `http://localhost:843/` (see `src/lib/api.ts`) |

Request URLs are composed as:

`{VITE_API_URL}/{VITE_API_CONTEXT_PATH}/ai-agent/agent/<endpoint>`

Endpoints used include `generate-angular-app`, `update-angular-screen`, `stream/:jobId`, `save-screen`, `ui-list`, `ui-screen/:id`, `credits`, `health`, `screen-versions`, `rollback-screen`, and project credential routes.

## Scripts

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest (run once) |
| `npm run test:watch` | Vitest watch mode |

Tests live under `src/**/*.{test,spec}.{ts,tsx}` with setup in `src/test/setup.ts`.

## Project layout

- `src/App.tsx` — routes and providers (React Query, router, toasts).
- `src/pages/` — `CreatePage`, `AppsPage`, `AppViewPage`, `EditorPage`, `DocsPage`, `SettingsPage`, `NotFound`.
- `src/lib/api.ts` — API base URL, preview URL resolution, types, and fetch helpers.
- `src/hooks/useJobGeneration.ts` — Job submit, SSE `EventSource` streaming, chat updates; uses `VITE_SUBSCRIBER_ID` (and a **hardcoded dev `user_id`** in code — replace with real auth for production).
- `src/components/editor/` — Editor shell, Monaco pane, file tree, backend function UI.
- `src/components/` — Shared UI: chat, preview iframe, prompt input, rollback modal, etc.
- `src/components/ui/` — shadcn-style Radix + Tailwind primitives.

Path alias: `@/` → `src/` (configured in `vite.config.ts` and `vitest.config.ts`).

## Stack

- **React 18** + **TypeScript**
- **Vite 5** (`@vitejs/plugin-react-swc`)
- **React Router 6**
- **TanStack Query**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **Monaco Editor** (`@monaco-editor/react`)
- **Vitest** + Testing Library + jsdom

## Preview hosting

The UI builds preview URLs from the backend response and/or `screenId` + `version`, normalizing them to `VITE_LIBERTY_FS_BASE_URL` when needed (`resolvePreviewUrl` in `src/lib/api.ts`). Ensure that host actually serves the generated `{screenId}-v{version}/` folders for local preview to work.

## License

Private project (`"private": true` in `package.json`). Add a license file if you intend to open-source.
