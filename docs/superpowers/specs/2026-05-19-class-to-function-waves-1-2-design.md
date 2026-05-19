# Class → Function Component Conversion — Waves 1 + 2 (61 files)

**Date:** 2026-05-19
**Scope:** Convert 61 of the remaining 91 class components in `src/` to function components using React hooks. Continuation of the pilot effort (`2026-05-19-class-to-function-pilot-design.md`), applying the same patterns at scale. Branch: `modernize-stack`.

## Problem

After the antd 6 / React 19 migration, 101 class components remained. The pilot (commits `d34444c`…`02bc458`) converted 10 of the smallest leaves. 91 still need conversion. The TODO entry recommends "Touch one component per PR. Smallest leaf first." but doing all 91 in a single batch carries real risk — the largest pages are 800–1700 line refactors of their own.

These two waves take the next sensible bite: every file <400 lines that doesn't use `getDerivedStateFromProps`. That covers most files by count, leaves the genuinely-risky pages for dedicated sessions.

## File inventory

61 files, split into two waves and five sub-batches by complexity. All files are <400 lines. None use `getDerivedStateFromProps`. (The 30 deferred files are listed in the "Out of scope" section at the bottom.)

### Wave 1 — 34 files, no `componentDidUpdate`/`componentWillUnmount`/etc

Mostly pure renders, plus mount-only `useEffect(_, [])` patterns. Lowest risk.

Split into three sub-batches by line count:

**1a — 12 files, 29–135 lines:**
```
src/pages/project/SectorPublishers/index.js
src/components/LayoutNew/Sync.js
src/pages/NameSearch/MultiValueFilter.js
src/components/exception/Exception.js
src/pages/project/Assembly/SectorNote.js
src/pages/Admin/SyncAllSectorsButton.js
src/pages/DatasetList/ColumnFilter.js
src/pages/project/ProjectReferences/ReferencePopover.js
src/pages/DatasetKey/DatasetExport.js
src/pages/DatasetKey/datasetPageTabs/DeleteDatasetButton.js
src/pages/project/ProjectSourceMetrics/TaxonomicCoverage.js
src/pages/Taxon/TypeMaterialPopover.js
```

**1b — 11 files, 95–186 lines:**
```
src/pages/DatasetKey/datasetPageTabs/DatasetClassification.js
src/components/ArchiveUpload.js
src/pages/project/SectorSync/SyncButton.js
src/pages/project/Assembly/TaxonSources.js
src/pages/project/Assembly/TaxonSourcesNew.js
src/components/MetaData/MetaDataUpload.js
src/pages/Imports/importTabs/ImportButton.js
src/pages/project/ProjectReferences/index.js
src/components/ReleaseSourceMetrics.js
src/pages/Taxon/VernacularNames.js
src/components/LayoutNew/CatalogueSelect.js
```

**1c — 11 files, 161–389 lines:**
```
src/pages/DatasetImportMetrics/Menu.js
src/pages/DatasetKey/datasetPageTabs/DatasetIssues.js
src/components/LayoutNew/UserMenu/index.js
src/components/TextTreeUpload.js
src/pages/HomePage/index.js
src/pages/DatasetKey/datasetPageTabs/DatasetTasks.js
src/pages/Admin/MatcherAdmin.js
src/pages/project/ProjectSources/Issues.js
src/pages/project/ProjectSources/index2.js
src/pages/DatasetKey/datasetPageTabs/ReleaseSource.js
src/pages/Admin/DatasetAdmin.js
```

### Wave 2 — 27 files, has `componentDidUpdate`/`componentWillUnmount`/etc

Effects required, deps must be extracted carefully.

**2a — 14 files, 79–192 lines:**
```
src/pages/project/Assembly/ReferenceAutocomplete.js
src/pages/DatasetList/ColumnFilter2.js
src/pages/DatasetKey/datasetPageTabs/DatasetSourceMetrics.js
src/components/hoc/Width.js
src/pages/project/ProjectSourceMetrics/ReleaseSelect.js
src/pages/project/Editors/UserAutocomplete.js
src/components/MetaData/LogoUpload.js
src/components/PublisherAutocomplete.js
src/pages/project/Assembly/NameAutocomplete.js
src/components/hoc/DatasetProvider.js
src/pages/project/Assembly/DatasetAutocomplete.js
src/pages/project/SectorDiff/index.js
src/pages/DatasetKey/datasetPageTabs/DatasetSectors.js
src/pages/project/SourceDataset/subPages/DatasetIssues.js
```

**2b — 13 files, 212–393 lines:**
```
src/pages/project/SourceDataset/index.js
src/components/ImportChartNested.js
src/pages/DatasetImportMetrics/ImportTimeline.js
src/pages/VerbatimRecord/index.js
src/pages/DatasetKey/datasetPageTabs/DatasetOptions.js
src/pages/project/SourceDataset/subPages/DatasetTasks.js
src/components/ImportChart.js
src/pages/DatasetKey/datasetPageTabs/DatasetImportDiff.js
src/pages/project/ProjectReferences/RefTable.js
src/pages/DatasetImportMetrics/index.js
src/pages/DatasetKey/index.js
src/pages/DatasetKey/datasetPageTabs/DatasetProjects.js
src/pages/Imports/importTabs/ImportTable.js
```

## Approach: subagent batches, per-file commit, BLOCKED escalation

Each sub-batch (1a, 1b, 1c, 2a, 2b) goes to one general-purpose subagent (sonnet model). The subagent applies the conversion patterns from the pilot to each file in its batch and commits each file separately. After every ~5 conversions it runs `npx vite build` to fail-fast on regressions.

**Subagents must STOP and report BLOCKED if they encounter:**
- `componentDidUpdate` whose body needs multiple distinct dep arrays (one effect per concern is fine, but the subagent should report it for review).
- `componentWillUnmount` doing cleanup other than `clearInterval`/`clearTimeout` (e.g., subscription unsubscribe, event listener removal).
- `setState(state, callback)` where the callback meaningfully depends on the just-set state.
- Refs being used as mutable instance variables (not just DOM handles).
- HOC wrappers other than `withRouter`/`withContext`/`withWidth` (project's standard set).
- Anything else that "doesn't look mechanical".

I handle BLOCKED files inline before continuing.

## Conversion patterns (same as pilot — no change)

| Class idiom | Function idiom |
|---|---|
| `this.state = { x: 0 }; setState({ x: 1 })` | `const [x, setX] = useState(0); setX(1)` |
| `componentDidMount()` body | `useEffect(() => { ... }, [])` |
| `componentDidMount` + `componentWillUnmount` paired (setInterval) | `useEffect(() => { const t = setInterval(...); return () => clearInterval(t); }, [])` |
| `componentDidUpdate(prev)` checking `prev.x !== this.props.x` | `useEffect(() => { ... }, [x])` |
| `handleX = (e) => { ... }` class field | `const handleX = (e) => { ... }` inside the function body |
| `this.setState({ s: v }, () => f(this.state.s))` | call `f(v)` directly with the new value |
| `React.createRef()` + `this.someRef.current` | `useRef(null)` + `someRef.current` |
| `class X extends Component` ... `export default withRouter(withContext(map)(X))` | `const X = ({ ...props }) => { ... }` — wrapper line **unchanged** |

Other rules:
- `import React from "react"` becomes `import { useEffect, useState, useRef } from "react"` (drop the default `React` import unless `React.Fragment`/`React.createElement` is used; otherwise add the relevant hooks).
- The function component name preserves the class name.
- Destructure props in the parameter list when stable; use a `props` variable when many props are accessed and partial destructure is awkward.

## Delivery shape

- **One commit per file** (61 commits total across both waves).
- Commit subject: `Convert <Component> to a function component`.
- Standard Co-Authored-By trailer.
- `npx vite build` succeeds before each subagent commits anything.
- No squashing.

## Verification

### Phase 1 — chrome-devtools self-verification (per wave)

After Wave 1 lands all 34 commits: start dev server (`npm start` background, served at `http://127.0.0.1:3000` to hit the dev API), navigate to the representative routes below, and inspect console messages. Pre-existing antd/Router deprecation warnings are acceptable; new errors are not.

After Wave 2 lands all 27 commits: same sweep, plus extra attention to import/diff pages where Wave 2 components live.

| Route | Components exercised (across both waves) |
|---|---|
| `/` | HomePage |
| `/dataset` (with "Show all datasets") | DatasetList + ColumnFilter + ColumnFilter2 |
| `/dataset/<key>/imports` | DatasetImportMetrics, ImportTimeline, ImportChart, ImportChartNested, Menu |
| `/dataset/<key>/about` | DatasetKey index + tab subpages (DatasetClassification, DatasetIssues, DatasetSourceMetrics, DatasetOptions, DatasetTasks, DatasetProjects, DatasetSectors, ReleaseSource, DatasetImportDiff, DeleteDatasetButton) |
| `/dataset/<key>/taxon/<id>` (logged in) | Taxon subviews (TypeMaterialPopover, VernacularNames, TaxonSources/New) |
| `/project/265156/sector/sync` | SectorSync chrome (touched by SyncButton) |
| `/project/265156/sector` | SectorPublishers index |
| `/project/265156/references` | ProjectReferences + RefTable + ReferencePopover |
| `/project/265156/sources/issues` | ProjectSources/Issues, index2 |
| `/project/265156/sources` | SourceDataset + subPages (DatasetIssues, DatasetTasks) |
| `/project/265156/sourcemetrics` | TaxonomicCoverage, ReleaseSelect |
| `/project/265156/editors` | UserAutocomplete |
| `/project/265156/sync/.../diff` | SectorDiff |
| `/imports` | ImportTable, ImportButton |
| `/admin/datasets` | DatasetAdmin |
| `/admin/matcher` | MatcherAdmin |
| `/admin/settings` (login form) | LogoUpload area |
| `/tools/validator` (archive upload) | ArchiveUpload, TextTreeUpload, MetaDataUpload |
| `/dataset/<key>/verbatim/<id>` | VerbatimRecord |
| Anywhere with a dataset autocomplete | DatasetAutocomplete, NameAutocomplete, PublisherAutocomplete, ReferenceAutocomplete |
| Chrome (visible on every page) | LayoutNew/Sync, LayoutNew/UserMenu, LayoutNew/CatalogueSelect |

### Phase 2 — user-driven click-through (Markus)

After each phase-1 sweep reports clean: user navigates the same routes, watches for functional regressions (debounced searches, autocomplete behavior, interval-driven refreshes, modal forms, file uploads, sort/filter changes), and reports anything off. Patches in follow-up commits.

## Risk surface

1. **Autocomplete components (~6 files in Wave 2)** — these depend on debounce, controlled state, and `componentDidUpdate` patterns to sync parent value into the input. Conversion needs care; will likely surface in BLOCKED reports if anything looks unusual.

2. **`hoc/DatasetProvider.js`** and **`hoc/Width.js`** — these are context plumbing components used app-wide. Any regression cascades. They're in Wave 2a.

3. **Import-chart components (ImportChart, ImportChartNested, ImportTimeline)** — these wire Highcharts via refs and lifecycle, so conversion needs to preserve the Highcharts mount/unmount semantics carefully. May produce BLOCKED reports for me to handle.

4. **`DatasetKey/index.js`** (349 lines, Wave 2b) — the dataset page shell that hosts all the tab subpages. Touching the host AND every tab in the same session means I must verify the full tab navigation after Wave 2.

5. **Strict-mode double-effect in dev** — already noted in the pilot spec; not a regression source in production.

## Out of scope (deferred to dedicated sessions)

These 30 files are intentionally NOT touched in this effort:

**8 XL pages (800+ lines) — each its own dedicated session:**
- `src/pages/project/Assembly/ColTree.js` (1690)
- `src/pages/Duplicates/index.js` (1245)
- `src/pages/WorkBench/index.js` (1202)
- `src/components/LayoutNew/BasicMenu.js` (1167)
- `src/pages/Taxon/index.js` (1028)
- `src/pages/NameSearch/index.js` (933)
- `src/pages/DatasetList/index.js` (912)
- `src/pages/project/Assembly/index.js` (844)

**17 large pages (400–800 lines):**
- `src/pages/project/Assembly/ColTreeNode.js` (792)
- `src/pages/project/ProjectSourceMetrics/SourceMetrics.js` (763)
- `src/pages/project/ProjectDecisions/Decisions.js` (763)
- `src/pages/project/ProjectDecisions/index_deprecated.js` (759)
- `src/pages/DatasetKey/datasetPageTabs/DatasetMeta.js` (752)
- `src/pages/project/ProjectSectors/SectorPageContent.js` (716)
- `src/pages/project/Assembly/Sector.js` (609)
- `src/pages/project/SectorSync/SyncTable.js` (600)
- `src/pages/tools/GBIFTaxonomyReview/Root.js` (577)
- `src/pages/Name/index.js` (506)
- `src/components/hoc/ContextProvider.js` (500)
- `src/components/VerbatimPresentation.js` (498)
- `src/pages/project/Options/Options.js` (484)
- `src/pages/Download/DatasetDownloadForm.js` (443)
- `src/pages/Admin/index.js` (421)
- `src/components/LayoutNew/index.js` (419)
- `src/pages/project/ProjectSectors/SectorTable.js` (402)

**5 `getDerivedStateFromProps` files — specialized hook patterns needed:**
- `src/components/TagControl.js`
- `src/components/PopconfirmMultiOption.js`
- `src/components/MetaData/KeyValueControl.js`
- `src/components/MetaData/AgentControl.js`
- `src/components/MetaData/CitationControl.js`

(The four MetaData files use `getDerivedStateFromProps` as a "controlled component" pattern syncing `props.value` into local state. The hook replacement is either `useEffect(() => setState(value), [value])` or — better — lift state to the parent and remove the sync entirely. Decision belongs in a separate session.)
