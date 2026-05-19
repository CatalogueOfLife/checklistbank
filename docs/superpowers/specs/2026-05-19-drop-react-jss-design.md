# Drop `react-jss` — Design Spec

**Date:** 2026-05-19
**Scope:** Replace `react-jss` with CSS Modules across 12 files. Stack-modernization follow-up tracked in `TODO.md`.

## Problem

ChecklistBank still depends on `react-jss` (`^10.10.0`) for component-level styling in 12 files. Since the migration to antd 5/6, antd ships its own CSS-in-JS runtime (cssinjs/emotion-style). Running a second style runtime is unnecessary overhead in bundle size and complexity, and JSS' `injectSheet`/`classes`-prop API is no longer idiomatic in a function-component + hooks codebase.

## Audit findings

Inspection of all 12 files using `react-jss`:

- **No file reads the JSS theme.** `App.js` wraps the tree in `<ThemeProvider theme={{ colorPrimary: "deepskyblue" }}>`, but no styled component references `theme` anywhere. The same `colorPrimary` value is already passed to antd's `ConfigProvider`, which is what actually drives the UI palette.
- **No dynamic styles.** Style objects are all flat constants; none depend on props, state, or theme.
- **`BasicMenu.js` defines `const styles = {}`** — the `injectSheet` wrapper has no rules to inject; it's pure overhead.
- **Two pairs of near-duplicate rule sets:**
  - The "list item" rules in `PresentationItem.js` and `pages/Taxon/BorderedListItem.js` (7 rules each, mostly identical).
  - The "new tag" rule in `TagControl.js`, `MetaData/CitationControl.js`, `MetaData/AgentControl.js`, and `MetaData/KeyValueControl.js` (two flavors: with and without `max-height: 22px`).
- **Only "real CSS" features used** by any file are: `&:last-of-type`, `&>div`, `& img` (descendant/child selectors and one pseudo-class) and JSS's `fallbacks: { imageRendering: "pixelated" }` (which is just stacked CSS declarations in real CSS). All trivially expressible in a plain `.module.css` file.

## Approach: CSS Modules with shared modules for deduped rules

Each `injectSheet(styles)(Component)` becomes a sibling `*.module.css` file. The component imports it as `import styles from "./Foo.module.css"` and uses `className={styles.foo}` — the same mental model as today's `classes.foo`, just sourced from an import instead of a prop.

**Why CSS Modules:**
- Native Vite support — no plugin, no config change.
- Zero runtime — rules ship in a static CSS bundle.
- Native pseudo-selectors and descendant selectors (no JSS-specific syntax).
- Same scope semantics as JSS (local class names, hashed).
- Matches the function-component style of the rest of the post-modernization codebase.

**Rejected alternatives:**
- *antd `theme.useToken()` + inline styles.* Inline styles can't express `:last-of-type` / `& img`, and none of these rules actually need design tokens.
- *CSS variables.* Solves runtime variation; nothing here varies at runtime.
- *Plain global CSS in `App.css`.* Viable for the smallest components but mixes strategies; collision risk grows over time.

## Per-file mapping

| # | File | New CSS module | Notes |
|---|---|---|---|
| 1 | `src/App.js` | – | Drop `import { ThemeProvider } from "react-jss"`, remove the dead `theme` constant, remove the `<ThemeProvider>` wrapper. `<ConfigProvider theme={antdTheme}>` remains. |
| 2 | `src/components/LayoutNew/BasicMenu.js` | – | `styles = {}` is empty. Drop `injectSheet` import and unwrap. |
| 3 | `src/components/Help.js` | `Help.module.css` | 2 rules (`tip`, `icon`). |
| 4 | `src/components/PresentationGroupHeader.js` | `PresentationGroupHeader.module.css` | 1 rule (`header`). |
| 5 | `src/components/LayoutNew/index.js` | `LayoutNew.module.css` | 1 rule (`sider`). |
| 6 | `src/components/LayoutNew/UserMenu/index.js` | `UserMenu.module.css` | 1 rule (`avatar`) with `& img` descendant + image-rendering fallback. |
| 7 | `src/components/TagControl.js` | shared `newTag.module.css` | uses `.newTag`. |
| 8 | `src/components/MetaData/CitationControl.js` | shared `newTag.module.css` | uses `.newTagTall`. |
| 9 | `src/components/MetaData/AgentControl.js` | shared `newTag.module.css` | uses `.newTagTall`. |
| 10 | `src/components/MetaData/KeyValueControl.js` | shared `newTag.module.css` | uses `.newTag`. |
| 11 | `src/components/PresentationItem.js` | `PresentationItem.module.css` (composes shared) | 7 rules, composes shared `borderedListItem.module.css`, adds child padding + label ellipsis. |
| 12 | `src/pages/Taxon/BorderedListItem.js` | `BorderedListItem.module.css` (composes shared) | 7 rules, re-export of shared module. |

## Shared modules

### `src/components/newTag.module.css`

```css
.newTag {
  background: #fff;
  border-style: dashed;
}

.newTagTall {
  composes: newTag;
  max-height: 22px;
}
```

Consumers:
- `TagControl`, `KeyValueControl` → `styles.newTag`
- `CitationControl`, `AgentControl` → `styles.newTagTall`

### `src/components/borderedListItem.module.css`

```css
.formItem {
  padding-bottom: 0;
  width: 100%;
  clear: both;
  border-bottom: 1px solid #eee;
}
.formItem:last-of-type { border: none; }

.label      { display: block; color: rgba(0, 0, 0, 0.85); }
.content    { word-break: break-word; margin-bottom: 0; }
.noContent  { word-break: break-word; color: #bbb; margin-bottom: 0; }
.contentCol { word-break: break-word; }
.smallMargin  { margin-bottom: 3px;  margin-top: 3px; }
.mediumMargin { margin-bottom: 10px; margin-top: 10px; }
```

`BorderedListItem.module.css` is a thin re-export composing each class from this module.

`PresentationItem.module.css` composes the same set and adds:

```css
.formItem { composes: formItem from "./borderedListItem.module.css"; }
.formItem > div { padding-left: 10px; padding-right: 10px; }

.label { composes: label from "./borderedListItem.module.css";
         overflow: hidden; text-overflow: ellipsis; }
```

Shared module location: `src/components/` (sits alongside `PresentationItem.js`; relative imports from `pages/Taxon/BorderedListItem.js` are `../../components/borderedListItem.module.css`).

## Conversion pattern (concrete diff)

**Before** — `src/components/Help.js`
```js
import injectSheet from "react-jss";
const styles = {
  tip:  { color: "rgba(0,0,0,.45)", marginLeft: "4px" },
  icon: { marginTop: "4px" },
};
const Help = ({ title, classes }) => (
  <span>
    {title && <span className={classes.tip}>…</span>}
    <QuestionCircleOutlined className={classes.icon} />
  </span>
);
export default injectSheet(styles)(Help);
```

**After** — `src/components/Help.js`
```js
import styles from "./Help.module.css";
const Help = ({ title }) => (
  <span>
    {title && <span className={styles.tip}>…</span>}
    <QuestionCircleOutlined className={styles.icon} />
  </span>
);
export default Help;
```

**New file** — `src/components/Help.module.css`
```css
.tip  { color: rgba(0, 0, 0, 0.45); margin-left: 4px; }
.icon { margin-top: 4px; }
```

### Renaming convention

`classes` → `styles` everywhere it appears (~25 references across the 12 files). The new name matches CSS-modules convention and avoids confusion with antd's own `classes` prop (which several converted files also accept).

For class components (`UserMenu`, `TagControl`, `CitationControl`, `AgentControl`, `KeyValueControl`), `this.props.classes.x` becomes `styles.x` (no destructure — `styles` is a module-level import).

## Cleanup

- `package.json`: remove `"react-jss": "^10.10.0"` and run `npm uninstall react-jss` to update `package-lock.json`.
- No Vite config change (`*.module.css` is built-in support).
- No test or CI change.

## Test plan (manual, dev server)

| Route | Components exercised |
|---|---|
| Any page (header/menu) | `LayoutNew`, `UserMenu`, `BasicMenu` |
| `/dataset/3/about` (or any dataset's "About" tab) | `PresentationItem`, `PresentationGroupHeader`, `Help`, `TagControl`, `CitationControl`, `AgentControl`, `KeyValueControl` |
| `/dataset/3/taxon/<id>` (or any taxon page) | `BorderedListItem` |

For each: visually compare against `master` to confirm zero visual drift (sider position/scroll, list-item borders + ellipsis, "new tag" buttons, help tooltip styling, user-menu avatar `image-rendering`).

## Delivery shape

Single PR off the current branch (or a new follow-up branch). Each non-`App.js` file is converted in its own commit; the shared CSS modules (`newTag.module.css`, `borderedListItem.module.css`) are introduced in the same commit as their first consumer. Two final cleanup commits:

1. ~11 file-conversion commits — one per file (BasicMenu is a single-line unwrap; the others each add a `.module.css` and rewrite the JS).
2. 1 commit — drop `<ThemeProvider>` and the dead `theme` constant from `App.js`.
3. 1 commit — `npm uninstall react-jss` + lockfile update.

## Out of scope

- Touching any of the other items in `TODO.md` (class-to-function conversion, deprecation warnings, Highcharts upgrade, etc.).
- Converting global stylesheets (`App.css`, antd theme tokens) — only `injectSheet` call sites are in scope.
- TypeScript adoption.
