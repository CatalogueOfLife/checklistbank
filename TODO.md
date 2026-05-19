# TODO

Tracked tech-debt and follow-up work that is out of scope for any active branch.

## Stack modernization follow-ups

These were explicitly carved out of the [stack modernization plan](https://github.com/CatalogueOfLife/checklistbank) (Vite + React 19 + antd 6 + react-leaflet 5) so each phase stays reviewable. Do incrementally after the modernization branch lands.

- **Revisit Vite 8 once `@vitejs/plugin-react` v6 (or `@vitejs/plugin-react-oxc`) handles JSX inside `.js` files cleanly.** Phase 1 stayed on Vite 7.3 because Vite 8's native `builtin:vite-transform` parses parser language by extension and ignores `moduleTypes`/`oxc.lang` for JSX-in-`.js`. Alternative: a dedicated rename PR that moves `~300 .js` files containing JSX to `.jsx` via `git mv`, which unlocks Vite 8 without plugin changes.

## Stack modernization out of scope

- **Upgrade Highcharts 9.x → latest (11.x at time of writing).** Out of scope from the stack modernization because Highcharts has a separate licensing/release cadence and its own breaking-change surface. Audit chart components before bumping.
