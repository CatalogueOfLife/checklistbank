# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChecklistBank UI is a React-based web application for the Catalogue of Life. It provides tools for exploring, importing, and managing taxonomic and nomenclatural data from multiple sources. The application allows authorized users to assemble taxonomic checklists with editorial decisions, duplicate detection, and quality checks.

## Development Commands

### Setup
```bash
npm install                    # Install dependencies
node writeEnums.cjs            # Fetch enumerations from API and write to src/enumeration/
```

### Development
```bash
npm start                      # Start dev server at http://localhost:3000 connecting to the prod ChecklistBank API
npm test                       # Run tests in watch mode
npm run build                  # Production build (runs gitTag.cjs, writeEnums.cjs, build, and compression)
```

### Pre-build Scripts
- `gitTag.cjs` - Writes current git commit SHA to `public/gitVersion.json`
- `writeEnums.cjs` - Fetches enumeration data from the API (rank, taxonomicstatus, issue, nomstatus, etc.) and writes JSON files to `src/enumeration/`

## Architecture

### Environment Configuration

The app uses a multi-environment setup controlled by domain-based detection:
- **Environment files**: `src/env.json` contains configurations for `dev`, `prod`, `docker`, and `local` environments
- **Selection**: `src/config.js` detects the environment based on `window.location.hostname`
  - `www.checklistbank.org` → prod
  - hostname ending in `localhost` → prod (so the local UI talks to the live API by default)
  - anything else (including `127.0.0.1`) → dev
- **Environment properties**: Each environment defines `url`, `dataApi`, `gbifApi`, `downloadApi`, and other service endpoints

**Important**: When modifying backend API endpoints or adding new environments, update `src/env.json`. The `loadEnumsFromAPI` flag controls whether enumerations are fetched from API or local JSON files.

### Application State Management

The app uses React Context extensively instead of Redux:

1. **ContextProvider** (`src/components/hoc/ContextProvider.js`)
   - Root-level provider that initializes global application state
   - Loads all enumerations (taxonomic ranks, statuses, issues, etc.) from either API or local JSON files
   - Manages user authentication state (login, logout, whoAmI)
   - Provides color mappings for issues (`ISSUE_COLOR`), duplicates (`DUPLICATE_COLOR`), and taxonomic statuses (`TAXONOMIC_STATUS_COLOR`)
   - Exposes `AppContext` consumed throughout the application

2. **DatasetProvider** (`src/components/hoc/DatasetProvider.js`)
   - Manages current dataset context
   - Used when viewing/editing a specific dataset

3. **SyncProvider** (`src/components/hoc/SyncProvider.js`)
   - Handles synchronization state for catalogue assembly operations

4. **BackgroundProvider** (`src/components/hoc/BackgroundProvider.js`)
   - Manages background task polling and status updates

### Enumeration System

Enumerations are central to the application's data model:

- **Storage**: JSON files in `src/enumeration/` (frequency.json, rank.json, taxonomicstatus.json, issue.json, etc.)
- **Fetching**: `node writeEnums.cjs` script fetches from API and writes to these files
- **Loading**: `src/api/enumeration.js` provides functions to load enumerations
  - Can load from local files (default) or API based on `loadEnumsFromAPI` config flag
  - Each enumeration has a dedicated getter (e.g., `getRank()`, `getTaxonomicStatus()`, `getIssue()`)
- **Usage**: Loaded into `ContextProvider` on app initialization and made available via `AppContext`

**When adding new enumerations**: Add to the `enums` array in `writeEnums.cjs`, create the getter in `src/api/enumeration.js`, and import/load in `ContextProvider`.

### Routing Structure

The app uses React Router 6 with custom route wrappers:
- **PrivateRoute** - Requires authentication
- **AdminRoute** - Requires admin privileges
- Routes are defined in `src/App.jsx`

Major route groups:
- `/` - Home page
- `/dataset/:key/:section?` - Dataset detail pages (metadata, classification, names, references, imports, verbatim, taxon browser, etc.)
- `/project/:projectKey/:section?` - Project (catalogue assembly) pages: sectors, decisions, sync, duplicates, sources, editors, options
- `/tools` - Utilities (name matcher, archive validator, diff viewer, dataset comparison, metadata generator, taxonomic alignment, etc.)
- `/admin` - Admin panels (users, jobs, dataset management, matcher admin)

### Component Organization

- **pages/** - Top-level route components (DatasetList, DatasetKey, Admin, project/, tools/, etc.)
- **components/** - Reusable components (forms, visualizations, HOCs)
  - `components/hoc/` - Higher-order components and context providers
  - `components/Auth/` - Authentication components (PrivateRoute, AdminRoute)
  - `components/tree/` - Tree wrapper around antd's `<Tree>` exposing a stable API for the assembly views
  - `components/HighchartsReact.js` - Default-import unwrap shim for `highcharts-react-official` (Vite 8 / Rolldown does not auto-unwrap the lib's CJS `__esModule + default` shape; see comments inside)
- **api/** - API client modules (dataset.js, enumeration.js, user.js, etc.)

Files containing JSX use the `.jsx` extension; pure-JS modules (API clients, helpers, configs, tests) keep `.js`. The split exists because Vite 8 / oxc parses by file extension and won't accept JSX in `.js` files. The repo has a single `git mv` rename history for this — `git log --follow` traces through it.

### Build Configuration (Vite)

The app is built with **Vite 8 / Rolldown** and `@vitejs/plugin-react` v6. Configuration lives in `vite.config.js`:

- **`plugins`**:
  - `react()` - JSX transform via plugin-react v6 (delegates to Vite's built-in oxc transform).
  - `nodePolyfills({ include: ["buffer", "fs", "os", "path", "process", "stream", "util"], globals: { Buffer: true, process: true } })` - csvtojson (NameMatch) and diff2html pull in Node builtins. We polyfill only what they actually need.
- **`define: { "process.env.NODE_ENV": '"production"' }`** - The deploy script passes `NODE_ENV=dev` so `writeEnums.cjs` picks the dev API; without this define, the same env var leaks into the bundle and React/plugin-react emit their development variants (extra ~570 KB minified).
- **`server: { port: 3000, host: true }`** - Binds both IPv4 and IPv6 on macOS so `127.0.0.1:3000` works (needed to route the local UI to the dev backend; see Environment Configuration).
- **`build.rollupOptions.output.manualChunks`** - Splits Highcharts, MapLibre, antd (+icons + rc-* helpers), and React into named vendor chunks so the browser can cache them independently across deploys. Rolldown only accepts the function form, not the Rollup-classic object form.

### Build Process

`npm run build` runs:
1. `node gitTag.cjs` - Write current git SHA to `public/gitVersion.json`
2. `node writeEnums.cjs` - Fetch enumerations from the API selected by `process.env.NODE_ENV` (dev / prod) and write them under `src/enumeration/`
3. `NODE_ENV=production vite build` - Build into `./dist/`. The explicit `NODE_ENV=production` prefix isolates Vite from the dev API selection in step 2.
4. `gzipper compress ./dist` - Gzip precompressed copies
5. `gzipper compress --brotli ./dist` - Brotli precompressed copies

## Key Dependencies

- **React 19** with React Router 6
- **Ant Design 6** + `@ant-design/icons` v6 - Primary UI component library
- **axios** - HTTP client for API calls
- **Vite 8** + `@vitejs/plugin-react` v6 - Build tool and JSX transform
- **Vitest** - Test runner (replaces Jest + react-scripts)
- **dayjs** with `relativeTime`, `utc`, `localizedFormat` plugins (extended in `src/main.jsx`)
- **MapLibre GL** - Distribution maps (replaces Leaflet)
- **Highcharts 9** - Import-metrics and taxon-breakdown charts
- **marked** - Markdown rendering
- **diff2html** - Diff visualization

## API Integration

The app communicates with multiple backend services:
- **ChecklistBank API** (`dataApi`) - Main taxonomic data API
- **GBIF API** (`gbifApi`) - Integration with GBIF services
- **Download API** (`downloadApi`) - Dataset downloads and exports

API client modules in `src/api/` wrap axios calls and provide typed interfaces.

## Testing

- Test framework: **Vitest** (jsdom environment, configured in `vite.config.js` under `test:`)
- Run tests: `npm test` (single-pass; pass `--watch` for watch mode)
- Currently minimal test coverage — `App.test.js`, plus a couple of unit tests under `src/pages/Taxon/DistributionsMap/`

## Authentication

- JWT-based authentication
- Token stored in localStorage under the constant `JWT_STORAGE_NAME` (= `col_plus_auth_token`)
- User API functions in `src/api/user.js`: `whoAmI()`, `authenticate()`, `logout()`
- Authentication state managed in ContextProvider

## Migration gotchas (Vite 8 / React 19 / antd 6)

The codebase was migrated from CRA / React 16 / antd 4 in the `modernize-stack` branch. A few patterns to watch for:

- **antd 6 removed child-element APIs.** `<Steps><Step /></Steps>` and `<Tabs><TabPane /></Tabs>` silently render empty — convert to the `items={[...]}` prop. Old `<Button type="danger">` is invalid; use `<Button type="primary" danger>` for the filled red variant or just `<Button danger>` for the outlined one. `Breadcrumb.Item`, `Menu.Item` are similarly deprecated in favour of `items`.
- **Vite 8 / Rolldown CJS interop.** Vite 7 / esbuild auto-unwrapped CJS modules whose exports had `{ __esModule: true, default: X }`; Vite 8 / Rolldown returns the wrapper object on default import. Symptom: `X is not a constructor` or `Element type is invalid: ... got: object`. Known offenders so far: `highcharts-react-official` (handled by `src/components/HighchartsReact.js`), `p-queue` (handled inline in `NameMatch.jsx`). Pattern when you hit it: `const X = M?.default ?? M;` after the default import.
- **JSX-in-`.js` is no longer accepted.** Vite 8's oxc transform parses by file extension. JSX-bearing files must use `.jsx`.
- **`process.env.NODE_ENV` leaks from shell to bundle.** Vite's `isProduction` is gated on `process.env.NODE_ENV === "production"`, not on `--mode`. The build script prefixes `vite build` with `NODE_ENV=production` and `vite.config.js` adds a `define` for belt-and-suspenders; don't remove either without checking that `writeEnums.cjs`'s NODE_ENV-based API selection is still isolated.
- **No inline `<script>` in `index.html`.** Dev's CSP blocks inline scripts (`default-src 'self' …`), so any conditional initialisation belongs in `src/main.jsx` (or another bundled module) where it ships from `'self'`.
- **Lodash imports must be explicit.** CRA / Webpack used to hoist `lodash` across sibling modules via scope hoisting; Vite 8's stricter ESM resolution does not. If you use `_.get` / `_.startCase` / etc., the file needs `import _ from "lodash"` of its own.

## Related Repositories

- Backend API: https://github.com/CatalogueOfLife/backend
- Frontend (this repo): https://github.com/CatalogueOfLife/checklistbank
- Custom tree component: https://github.com/CatalogueOfLife/tree
