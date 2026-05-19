# Class → Function Component Conversion — Pilot Batch (10 leaves)

**Date:** 2026-05-19
**Scope:** Convert the 10 smallest class components in the codebase to function components using React hooks. Validates the conversion patterns before any larger sweep. Branch: `modernize-stack`.

## Problem

After the antd 6 / React 19 migration, 101 class components remain in `src/`. They still work under React 19, but hooks-based equivalents read better, are easier to test, and unlock the antd `App.useApp()` migration (32 of those class components still call deprecated static `notification`/`message`/`Modal` APIs because `App.useApp` is a hook).

The full ~100-component conversion is too large for one batch and explicitly out of scope here. This pilot converts the 10 smallest leaves to validate the conversion patterns under chrome-devtools + user verification before any wider sweep.

## Files in scope (10)

Ordered ascending by line count:

| # | File | Lines | Lifecycle | State | HOCs |
|---|------|-------|-----------|-------|------|
| 1 | `src/components/exception/ExceptionHandler.js` | 30 | `componentDidUpdate` | none | `withRouter` + `withContext` |
| 2 | `src/pages/project/SectorSync/index.js` | 30 | none | none | `withRouter` + `withContext` |
| 3 | `src/pages/DatasetList/DatasetLogo.js` | 33 | none | `{ error, loading }` | none |
| 4 | `src/components/hoc/BackgroundProvider.js` | 34 | mount + unmount | none | `withContext` |
| 5 | `src/components/CsvDelimiterInput.js` | 38 | none | none | none |
| 6 | `src/components/hoc/SyncProvider.js` | 42 | mount + didUpdate + unmount | none | `withRouter` + `withContext` |
| 7 | `src/pages/project/Assembly/Custom404.js` | 43 | none | `{ modalVisible }` | none |
| 8 | `src/pages/project/ProjectSourceMetrics/index.js` | 48 | none | none | `withRouter` + `withContext` |
| 9 | `src/pages/DatasetList/SearchBox.js` | 56 | mount + didUpdate | `{ search }` | none |
| 10 | `src/components/ErrorMsg.js` | 58 | none | none | none |

None use refs. None use `getDerivedStateFromProps` or other harder lifecycle hooks.

## Approach: keep HOC wrappers, convert internals only

The existing HOC wrappers (`withRouter`, `withContext`) inject `match` / `location` / context-derived values as props. They work identically against function components — the props arrive the same way. Keep the `export default withRouter(withContext(...)(Component))` lines unchanged; only convert the class body to a function.

**Why keep the wrappers:**
- Smallest possible diff per file — easier to review and revert.
- Migrating wrappers (to `useLocation`, `useContext(AppContext)`) is a separate cleanup that can be done later without re-touching the conversion work.
- The HOCs are codebase-wide patterns; replacing them per-file mid-pilot would set an inconsistent precedent.

**Rejected alternatives:**

- *Replace HOCs with hooks (`useLocation` / `useContext`) in the same commit.* Larger diff per file, more places to slip up, doesn't change the end-user behavior. Not enough payoff for a pilot.
- *Convert only the easiest 3-4 files.* Smaller pilot is fine but most of the conversion patterns (state, intervals, didUpdate) only show up at files 4-9. We need those represented.

## Conversion patterns

| Class idiom | Function idiom |
|---|---|
| `this.state = { x: 0 }; setState({ x: 1 })` | `const [x, setX] = useState(0); setX(1)` |
| `componentDidMount()` body | `useEffect(() => { ... }, [])` |
| `componentDidMount` + `componentWillUnmount` paired (setInterval) | `useEffect(() => { const t = setInterval(...); return () => clearInterval(t); }, [])` |
| `componentDidUpdate(prev)` checking `prev.x !== this.props.x` | `useEffect(() => { ... }, [x])` (extract `x` from props in the function signature) |
| `handleX = (e) => { ... }` class field | plain `const handleX = (e) => { ... }` inside the function body |
| `this.setState({ s: v }, () => f(this.state.s))` | call `f(v)` directly with the new value — hooks have no setState callback API |

Other rules:
- Function component name preserves the class name (`class SearchBox` → `const SearchBox = (props) => {...}`).
- Destructure props in the parameter list when stable (`({ datasetKey, size }) => {...}`); use a `props` variable when many props are accessed and partial destructure is awkward.
- `React.createRef()` → `useRef(null)` (none of these 10 use refs — noted for the pattern table).
- Empty lifecycle methods (`componentDidMount() {}` in `ExceptionHandler`) are deleted, not converted.

## Per-file specifics

### 1. `ExceptionHandler.js`

Drops the empty `componentDidMount`. `componentDidUpdate` becomes an effect that fires when `location.pathname` changes:

```jsx
const ExceptionHandler = ({ location, clearError, error }) => {
  useEffect(() => {
    if ([401, 403].includes(_.get(error, "response.status"))) {
      // ... only when path changed; React already handles the change-detection via the dep array
    }
  }, [location.pathname]);
  return null;
};
```

Subtlety: the original guard reads `prevProps.error` (the BEFORE state). After conversion, `error` in the deps will be the AFTER state. The check is on whether the LAST navigation was from a 401/403 page; since `[error]` as a dep would refire when error itself changes, we keep `[location.pathname]` as the sole dep and read current `error` from closure. Behavior matches: clear-error fires only when path changes AND the (still-current) error is 401/403.

### 2. `SectorSync/index.js`

Pure render. Function-component equivalent reads `catalogue` from props and renders `<Layout><PageContent>...`. No state, no effects.

### 3. `DatasetLogo.js`

Two `useState` flags. `onLoad` and `onError` callbacks call `setError`/`setLoading`. No lifecycle.

```jsx
const DatasetLogo = ({ fallBack = null, datasetKey, style = {}, size = "MEDIUM", maxWidth = 200, maxHeight = 50 }) => {
  const [error, setError] = useState(true);
  const [loading, setLoading] = useState(true);
  return loading || !error ? (
    <img ... onLoad={() => { setError(false); setLoading(false); }} onError={() => { setError(true); setLoading(false); }} />
  ) : fallBack;
};
```

### 4. `BackgroundProvider.js`

Two `setInterval` calls in mount + `clearInterval` in unmount. Single `useEffect` with cleanup:

```jsx
const BackgroundProvider = ({ getBackground, getSystemHealth }) => {
  useEffect(() => {
    getBackground();
    const t = setInterval(getBackground, backgroundHeartBeat);
    const sysT = setInterval(getSystemHealth, backgroundHeartBeat);
    return () => {
      clearInterval(t);
      clearInterval(sysT);
    };
  }, []);
  return null;
};
```

Effect uses `[]` deps; `getBackground` and `getSystemHealth` are stable identities from context (mounted at the root once).

### 5. `CsvDelimiterInput.js`

Stateless wrapper around `<Input>`. The two helper methods (`handleDelimiterChange`, `triggerChange`) become plain function declarations in the body.

### 6. `SyncProvider.js`

Two effects:

1. The `setInterval` lifecycle, empty deps:
   ```jsx
   useEffect(() => {
     getSyncState();
     const t = setInterval(getSyncState, syncStateHeartbeat);
     return () => clearInterval(t);
   }, []);
   ```
2. The `componentDidUpdate` projectKey-change refresh:
   ```jsx
   useEffect(() => {
     if (projectKey) getSyncState();
   }, [projectKey]);
   ```

`projectKey` is destructured from `match.params`.

### 7. `Custom404.js`

One `useState` for `modalVisible`. `setState({ modalVisible: false })` → `setModalVisible(false)`. No lifecycle.

### 8. `ProjectSourceMetrics/index.js`

Pure render reading `match.params.projectKey` and `catalogue`. No state.

### 9. `SearchBox.js`

- `useState` for `search`, initialized from `props.defaultValue || ""`.
- The mount + didUpdate pair (sync `search` from `defaultValue` whenever `defaultValue` changes) collapses to one effect:
  ```jsx
  useEffect(() => {
    if (defaultValue) setSearch(defaultValue);
  }, [defaultValue]);
  ```
- `resetSearch`'s `setState(_, cb)` pattern that reads the new state back is replaced by calling `onSearch("")` directly:
  ```jsx
  const resetSearch = () => {
    setSearch("");
    onSearch("");
  };
  ```
- The trailing `onSearch={(value) => this.props.onSearch(this.state.search)}` on the `<Search>` element (note: ignores `value`, reads back from state — antd Search's onSearch fires with the current input value, so the existing code is correct in passing `this.state.search`) becomes `onSearch={() => onSearch(search)}` since `search` is the latest closure variable.

### 10. `ErrorMsg.js`

Stateless render. Trivial conversion.

## Delivery shape

One commit per file (10 commits total) per the TODO's "Touch one component per PR" guidance. Each commit:

1. Convert the file.
2. Run `npx vite build`. Must pass.
3. Commit.

Order: small to large per the table above.

## Verification

### Phase 1 — chrome-devtools self-verification (no user needed)

After all 10 commits:

1. Start dev server:
   ```bash
   npm start  # backgrounded; Vite on http://localhost:3000
   ```
2. Wait for the "Local:" output to confirm the server is ready.
3. For each route below, use `mcp__chrome-devtools__navigate_page`, then `mcp__chrome-devtools__take_snapshot` + `mcp__chrome-devtools__list_console_messages` to confirm the page mounts and produces no new red console errors. Pre-existing antd 6 deprecation warnings on unrelated components are acceptable.

| Route | Validates |
|---|---|
| `/` (any page, e.g. `/dataset`) | `BackgroundProvider` and `SyncProvider` mount + their intervals; `ExceptionHandler` mounted; `ErrorMsg` available |
| `/dataset` | `DatasetLogo` (rows render with logos), `SearchBox` (typing updates input) |
| `/project/3/sector/sync` | `SectorSync/index` (sector sync table page mounts) |
| `/project/3/sourcemetrics` | `ProjectSourceMetrics/index` |
| `/project/3/taxon/<missing-id>` | `Custom404` renders the 404 affordance |
| `/dataset/3/about` (metadata edit) | `CsvDelimiterInput` is used in DwC-A upload form variants |

If any route shows runtime errors or a white screen, fix before pinging the user.

### Phase 2 — user-driven functional verification (Markus)

After phase 1 reports clean: user clicks through the same routes, watches for functional regressions (e.g., search debouncing, interval-driven refreshes, error toasts behaving), and reports anything off. Patch in follow-up commits.

## Risk surface

1. **`SearchBox`'s `setState(_, cb)` rewrite.** Original reads `this.state.search` (the new empty value) inside the callback. Function version calls `onSearch("")` directly with the literal value. Semantically identical.

2. **Strict-mode double-effect in dev.** `BackgroundProvider`/`SyncProvider` start intervals in `useEffect(_, [])`. React 18+ strict mode runs each effect twice on mount. The cleanup correctly clears the first interval before the second starts; production sees a single interval. Not a correctness issue, but in dev you might observe a brief double-fetch on initial load.

3. **HOC compatibility.** `withRouter` (project-local) and `withContext` (project-local) inject props by cloning element vs. wrapping. Both work with function components — verified by the existing code where some function components already accept `match` / context values as props from these same HOCs.

## Out of scope

- The other 91 class components (the larger pages and form/modal screens).
- Hook-ifying the HOCs themselves (`withRouter` → `useLocation`; `withContext` → `useContext(AppContext)`).
- Converting class components that have `getDerivedStateFromProps` (5 components: TagControl, PopconfirmMultiOption, KeyValueControl, AgentControl, CitationControl).
- Migrating any static `notification`/`message`/`Modal` calls — none of these 10 components use those.
- Adding automated tests for the converted components.
