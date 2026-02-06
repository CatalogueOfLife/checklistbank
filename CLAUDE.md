# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChecklistBank UI is a React-based web application for the Catalogue of Life. It provides tools for exploring, importing, and managing taxonomic and nomenclatural data from multiple sources. The application allows authorized users to assemble taxonomic checklists with editorial decisions, duplicate detection, and quality checks.

## Development Commands

### Setup
```bash
npm install                    # Install dependencies
node writeEnums.js            # Fetch enumerations from API and write to src/enumeration/
```

### Development
```bash
npm start                      # Start dev server at http://localhost:3000 connecting to the prod ChecklistBank API
npm test                       # Run tests in watch mode
npm run build                  # Production build (runs gitTag.js, writeEnums.js, build, and compression)
```

### Pre-build Scripts
- `gitTag.js` - Writes current git commit SHA to `public/gitVersion.json`
- `writeEnums.js` - Fetches enumeration data from the API (rank, taxonomicstatus, issue, nomstatus, etc.) and writes JSON files to `src/enumeration/`

## Architecture

### Environment Configuration

The app uses a multi-environment setup controlled by domain-based detection:
- **Environment files**: `src/env.json` contains configurations for `dev`, `prod`, `docker`, and `local` environments
- **Selection**: `src/config.js` detects the environment based on `window.location.hostname`
  - `data.catalogueoflife.org` or `www.checklistbank.org` → prod
  - `localhost` → dev (default)
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
- **Fetching**: `node writeEnums.js` script fetches from API and writes to these files
- **Loading**: `src/api/enumeration.js` provides functions to load enumerations
  - Can load from local files (default) or API based on `loadEnumsFromAPI` config flag
  - Each enumeration has a dedicated getter (e.g., `getRank()`, `getTaxonomicStatus()`, `getIssue()`)
- **Usage**: Loaded into `ContextProvider` on app initialization and made available via `AppContext`

**When adding new enumerations**: Add to the `enums` array in `writeEnums.js`, create the getter in `src/api/enumeration.js`, and import/load in `ContextProvider`.

### Routing Structure

The app uses React Router with custom route wrappers:
- **PrivateRoute** - Requires authentication
- **AdminRoute** - Requires admin privileges
- Routes are defined in `src/App.js`

Major route groups:
- `/` - Home page
- `/dataset/:key` - Dataset detail pages (taxon browser, sectors, metadata, etc.)
- `/catalogue/:catalogueKey` - Catalogue assembly tools (sectors, decisions, sync, duplicates)
- `/tools` - Utilities (name matcher, archive validator, diff viewer, etc.)
- `/admin` - Admin panels (users, jobs, dataset management, matcher admin)

### Component Organization

- **pages/** - Top-level route components (DatasetList, DatasetKey, Admin, catalogue/, etc.)
- **components/** - Reusable components (forms, visualizations, HOCs)
  - `components/hoc/` - Higher-order components and context providers
  - `components/Auth/` - Authentication components (PrivateRoute, AdminRoute)
  - `components/tree/` - Custom tree component (forked `col-rc-tree`)
- **api/** - API client modules (dataset.js, enumeration.js, user.js, etc.)

### Webpack Configuration

The app uses `react-app-rewired` to customize Create React App's webpack config:
- **config-overrides.js**: Configures Node.js polyfills for browser (fs, crypto, stream, path, etc.)
- Necessary because the app uses some Node libraries in the browser (e.g., for CSV parsing, file handling)

### Build Process

The production build (`npm run build`) runs a multi-step pipeline:
1. `node gitTag.js` - Embed git version info
2. `node writeEnums.js` - Fetch latest enumerations
3. `react-app-rewired build` - Build React app
4. `gzipper compress ./build` - Gzip compression
5. `gzipper compress --brotli` - Brotli compression for static assets

## Key Dependencies

- **React 16.9** with React Router 5
- **Ant Design 4.24.15** - Primary UI component library
- **axios** - HTTP client for API calls
- **react-app-rewired** - Webpack configuration overrides
- **col-rc-tree** - Custom tree component from CatalogueOfLife/tree.git
- **marked** - Markdown rendering
- **diff2html** - Diff visualization
- **highcharts** - Data visualization charts

## API Integration

The app communicates with multiple backend services:
- **ChecklistBank API** (`dataApi`) - Main taxonomic data API
- **GBIF API** (`gbifApi`) - Integration with GBIF services
- **Download API** (`downloadApi`) - Dataset downloads and exports

API client modules in `src/api/` wrap axios calls and provide typed interfaces.

## Testing

- Test framework: Jest (via react-scripts)
- Run tests: `npm test` (interactive watch mode)
- Currently minimal test coverage (only `App.test.js` exists)

## Authentication

- JWT-based authentication
- Token stored in localStorage under `JWT_STORAGE_NAME`
- User API functions in `src/api/user.js`: `whoAmI()`, `authenticate()`, `logout()`
- Authentication state managed in ContextProvider

## Related Repositories

- Backend API: https://github.com/CatalogueOfLife/backend
- Frontend (this repo): https://github.com/CatalogueOfLife/checklistbank
- Custom tree component: https://github.com/CatalogueOfLife/tree
