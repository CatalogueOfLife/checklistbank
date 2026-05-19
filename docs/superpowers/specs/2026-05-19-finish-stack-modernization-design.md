# Finish Stack Modernization — Items 1, 2, 3, 5

**Date:** 2026-05-19
**Scope:** Land TODO.md items 1 (App.useApp), 2 (Tabs/Menu structural cleanup), 3 (deprecation tail), and 5 (class → function conversion remainder). Branch: `modernize-stack`. Vite 8 readiness and Highcharts 9 → 11 are explicitly out of scope per user decision.

## Why one spec for four TODO items

The four items are deeply interlinked:

- **Item 5 (class → function, 30 files)** subsumes **item 1 (32 callers of static `notification`/`message`/`Modal`)** — every callee in item 1 is currently a class component, and once it becomes a function component, the migration to `App.useApp()` is mechanical.
- **Item 2 (Tabs/Menu structural cleanup, 4 files)** is entirely inside the XL subset of item 5: `Name/index.js`, `Taxon/index.js`, `WorkBench/index.js`, `LayoutNew/BasicMenu.js`. Converting these to function components is the same touch that flips `<Tabs><TabPane>` to `<Tabs items={...}/>`.
- **Item 3 (deprecation tail)** is independent and small (current grep returns ~5 sites total — much smaller than TODO.md suggests).

Doing item 5 first lets items 1, 2 fold in naturally.

## File inventory

### Phase α — Item 3 (deprecation tail)

Scope after fresh audit (much smaller than TODO suggested):

- `src/pages/UserProfile/index.js:216` — `<List dataSource={...}/>` inside a grid container (the deprecation case)
- `src/pages/project/Assembly/NameAutocomplete.js:150` — `<Input.Search status="error" ...>` (verify whether the deprecation actually applies; if not, keep)
- `src/components/ImportChart.js:12` — `Button.Group` (deprecated in v6 in favor of plain `<Space.Compact>`)
- Any other `is deprecated` diagnostics surfacing during the phase δ conversions (handle inline)

### Phase β — `getDerivedStateFromProps` files (5)

Trickiest hook pattern; each ≤230 lines:
- `src/components/TagControl.js` (143)
- `src/components/PopconfirmMultiOption.js` (159)
- `src/components/MetaData/CitationControl.js` (226)
- `src/components/MetaData/KeyValueControl.js` (147)
- `src/components/MetaData/AgentControl.js` (224)

Pattern: `getDerivedStateFromProps(props)` syncs `props.value` into local state on every render where the prop changed. Hook equivalent:
```js
useEffect(() => { setX(value); }, [value]);
```
With the caveat that the four `MetaData/*Control.js` files use the "controlled-component bridge" pattern (parent passes `value`, component maintains internal edit state, calls `onChange` on commit). The hook version needs to keep that semantic.

### Phase γ — Large files (17, 400–800 lines)

Sorted descending:

```
792  src/pages/project/Assembly/ColTreeNode.js
763  src/pages/project/ProjectSourceMetrics/SourceMetrics.js
763  src/pages/project/ProjectDecisions/Decisions.js
759  src/pages/project/ProjectDecisions/index_deprecated.js
752  src/pages/DatasetKey/datasetPageTabs/DatasetMeta.js
716  src/pages/project/ProjectSectors/SectorPageContent.js
609  src/pages/project/Assembly/Sector.js
600  src/pages/project/SectorSync/SyncTable.js
577  src/pages/tools/GBIFTaxonomyReview/Root.js
506  src/pages/Name/index.js               ← also touched in phase ζ (Tabs)
500  src/components/hoc/ContextProvider.js
498  src/components/VerbatimPresentation.js
484  src/pages/project/Options/Options.js
443  src/pages/Download/DatasetDownloadForm.js
421  src/pages/Admin/index.js
419  src/components/LayoutNew/index.js
402  src/pages/project/ProjectSectors/SectorTable.js
```

Note: `index_deprecated.js` is dead code (named "deprecated"). Verify before touching; possibly just delete instead of convert.

Approach: subagent batches of 4-5 files each. Each batch verified by `npx vite build` between conversions, chrome-devtools smoke test after batch.

### Phase δ — XL files (8, 800+ lines)

These are the dangerous ones. **One file per dedicated subagent**, not batched, with browser verification by the user after each.

```
1690  src/pages/project/Assembly/ColTree.js          ← rendering engine for the assembly tree
1245  src/pages/Duplicates/index.js                  ← duplicate-detection workbench
1202  src/pages/WorkBench/index.js                   ← editorial workbench + Tabs structural change
1167  src/components/LayoutNew/BasicMenu.js          ← main left-nav + Menu structural change
1028  src/pages/Taxon/index.js                       ← taxon detail browser + Tabs structural change
 933  src/pages/NameSearch/index.js                  ← name search
 912  src/pages/DatasetList/index.js                 ← dataset list page
 844  src/pages/project/Assembly/index.js            ← assembly orchestrator
```

Each XL file's subagent gets:
- The pilot's conversion patterns (table reproduced in the implementation plan).
- Explicit BLOCKED criteria for unusual patterns (refs-as-state, `setState` callbacks that read back state, debounce timers, Highcharts mounts, ColTree's deep mutation patterns).
- For files in phase ζ (Tabs/Menu), explicit instructions to ALSO flip JSX children to `items={...}`.

After each XL file: `npx vite build`, chrome-devtools self-verification, **then user click-through** before continuing.

### Phase ε — App.useApp() static-call migration

After all class components in phases β/γ/δ are function components, the 32 sites that used static `notification.x(...)` / `message.x(...)` / `Modal.confirm(...)` are now reachable via `App.useApp()`. Sweep them via subagent: replace `import { notification } from "antd"` patterns at each call site with `const { notification } = App.useApp()` inside the (now-function) component, the same way Wave B.1 did for the 17 original function components.

The 2 helper modules from item 1 (`Assembly/ColTreeContext.js`, `WorkBench/DecisionTag.js`) export module-level functions; those become functions that accept a `notification` instance as an argument, with callers (now function components) doing:
```js
const { notification } = App.useApp();
// ...
applyDecision({ notification, ...args });
```

### Phase ζ — Tabs/Menu structural cleanup

The three Tabs files (`Name`, `Taxon`, `WorkBench`) + `BasicMenu` are all in phase δ. The structural change is part of each XL conversion. No separate phase needed; the implementation plan calls it out per-file.

## Order of operations

1. **Phase α** (deprecation tail) — quick win first, single commit.
2. **Phase β** (5 gDSFP files) — one subagent batch.
3. **Phase γ** (17 large files) — 3-4 subagent batches.
4. **Phase δ + ζ** (8 XL files) — one subagent per file, user click-through gate after each.
5. **Phase ε** (App.useApp sweep) — one final subagent.
6. **TODO.md update** — drop items 1, 2, 3, 5 from the follow-ups section; mark Highcharts and Vite 8 as the remaining out-of-scope items.

## Conversion patterns (same as prior batches)

| Class idiom | Function idiom |
|---|---|
| `this.state = { x: 0 }; setState({ x: 1 })` | `const [x, setX] = useState(0); setX(1)` |
| `componentDidMount()` body | `useEffect(() => { ... }, [])` |
| Paired mount+unmount (timer/listener/Highcharts) | `useEffect(() => { setup(); return () => cleanup(); }, [])` |
| `componentDidUpdate(prev)` on one prop | `useEffect(() => { ... }, [x])` |
| `componentDidUpdate` on multiple unrelated props | One `useEffect` per concern |
| `getDerivedStateFromProps(props)` syncing `props.value` into state | `useEffect(() => setX(value), [value])` — see β notes |
| `handleX = (e) => { ... }` class field | `const handleX = (e) => { ... }` inside body |
| `this.setState({ s: v }, () => f(this.state.s))` | call `f(v)` directly |
| `React.createRef()` + `this.someRef.current` | `useRef(null)` + `someRef.current` |
| `notification.error(...)` static | `const { notification } = App.useApp(); notification.error(...)` |
| `<Tabs><TabPane key="a">A body</TabPane></Tabs>` | `<Tabs items={[{ key: "a", label: "A", children: <ABody/> }]}/>` |
| `<Menu><SubMenu key="x" title="X"><Menu.Item .../></SubMenu></Menu>` | `<Menu items={[{ key: "x", label: "X", children: [...] }]}/>` |
| HOC wrappers `withRouter(withContext(map)(C))` | unchanged on export line |

## Verification strategy

- **`npx vite build` after every batch** — fails fast on syntax errors, dead imports, type-name collisions.
- **chrome-devtools smoke** after each phase γ batch + each phase δ file: navigate to representative routes, scan console for new errors, take screenshot.
- **User click-through gate** between each phase δ file — the user manually exercises the converted page. This is the only way to catch subtle behavior regressions (autocomplete debounce, tree expand state, sort interactions, modal lifecycle, Highcharts redraw).
- **TODO.md updated** in a final commit that removes items 1, 2, 3, and 5 from "Stack modernization follow-ups". The "Stack modernization out of scope" section keeps items for Highcharts and class→function (rephrased as "done; only the 8 XL pages were dedicated").

## Risk surface

1. **ColTree.js (1690 lines)** is the project's most complex component — the assembly-tree rendering engine. It uses refs heavily, has internal mutation patterns, manages selection state, and integrates with the custom `col-rc-tree` library. The XL-file conversion plan must explicitly allow the implementer to STOP and report BLOCKED if any pattern looks like it won't translate mechanically.

2. **BasicMenu structural rewrite + class conversion** combined is two large changes in one file. The plan should do the class → function conversion first, verify, then do the children → `items={...}` migration as a separate commit.

3. **ContextProvider.js (500 lines)** is the root context wiring (enumerations, user, etc.) — every page depends on it. Converting it requires extra care; bugs here cascade everywhere.

4. **The 17 "large" files in phase γ include three pages that share patterns** (the two ProjectDecisions files are 90% the same content; `index_deprecated.js` may be deletable instead of converted).

5. **`getDerivedStateFromProps` in the four MetaData controls** is a "controlled component" sync — naive `useEffect(() => setX(value), [value])` may cause an extra render cycle or echo back to the parent. Each conversion needs a careful look at the form's onChange contract.

## Out of scope (per user)

- Vite 8 readiness (`.js` → `.jsx` mass rename or plugin upgrade).
- Highcharts 9 → 11 upgrade.
- Any cleanup not on the four TODO items.
