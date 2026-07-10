# NamesDiff JSON Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the diff2html/udiff rendering in all three CLB UI diff views with a reusable `NamesDiffView` component that renders the new JSON `NamesDiff` object from backend PR #1546.

**Architecture:** A purely presentational `NamesDiffView` component takes an already-fetched `NamesDiff` object and renders a stats overview plus a Grouped⇆Sorted toggle. Changed names render as an inline word-diff from their `chunks[]`. The three existing pages keep their inline `axios` fetch (now receiving JSON) and swap their diff2html block for `<NamesDiffView diff={data} />`.

**Tech Stack:** React 19, Ant Design 6 (`Segmented`, `Collapse`, `Tag`, `Space`, `Empty`, `Button`), Vitest (pure-logic tests only — no renderer, per repo constraint).

## Global Constraints

- Files containing JSX use `.jsx`; pure-JS helpers/tests use `.js`.
- `op` values serialize **lowercase** (`equal`/`delete`/`insert`) but must be consumed **case-insensitively**.
- Vitest has no renderer in this repo — test only pure functions (`src/components/NamesDiffView/diffRows.js`); verify rendering in the browser.
- New component lives under `src/components/NamesDiffView/`.
- Do NOT add a `src/api/diff.js`; fetching stays inline in each call site.
- Work stays on branch `feature/names-diff-json` (already checked out).

### `NamesDiff` JSON shape (reference for all tasks)

```json
{
  "label1": "dataset_1010#1", "label2": "dataset_1010#2",
  "removed": ["Aus bus L."], "added": ["Xus yus Sm."],
  "changed": [{ "before": "Aus bus L.", "after": "Aus bus L., 1758",
    "chunks": [{"op":"equal","text":"Aus bus L."},{"op":"insert","text":", 1758"}],
    "similarity": 85.0 }],
  "removedCount": 1, "addedCount": 1, "changedCount": 1,
  "truncated": false, "identical": false
}
```

## File Structure

- Create `src/components/NamesDiffView/diffRows.js` — pure helpers `normOp`, `mergeSorted`.
- Create `src/components/NamesDiffView/diffRows.test.js` — Vitest unit tests.
- Create `src/components/NamesDiffView/ChangedNameRow.jsx` — inline word-diff of a chunk list.
- Create `src/components/NamesDiffView/DiffStats.jsx` — the always-on counts bar.
- Create `src/components/NamesDiffView/NamesDiffView.css` — diff colors.
- Create `src/components/NamesDiffView/index.jsx` — `NamesDiffView` (toggle + both views + capping).
- Modify `src/pages/project/SectorDiff/index.jsx`.
- Modify `src/pages/DatasetKey/datasetPageTabs/DatasetImportDiff.jsx`.
- Modify `src/pages/tools/DiffViewer.jsx`.
- Modify `src/pages/tools/TaxonComparer/index.jsx` (remove unused import only).

---

### Task 1: Pure helpers (`diffRows.js`)

**Files:**
- Create: `src/components/NamesDiffView/diffRows.js`
- Test: `src/components/NamesDiffView/diffRows.test.js`

**Interfaces:**
- Produces:
  - `normOp(op: string) => "equal"|"delete"|"insert"|string` — lowercases/trims a chunk op.
  - `mergeSorted(diff: NamesDiff|null) => Array<{ type: "removed"|"added"|"changed", key: string, sortKey: string, value: string|ChangedName }>` — merged, label-sorted rows.

- [ ] **Step 1: Write the failing test**

Create `src/components/NamesDiffView/diffRows.test.js`:

```js
import { describe, it, expect } from "vitest";
import { normOp, mergeSorted } from "./diffRows";

describe("normOp", () => {
  it("lowercases and trims op values (case-insensitive consumption)", () => {
    expect(normOp("INSERT")).toBe("insert");
    expect(normOp(" Delete ")).toBe("delete");
    expect(normOp("equal")).toBe("equal");
  });
  it("returns empty string for nullish", () => {
    expect(normOp(undefined)).toBe("");
    expect(normOp(null)).toBe("");
  });
});

describe("mergeSorted", () => {
  it("returns [] for a nullish diff", () => {
    expect(mergeSorted(null)).toEqual([]);
    expect(mergeSorted(undefined)).toEqual([]);
  });

  it("merges removed/added/changed into one list sorted by label", () => {
    const diff = {
      removed: ["Bus", "Zus"],
      added: ["Aus"],
      changed: [{ before: "Mus", after: "Mus L.", chunks: [] }],
    };
    const rows = mergeSorted(diff);
    expect(rows.map((r) => [r.type, r.sortKey])).toEqual([
      ["added", "Aus"],
      ["removed", "Bus"],
      ["changed", "Mus"],
      ["removed", "Zus"],
    ]);
  });

  it("uses `before` as the sort key and value object for changed rows", () => {
    const changed = { before: "Mus", after: "Mus L.", chunks: [] };
    const rows = mergeSorted({ removed: [], added: [], changed: [changed] });
    expect(rows[0].type).toBe("changed");
    expect(rows[0].sortKey).toBe("Mus");
    expect(rows[0].value).toBe(changed);
  });

  it("tolerates missing arrays", () => {
    expect(mergeSorted({})).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/NamesDiffView/diffRows.test.js`
Expected: FAIL — "Failed to resolve import './diffRows'".

- [ ] **Step 3: Write minimal implementation**

Create `src/components/NamesDiffView/diffRows.js`:

```js
// Normalize a chunk op to lowercase. The backend serializes ops lowercase but
// PR #1546 documents case-insensitive consumption, so guard against casing.
export const normOp = (op) => String(op ?? "").trim().toLowerCase();

// Build a single alphabetically-merged list from a NamesDiff object.
// removed/added rows carry the name string as `value`; changed rows carry the
// ChangedName object and sort by its `before`. Sort uses JS default string
// order (UTF-16 code units) to approximate the backend's C-collation byte order.
export const mergeSorted = (diff) => {
  if (!diff) return [];
  const rows = [];
  (diff.removed || []).forEach((name, i) =>
    rows.push({ type: "removed", key: `r${i}`, sortKey: name, value: name })
  );
  (diff.added || []).forEach((name, i) =>
    rows.push({ type: "added", key: `a${i}`, sortKey: name, value: name })
  );
  (diff.changed || []).forEach((c, i) =>
    rows.push({ type: "changed", key: `c${i}`, sortKey: c?.before ?? "", value: c })
  );
  return rows.sort((x, y) =>
    x.sortKey < y.sortKey ? -1 : x.sortKey > y.sortKey ? 1 : 0
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/NamesDiffView/diffRows.test.js`
Expected: PASS (2 describe blocks, all cases green).

- [ ] **Step 5: Commit**

```bash
git add src/components/NamesDiffView/diffRows.js src/components/NamesDiffView/diffRows.test.js
git commit -m "feat(diff): pure helpers for NamesDiff merge + op normalization"
```

---

### Task 2: `ChangedNameRow` (inline word-diff) + CSS

**Files:**
- Create: `src/components/NamesDiffView/ChangedNameRow.jsx`
- Create: `src/components/NamesDiffView/NamesDiffView.css`

**Interfaces:**
- Consumes: `normOp` from `./diffRows`.
- Produces: default export `ChangedNameRow` — props `{ chunks: Array<{op,text}> }`. Renders inline `<span>`s only (no wrapping block); caller supplies the row container. `delete`→`.namesdiff-del`, `insert`→`.namesdiff-ins`, `equal`→unstyled.

- [ ] **Step 1: Create the CSS**

Create `src/components/NamesDiffView/NamesDiffView.css`:

```css
.namesdiff-row {
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}
.namesdiff-prefix {
  display: inline-block;
  width: 1.4em;
  opacity: 0.6;
  user-select: none;
}
.namesdiff-removed { color: #cf1322; }
.namesdiff-added { color: #389e0d; }
.namesdiff-del {
  color: #cf1322;
  text-decoration: line-through;
  background: #fff1f0;
}
.namesdiff-ins {
  color: #389e0d;
  text-decoration: underline;
  background: #f6ffed;
}
.namesdiff-showall { display: inline-block; margin-top: 4px; }
```

- [ ] **Step 2: Write the component**

Create `src/components/NamesDiffView/ChangedNameRow.jsx`:

```jsx
import { normOp } from "./diffRows";

// Render a changed name's chunks inline: equal text plain, delete text
// red+strikethrough, insert text green+underline. Op is matched case-insensitively.
const opClass = { delete: "namesdiff-del", insert: "namesdiff-ins" };

const ChangedNameRow = ({ chunks = [] }) =>
  chunks.map((chunk, i) => {
    const cls = opClass[normOp(chunk.op)];
    return (
      <span key={i} className={cls}>
        {chunk.text}
      </span>
    );
  });

export default ChangedNameRow;
```

- [ ] **Step 3: Verify it compiles (imports resolve)**

Run: `npx vitest run src/components/NamesDiffView/diffRows.test.js`
Expected: PASS (unchanged; confirms `normOp` import path used by the component is valid). Visual verification of the component happens in Task 7's browser check.

- [ ] **Step 4: Commit**

```bash
git add src/components/NamesDiffView/ChangedNameRow.jsx src/components/NamesDiffView/NamesDiffView.css
git commit -m "feat(diff): ChangedNameRow inline word-diff renderer + styles"
```

---

### Task 3: `DiffStats` overview bar

**Files:**
- Create: `src/components/NamesDiffView/DiffStats.jsx`

**Interfaces:**
- Produces: default export `DiffStats` — props `{ diff: NamesDiff }`. Renders three antd `Tag`s (Removed red, Added green, Changed gold) using `*Count` (falling back to array length), plus a `warning` Tag when `diff.truncated`. Returns `null` for a nullish diff.

- [ ] **Step 1: Write the component**

Create `src/components/NamesDiffView/DiffStats.jsx`:

```jsx
import { Space, Tag } from "antd";

const DiffStats = ({ diff }) => {
  if (!diff) return null;
  const removed = diff.removedCount ?? diff.removed?.length ?? 0;
  const added = diff.addedCount ?? diff.added?.length ?? 0;
  const changed = diff.changedCount ?? diff.changed?.length ?? 0;
  return (
    <Space wrap>
      <Tag color="red">Removed −{removed}</Tag>
      <Tag color="green">Added +{added}</Tag>
      <Tag color="gold">Changed ~{changed}</Tag>
      {diff.truncated && (
        <Tag color="warning">Truncated — showing a partial diff</Tag>
      )}
    </Space>
  );
};

export default DiffStats;
```

- [ ] **Step 2: Verify build resolves**

Run: `npx vitest run src/components/NamesDiffView/diffRows.test.js`
Expected: PASS (no test for JSX; this confirms nothing else broke). Visual check in Task 7.

- [ ] **Step 3: Commit**

```bash
git add src/components/NamesDiffView/DiffStats.jsx
git commit -m "feat(diff): DiffStats overview bar with counts + truncated warning"
```

---

### Task 4: `NamesDiffView` (toggle, both views, row cap)

**Files:**
- Create: `src/components/NamesDiffView/index.jsx`

**Interfaces:**
- Consumes: `DiffStats`, `ChangedNameRow`, `mergeSorted`, `NamesDiffView.css`.
- Produces: default export `NamesDiffView` — props `{ diff: NamesDiff|null, defaultView?: "grouped"|"sorted" }`. Renders nothing for nullish diff; `Empty` "No differences" when identical/all-empty; otherwise stats + `Segmented` toggle + Grouped (`Collapse`) or Sorted (merged list). Each list capped at 500 rows with a "Show all N" `Button`.

- [ ] **Step 1: Write the component**

Create `src/components/NamesDiffView/index.jsx`:

```jsx
import { useState } from "react";
import { Segmented, Collapse, Empty, Button } from "antd";
import DiffStats from "./DiffStats";
import ChangedNameRow from "./ChangedNameRow";
import { mergeSorted } from "./diffRows";
import "./NamesDiffView.css";

const ROW_CAP = 500;

// Render at most ROW_CAP items, with a "Show all N" toggle for the remainder.
const CappedList = ({ items, renderItem }) => {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? items : items.slice(0, ROW_CAP);
  return (
    <>
      {shown.map(renderItem)}
      {!showAll && items.length > ROW_CAP && (
        <Button
          type="link"
          className="namesdiff-showall"
          onClick={() => setShowAll(true)}
        >
          Show all {items.length}
        </Button>
      )}
    </>
  );
};

const plainRow = (type, prefix) => (name, i) => (
  <div key={`${type}${i}`} className={`namesdiff-row namesdiff-${type}`}>
    <span className="namesdiff-prefix">{prefix}</span>
    {name}
  </div>
);

const changedRow = (chunks, key) => (
  <div key={key} className="namesdiff-row namesdiff-changed">
    <span className="namesdiff-prefix">~</span>
    <ChangedNameRow chunks={chunks} />
  </div>
);

const NamesDiffView = ({ diff, defaultView = "grouped" }) => {
  const [view, setView] = useState(defaultView);
  if (!diff) return null;

  const removed = diff.removed || [];
  const added = diff.added || [];
  const changed = diff.changed || [];
  const identical =
    diff.identical ??
    (removed.length === 0 && added.length === 0 && changed.length === 0);

  if (identical) return <Empty description="No differences" />;

  const groupedItems = [
    removed.length > 0 && {
      key: "removed",
      label: `Removed (${removed.length})`,
      children: <CappedList items={removed} renderItem={plainRow("removed", "−")} />,
    },
    added.length > 0 && {
      key: "added",
      label: `Added (${added.length})`,
      children: <CappedList items={added} renderItem={plainRow("added", "+")} />,
    },
    changed.length > 0 && {
      key: "changed",
      label: `Changed (${changed.length})`,
      children: (
        <CappedList
          items={changed}
          renderItem={(c, i) => changedRow(c.chunks, `c${i}`)}
        />
      ),
    },
  ].filter(Boolean);

  const sortedRows = mergeSorted(diff);
  const renderSortedRow = (row) =>
    row.type === "changed"
      ? changedRow(row.value.chunks, row.key)
      : plainRow(row.type, row.type === "removed" ? "−" : "+")(row.value, row.key);

  return (
    <div className="namesdiff">
      <DiffStats diff={diff} />
      <Segmented
        style={{ margin: "8px 0" }}
        value={view}
        onChange={setView}
        options={[
          { label: "Grouped", value: "grouped" },
          { label: "Sorted", value: "sorted" },
        ]}
      />
      {view === "grouped" ? (
        <Collapse
          defaultActiveKey={groupedItems.map((i) => i.key)}
          items={groupedItems}
        />
      ) : (
        <CappedList items={sortedRows} renderItem={renderSortedRow} />
      )}
    </div>
  );
};

export default NamesDiffView;
```

Note: `plainRow(type, prefix)` returns a `(item, index) => element` function. In the Sorted branch we call it immediately with `(row.value, row.key)` — `row.key` is a stable string, satisfying React's key requirement.

- [ ] **Step 2: Verify build resolves**

Run: `npx vitest run src/components/NamesDiffView/diffRows.test.js`
Expected: PASS (still green; confirms the module graph imports cleanly).

- [ ] **Step 3: Commit**

```bash
git add src/components/NamesDiffView/index.jsx
git commit -m "feat(diff): NamesDiffView with grouped/sorted toggle and row cap"
```

---

### Task 5: Wire `SectorDiff` to `NamesDiffView`

**Files:**
- Modify: `src/pages/project/SectorDiff/index.jsx`

**Interfaces:**
- Consumes: `NamesDiffView` default export from `../../../components/NamesDiffView`.

- [ ] **Step 1: Remove diff2html imports**

In `src/pages/project/SectorDiff/index.jsx`, delete these two lines (currently 8–9):

```jsx
import { Diff2Html } from "diff2html";
import "diff2html/dist/diff2html.min.css";
```

Add, after the other component imports (e.g. below the `withContext` import on line 12):

```jsx
import NamesDiffView from "../../../components/NamesDiffView";
```

- [ ] **Step 2: Remove the html + parsingError computation**

Delete the `parsingError` state line (currently 26):

```jsx
  const [parsingError, setParsingError] = useState(null);
```

Delete the whole `const diff = data; let html; ...` block (currently 66–79):

```jsx
  const diff = data;
  let html;
  if (diff) {
    try {
      html = Diff2Html.getPrettyHtml(diff, {
        inputFormat: "diff",
        showFiles: false,
        matching: "lines",
        outputFormat: "side-by-side",
      });
    } catch (err) {
      setParsingError(err);
    }
  }
```

- [ ] **Step 3: Replace the summary Tags column and the html/identical render**

Delete the summary `Col` block (currently 126–139):

```jsx
          {_.get(data, "summary") && (
            <Col span={6}>
              {!isNaN(_.get(data, "summary.DELETE")) && (
                <Tag color="red">
                  Deleted: {_.get(data, "summary.DELETE")}
                </Tag>
              )}
              {!isNaN(_.get(data, "summary.INSERT")) && (
                <Tag color="green">
                  Inserted: {_.get(data, "summary.INSERT")}
                </Tag>
              )}
            </Col>
          )}
```

Delete the html render and the identical Alert (currently 146–152):

```jsx
        {html && <div dangerouslySetInnerHTML={{ __html: html }} />}

        {_.get(data, "identical") && (
          <Row style={{ marginBottom: "8px" }}>
            <Alert title="No diff between sync attempts" />
          </Row>
        )}
```

In their place (after the error `Row`, still inside `<PageContent>`), add:

```jsx
        {data && <NamesDiffView diff={data} />}
```

- [ ] **Step 4: Drop the now-unused `Tag` import**

`Tag` is no longer used. Change the antd import (currently line 5) from:

```jsx
import { Row, Col, Select, Alert, Tag } from "antd";
```

to:

```jsx
import { Row, Col, Select, Alert } from "antd";
```

- [ ] **Step 5: Smoke-test (no crash against current prod API)**

Run: `npm start` and open `http://localhost:3000` → navigate to a project sector's Names diff (`/project/<projectKey>/sync/<sectorKey>/diff?attempts=n-1..n`).
Expected: page renders without a JS error. Against the **current** prod API (still udiff text) the object shape is absent, so `NamesDiffView` shows "No differences" — that is the intended graceful fallback until PR #1546 deploys. Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add src/pages/project/SectorDiff/index.jsx
git commit -m "feat(diff): render sector diff via NamesDiffView"
```

---

### Task 6: Wire `DatasetImportDiff` to `NamesDiffView`

**Files:**
- Modify: `src/pages/DatasetKey/datasetPageTabs/DatasetImportDiff.jsx`

**Interfaces:**
- Consumes: `NamesDiffView` default export from `../../../components/NamesDiffView`.

- [ ] **Step 1: Swap imports**

Delete these two lines (currently 8–9):

```jsx
import { Diff2Html } from "diff2html";
import "diff2html/dist/diff2html.min.css";
```

Add, near the other component imports (e.g. after line 7):

```jsx
import NamesDiffView from "../../../components/NamesDiffView";
```

- [ ] **Step 2: Remove the html computation**

Delete the `const diff = data; let html; ...` block (currently 127–140):

```jsx
  const diff = data;
  let html;
  if (diff) {
    try {
      html = Diff2Html.getPrettyHtml(diff, {
        inputFormat: "diff",
        showFiles: false,
        matching: "lines",
        outputFormat: "side-by-side",
      });
    } catch (parsingError) {
      // ignore parse errors in render
    }
  }
```

- [ ] **Step 3: Replace the html render and the string-empty check**

Delete the html render line (currently 205):

```jsx
      {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
```

Delete the `{data === ""}` empty block (currently 215–223):

```jsx
      {data === "" && (
        <Row style={{ marginTop: "40px" }}>
          <Col flex="auto"></Col>
          <Col>
            <Empty description="No diff between import attempts" />
          </Col>
          <Col flex="auto"></Col>
        </Row>
      )}
```

In place of the deleted html render line (after `{onlyOneImport && ...}` and the error `Row`), add:

```jsx
      {data && !loading && <NamesDiffView diff={data} />}
```

(`NamesDiffView` renders its own `Empty` "No differences" when the two attempts are identical, replacing the old `data === ""` branch.)

- [ ] **Step 4: Smoke-test**

Run: `npm start`, open a dataset with ≥2 finished imports → the "diff" tab (`/dataset/<key>/diff?attempts=1..2`).
Expected: no JS error; graceful "No differences" against current prod API. Stop the server when done.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DatasetKey/datasetPageTabs/DatasetImportDiff.jsx
git commit -m "feat(diff): render dataset import diff via NamesDiffView"
```

---

### Task 7: Wire `DiffViewer` (JSON download) + `TaxonComparer` cleanup

**Files:**
- Modify: `src/pages/tools/DiffViewer.jsx`
- Modify: `src/pages/tools/TaxonComparer/index.jsx`

**Interfaces:**
- Consumes: `NamesDiffView` default export from `../../components/NamesDiffView`.

- [ ] **Step 1: Swap imports in DiffViewer**

Delete these two lines (currently 24–25):

```jsx
import { Diff2Html } from "diff2html";
import "diff2html/dist/diff2html.min.css";
```

Add, after the `PageContent` import (line 22) or near the other component imports:

```jsx
import NamesDiffView from "../../components/NamesDiffView";
```

- [ ] **Step 2: Add object state alongside the download-URL state**

The existing `diff` state holds the download **object URL**. Add a separate state for the parsed object. Change (currently 36–37):

```jsx
  const [html, setHTML] = useState(null);
  const [diff, setDiff] = useState(null);
```

to:

```jsx
  const [diffData, setDiffData] = useState(null);
  const [diff, setDiff] = useState(null); // object URL for the JSON download
```

(`html`/`setHTML` are removed.)

- [ ] **Step 3: Rework `getData` to store the object + build a JSON blob**

Replace the body from the `axios` call through `setHTML(html);` (currently 116–131):

```jsx
    try {
      const { data: diff } = await axios(
        `${config.dataApi}dataset/${datasetKey1}/diff/${datasetKey2}${search}${minRank ? "&minRank=" + minRank : ""}${rankFilter ? "&rankFilter=" + rankFilter : ""}${synonyms ? "&synonyms=true" : ""}${showParent ? "&showParent=true" : ""}${showParent ? "&parentRank=" + parentRank : ""}${!authorship ? "&authorship=false" : ""}`
      );
      let html;
      if (!diff) {
        setEmpty(true)
      }
      makeFile(diff);
      html = Diff2Html.getPrettyHtml(diff, {
        inputFormat: "diff",
        showFiles: false,
        matching: "lines",
        outputFormat: "side-by-side",
      });
      setHTML(html);
    } catch (error) {
      addError(error);
      setHTML(null);
    }
```

with:

```jsx
    try {
      const { data } = await axios(
        `${config.dataApi}dataset/${datasetKey1}/diff/${datasetKey2}${search}${minRank ? "&minRank=" + minRank : ""}${rankFilter ? "&rankFilter=" + rankFilter : ""}${synonyms ? "&synonyms=true" : ""}${showParent ? "&showParent=true" : ""}${showParent ? "&parentRank=" + parentRank : ""}${!authorship ? "&authorship=false" : ""}`
      );
      const isEmpty =
        !data ||
        data.identical ||
        ((data.removed?.length ?? 0) === 0 &&
          (data.added?.length ?? 0) === 0 &&
          (data.changed?.length ?? 0) === 0);
      setEmpty(isEmpty);
      setDiffData(data);
      makeFile(data);
    } catch (error) {
      addError(error);
      setDiffData(null);
    }
```

- [ ] **Step 4: Make the download a JSON blob**

Replace `makeFile` (currently 139–149):

```jsx
  const makeFile = function (text) {
    var data = new Blob([text], { type: "text/plain" });

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (diff !== null) {
      setDiff(null);
      window.URL.revokeObjectURL(diff);
    }
    return setDiff(window.URL.createObjectURL(data));
  };
```

with:

```jsx
  const makeFile = function (obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
      type: "application/json",
    });
    // Revoke the previous object URL to avoid leaking it.
    if (diff !== null) {
      setDiff(null);
      window.URL.revokeObjectURL(diff);
    }
    return setDiff(window.URL.createObjectURL(blob));
  };
```

- [ ] **Step 5: Update `resetAll` and the download filename, and render `NamesDiffView`**

In `resetAll` (currently ~81–95), replace `setHTML(null);` with `setDiffData(null);` (the first line inside `resetAll`):

```jsx
  const resetAll = () => {
    setDiffData(null);
    setDiff(null);
    setEmpty(false);
```

Change the download button's filename (currently 265) from:

```jsx
                download={`dataset${datasetKey1}_dataset${datasetKey2}.diff`}
```

to:

```jsx
                download={`dataset${datasetKey1}_dataset${datasetKey2}.json`}
```

Replace the html render line (currently 411):

```jsx
        {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
```

with:

```jsx
        {diffData && !empty && <NamesDiffView diff={diffData} />}
```

- [ ] **Step 6: Remove the unused Diff2Html import in TaxonComparer**

In `src/pages/tools/TaxonComparer/index.jsx`, delete the two unused lines (currently 24–25):

```jsx
import { Diff2Html } from "diff2html";
import "diff2html/dist/diff2html.min.css";
```

- [ ] **Step 7: Confirm diff2html is fully unreferenced**

Run: `grep -rn "diff2html\|Diff2Html" src`
Expected: no matches (the dependency is now dead; leaving it in `package.json` is fine for this branch).

- [ ] **Step 8: Smoke-test both tools**

Run: `npm start`.
- Open `/tools/diff-viewer`, pick two datasets + roots, "Get Diff". Against current prod API expect graceful "No diff" (udiff text is not the new object). Confirm no JS error and the download button (when a diff object exists) offers a `.json` file.
- Open `/tools/taxon-comparer` and confirm it still loads and its "Show diff" button navigates to the diff viewer.
Stop the server when done.

- [ ] **Step 9: Run the full unit suite**

Run: `npx vitest run src/components/NamesDiffView`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/pages/tools/DiffViewer.jsx src/pages/tools/TaxonComparer/index.jsx
git commit -m "feat(diff): render dataset-to-dataset diff via NamesDiffView, JSON download"
```

---

## Verification summary

- **Automated:** `npx vitest run src/components/NamesDiffView` (pure helpers).
- **Smoke (current prod API):** all three pages render without JS errors, showing graceful "No differences" because the live API still returns udiff text.
- **Full functional verification is deferred** until backend PR #1546 is deployed to a reachable environment (dev/staging). At that point re-check the three pages against real JSON: grouped/sorted toggle, changed word-diff highlighting, truncated warning, and the DiffViewer `.json` download. This branch is held and merged in lockstep with the API change.
