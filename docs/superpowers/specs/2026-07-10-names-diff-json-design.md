# NamesDiff JSON rendering — design

**Date:** 2026-07-10
**Branch:** `feature/names-diff-json`
**Related backend PR:** [CatalogueOfLife/backend#1546](https://github.com/CatalogueOfLife/backend/pull/1546)

## Problem

Backend PR #1546 changes all three diff endpoints from returning unified-diff (udiff)
**text** to returning a structured **JSON `NamesDiff`** object. The UI currently renders
every diff with `diff2html` (`Diff2Html.getPrettyHtml`, side-by-side, `dangerouslySetInnerHTML`),
which will break the moment the API goes live. We must replace that rendering with a reusable
component that understands the new JSON, and adopt it in lockstep so we can merge + deploy the
frontend when the API changes ship.

Affected endpoints (response now `application/json`):
- `GET /dataset/{key}/diff?attempts=A..B` — dataset import-attempt diff
- `GET /dataset/{key}/sector/{id}/diff?attempts=A..B` — sector sync-attempt diff
- `GET /dataset/{key}/diff/{key2}` — dataset-to-dataset diff

## New response shape (`NamesDiff`)

```json
{
  "label1": "dataset_1010#1",
  "label2": "dataset_1010#2",
  "removed":  ["Aus bus L.", "Cus dus Sm."],
  "added":    ["Xus yus Sm."],
  "changed": [
    {
      "before": "Aus bus L.",
      "after":  "Aus bus L., 1758",
      "chunks": [
        { "op": "equal",  "text": "Aus bus L." },
        { "op": "insert", "text": ", 1758" }
      ],
      "similarity": 85.0
    }
  ],
  "removedCount": 2,
  "addedCount": 1,
  "changedCount": 1,
  "truncated": false,
  "identical": false
}
```

Field notes (from the PR's Java models):
- `removed` = names on side 1 only; `added` = names on side 2 only. Both are plain strings,
  already sorted by label under C collation (byte order).
- `changed[]` = `ChangedName` records: `before`, `after`, `chunks[]`, `similarity` (0–100).
- `chunks[]` = `Chunk` records: `op` ∈ `equal | delete | insert` (**serialized lowercase**,
  consume case-insensitively), plus `text`. Old string = concat of `equal`+`delete` chunks;
  new string = concat of `equal`+`insert` chunks.
- `*Count` are convenience getters; `identical` and `truncated` are booleans.
- `truncated: true` means the diff hit the backend cap (`diffMaxItems`, default 10k) and is
  partial.

## Component design

### `NamesDiffView` — presentational component

New folder `src/components/NamesDiffView/`. The component is **purely presentational**: it takes
an already-fetched `NamesDiff` object and renders it. Fetching, attempt/dataset selectors, and
page chrome stay in the three call sites (they already own that logic and URL/query state).

```
<NamesDiffView diff={namesDiff} />
```

Props:
- `diff` — the `NamesDiff` object (required). If `null`/`undefined`, renders nothing (call sites
  own the loading spinner).
- `defaultView` — `"grouped"` (default) | `"sorted"`.

Structure of the folder:
- `index.jsx` — `NamesDiffView` (owns the view-toggle state, stats bar, renders one of the two views).
- `DiffStats.jsx` — the always-on overview: three counts (Removed −N red, Added +N green,
  Changed ~N amber) + a "truncated" warning tag when `diff.truncated`.
- `ChangedNameRow.jsx` — renders one `ChangedName` as the **full old name → full new name**:
  the old name is reconstructed from `equal`+`delete` chunks, the new name from `equal`+`insert`
  chunks, joined by a ` → ` arrow. Only the differing parts are tinted (red in the old name,
  green in the new); both names stay fully readable. (An earlier inline word-diff that interleaved
  deletes and inserts on one line was rejected in review — it became unreadable when a delete and
  insert collided mid-word.) Op comparison is case-insensitive.
- `diffRows.js` — pure helpers: `mergeSorted(diff)` builds the single sorted list for the Sorted
  view (see below); shared row components for added/removed plain-string rows.
- `NamesDiffView.css` (or inline styles) — the red/green/amber colors and monospace rows.

### Two views (toggle), stats always on top

Layout top-to-bottom:
1. **`DiffStats`** overview bar — always visible.
2. A segmented **view toggle**: `Grouped | Sorted` (antd `Segmented`). Default **Grouped**.
3. The selected view.

**Grouped view** — three stacked, collapsible sections (antd `Collapse`), each with a colored
count header:
- `Removed (N)` — red, one plain-string row per name.
- `Added (N)` — green, one plain-string row per name.
- `Changed (N)` — amber, one `ChangedNameRow` per entry.
Empty sections (count 0) are hidden.

**Sorted view** — a single alphabetically-merged list. `mergeSorted(diff)` produces rows of
`{ type: "removed"|"added"|"changed", key, payload }` sorted by the name label
(`removed`/`added` by the string; `changed` by `before`). Each row is color/icon-coded:
- removed → red, `−` prefix, plain string
- added → green, `+` prefix, plain string
- changed → amber, `~` prefix, full `old → new` names (`ChangedNameRow`)

Because backend lists are each pre-sorted, `mergeSorted` is a simple k-way merge (or concat+sort;
lists are ≤ ~10k). Adjacent removed/added rows surface near-neighbor renames the grouped view
splits apart.

### Empty / truncated / large lists

- `diff.identical === true` (or all three lists empty) → antd `Empty` "No differences" (call
  sites keep their own attempt-specific empty copy where they already have it; the component
  renders a neutral empty state as fallback).
- `diff.truncated === true` → an amber warning in `DiffStats` ("Showing first N; diff truncated").
- Large lists: cap each rendered section at **500 rows** with a "Show all N" expander, so a 10k
  diff doesn't mount 10k DOM nodes up front. Same cap applies to the merged Sorted list. (Simple
  slice + toggle; no virtualization dependency.)

### Styling

Names render in a monospace font inside the diff rows so character-level chunk highlighting lines
up. Colors: removed/delete red (antd red-6 `#cf1322`), added/insert green (antd green-7
`#389e0d`), changed amber (antd gold-6 `#d48806`), each chunk with a light background tint.
Reuse antd tokens where practical.

## Call-site changes

All three drop `Diff2Html` + `diff2html.min.css` and the `dangerouslySetInnerHTML` block, keep
their `axios` fetch (now receiving JSON), and render `<NamesDiffView diff={data} />`.

1. **`src/pages/project/SectorDiff/index.jsx`**
   - Remove `Diff2Html`, the `getPrettyHtml` call, and the `parsingError` state.
   - Remove the ad-hoc `summary.DELETE/INSERT` Tags and the `data.identical` Alert — `DiffStats`
     replaces both (it reads `removedCount`/`addedCount`/`changedCount`/`identical`).
   - Keep the two attempt `Select`s and error `Alert`.

2. **`src/pages/DatasetKey/datasetPageTabs/DatasetImportDiff.jsx`**
   - Remove `Diff2Html`/`getPrettyHtml`.
   - Replace `{data === ""}` empty check with `NamesDiffView`'s identical handling (the JSON body
     is now an object, never `""`).
   - Keep attempt selectors, `onlyOneImport` `Empty`, error `Alert`, and `Spin`.

3. **`src/pages/tools/DiffViewer.jsx`**
   - Remove `Diff2Html`/`getPrettyHtml`/`setHTML`.
   - Replace the udiff blob **download** (`makeFile`, the `text/plain` Blob, the `.diff` download
     button) with a **JSON download** of the raw `NamesDiff` (`application/json`,
     `dataset{k1}_dataset{k2}.json`). Keep the `DownloadOutlined` button, just change the payload.
   - `empty` state: derive from `diff.identical` (object is never falsy now).
   - Keep all the root/rank/synonyms/authorship controls and the two `DatasetAutocomplete`
     columns unchanged.

### Not in scope
- `src/pages/tools/TaxonComparer/index.jsx` imports `Diff2Html` but never renders a diff (it
  navigates to DiffViewer). Remove its now-unused `Diff2Html` import as trivial cleanup; no
  behavior change.
- Fetching stays **inline** in each call site (as today), to keep the blast radius small. No new
  `src/api/diff.js` module — the three components already own their fetch + query state.
- We do **not** link names to name-search or add navigation from diff rows (YAGNI).

## Testing

- Unit-test `ChangedNameRow`'s chunk→segments logic and `mergeSorted` as pure functions
  (Vitest, no renderer — per repo's `vitest-no-renderer` constraint, test logic/statics only).
- Manual verification in the browser against a dev/staging backend once PR #1546 is deployed
  there: all three pages (sector diff, dataset import diff, diff-viewer tool), plus identical
  and truncated cases.

## Rollout

Frontend change lands on `feature/names-diff-json`, held until backend PR #1546 merges +
deploys, then merged and deployed in lockstep (the API change is breaking).
