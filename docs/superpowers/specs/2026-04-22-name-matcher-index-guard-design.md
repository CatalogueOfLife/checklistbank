# Name Matcher Index Guard — Design Spec

**Date:** 2026-04-22  
**Scope:** `src/pages/tools/NameMatch.js`

## Problem

The name matcher tool at `/tools/name-match` lets users select one or two target datasets to match against. Matching is backed by a file-based index per dataset. If that index doesn't exist yet (API returns 404) or has size 0, the matching API returns incorrect results silently. Users have no indication that they need to wait for the index to be built.

## API changes (already applied)

All matcher API calls have been moved from `/admin/matcher/...` to `/matcher/...` across:
- `src/pages/Admin/MatcherAdmin.js`
- `src/pages/Admin/DatasetAdmin.js`
- `src/pages/DatasetKey/datasetPageTabs/DatasetOptions.js`

## Feature: Matcher index guard

### Trigger

When a user selects a primary or secondary target dataset in step 1 ("Target data"), immediately check whether a valid matcher index exists for that dataset.

### API

- **Check:** `GET /matcher/{datasetKey}` — returns `{ size: number, ... }` or 404
- **Request build:** `POST /matcher/{datasetKey}` (empty body) — schedules index build

### State additions to `NameMatch.js`

```js
const [primaryMatcherStatus, setPrimaryMatcherStatus] = useState(null);
// null = unchecked | 'checking' | 'ok' | 'missing'
const [secondaryMatcherStatus, setSecondaryMatcherStatus] = useState(null);
const [primaryMatcherRequested, setPrimaryMatcherRequested] = useState(false);
const [secondaryMatcherRequested, setSecondaryMatcherRequested] = useState(false);
```

Status resets to `null` (and `*MatcherRequested` resets to `false`) when the dataset selector is cleared or a different dataset is selected.

### Matcher check helper

```js
const checkMatcher = async (datasetKey, setStatus) => {
  setStatus('checking');
  try {
    const { data } = await axios.get(`${config.dataApi}matcher/${datasetKey}`);
    setStatus(data.size > 0 ? 'ok' : 'missing');
  } catch (err) {
    setStatus(err?.response?.status === 404 ? 'missing' : 'ok');
    // non-404 errors (network, 5xx) don't block the user
  }
};
```

Called from the `onSelectDataset` callbacks for both primary and secondary autocompletes.

### UI — below each DatasetAutocomplete

| Status | UI |
|---|---|
| `'checking'` | `<Spin size="small" />` + "Checking matcher index…" |
| `'missing'`, not yet requested | `<Alert type="warning">` + message + "Request matcher" button |
| `'missing'`, requested | `<Alert type="info">` + "Matcher is being built. Please come back in about an hour before running the match." |
| `'ok'` or `null` | nothing shown |

### Match / Submit button

Disabled when either selected dataset has status `'checking'` or `'missing'`.

### Scope

Available to all authenticated users. The `POST /matcher/{datasetKey}` endpoint is accessible to authenticated users (not admin-only).
