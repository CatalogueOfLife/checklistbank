# Dataset search by publisher name — design

**Date:** 2026-07-01
**Repos touched:** `backend` (Java API) and `checklistbank` (React UI)

## Goal

Add a **publisher** search field to the dataset search on the ChecklistBank UI. As
the user types, suggest publishers that actually have datasets in ChecklistBank,
matched case-insensitively. Selecting a suggestion filters the dataset list to
datasets published by that publisher, matching the publisher name **exactly but
case-insensitively**.

## Context / what already exists

- **Frontend** already filters datasets by publisher via the `gbifPublisherKey`
  URL param (present in `DATASET_SEARCH_PARAMS`, a sortable Publisher table
  column, and deep-links from `ProjectPublisherKey`). A GBIF-org-based
  `PublisherAutocomplete.jsx` exists but is **not** wired into the dataset search
  form and suggests from GBIF's global org list.
- **Backend** already accepts `gbifPublisherKey` (+ exclusion list) in
  `DatasetSearchRequest` and filters on `d.gbif_publisher_key`. A `publisher`
  table + `/publisher?q=` endpoint exist, but that table is a curated/sector
  cache — **not** "every publisher that has a dataset".

## Design decisions (confirmed with user)

1. **Suggest source:** ChecklistBank's own dataset publishers — only publishers
   that actually have datasets — derived directly from the `dataset` table.
   (Not GBIF orgs; not the curated `publisher` table.)
2. **Filter semantics:** by publisher **name text**, exact match, case-insensitive
   (also covers external datasets that have a publisher name but no GBIF key).
3. **Suggest matching:** substring, case- and accent-insensitive (to *find* a
   name); the applied filter is exact + case-insensitive (to *apply* it).
4. **Counts:** the suggest dropdown shows the dataset count per publisher, e.g.
   `Royal Botanic Gardens, Kew (312)`. Counts are not recomputed against other
   active search facets (e.g. origin/type), but they **do** respect the caller's
   private-dataset visibility (see decision 6).
5. **Suggest scope:** all datasets that have a publisher name set, regardless of
   origin.
6. **Private datasets:** the suggest honors the logged-in user exactly like the
   dataset search — private datasets contribute to suggestions/counts only when
   the caller may see them (admin, or an editor/reviewer on the dataset). Reuses
   the existing `PRIVATE` + `FROM_PROJ` mapper fragments. Anonymous callers see
   only public-dataset publishers. (A private dataset's publisher must not leak
   to unauthorized users.)

The publisher display name is `coalesce((publisher).organisation,
(publisher).family)` — the same expression the existing `SortBy.PUBLISHER` sort
uses, so suggest, filter, and sort stay consistent.

## Backend changes (repo: `backend`)

### 1. New `publisher` name filter on dataset search

`api/.../search/DatasetSearchRequest.java`:
- Add field `@QueryParam("publisher") String publisher;` with getter/setter.
- Add it to `hasFilter()`, `equals()`, and `hashCode()` (these enumerate every
  field).

`dao/.../db/mapper/DatasetMapper.xml`, in the `SEARCH_WHERE` `<sql>` block:
```xml
<if test="req.publisher != null">
  AND lower(coalesce((d.publisher).organisation,(d.publisher).family)) = lower(#{req.publisher})
</if>
```
Exact equality, case-folded with `lower()` — the "match exactly but case
insensitively" semantics. No accent folding here (the user selects a real stored
name from the suggest, so accents already match).

### 2. New publisher-suggest endpoint

- **Route:** `GET /dataset/publishers?q=<text>&limit=<n>` on
  `webservice/.../resources/DatasetResource.java` (default `limit` e.g. 25).
  Takes `@Auth Optional<User> user` and passes `userkey(user)` down, exactly
  like the existing `search` method.
- **Result DTO:** a small `{ String name; int count; }` — reuse an existing
  name/count pair type if one fits, else a small new class/record.
- **Mapper:** `DatasetMapper.suggestPublishers(@Param("q") String q,
  @Param("limit") int limit, @Param("userKey") Integer userKey)` returning
  `List<...>`.
- **DAO:** thin method on `DatasetDao` opening a session and delegating to the
  mapper (mirrors `PublisherDao.search`), threading `userKey` through.
- **SQL** (`DatasetMapper.xml`) — reuses the existing `FROM_PROJ` join and
  `PRIVATE` visibility fragment (included with `alias="d"`, `projAlias="proj"`,
  same as `SEARCH_FROM_WHERE`):
  ```sql
  SELECT coalesce((d.publisher).organisation,(d.publisher).family) AS name,
         count(*) AS count
  FROM dataset d
  <include FROM_PROJ/>
  WHERE d.deleted IS NULL
    AND coalesce((d.publisher).organisation,(d.publisher).family) IS NOT NULL
    AND f_unaccent(coalesce((d.publisher).organisation,(d.publisher).family))
        ILIKE f_unaccent('%' || #{q} || '%')
    <include PRIVATE/>   <!-- honors userKey; admins (-42) see all -->
  GROUP BY name
  ORDER BY count DESC, name
  LIMIT #{limit}
  ```
  Table is a few thousand rows; a sequential scan with `ILIKE` is fine, no new
  index required. Because visibility is applied before the aggregate, counts
  reflect only datasets the caller may see.

## Frontend changes (repo: `checklistbank`)

`src/pages/DatasetList/index.jsx`:
- Add `"publisher"` to `DATASET_SEARCH_PARAMS`.
- Add `"publisher"` to the `parseSearch` casing-normalization map.
- Render a new publisher autocomplete in the search form, next to the existing
  "Released from" (`DatasetAutocomplete`) field.
- Wire select/reset following the existing `onSelectReleasedFrom` /
  `onResetReleasedFrom` history-push pattern:
  - on select → push `?…&publisher=<name>`
  - on clear → push search with `publisher` omitted

New component `src/components/PublisherNameAutocomplete.jsx`:
- antd `AutoComplete`, debounced, querying `${config.dataApi}dataset/publishers?q=…`.
- Option label renders `name (count)`; option value is the bare `name`.
- Props mirror the `DatasetAutocomplete` usage: `defaultValue`/current value from
  `params.publisher`, `onSelectPublisher`, `onResetSearch`, `placeHolder`.
- Distinct from the existing GBIF `PublisherAutocomplete.jsx` — do not conflate.

## Out of scope (YAGNI)

- No change to the GBIF `PublisherAutocomplete` component or to `gbifPublisherKey`
  filtering / deep-links — both keep working untouched.
- Suggest counts are not filtered by other active search facets (origin/type/
  etc.) — but they do honor private-dataset visibility.
- No new DB index (table is small).

## Testing

- **Backend:** a mapper test for `suggestPublishers` (case/accent-insensitive
  match, count, ordering) and for the `publisher` name filter in
  `DatasetMapper.search`, following existing `DatasetMapper` test patterns.
- **Frontend:** per repo convention (Vitest has no renderer), verify the new
  field and suggest behavior live in the browser against the dev API; unit-test
  any pure helper (e.g. option formatting) if extracted.

## Notes / edge cases

- A publisher with two stored name variants appears as two suggestions and
  filters independently — inherent to name-based filtering (the user chose name
  over UUID).
- Releases/projects rarely carry a publisher name, so suggestions are naturally
  dominated by external source datasets even though scope is "all datasets".
