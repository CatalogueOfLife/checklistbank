# TODO

Tracked tech-debt and follow-up work that is out of scope for any active branch.

## Stack modernization follow-ups

These were explicitly carved out of the [stack modernization plan](https://github.com/CatalogueOfLife/checklistbank) (Vite + React 19 + antd 6 + react-leaflet 5) so each phase stays reviewable. Do incrementally after the modernization branch lands.

- **Retire the `col-rc-tree` fork** (Phase 0 of the modernization tried this and reverted on 2026-05-16). The fork at `https://github.com/CatalogueOfLife/tree.git` (rc-tree 4.1.2 + ~6 custom commits) patches *cross-tree* drag-and-drop, which the Catalogue Assembly UI relies on. Upstream rc-tree 5.x added the `dropContainerKey` state but **not** the dispatch logic for drops whose drag originated in another rc-tree instance (see `rc-tree/es/Tree.js:282` `onNodeDrop` — bails at line 297 when `dropTargetKey === null` and TypeErrors at line 309 when `this.dragNode === null`). Three viable paths:
  1. Push the fork's PR #420 series upstream to `react-component/tree` and wait for a release.
  2. Rebuild cross-tree DnD on top of `react-dnd` (or `@dnd-kit`) at the React layer, keeping antd's `Tree` for rendering — most portable, biggest rewrite.
  3. Intercept drag events in a thin wrapper around antd's `Tree` and dispatch our own onDrop before rc-tree's internal handler runs.
- **Convert class components to function components.** ~100 class components remain after the modernization. They still work under React 19, but hooks-based equivalents read better and are easier to test. Suggested order: smallest leaf components first, then page-level containers. Touch one component per PR.
- **Drop `react-jss` in favour of antd's CSS-in-JS (or vanilla CSS modules).** 12 files use `injectSheet`. antd v5+ already injects its own emotion-style runtime; keeping a second style runtime is overhead. Decide between (a) `antd`'s `theme.useToken()` + inline styles, (b) plain CSS modules, or (c) CSS variables — pick before starting.
- **Upgrade Highcharts 9.x → latest (11.x at time of writing).** Out of scope from the stack modernization because Highcharts has a separate licensing/release cadence and its own breaking-change surface. Audit chart components before bumping.
- **Migrate `<Select><Option/></Select>` to `<Select options={...}/>`.** ~156 occurrences. Cosmetic — the old pattern still works in antd 6 — but worth normalizing.
- **Move `Modal.confirm` / `message.x` / `notification.x` static calls to the `App.useApp()` context API.** ~111 occurrences. Antd 6 logs deprecation warnings for the static form.
- **Replace `prop-types` with TypeScript or just drop it.** 7 files use it. React 19 still tolerates `propTypes` but adds runtime cost. A bigger conversation is whether the project should move to TypeScript at all — separate plan needed.
- **Retire `src/registerServiceWorker.js` if confirmed unused.** No companion `serviceWorker.js` is authored in the repo; the registration may be a no-op artifact from the original CRA scaffold. (Phase 1 already trimmed the dead `register()` helpers; only the `unregister()` call remains.)
- **Revisit Vite 8 once `@vitejs/plugin-react` v6 (or `@vitejs/plugin-react-oxc`) handles JSX inside `.js` files cleanly.** Phase 1 stayed on Vite 7.3 because Vite 8's native `builtin:vite-transform` parses parser language by extension and ignores `moduleTypes`/`oxc.lang` for JSX-in-`.js`. Alternative: a dedicated rename PR that moves `~300 .js` files containing JSX to `.jsx` via `git mv`, which unlocks Vite 8 without plugin changes.
