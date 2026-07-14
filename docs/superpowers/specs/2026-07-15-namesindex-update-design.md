# Names Index UI update — design

**Date:** 2026-07-15
**Branch:** `feature/namesindex-update`
**Scope:** `src/pages/NameIndex/*` (the `/namesindex` search + detail pages)

## Motivation

The backend names index model was collapsed to a minimal shape. There are no
longer two tiers (canonical vs. non-canonical) and no parsed/atomized index
name. A names index entry is now just:

- a **normalized name** (folded bucket key),
- a representative **scientificName**, and
- a list of authorship-**qualified scientificNames** (`labels`), each with a
  **count** = the number of times that exact label occurs across ChecklistBank.

The UI's `/namesindex` pages still assume the old rich model (rank, authorship
objects, parsed atoms, canonical toggle, a separate `/group` endpoint) and must
be updated.

## Backend contract (as of this change)

| Endpoint | Returns | Notes |
|---|---|---|
| `GET /nidx/pattern?q=&offset=&limit=` | `[{ key, scientificName, normalized }]` | `canonical` (default `true`) and `rank` params still exist but are **no longer exposed** by the UI. No total count → keep Prev/Next paging (fetch `limit+1` to detect a next page). |
| `GET /nidx/{key}` | `{ nidx, normalizedName, scientificName, labels: [{ label, count }] }` | `normalizedName` will be exposed backend-side (public getter/field added). |
| `GET /nidx/{key}/usages` | `ResultPage<SimpleNameInDatasetClassified>` | **Unchanged.** Powers the Related tab + the Related count. |
| `GET /nameusage/{ext}?nidx=` | extension rows | **Unchanged.** Powers Properties / Vernacular / Distribution / Media. |
| ~~`GET /nidx/{key}/group`~~ | — | **Removed.** The "group" is now the `labels` array on the detail record. |

Field-name changes that matter:
- search row id: `record.id` → **`record.key`**
- detail row id: `record.id` → **`record.nidx`**

## Changes

### 1. `NameIndexSearch.jsx`
- Remove the **Canonical** toggle button and the **Rank** `Select`, plus all
  related state (`canonical`, `selectedRank`, `rankOptions`) and the `rank`
  context prop.
- Request URL becomes `nidx/pattern?q=…&offset=…&limit=(limit+1)` — drop the
  `rank` and `canonical` params (backend defaults `canonical=true`).
- `updateSearch` no longer threads `rank`/`canonical`.
- Columns: **Scientific Name** (link) → **Normalized** (muted) → **ID** (link).
  Drop the Authorship and Rank columns. Links + `rowKey` use `record.key`.
- Keep the search box, Prev/Next paging, page-size select, and version footer.

### 2. `Entry.jsx` (the "Entry" detail tab)
- Render only: **ID** (`record.nidx`, linkable), **Normalized**
  (`record.normalizedName`), **Scientific Name** (`record.scientificName`).
- Remove every removed field: canonicalId, rank, genus, uninomial,
  specific/infraspecific epithet, basionym/combination authorship, parsed,
  created, modified.
- Keep the JSON toggle (shows the raw record).
- Remove the now-unused `Authorship` component + its export (only the deleted
  group columns used it — verified no other importer).

### 3. `NameIndexKey.jsx`
- Delete the `GET /nidx/{key}/group` fetch and the `group` state.
- **Group tab** renders `record.labels` as a two-column table:
  **Name** (`label`) + **Count** (`count`), sorted by count descending. Tab
  label stays `Group (${record.labels?.length || 0})`.
- Layout `title` uses `record.scientificName` (was `record.labelHtml`).
- `taxonOrNameKey` and the four extension tabs' `nidxKey` use `record.nidx`
  (were `record.id`).
- Drop the dead props passed to `RelatedNames` (`updateCount`, `group`,
  `defaultFilteredValue` — already ignored by the component) and the unused
  `defaultFilteredValue` state.

### 4. `RelatedNames.jsx` / `UsageExtension.jsx`
- **No functional change.** They operate on usage records
  (`SimpleNameInDatasetClassified`), a different shape that still carries
  `labelHtml`, `rank`, `status`, `group`, `id`, `classification`, etc. Their
  `record.id` / `labelHtml` references are on usage rows, not nidx rows.

## Out of scope
- Backend serialization of `normalizedName` (owner: backend; tracked separately).
- Any change to the usages / extension endpoints or their tabs beyond the
  `nidxKey` id-field rename.

## Verification
- Cannot hit the dev service yet (deploy in progress). Verify against the live
  dev API once up: search returns rows and links resolve; detail Entry tab shows
  id/normalized/scientificName; Group tab lists labels + counts sorted desc;
  Related/Properties/Vernacular/Distribution/Media tabs still load.
