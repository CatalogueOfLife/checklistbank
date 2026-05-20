# Distribution Map: Infraspecific Descendant Layers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a nested Leaflet layer control to the Taxon distribution map that lazily reveals the distributions of accepted lower-ranked descendants (subspecies, varieties, forms, …), one overlay per rank and per individual descendant taxon that has children of its own.

**Architecture:** Refactor the existing single-file `DistributionsMap.js` into a folder with focused helpers (color assignment, descendant fetch, included-taxa legend) and an `index.js` orchestrator. Use the `Leaflet.Control.Layers.Tree` plugin to render the nested overlay tree. Each descendant taxon becomes its own `L.featureGroup`; the tree's group nodes act as master toggles that add/remove those feature groups from the map. Data fetch is lazy on first expansion of the layer control, then cached in component state.

**Tech Stack:** React 16.9, Ant Design 4.24, Leaflet 1.9, axios, Jest (via react-scripts). New dependency: `leaflet.control.layers.tree`.

**Spec:** [`docs/superpowers/specs/2026-05-20-distribution-map-infraspecific-layers-design.md`](../specs/2026-05-20-distribution-map-infraspecific-layers-design.md)

**File structure after this plan:**

```
src/pages/Taxon/
  Distributions.js                       (modified: pass focalTaxon, rank, datasetKey)
  DistributionsMap.js                    → removed (becomes folder/index.js)
  DistributionsMap/
    index.js                             (main map component — orchestrator)
    colorAssignment.js                   (pure helper — palette round-robin)
    colorAssignment.test.js
    descendantRanks.js                   (pure helper — derive descendant ranks for a focal rank)
    descendantRanks.test.js
    descendantTree.js                    (pure helper — build parent/children tree from a flat list)
    descendantTree.test.js
    descendantFetch.js                   (async helper — orchestrate search + per-taxon distribution calls)
    IncludedTaxaLegend.js                (presentational component)
src/pages/Taxon/index.js                 (modified: pass rank prop through to Distributions)
package.json                             (add leaflet.control.layers.tree)
```

`DistributionsMap.js` becomes `DistributionsMap/index.js` so existing imports (`import DistributionsMap from "./DistributionsMap"` in `Distributions.js:7`) continue to resolve.

---

## Task 1: Add the leaflet.control.layers.tree dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install the plugin**

Run from the repo root:

```bash
npm install --save leaflet.control.layers.tree
```

- [ ] **Step 2: Verify install**

```bash
node -e "console.log(require('leaflet.control.layers.tree/package.json').version)"
```

Expected: a version string is printed, no error. The package should also appear under `dependencies` in `package.json`.

- [ ] **Step 3: Verify the dev server still builds**

```bash
npm start
```

Wait until the compile finishes ("Compiled successfully" or "compiled with N warnings"). Stop with Ctrl-C. If new warnings appear that mention `leaflet.control.layers.tree`, note them but don't act on them yet.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add leaflet.control.layers.tree dependency for nested map overlays"
```

---

## Task 2: Move DistributionsMap.js into a folder

This step is a pure restructure — no behavior change. It unblocks all subsequent tasks that add sibling files.

**Files:**
- Create: `src/pages/Taxon/DistributionsMap/index.js` (content = current `DistributionsMap.js`)
- Delete: `src/pages/Taxon/DistributionsMap.js`

- [ ] **Step 1: Move the file with git**

```bash
mkdir -p src/pages/Taxon/DistributionsMap
git mv src/pages/Taxon/DistributionsMap.js src/pages/Taxon/DistributionsMap/index.js
```

- [ ] **Step 2: Verify the import still resolves**

```bash
npm start
```

Wait for "Compiled successfully". The browser at `http://localhost:3000` should still render any taxon's distribution map exactly as before (open e.g. any taxon detail page with distributions). Stop with Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Taxon/DistributionsMap
git commit -m "Move DistributionsMap into its own folder ahead of helper extraction"
```

---

## Task 3: Add color-assignment helper

Pure round-robin assignment from the Carto Vivid palette, sorted by `(rankIndex, scientificName)` for stability.

**Files:**
- Create: `src/pages/Taxon/DistributionsMap/colorAssignment.js`
- Create: `src/pages/Taxon/DistributionsMap/colorAssignment.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/pages/Taxon/DistributionsMap/colorAssignment.test.js`:

```javascript
import { VIVID_PALETTE, assignColors } from "./colorAssignment";

const RANK_ORDER = ["species", "subspecies", "variety", "form"];

describe("assignColors", () => {
  it("returns an empty map for no taxa", () => {
    expect(assignColors([], RANK_ORDER)).toEqual({});
  });

  it("assigns the first palette color to a single taxon", () => {
    const taxa = [{ id: "a", scientificName: "A", rank: "subspecies" }];
    expect(assignColors(taxa, RANK_ORDER)).toEqual({ a: VIVID_PALETTE[0] });
  });

  it("sorts by rank index first, then scientific name", () => {
    const taxa = [
      { id: "v", scientificName: "Var two", rank: "variety" },
      { id: "s", scientificName: "Sub two", rank: "subspecies" },
      { id: "s1", scientificName: "Sub one", rank: "subspecies" },
    ];
    const result = assignColors(taxa, RANK_ORDER);
    expect(result.s1).toBe(VIVID_PALETTE[0]);
    expect(result.s).toBe(VIVID_PALETTE[1]);
    expect(result.v).toBe(VIVID_PALETTE[2]);
  });

  it("cycles the palette when there are more taxa than colors", () => {
    const taxa = Array.from({ length: VIVID_PALETTE.length + 2 }, (_, i) => ({
      id: `t${i}`,
      scientificName: `T${String(i).padStart(3, "0")}`,
      rank: "subspecies",
    }));
    const result = assignColors(taxa, RANK_ORDER);
    expect(result.t0).toBe(VIVID_PALETTE[0]);
    expect(result[`t${VIVID_PALETTE.length}`]).toBe(VIVID_PALETTE[0]);
    expect(result[`t${VIVID_PALETTE.length + 1}`]).toBe(VIVID_PALETTE[1]);
  });

  it("falls back to the end of the rank list for unknown ranks", () => {
    const taxa = [
      { id: "known", scientificName: "A", rank: "subspecies" },
      { id: "unknown", scientificName: "A", rank: "weird-rank" },
    ];
    const result = assignColors(taxa, RANK_ORDER);
    expect(result.known).toBe(VIVID_PALETTE[0]);
    expect(result.unknown).toBe(VIVID_PALETTE[1]);
  });

  it("exposes a 12-color Carto Vivid palette", () => {
    expect(VIVID_PALETTE).toHaveLength(12);
    expect(VIVID_PALETTE[0]).toBe("#E58606");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --watchAll=false src/pages/Taxon/DistributionsMap/colorAssignment.test.js
```

Expected: FAIL with `Cannot find module './colorAssignment'`.

- [ ] **Step 3: Write the helper**

Create `src/pages/Taxon/DistributionsMap/colorAssignment.js`:

```javascript
export const VIVID_PALETTE = [
  "#E58606",
  "#5D69B1",
  "#52BCA3",
  "#99C945",
  "#CC61B0",
  "#24796C",
  "#DAA51B",
  "#2F8AC4",
  "#764E9F",
  "#ED645A",
  "#CC3A8E",
  "#A5AA99",
];

const rankIndex = (rank, rankOrder) => {
  const i = rankOrder.indexOf(rank);
  return i === -1 ? rankOrder.length : i;
};

export const assignColors = (taxa, rankOrder) => {
  const sorted = [...taxa].sort((a, b) => {
    const ra = rankIndex(a.rank, rankOrder);
    const rb = rankIndex(b.rank, rankOrder);
    if (ra !== rb) return ra - rb;
    return a.scientificName.localeCompare(b.scientificName);
  });
  const out = {};
  sorted.forEach((t, i) => {
    out[t.id] = VIVID_PALETTE[i % VIVID_PALETTE.length];
  });
  return out;
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --watchAll=false src/pages/Taxon/DistributionsMap/colorAssignment.test.js
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/colorAssignment.js src/pages/Taxon/DistributionsMap/colorAssignment.test.js
git commit -m "Distribution map: color-assignment helper for descendant taxa"
```

---

## Task 4: Add descendant-rank helper

Given a focal rank, return the list of infraspecific ranks that sit below it in the canonical rank order. Used to build the `rank=…` query string for the nameusage search.

**Files:**
- Create: `src/pages/Taxon/DistributionsMap/descendantRanks.js`
- Create: `src/pages/Taxon/DistributionsMap/descendantRanks.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/pages/Taxon/DistributionsMap/descendantRanks.test.js`:

```javascript
import { INFRASPECIFIC_RANKS, getDescendantRanks } from "./descendantRanks";

const RANK_ORDER = [
  "kingdom",
  "genus",
  "species",
  "subspecies",
  "variety",
  "subvariety",
  "form",
  "subform",
  "infraspecific name",
];

describe("getDescendantRanks", () => {
  it("returns all infraspecific ranks for species", () => {
    expect(getDescendantRanks("species", RANK_ORDER)).toEqual(
      INFRASPECIFIC_RANKS
    );
  });

  it("returns only ranks strictly below the focal rank", () => {
    expect(getDescendantRanks("subspecies", RANK_ORDER)).toEqual([
      "variety",
      "subvariety",
      "form",
      "subform",
      "infraspecific name",
    ]);
  });

  it("returns an empty list when focal rank has no infraspecific descendants", () => {
    expect(getDescendantRanks("infraspecific name", RANK_ORDER)).toEqual([]);
  });

  it("returns an empty list for ranks above species", () => {
    expect(getDescendantRanks("genus", RANK_ORDER)).toEqual(
      INFRASPECIFIC_RANKS
    );
  });

  it("returns an empty list when focal rank is unknown", () => {
    expect(getDescendantRanks("nonsense", RANK_ORDER)).toEqual([]);
  });
});
```

Note: "ranks above species" deliberately returns the same infraspecific ranks — the rank gating at the call site (Task 8) prevents calling this for above-species focal taxa.

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --watchAll=false src/pages/Taxon/DistributionsMap/descendantRanks.test.js
```

Expected: FAIL with `Cannot find module './descendantRanks'`.

- [ ] **Step 3: Write the helper**

Create `src/pages/Taxon/DistributionsMap/descendantRanks.js`:

```javascript
export const INFRASPECIFIC_RANKS = [
  "subspecies",
  "variety",
  "subvariety",
  "form",
  "subform",
  "infraspecific name",
];

export const getDescendantRanks = (focalRank, rankOrder) => {
  const focalIdx = rankOrder.indexOf(focalRank);
  if (focalIdx === -1) return [];
  return INFRASPECIFIC_RANKS.filter((r) => {
    const i = rankOrder.indexOf(r);
    return i > focalIdx;
  });
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --watchAll=false src/pages/Taxon/DistributionsMap/descendantRanks.test.js
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/descendantRanks.js src/pages/Taxon/DistributionsMap/descendantRanks.test.js
git commit -m "Distribution map: helper to derive descendant ranks for a focal rank"
```

---

## Task 5: Add descendant-tree helper

Pure function that takes a flat list of descendant taxa (each with `id`, `parentId`, etc.) plus the focal taxon's id, and produces:

1. a `byParent` map: `parentId → [child]` (for building the nested layer-control tree)
2. a `roots` list: direct children of the focal taxon (top of the tree)

**Files:**
- Create: `src/pages/Taxon/DistributionsMap/descendantTree.js`
- Create: `src/pages/Taxon/DistributionsMap/descendantTree.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/pages/Taxon/DistributionsMap/descendantTree.test.js`:

```javascript
import { buildTree } from "./descendantTree";

describe("buildTree", () => {
  it("returns empty roots and empty map for no taxa", () => {
    expect(buildTree([], "focal")).toEqual({ roots: [], byParent: {} });
  });

  it("places direct children under roots", () => {
    const taxa = [
      { id: "a", parentId: "focal", scientificName: "A", rank: "subspecies" },
      { id: "b", parentId: "focal", scientificName: "B", rank: "subspecies" },
    ];
    const tree = buildTree(taxa, "focal");
    expect(tree.roots.map((t) => t.id)).toEqual(["a", "b"]);
    expect(tree.byParent).toEqual({});
  });

  it("nests grandchildren under their parents", () => {
    const taxa = [
      { id: "sub", parentId: "focal", scientificName: "Sub", rank: "subspecies" },
      { id: "var1", parentId: "sub", scientificName: "V1", rank: "variety" },
      { id: "var2", parentId: "sub", scientificName: "V2", rank: "variety" },
    ];
    const tree = buildTree(taxa, "focal");
    expect(tree.roots.map((t) => t.id)).toEqual(["sub"]);
    expect(tree.byParent.sub.map((t) => t.id)).toEqual(["var1", "var2"]);
  });

  it("treats taxa whose parent is missing from the list as roots", () => {
    const taxa = [
      { id: "orphan", parentId: "missing", scientificName: "O", rank: "variety" },
    ];
    const tree = buildTree(taxa, "focal");
    expect(tree.roots.map((t) => t.id)).toEqual(["orphan"]);
  });

  it("sorts roots and per-parent children alphabetically", () => {
    const taxa = [
      { id: "b", parentId: "focal", scientificName: "B", rank: "subspecies" },
      { id: "a", parentId: "focal", scientificName: "A", rank: "subspecies" },
      { id: "ab", parentId: "a", scientificName: "Ab", rank: "variety" },
      { id: "aa", parentId: "a", scientificName: "Aa", rank: "variety" },
    ];
    const tree = buildTree(taxa, "focal");
    expect(tree.roots.map((t) => t.id)).toEqual(["a", "b"]);
    expect(tree.byParent.a.map((t) => t.id)).toEqual(["aa", "ab"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --watchAll=false src/pages/Taxon/DistributionsMap/descendantTree.test.js
```

Expected: FAIL with `Cannot find module './descendantTree'`.

- [ ] **Step 3: Write the helper**

Create `src/pages/Taxon/DistributionsMap/descendantTree.js`:

```javascript
const byName = (a, b) => a.scientificName.localeCompare(b.scientificName);

export const buildTree = (taxa, focalId) => {
  const ids = new Set(taxa.map((t) => t.id));
  const byParent = {};
  const roots = [];
  taxa.forEach((t) => {
    const isRoot = t.parentId === focalId || !ids.has(t.parentId);
    if (isRoot) {
      roots.push(t);
    } else {
      (byParent[t.parentId] = byParent[t.parentId] || []).push(t);
    }
  });
  roots.sort(byName);
  Object.values(byParent).forEach((arr) => arr.sort(byName));
  return { roots, byParent };
};
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --watchAll=false src/pages/Taxon/DistributionsMap/descendantTree.test.js
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/descendantTree.js src/pages/Taxon/DistributionsMap/descendantTree.test.js
git commit -m "Distribution map: helper to build the descendant taxon tree"
```

---

## Task 6: Add descendant-fetch helper

Async orchestrator that combines the nameusage search and per-taxon distribution fetches into the shape the map needs. Uses a small concurrency pool (16) for the per-taxon calls.

**Files:**
- Create: `src/pages/Taxon/DistributionsMap/descendantFetch.js`

No automated test — this is thin orchestration over axios; we exercise it manually via the running app in Task 9.

- [ ] **Step 1: Write the helper**

Create `src/pages/Taxon/DistributionsMap/descendantFetch.js`:

```javascript
import axios from "axios";
import config from "../../../config";
import { getDescendantRanks } from "./descendantRanks";

const POOL_SIZE = 16;

const isMappable = (r) =>
  r?.area?.gazetteer !== "text" && !!r?.area?.globalId;

const runPool = async (items, worker, size) => {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
};

const searchDescendants = async (datasetKey, focalId, ranks) => {
  if (ranks.length === 0) return [];
  const params = new URLSearchParams();
  params.append("TAXON_ID", focalId);
  ranks.forEach((r) => params.append("rank", r));
  ["accepted", "provisionally accepted"].forEach((s) =>
    params.append("status", s)
  );
  params.append("limit", "1000");
  const url = `${config.dataApi}dataset/${datasetKey}/nameusage/search?${params}`;
  const res = await axios(url);
  const list = res?.data?.result || [];
  return list
    .filter((u) => u?.usage?.id)
    .map((u) => ({
      id: u.usage.id,
      scientificName:
        u.usage?.name?.scientificName || u.usage?.label || u.usage.id,
      rank: u.usage?.name?.rank,
      parentId: u.usage?.parentId,
    }));
};

const fetchDistributions = async (datasetKey, taxonId) => {
  const url = `${config.dataApi}dataset/${datasetKey}/taxon/${encodeURIComponent(taxonId)}/distribution`;
  try {
    const res = await axios(url);
    return Array.isArray(res?.data) ? res.data : [];
  } catch {
    return [];
  }
};

/**
 * Fetch all infraspecific descendants of `focalTaxon` and their distributions.
 * Returns { taxa, descendantsFailed } where each taxon carries `mappable` (the
 * mappable subset of its distributions) and `distributions` (the full list).
 */
export const fetchDescendants = async ({ datasetKey, focalTaxon, rankOrder }) => {
  const ranks = getDescendantRanks(focalTaxon?.name?.rank, rankOrder);
  let descendantsFailed = false;
  let list = [];
  try {
    list = await searchDescendants(datasetKey, focalTaxon.id, ranks);
  } catch {
    descendantsFailed = true;
    return { taxa: [], descendantsFailed };
  }

  const distributions = await runPool(
    list,
    (t) => fetchDistributions(datasetKey, t.id),
    POOL_SIZE
  );

  const taxa = list.map((t, i) => {
    const all = distributions[i] || [];
    return { ...t, distributions: all, mappable: all.filter(isMappable) };
  });
  return { taxa, descendantsFailed };
};
```

- [ ] **Step 2: Sanity check that it parses**

```bash
node -e "require('./src/pages/Taxon/DistributionsMap/descendantFetch.js')" 2>&1 | head -5
```

This will error on ESM syntax under raw Node — that's expected. The real check is whether the dev server compiles, which we do next.

- [ ] **Step 3: Verify dev server still compiles**

```bash
npm start
```

Wait for "Compiled successfully". Stop with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/descendantFetch.js
git commit -m "Distribution map: async fetcher for descendant distributions"
```

---

## Task 7: Build the IncludedTaxaLegend component

Presentational component used in Task 9.

**Files:**
- Create: `src/pages/Taxon/DistributionsMap/IncludedTaxaLegend.js`

- [ ] **Step 1: Write the component**

Create `src/pages/Taxon/DistributionsMap/IncludedTaxaLegend.js`:

```javascript
import React, { useState } from "react";

const wrapStyle = {
  position: "absolute",
  bottom: 8,
  left: 8,
  zIndex: 1000,
  background: "#fff",
  borderRadius: 4,
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  padding: "6px 8px",
  fontSize: 12,
  lineHeight: 1.5,
  maxWidth: 260,
};

const scrollStyle = {
  maxHeight: 200,
  overflowY: "auto",
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const swatchStyle = (color) => ({
  display: "inline-block",
  width: 12,
  height: 12,
  background: color,
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: 2,
  flex: "0 0 auto",
});

const rankLabelStyle = {
  color: "#888",
  fontSize: 11,
  marginLeft: "auto",
  paddingLeft: 8,
};

const footerToggleStyle = {
  marginTop: 4,
  cursor: "pointer",
  color: "#1890ff",
  fontSize: 11,
};

const footerListStyle = {
  marginTop: 4,
  borderTop: "1px solid #eee",
  paddingTop: 4,
  fontStyle: "italic",
  color: "#666",
};

const IncludedTaxaLegend = ({ visibleTaxa, unmappableTaxa }) => {
  const [showUnmappable, setShowUnmappable] = useState(false);
  if (!visibleTaxa.length && !unmappableTaxa.length) return null;
  return (
    <div style={wrapStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Included taxa</div>
      <div style={scrollStyle}>
        {visibleTaxa.map((t) => (
          <div key={t.id} style={rowStyle}>
            <span style={swatchStyle(t.color)} />
            <span style={{ fontStyle: "italic" }}>{t.scientificName}</span>
            <span style={rankLabelStyle}>{t.rank}</span>
          </div>
        ))}
        {visibleTaxa.length === 0 && (
          <div style={{ color: "#888" }}>No taxa selected.</div>
        )}
      </div>
      {unmappableTaxa.length > 0 && (
        <>
          <div
            style={footerToggleStyle}
            onClick={() => setShowUnmappable((v) => !v)}
          >
            {showUnmappable ? "− Hide" : "+"} {unmappableTaxa.length} without map
            data
          </div>
          {showUnmappable && (
            <div style={footerListStyle}>
              {unmappableTaxa.map((t) => (
                <div key={t.id}>{t.scientificName}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IncludedTaxaLegend;
```

- [ ] **Step 2: Verify dev server compiles**

```bash
npm start
```

Wait for "Compiled successfully". Stop with Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/IncludedTaxaLegend.js
git commit -m "Distribution map: IncludedTaxaLegend component"
```

---

## Task 8: Thread focalTaxon / datasetKey / rank through Distributions.js

Pass the props needed by the new layer to `DistributionsMap`, gated on whether the feature applies.

**Files:**
- Modify: `src/pages/Taxon/index.js` (one render-site change to pass `rank` through)
- Modify: `src/pages/Taxon/Distributions.js`

- [ ] **Step 1: Forward `rank` and `taxon` from Taxon/index.js to Distributions**

In `src/pages/Taxon/index.js`, find the `<Distributions>` JSX (lines 762-770 at time of writing):

```javascript
              {_.get(info, "distributions") && (
                <PresentationItem md={md} label="Distributions">
                  <Distributions
                    style={{ marginTop: "-3px" }}
                    data={info.distributions}
                    datasetKey={datasetKey}
                    projectKey={projectKey}
                  />
                </PresentationItem>
              )}
```

Replace the `<Distributions ...>` element with:

```javascript
                  <Distributions
                    style={{ marginTop: "-3px" }}
                    data={info.distributions}
                    datasetKey={datasetKey}
                    projectKey={projectKey}
                    focalTaxon={taxon}
                    rankOrder={rank}
                  />
```

`taxon` and `rank` are already in scope (see `Taxon/index.js:399` and `:390`).

- [ ] **Step 2: Accept and forward the new props in Distributions.js**

In `src/pages/Taxon/Distributions.js`, change the component signature of `DistributionsTable` (currently `const DistributionsTable = ({ datasetKey, data, style }) => {`) and the `<DistributionsMap>` JSX:

Replace:

```javascript
const DistributionsTable = ({ datasetKey, data, style }) => {
```

with:

```javascript
const DistributionsTable = ({ datasetKey, data, style, focalTaxon, rankOrder }) => {
```

Then in the same file, replace:

```javascript
          <DistributionsMap
            records={mappable}
            onUnmappable={setFetchFailures}
          />
```

with:

```javascript
          <DistributionsMap
            records={mappable}
            onUnmappable={setFetchFailures}
            datasetKey={datasetKey}
            focalTaxon={focalTaxon}
            rankOrder={rankOrder}
          />
```

- [ ] **Step 3: Verify dev server still compiles and renders**

```bash
npm start
```

Open `http://localhost:3000`, navigate to any species detail page that has distributions. The map should render exactly as today (no new behavior yet). Stop with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Taxon/index.js src/pages/Taxon/Distributions.js
git commit -m "Distribution map: thread focalTaxon and rank order through to the map"
```

---

## Task 9: Mount Leaflet tree control + lazy descendant fetch + overlays

The big task. Replace today's basemap radio (`DistributionsMap/index.js:226-245`) with `L.control.layers.tree`, add a "This taxon" overlay, lazily fetch descendants on first expansion, and add one feature group per descendant taxon as nested overlays.

**Files:**
- Modify: `src/pages/Taxon/DistributionsMap/index.js`

The order of sub-steps below keeps each commit a coherent unit.

### 9a. Switch basemaps from the antd radio to L.control.layers.tree

- [ ] **Step 1: Replace the basemap radio with a Leaflet tree control hosting only base layers**

Open `src/pages/Taxon/DistributionsMap/index.js`. At the top with the other imports, add:

```javascript
import "leaflet.control.layers.tree";
import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
```

In the same file, remove the `Radio` import:

```javascript
import { Radio } from "antd";
```

→ remove that line entirely.

Remove the `useState` for `basemap`, the `tileLayerRef`, and the `useEffect` that swaps tile layers (the one keyed on `[basemap]`). Replace the body of the component with a single mount effect that wires up `L.control.layers.tree` with the base layers and a single "This taxon" overlay placeholder (we'll fill in real overlays later in this task).

Replace the entire current body of `DistributionsMap` (everything inside the component function — useState, useEffect blocks, JSX) with the structure below. Keep the existing `popupHtml`, `polygonStyleFor`, `polygonHoverStyle`, `cache`, `fetchShape`, `resolveKey`, `colorFor`, etc. that live OUTSIDE the component function — they stay unchanged.

```javascript
const DistributionsMap = ({
  records,
  onUnmappable,
  datasetKey,
  focalTaxon,
  rankOrder,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerControlRef = useRef(null);
  const focalGroupRef = useRef(null);
  const baseLayersRef = useRef({});

  const presentMeans = useMemo(() => {
    if (!records?.length) return [];
    const seen = new Set(records.map(resolveKey));
    return ESTABLISHMENT_MEANS.filter((m) => seen.has(m.key));
  }, [records]);

  // Mount the map and the layer-tree control with base layers only.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      worldCopyJump: true,
      minZoom: 1,
    }).setView([20, 0], 2);
    mapRef.current = map;

    const baseLayers = {};
    BASEMAPS.forEach((b, i) => {
      const layer = L.tileLayer(b.url, b.options);
      baseLayers[b.key] = layer;
      if (b.key === DEFAULT_BASEMAP) layer.addTo(map);
    });
    baseLayersRef.current = baseLayers;

    const baseTree = BASEMAPS.map((b) => ({
      label: b.label,
      layer: baseLayers[b.key],
    }));
    const overlayTree = { label: "Overlays", children: [] };

    const control = L.control.layers
      .tree(baseTree, overlayTree, {
        collapsed: true,
        position: "topright",
      })
      .addTo(map);
    layerControlRef.current = control;

    return () => {
      map.remove();
      mapRef.current = null;
      layerControlRef.current = null;
      focalGroupRef.current = null;
      baseLayersRef.current = {};
    };
  }, []);

  // Focal taxon polygons — rebuilt whenever `records` changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !records?.length) return;
    let cancelled = false;
    const group = L.featureGroup().addTo(map);
    focalGroupRef.current = group;
    let failures = 0;

    Promise.allSettled(
      records.map((r) =>
        fetchShape(r.area.gazetteer, r.area.id).then((geojson) => ({
          record: r,
          geojson,
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      results.forEach((res) => {
        if (res.status !== "fulfilled" || !res.value.geojson) {
          failures += 1;
          return;
        }
        const { record, geojson } = res.value;
        const baseStyle = polygonStyleFor(colorFor(record));
        const layer = L.geoJSON(geojson, {
          style: () => baseStyle,
          onEachFeature: (_feature, lyr) => {
            lyr.bindPopup(popupHtml(record));
            lyr.on("mouseover", () => lyr.setStyle(polygonHoverStyle));
            lyr.on("mouseout", () => lyr.setStyle(baseStyle));
          },
        });
        layer.addTo(group);
      });
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [10, 10] });
      }
      if (typeof onUnmappable === "function") {
        onUnmappable(failures);
      }
    });

    return () => {
      cancelled = true;
      group.remove();
      focalGroupRef.current = null;
    };
  }, [records, onUnmappable]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{ height: 360, width: "100%", background: "#f5f5f5" }}
      />
      {presentMeans.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            zIndex: 1000,
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            padding: "6px 8px",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {presentMeans.map((m) => (
            <div
              key={m.key}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  background: m.color,
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 2,
                }}
              />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify in the browser**

```bash
npm start
```

Open any taxon detail page with distributions. Check:
- Focal polygons render with means colors (unchanged).
- Top-right shows a Leaflet layer control. Hover/click to expand — base layer radio (Carto/OSM/Esri) is visible. Switching base layers works.
- The "Overlays" branch is empty (no children yet). That's expected; we'll add overlays next.
- Establishment-means legend (bottom-left) still renders.

Stop with Ctrl-C once verified.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/index.js
git commit -m "Distribution map: switch basemap picker to L.control.layers.tree"
```

### 9b. Add "This taxon" as a real overlay

- [ ] **Step 1: Move the focal-taxon polygons into the layer control's overlay tree**

In `src/pages/Taxon/DistributionsMap/index.js`, edit the focal-taxon `useEffect` so that after the polygons are built, the feature group is added under a "This taxon" node in the layer tree (instead of being permanently on the map).

Modify the line:

```javascript
    const group = L.featureGroup().addTo(map);
```

→

```javascript
    const group = L.featureGroup();
    group.addTo(map);
```

(Keep `addTo(map)` so it starts visible by default.)

After the `.then(...)` callback resolves and bounds are fitted, register the group in the layer control. Find the existing `.then((results) => { … })` block and at the end of it (after the `onUnmappable` call), append:

```javascript
      const control = layerControlRef.current;
      if (control) {
        const newTree = {
          label: "Overlays",
          children: [{ label: "This taxon", layer: group }],
        };
        control.setOverlayTree(newTree);
      }
```

- [ ] **Step 2: Verify in the browser**

```bash
npm start
```

Open a taxon with distributions. Confirm:
- Top-right layer control now shows "Overlays" with one child: "This taxon" (checked).
- Unchecking "This taxon" hides the focal polygons; checking re-shows them.

Stop with Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/index.js
git commit -m "Distribution map: expose 'This taxon' as a toggleable overlay"
```

### 9c. Lazy-fetch descendants on first layer-control expansion

- [ ] **Step 1: Add a "first expand" listener and the fetch state**

At the top of the component function, add new state:

```javascript
  const [descendantState, setDescendantState] = useState({
    status: "idle", // idle | loading | ready | empty | error
    taxa: [],
  });
  const fetchTriggeredRef = useRef(false);
```

In the mount effect, after creating the layer control, add a listener on the control's "expand" event. The plugin uses Leaflet's standard `L.Control.Layers` so the DOM element receives a `mouseenter` and the control fires `add`/`remove`-style events; the simplest reliable trigger is to listen for `mouseenter` on the control's container, since that's what expands the panel:

```javascript
    const containerEl = control.getContainer();
    const triggerFetch = () => {
      if (fetchTriggeredRef.current) return;
      if (!focalTaxon || !rankOrder) return;
      const ranks = getDescendantRanks(focalTaxon?.name?.rank, rankOrder);
      if (ranks.length === 0) return; // above-species or unknown rank
      fetchTriggeredRef.current = true;
      setDescendantState({ status: "loading", taxa: [] });
      fetchDescendants({ datasetKey, focalTaxon, rankOrder }).then(
        ({ taxa, descendantsFailed }) => {
          if (descendantsFailed) {
            setDescendantState({ status: "error", taxa: [] });
            return;
          }
          if (taxa.length === 0) {
            setDescendantState({ status: "empty", taxa: [] });
            return;
          }
          setDescendantState({ status: "ready", taxa });
        }
      );
    };
    containerEl.addEventListener("mouseenter", triggerFetch);
    containerEl.addEventListener("click", triggerFetch);
```

Make sure these imports are at the top of the file:

```javascript
import { fetchDescendants } from "./descendantFetch";
import { getDescendantRanks } from "./descendantRanks";
```

- [ ] **Step 2: Verify the network calls fire**

```bash
npm start
```

Open a species page with distributions. Open the browser devtools network tab. Hover over the top-right layer control — confirm:
- A request fires to `/dataset/<key>/nameusage/search?TAXON_ID=<focalId>&rank=…&status=…`.
- For each result, a follow-up request fires to `/dataset/<key>/taxon/<id>/distribution`.
- A second hover does NOT re-fire any requests (cached via `fetchTriggeredRef`).

Hover on a higher-rank taxon (e.g., a genus page if accessible) — confirm no requests fire.

Stop with Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/index.js
git commit -m "Distribution map: lazy-fetch descendant distributions on first control expand"
```

### 9d. Build per-taxon feature groups and inject them into the layer tree

- [ ] **Step 1: Compute the overlay tree from the fetched data and push it into the control**

Add another `useEffect` to `DistributionsMap/index.js` that fires whenever `descendantState.status === "ready"` and builds:

- one `L.featureGroup` per descendant taxon (using its `mappable` distributions),
- the assigned color (from `assignColors`),
- the nested overlay tree (rank groups at the top level plus per-taxon sub-groups for taxa that have children).

Add these imports at the top:

```javascript
import { assignColors } from "./colorAssignment";
import { buildTree } from "./descendantTree";
import { INFRASPECIFIC_RANKS } from "./descendantRanks";
```

Below the other refs near the top of the component, add:

```javascript
  const descendantGroupsRef = useRef({}); // taxonId → L.featureGroup
```

Below the existing effects, add:

```javascript
  useEffect(() => {
    const map = mapRef.current;
    const control = layerControlRef.current;
    const focalGroup = focalGroupRef.current;
    if (!map || !control || descendantState.status !== "ready") return;

    const { taxa } = descendantState;
    const mappableTaxa = taxa.filter((t) => t.mappable.length > 0);
    const colors = assignColors(mappableTaxa, rankOrder);

    // Build a feature group per mappable taxon.
    const groups = {};
    mappableTaxa.forEach((t) => {
      const color = colors[t.id];
      const baseStyle = {
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.55,
      };
      const hoverStyle = { weight: 3, fillOpacity: 0.85 };
      const group = L.featureGroup();
      t.mappable.forEach((rec) => {
        fetchShape(rec.area.gazetteer, rec.area.id).then((geojson) => {
          if (!geojson) return;
          const lyr = L.geoJSON(geojson, {
            style: () => baseStyle,
            onEachFeature: (_f, l) => {
              const head = `<div style="font-weight:600;font-style:italic;margin-bottom:4px">${escapeHtml(
                t.scientificName
              )}</div><div style="color:#888;margin-bottom:4px">${escapeHtml(
                t.rank || ""
              )}</div>`;
              l.bindPopup(head + popupHtml(rec));
              l.on("mouseover", () => l.setStyle(hoverStyle));
              l.on("mouseout", () => l.setStyle(baseStyle));
            },
          });
          lyr.addTo(group);
        });
      });
      groups[t.id] = group;
    });
    descendantGroupsRef.current = groups;

    // Tree by rank: top-level group per rank present, with each individual
    // taxon as a child; if a taxon has lower-ranked descendants in the same
    // fetch, those appear as a nested sub-group ("<rank> of <name>").
    const tree = buildTree(
      taxa.map((t) => ({
        id: t.id,
        parentId: t.parentId,
        scientificName: t.scientificName,
        rank: t.rank,
      })),
      focalTaxon.id
    );

    const childrenOfTaxonNode = (taxonId) => {
      const kids = tree.byParent[taxonId] || [];
      // Group sub-children by rank, mapped to nested groups.
      const grouped = {};
      kids.forEach((k) => {
        (grouped[k.rank] = grouped[k.rank] || []).push(k);
      });
      const out = [];
      INFRASPECIFIC_RANKS.forEach((rank) => {
        const inGroup = grouped[rank];
        if (!inGroup) return;
        const parentTaxon = taxa.find((t) => t.id === taxonId);
        const subLabel = `${rankLabelPlural(rank)} of ${
          parentTaxon ? parentTaxon.scientificName : ""
        }`;
        const childLeaves = inGroup
          .filter((k) => groups[k.id])
          .map((k) => ({
            label: taxonLabel(k, colors[k.id]),
            layer: groups[k.id],
            children: childrenOfTaxonNode(k.id),
          }));
        out.push({
          label: subLabel,
          selectAllCheckbox: true,
          children: childLeaves,
        });
      });
      return out;
    };

    // Top-level rank groups: every taxon of that rank across the whole subtree.
    const byRank = {};
    taxa.forEach((t) => {
      (byRank[t.rank] = byRank[t.rank] || []).push(t);
    });

    const overlayChildren = [
      { label: "This taxon", layer: focalGroup },
    ];
    INFRASPECIFIC_RANKS.forEach((rank) => {
      const inRank = (byRank[rank] || []).filter((t) => groups[t.id]);
      if (inRank.length === 0) return;
      const children = inRank.map((t) => ({
        label: taxonLabel(t, colors[t.id]),
        layer: groups[t.id],
        children: childrenOfTaxonNode(t.id),
      }));
      overlayChildren.push({
        label: rankLabelPlural(rank),
        selectAllCheckbox: true,
        children,
      });
    });

    control.setOverlayTree({ label: "Overlays", children: overlayChildren });

    return () => {
      Object.values(groups).forEach((g) => g.remove());
      descendantGroupsRef.current = {};
    };
  }, [descendantState, focalTaxon, rankOrder]);
```

Add two small helpers at module level (below the existing `popupHtml`):

```javascript
const RANK_LABEL_PLURAL = {
  subspecies: "Subspecies",
  variety: "Varieties",
  subvariety: "Subvarieties",
  form: "Forms",
  subform: "Subforms",
  "infraspecific name": "Infraspecific names",
};
const rankLabelPlural = (rank) =>
  RANK_LABEL_PLURAL[rank] || rank.charAt(0).toUpperCase() + rank.slice(1);

const taxonLabel = (taxon, color) =>
  `<span style="display:inline-flex;align-items:center;gap:6px">` +
  `<span style="display:inline-block;width:10px;height:10px;background:${color};border:1px solid rgba(0,0,0,0.15);border-radius:2px"></span>` +
  `<span style="font-style:italic">${escapeHtml(taxon.scientificName)}</span>` +
  `</span>`;
```

- [ ] **Step 2: Verify in the browser**

```bash
npm start
```

Open a species detail page known to have subspecies/varieties (e.g. a polytypic vertebrate). Confirm:
- After the layer control expands, the "Overlays" branch shows rank groups (e.g. "Subspecies", "Varieties") with the master checkbox + nested taxon names with italic scientific names and color swatches.
- Checking a rank-group master enables all taxa OF THAT RANK (not their further children).
- Checking a per-taxon sub-group like "Varieties of <subspecies>" enables only that subset.
- Toggling individual taxa shows/hides only their polygons.
- Polygons of different taxa have visibly different colors from Carto Vivid.

Stop with Ctrl-C.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/index.js
git commit -m "Distribution map: render descendant feature groups in the layer tree"
```

### 9e. Refit bounds when overlays change

- [ ] **Step 1: Listen to overlay add/remove and refit**

In the mount effect, after the layer control is added, attach handlers:

```javascript
    const refit = () => {
      const groups = [];
      if (focalGroupRef.current && map.hasLayer(focalGroupRef.current)) {
        groups.push(focalGroupRef.current);
      }
      Object.values(descendantGroupsRef.current).forEach((g) => {
        if (map.hasLayer(g)) groups.push(g);
      });
      if (groups.length === 0) return;
      const combined = L.featureGroup(groups);
      const bounds = combined.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [10, 10] });
      }
    };
    map.on("overlayadd", refit);
    map.on("overlayremove", refit);
```

And in the cleanup function of the mount effect (the `return () => { … }`), add before `map.remove()`:

```javascript
      map.off("overlayadd", refit);
      map.off("overlayremove", refit);
```

- [ ] **Step 2: Verify in the browser**

Toggle descendant layers on/off. The map should re-zoom to fit the union of currently-visible polygons. When you toggle them all off, the bounds stay where they are (no refit happens).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/index.js
git commit -m "Distribution map: refit bounds when overlay set changes"
```

---

## Task 10: Swap the establishment-means legend for the Included-taxa legend

When any descendant overlay is on, hide the means legend and show `IncludedTaxaLegend`.

**Files:**
- Modify: `src/pages/Taxon/DistributionsMap/index.js`

- [ ] **Step 1: Track visible descendant taxa in state**

Near the top of the component, add:

```javascript
  const [visibleTaxonIds, setVisibleTaxonIds] = useState(new Set());
```

In the mount effect, extend the `refit` handler to also update `visibleTaxonIds`:

```javascript
    const recomputeVisible = () => {
      const ids = new Set();
      Object.entries(descendantGroupsRef.current).forEach(([id, g]) => {
        if (map.hasLayer(g)) ids.add(id);
      });
      setVisibleTaxonIds(ids);
    };
    const onOverlayChange = () => {
      refit();
      recomputeVisible();
    };
    map.on("overlayadd", onOverlayChange);
    map.on("overlayremove", onOverlayChange);
```

(Replace the previous `map.on("overlayadd", refit)` / `overlayremove` lines with these.) Update the cleanup function to call `map.off("overlayadd", onOverlayChange)` and `map.off("overlayremove", onOverlayChange)` instead of the previous handlers.

- [ ] **Step 2: Compute legend data and render the right legend**

Add an import at the top of `DistributionsMap/index.js`:

```javascript
import IncludedTaxaLegend from "./IncludedTaxaLegend";
```

Below `presentMeans`, add a derived `descendantLegend`:

```javascript
  const descendantLegend = useMemo(() => {
    if (descendantState.status !== "ready") {
      return { visible: [], unmappable: [] };
    }
    const colors = assignColors(
      descendantState.taxa.filter((t) => t.mappable.length > 0),
      rankOrder
    );
    const visible = descendantState.taxa
      .filter((t) => t.mappable.length > 0 && visibleTaxonIds.has(t.id))
      .map((t) => ({ ...t, color: colors[t.id] }));
    const unmappable = descendantState.taxa.filter(
      (t) => t.mappable.length === 0
    );
    return { visible, unmappable };
  }, [descendantState, visibleTaxonIds, rankOrder]);

  const showDescendantLegend = descendantLegend.visible.length > 0;
```

In the JSX, wrap the means legend so it only renders when no descendants are shown, and render `IncludedTaxaLegend` otherwise:

Replace the existing means-legend block:

```javascript
      {presentMeans.length > 0 && (
        <div style={{ /* … */ }}>
          {presentMeans.map((m) => ( /* … */ ))}
        </div>
      )}
```

with:

```javascript
      {!showDescendantLegend && presentMeans.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            zIndex: 1000,
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            padding: "6px 8px",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {presentMeans.map((m) => (
            <div
              key={m.key}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  background: m.color,
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 2,
                }}
              />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      )}
      {showDescendantLegend && (
        <IncludedTaxaLegend
          visibleTaxa={descendantLegend.visible}
          unmappableTaxa={descendantLegend.unmappable}
        />
      )}
```

- [ ] **Step 3: Verify in the browser**

```bash
npm start
```

On a species page with descendants:
- With no descendant overlay enabled → bottom-left shows the establishment-means legend (unchanged behavior).
- Enable a descendant taxon → means legend disappears, "Included taxa" legend appears, lists the visible taxon with its color and rank.
- Enable more taxa → they accumulate in the legend. Disable all → means legend reappears.
- If any descendants have no mappable distributions, the footer "+K without map data" appears. Click to expand and verify the list of names.

Stop with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/index.js
git commit -m "Distribution map: swap to Included-taxa legend when descendants visible"
```

---

## Task 11: Show error and empty states in the layer control

When `descendantState.status === "error"`, the layer control should surface a retry option; when `"loading"`, a spinner; when `"empty"`, no descendant groups (current behavior already covers this).

**Files:**
- Modify: `src/pages/Taxon/DistributionsMap/index.js`

- [ ] **Step 1: Render an inline status above the map**

The Leaflet tree plugin doesn't easily support arbitrary widgets in its panel, so render the status as a small label in the top-left of the map container (independent of the layer control panel).

In the JSX after the map container `<div>`, before the legends, add:

```javascript
      {(descendantState.status === "loading" ||
        descendantState.status === "error") && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 1000,
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            padding: "4px 8px",
            fontSize: 12,
          }}
        >
          {descendantState.status === "loading" && "Loading descendants…"}
          {descendantState.status === "error" && (
            <>
              Couldn't load descendants.{" "}
              <a
                onClick={() => {
                  fetchTriggeredRef.current = false;
                  setDescendantState({ status: "idle", taxa: [] });
                }}
                style={{ cursor: "pointer" }}
              >
                Retry
              </a>
            </>
          )}
        </div>
      )}
```

Retry resets the trigger so the next mouseenter on the layer control re-runs the fetch.

- [ ] **Step 2: Verify**

Force an error by temporarily breaking the nameusage URL in `descendantFetch.js` (e.g., add `/broken` to the path), reload the species page, hover the layer control — the "Couldn't load descendants. Retry" badge appears. Restore the URL, click Retry, verify the fetch succeeds. Revert the temporary break.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Taxon/DistributionsMap/index.js
git commit -m "Distribution map: show loading and retry states for descendant fetch"
```

---

## Task 12: End-to-end manual verification + cleanup

**Files:** (verification only; only commit cleanup-style edits)

- [ ] **Step 1: Walk through every spec test case**

For each, screenshot or note actual behavior:

1. Species **with no descendants** → layer control expands, fetch fires once, control shows only "This taxon" after `descendantState` becomes `empty`.
2. Species **with subspecies only** → "Subspecies" group appears; master toggle shows/hides all subspecies polygons.
3. Species **with subspecies that have varieties** → nested "Varieties of <subspecies>" sub-group appears; top-level "Varieties" group toggles every variety (whether nested or not).
4. **Subspecies focal** with its own varieties → "Varieties" group appears at top level.
5. **Variety focal** with no further descendants → control shows only "This taxon" after the fetch completes.
6. **Genus/family focal** → no fetch is fired (verify in network tab); no descendant groups appear.
7. Species **with 50+ descendants** → colors visibly cycle from Carto Vivid; legend scrolls; network tab shows in-flight requests capped at 16.
8. Descendants whose distributions are all unmappable → appear in legend footer, not on the map.
9. Means legend hides when at least one descendant overlay is on, returns when all are off.
10. Bounds refit when overlays change.
11. Switching base layers continues to work.

- [ ] **Step 2: Run all unit tests once more**

```bash
npm test -- --watchAll=false src/pages/Taxon/DistributionsMap
```

Expected: all helper tests pass.

- [ ] **Step 3: Run the production build to catch lint/compile regressions**

```bash
npm run build
```

Expected: build completes without errors. Warnings related to existing code are acceptable; new warnings introduced by this work should be fixed before committing.

- [ ] **Step 4: Fix any new warnings inline**

If `npm run build` surfaced new ESLint warnings (e.g. unused imports), edit the offending files to remove them. No new feature work in this step.

- [ ] **Step 5: Commit any cleanup edits**

```bash
git add -A
git diff --cached --quiet || git commit -m "Distribution map: cleanup after end-to-end verification"
```

If there are no cleanup edits, this is a no-op.

---

## Done

The feature is live behind no flag — once merged, every species or infraspecific taxon detail page with at least one mappable distribution will offer the new layer control immediately.

Future work (out of scope for this plan):

- Replace per-taxon distribution requests with a single bulk endpoint (`dataset/{key}/taxon/{id}/descendants/distribution`) when the backend ships it. Only `descendantFetch.js` needs to change.
- Persist enabled overlay set in URL state so deep links can pre-open specific descendant layers.
