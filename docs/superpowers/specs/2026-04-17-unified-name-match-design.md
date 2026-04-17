# Unified Name Match Page — Design Spec

## Summary

Merge `/tools/name-match` (synchronous) and `/tools/name-match-async` (asynchronous) into a single page with a sync/async toggle switch. Remove the async route entirely; redirect job status to `/tools/name-match/job/:key`.

---

## Routes

| Route | Component | Notes |
|---|---|---|
| `/tools/name-match` | `NameMatch.js` (extended) | Unified page |
| `/tools/name-match/job/:key` | `NameMatchJob.js` | Job status — route updated |
| `/tools/name-match-async` | — | Removed |
| `/tools/name-match-async/job/:key` | — | Removed |

`NameMatchAsync.js` is deleted.

---

## Page Structure

### Header area
- Page title: "Name Match"
- Switch in top-right area: **Synchronous / Asynchronous** (default: synchronous)
- Async mode requires login. If user is not logged in:
  - Only show "Simple data entry" panel
  - Below the panel, show an info alert: "There is also a file upload option available for larger lists — please log in to use it."
  - The async switch is hidden or disabled

### Input panels (Collapse accordion)

**Panel 1 — "Simple data entry"** (sync mode only; hidden in async mode)  
- Textarea, one name per line  
- Unchanged from current `NameMatch.js`

**Panel 2 — "Upload CSV/TSV"** (both modes)  
- File dragger (unchanged UI)  
- In **sync mode**: parses locally with `csvtojson`, proceeds to the existing multi-step workflow  
- In **async mode**: POSTs file directly to `POST /dataset/{key}/match/nameusage/job` with `Content-Type: text/plain`; no format radio buttons (API auto-detects); on success redirects to `/tools/name-match/job/{jobKey}`  
- File format overview list (from current `NameMatchAsync.js`) shown below the dragger in both modes

**Panel 3 — "Choose dataset in ChecklistBank"** (both modes)  
- Dataset autocomplete + root taxon picker (unchanged)  
- In **sync mode**: fetches names via `export.json`, loads into the multi-step workflow (unchanged)  
- In **async mode**: POSTs JSON body `{ sourceDatasetKey: key, taxonId: taxonId }` to `POST /dataset/{primaryDataset.key}/match/nameusage/job`; on success redirects to `/tools/name-match/job/{jobKey}`

---

## Sync mode workflow

Unchanged from current `NameMatch.js`:  
Steps 0→1→2→3 (Input → Target → Matching → Review result)

The "If your list contains more than 5000 names, use asynchronous matching" hint at the bottom of step 0 is updated to use the switch instead of a link.

---

## Async mode workflow

1. User selects dataset (panel 2 or 3)
2. User uploads file or picks subject dataset + taxon
3. Submit → POST to job API → redirect to `/tools/name-match/job/{key}`
4. Job status page polls and shows result/download link

---

## Removed

- `src/pages/tools/NameMatchAsync.js` — deleted
- Format radio buttons (TSV/CSV) — removed; API auto-detects
- All links/buttons that navigate to `/tools/name-match-async`
- Routes `/tools/name-match-async` and `/tools/name-match-async/job/:key` in `App.js`

---

## Files changed

| File | Change |
|---|---|
| `src/pages/tools/NameMatch.js` | Add `asyncMode` state, switch, async submit logic, file format list, login-gating |
| `src/pages/tools/NameMatchJob.js` | Update "Back" button path from `/tools/name-match-async` → `/tools/name-match` |
| `src/App.js` | Update route `/tools/name-match-async/job/:key` → `/tools/name-match/job/:key`; remove `/tools/name-match-async`; remove `NameMatchAsync` import |
| `src/pages/tools/NameMatchAsync.js` | Delete file |
