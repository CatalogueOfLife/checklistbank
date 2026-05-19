# TODO

Tracked tech-debt and follow-up work that is out of scope for any active branch.

## Stack modernization follow-ups

These were explicitly carved out of the [stack modernization plan](https://github.com/CatalogueOfLife/checklistbank) (Vite + React 19 + antd 6 + react-leaflet 5) so each phase stays reviewable. Do incrementally after the modernization branch lands.

- **Move `Modal.confirm` / `message.x` / `notification.x` static calls to the `App.useApp()` context API.** ~111 occurrences. Antd 6 logs deprecation warnings for the static form.
- **Finish the antd 6 Tabs/Menu structural cleanup.** Phase 5 of the modernization converted the six smaller Tabs files (Verbatim, TextTreeUpload, NameIndexKey, MetaDataGenerator, Reference, UserProfile) and the two small Menu files (DatasetImportMetrics/Menu, LayoutNew/UserMenu) from JSX-children to the `items={[...]}` prop, but three Tabs files were left as-is because their tab bodies are 200+ lines each and the conversion is risky without browser verification:
  - `src/pages/Name/index.js` — "About" tab body lines 256–487
  - `src/pages/Taxon/index.js` — "About" tab body lines 541–992
  - `src/pages/WorkBench/index.js` — "Search" tab body lines 780–967
    And the project's main left-nav (`src/components/LayoutNew/BasicMenu.js`) is ~900 lines of nested `<SubMenu>` / `<Menu.Item>` with conditional rendering that needs to become a nested data structure passed via `items=`. These all still render correctly under antd 6 — they only emit deprecation warnings in the console. Convert when you can do it with a browser open to verify each interaction.
- **Mop up the remaining antd 6 deprecation warnings.** The big sweeps (Alert `message=`/`onClose=`, Tabs `tabPosition`, Select `onDropdownVisibleChange`, the `Select.Option`/`OptGroup` JSX-children API) are done. What's left is a scattered tail flagged by IDE diagnostics: Modal/Drawer `onClose=` (signature changed in v6, several call sites), `Card`/`Select` `bordered` → `variant`, `Steps` / `Pagination` `direction` (deprecated), `List dataSource` when used inside grid containers, `Input.status` (deprecated), `Button.Group`/`Radio.Group` `Group` deprecations. Hunt with the IDE diagnostics for `is deprecated`.
- **Revisit Vite 8 once `@vitejs/plugin-react` v6 (or `@vitejs/plugin-react-oxc`) handles JSX inside `.js` files cleanly.** Phase 1 stayed on Vite 7.3 because Vite 8's native `builtin:vite-transform` parses parser language by extension and ignores `moduleTypes`/`oxc.lang` for JSX-in-`.js`. Alternative: a dedicated rename PR that moves `~300 .js` files containing JSX to `.jsx` via `git mv`, which unlocks Vite 8 without plugin changes.

## Stack modernization out of scope

- **Convert class components to function components.** ~100 class components remain after the modernization. They still work under React 19, but hooks-based equivalents read better and are easier to test. Suggested order: smallest leaf components first, then page-level containers. Touch one component per PR.
- **Upgrade Highcharts 9.x → latest (11.x at time of writing).** Out of scope from the stack modernization because Highcharts has a separate licensing/release cadence and its own breaking-change surface. Audit chart components before bumping.
