# Sector profiles UI — design

**Date:** 2026-10-05
**Issue:** [checklistbank#1732](https://github.com/CatalogueOfLife/checklistbank/issues/1732)
**Branch:** `master` (local commits, pushed only together with the backend deploy)
**Backend reference:** `docs/SECTOR-SETTINGS.md` and `docs/2026-10-05-sector-profiles.md` in the backend repo

## Motivation

The backend resolves every sector setting from three levels: built-in defaults, every matching **sector profile**
in ascending `position` (ties by id), and the sector itself. Scalars and allow-lists are *nearest wins*, where null
or an empty list means "not set, inherit". The four blocklists (`nameStatusExclusion`, `issueExclusion`,
`blockedNames`, `blockedNamePatterns`) are *unioned* over all levels. The seven `sector …` project settings are gone.

The UI must let curators manage profiles, and must stop sending values editors did not choose: an unticked checkbox
now sends an explicit `false` that overrides every profile.

## Goals / acceptance

- A curator can create, reorder, edit and delete profiles, and see which sectors each selects, without the API.
- The sector form never sends an explicit `false` or empty value the editor did not choose, and shows inherited
  values with their source.
- The seven removed settings are gone from the project options.
- Release pages show sectors and profiles read-only.

## Backend contract

| Request | Use in the UI |
|---|---|
| `GET /dataset/{key}/sector/profile` | Profiles list, in cascade order (paged; the UI asks for `limit=1000`) |
| `POST /dataset/{key}/sector/profile` | Create; returns the new id |
| `GET`/`PUT`/`DELETE /dataset/{key}/sector/profile/{id}` | Edit, reorder (PUT with new `position`), delete |
| `GET /dataset/{key}/sector?profileKey={id}` | Members, combinable with every other sector filter; `limit=0` → `total` |
| `GET /dataset/{key}/sector/{id}/settings` | `{settings, sources}`: effective values and provenance |
| **new** `POST /dataset/{key}/sector/profile/preview?limit&offset` | Body: a `SectorSelector`. Returns `ResultPage<Sector>` of the sectors it would select now |

`sources` values are `default`, `sector` or `profile:{id}`; blocklists list every contributing level, comma separated
(`profile:1,sector`).

### New backend preview endpoint

- `SectorSearchRequest` gets a `selector` property (`SectorSelector`, not a query param).
- `SectorMapper`'s `WHERE` gets a second `EXISTS`, next to the `profileKey` one, that applies
  `SectorProfileMapper.MATCHES` to an inline row built from the selector, with explicit array casts.
- `SectorProfileResource` adds `POST preview` (no role required, read only) that sets
  `datasetKey` and `selector` on a search request and calls `SectorDao.search`.
- Covered by a `SectorMapperTest` case; documented in `SECTOR-SETTINGS.md`.

## UI design

### Shared settings widgets — `src/components/SectorSettings/`

- **`settingsMeta.js`** (pure, unit tested)
  - `SETTINGS`: the 14 settings with `name`, `label`, `help`, `kind` (`enums`, `tags`, `regex`, `bool`, `enum`),
    `union` (blocklist), `modes` (`["merge"]` for the three merge-only ones, `["hierarchy"]` for
    `authorshipUpdate`, otherwise all).
  - `appliesTo(setting, modes)`: shown when `modes` is empty or intersects the setting's modes.
  - `parseSources("profile:1,sector")` → `[{type: "profile", id: 1}, {type: "sector"}]`.
  - `inheritedPart(effectiveList, ownList)`: the effective blocklist minus the sector's own entries.
  - `cleanSettings(values)`: empty lists and blank strings become `null`, so a level never sends "empty".
  - `setSettingNames(settings)`: names of the settings a level sets, for list summaries.
- **`TriStateRadio.jsx`**: a solid `Radio.Group` with *Inherit* (`null`), then two labelled values (Yes/No, or
  Extinct/Extant for `extinctFilter`). The *Inherit* button shows the effective value when known,
  e.g. "Inherit (no)".
- **`SectorSettingsFields.jsx`**: renders the 14 `Form.Item`s inside the host `Form`.
  - Props: `modes`, `namePrefix` (`[]` for sectors, `["settings"]` for profiles), `rankOptions`, `effective`
    (`{settings, sources}` or null), `profiles` (to name `profile:{id}` sources), `datasetKey`, `readOnly`.
  - Grouped like the current form: *Filter* (ranks, nameTypes, nameStatusExclusion, extinctFilter, nameFilter),
    *Data to sync* (entities, code, copyAccordingTo, removeOrdinals, createImplicitNames, authorshipUpdate),
    *Merge blocklists* (issueExclusion, blockedNames, blockedNamePatterns).
  - `extra` under each field, when `effective` is given and the source is not `sector`: "inherits *value* from
    *Profile title*" (linked to the profiles page) or "default: *value*". An empty ranks field therefore reads as
    inherited, never as "nothing".
  - Blocklists: `extra` shows the inherited part as read-only tags with their sources; the field holds the
    sector's own additions.
  - `blockedNames` and `blockedNamePatterns` are `Select mode="tags"` without token separators (commas are valid in
    regexes). No client-side regex check: Java and JS syntax differ, so the backend's 400 is the authority.
- **`EffectiveSettingsSummary.jsx`**: fetches `…/sector/{id}/settings` (and the profiles) and lists every setting
  whose source is not `default`, plus `ranks` always. Inherited values carry a small "profile" `Tag` whose tooltip
  names the profile; default ones a "default" tag.

### Sector form — `src/pages/project/Assembly/SectorForm.jsx`

- Keeps `mode`, `priority`, `subjectDatasetKey`, `subject`, `target`, `placeholderRank`, `useXRelease`, `note`.
- Replaces its own settings fields with `SectorSettingsFields` (`modes=[mode]`, `rankOptions` = the source
  dataset's ranks as today).
- For an existing sector, loads the effective settings and the profiles of `sector.datasetKey`.
- `initialValues` gives no boolean a default; lists default to `[]` (empty means inherit).
- On submit, settings pass through `cleanSettings`; *Inherit* sends `null`.
- Errors (incl. the regex 400) keep using the existing `Alert` + `ErrorMsg`.

### Project settings — item 5

- Remove the seven `sector …` entries from `src/enumeration/setting.json` (the build regenerates the file from
  `/vocab/setting`, which drops them once the backend is deployed).
- The project Options page gets an info `Alert` pointing to the Profiles tab.

### Profiles page — item 1

- `sector$mode` becomes a loaded enum (`writeEnums.cjs`, `getSectorMode()`, `ContextProvider` → `sectorMode`).
- `src/api/sector.js`: `getProfiles`, `getProfile`, `createProfile`, `updateProfile`, `deleteProfile`,
  `countProfileSectors`, `previewProfile`, `getEffectiveSettings`.
- Route `/project/:projectKey/sector/profiles` (before `/project/:projectKey/sector`) and a **Profiles** tab with a
  `ControlOutlined` icon in `SectorTabs`.
- `src/pages/project/SectorProfiles/`
  - `index.jsx`: `Layout` + `SectorTabs` + `ProfileList`.
  - `ProfileList.jsx` (`datasetKey`, `readOnly`): one row per profile, in cascade order.
    - Columns: drag handle, position, title + description, selector summary, settings tags, member count (link to
      the sector page with `?profileKey=`), actions (edit, delete).
    - Drag & drop via `react-drag-listview` (as `Priority.jsx`). A drop renumbers the list `0…n-1` and PUTs only
      the profiles whose position changed, then reloads.
    - Delete: `Popconfirm` naming the member count.
    - `readOnly` hides the handle, actions and "New profile" button.
  - `selectorSummary.js` (pure, unit tested): `summarizeSelector(selector, labels)` → e.g.
    "merge · any sector publisher", "3 source datasets", "all sectors".
  - `ProfileForm.jsx` (in a `Modal`): title (required), description, position, selector, settings, preview.
    - Selector: modes (`sectorMode`), dataset types (`datasetType`), publishers (`PublisherSelect`), any sector
      publisher (`Switch`), source datasets (`DatasetSelect`), sector keys (`Select mode="tags"`, numbers only).
    - Settings: `SectorSettingsFields` with `namePrefix=["settings"]`, `modes` = selector modes, all ranks.
    - Preview: debounced (500 ms) `previewProfile(selector, limit 0)` on selector change, showing
      "Selects *n* sectors" and a "show" link opening `PreviewDrawer`.
  - `PublisherSelect.jsx`: multi `Select`; options are the project's sector publishers, plus GBIF organization
    search results while typing; labels of other selected keys are fetched from GBIF.
  - `DatasetSelect.jsx`: multi `Select` with remote dataset search; labels via `getDatasetsBatch`.
  - `PreviewDrawer.jsx`: a `Drawer` with a paged table of preview results (columns from `ProjectSectors/columns`).

### Sector display — item 3

- `Assembly/Sector.jsx`: the popover replaces the raw code/ranks/entities with `EffectiveSettingsSummary`
  (note stays).
- `ProjectSectors/SectorPageContent.jsx`: release rows become expandable and show `EffectiveSettingsSummary`.
- `DatasetKey/datasetPageTabs/ReleaseSectors.jsx`: a collapsed "Sector profiles" panel with
  `ProfileList readOnly` above the sector table. Member links point at the release's sector page.

### Bulk helpers — item 4

- `SectorPageContent.jsx`: a "Profile" `Select` filter (`profileKey`), options from the profiles of the
  project or release.
- `SectorTable.jsx`: a row-selection action "Add to profile…" (projects only) opening `AddToProfileModal.jsx`:
  pick a profile, choose *these sectors* or *their source datasets*, then GET, append the keys to
  `selector.sectorKeys` / `selector.subjectDatasetKeys` (deduplicated), PUT.

## Error handling

- API errors in profile CRUD go through `addError` / `ErrorMsg`, like the rest of the assembly pages.
- A failed effective-settings fetch leaves the form usable without inherited hints.
- A failed preview shows "preview unavailable" instead of a count.

## Testing

- Vitest unit tests for `settingsMeta.js` and `selectorSummary.js`, plus the reorder helper.
- Backend: `SectorMapperTest` for the selector filter.
- Live check in the browser against a backend with profiles (local or dev once deployed), with the
  `claude.doering` editor account.

## Out of scope

- Client-side regex validation.
- Showing what a sector would inherit if its own value were removed (the endpoint only reports the winner).
