# Catalogue of Life — ChecklistBank UI

[![Build Status](https://builds.gbif.org/job/col-checklistbank/badge/icon)](https://builds.gbif.org/job/col-checklistbank/)

The Catalogue of Life ChecklistBank is an environment to place taxonomic and nomenclatural information from different sources in different formats into a consistent data model exposed with a rich API.

The UI allows public exploring of all data in ChecklistBank. It is also a tool for assembling taxonomic checklists from multiple sources for authorized users. Source checklists can be imported in several formats and quality checks are applied during import. ChecklistBank includes tools for duplicate detection and allows editorial decisions to be recorded and applied repeatedly when synchronising data from sources to an assembled checklist.

Production UI: <https://www.checklistbank.org/>
Dev UI: <https://www.dev.checklistbank.org/>

## Tech stack

- [React 19](https://react.dev/) with hooks throughout (no class components remain)
- [Ant Design 6](https://ant.design/) for UI primitives
- [React Router 6](https://reactrouter.com/)
- [Vite 7](https://vite.dev/) as the build tool (migrated from Create React App)
- [dayjs](https://day.js.org/) for date handling
- [axios](https://axios-http.com/) for HTTP
- [Highcharts](https://www.highcharts.com/) for import-metrics visualisations
- CSS Modules for component-level styling (no runtime CSS-in-JS beyond antd's own)

## Prerequisites

- Node ≥ 22.12 (see `engines` in `package.json`).

## Setup

```bash
npm install
node writeEnums.cjs   # fetches enumerations from the API into src/enumeration/
```

## Scripts

### `npm start`

Runs the app in development mode at <http://localhost:3000>.

The page hot-reloads on file change.

**Which API does the dev server talk to?** It depends on the hostname you open in the browser, not the port. See `src/config.js`:

| URL you open                   | Backend API used         |
| ------------------------------ | ------------------------ |
| `http://localhost:3000`        | **production** (`api.checklistbank.org`) |
| `http://127.0.0.1:3000`        | **dev** (`api.dev.checklistbank.org`)    |
| `data.catalogueoflife.org`     | production               |
| `www.checklistbank.org`        | production               |
| anything else                  | dev                      |

The `localhost` → production mapping is intentional so the local UI can talk to the live database for quick exploration, but be careful: a logged-in editor running `npm start` and visiting `http://localhost:3000` is editing **production data**. For day-to-day development against the dev backend, use `http://127.0.0.1:3000`.

### `npm run build`

Builds the app for production into `./dist`. The build script also:

1. writes the current git SHA into `public/gitVersion.json` (`gitTag.cjs`),
2. refreshes the enumerations from the prod API (`writeEnums.cjs`),
3. runs `vite build`,
4. produces gzip and brotli precompressed copies of the static assets.

### `npm test`

Runs the test suite (Vitest). Test coverage is minimal — currently only a smoke test that imports `App.js`.

### `npm run preview`

Serves the production build locally for smoke-testing.

## Configuration

Environments live in `src/env.json` (`dev`, `prod`, `docker`, `local`). `src/config.js` picks the matching block based on the browser hostname.

For local development against a backend you run yourself (e.g. via `~/code/col/backend`), open `http://localhost:8080/` — see `src/env.json` for the `local` and `docker` profiles.

## Authentication

The UI uses JWT tokens issued by the ChecklistBank backend, which delegates to GBIF for the actual login. Tokens live in `localStorage` under the key in `JWT_STORAGE_NAME`. Public pages work anonymously; project-editing pages require an editor role on the relevant project.

## Project layout

```
src/
├── api/                  axios wrappers per resource
├── components/           reusable UI (forms, tags, layouts, hoc/ providers)
├── enumeration/          static JSON copies of backend enumerations
├── pages/                top-level route components
│   ├── DatasetKey/       dataset detail + tab subpages
│   ├── DatasetList/      public dataset list + filters
│   ├── NameSearch/       global name search
│   ├── Taxon/            taxon detail browser
│   ├── WorkBench/        editorial workbench
│   ├── Admin/            admin-only pages
│   └── project/          project-level pages (assembly, decisions, sectors, …)
├── App.js                top-level routes + providers
├── main.jsx              entry point
└── config.js             environment selection
```

## Related repositories

- Backend API: <https://github.com/CatalogueOfLife/backend>
- Public Catalogue of Life portal: <https://github.com/CatalogueOfLife/portal>
- Embeddable portal components: <https://github.com/CatalogueOfLife/portal-components>
- ColDP data-package spec: <https://github.com/CatalogueOfLife/coldp>
