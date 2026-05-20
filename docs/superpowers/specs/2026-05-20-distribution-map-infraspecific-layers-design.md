# Distribution map: infraspecific descendant layers

## Goal

On the Taxon page distribution map, when the focal taxon has rank `species`,
let the user reveal the distributions of its accepted infraspecific descendants
(subspecies, varieties, forms, …) as toggleable map layers. Each infraspecific
taxon's polygons share one distinct color so the user can read which
infraspecific taxon contributes which area at a glance.

The feature is hidden for any non-species rank.

## Scope

In scope:

- Lazy fetch of accepted/provisionally-accepted infraspecific descendants and
  their distributions, on first activation of the layer control.
- A nested Leaflet layer control with:
  - the existing basemaps as base layers,
  - an overlay for the focal taxon,
  - one overlay per infraspecific rank present in the descendants,
  - nested sub-overlays per individual infraspecific taxon that has
    infraspecific children of its own.
- Color assignment per taxon from the Carto **Vivid** palette, cycling.
- A second legend listing the infraspecific taxa currently rendered, plus a
  collapsible footer listing taxa without mappable distributions.

Out of scope:

- Showing synonyms or unranked descendants.
- Showing infraspecific descendants for higher ranks (genus, family, …) — the
  feature is species-only.
- Persisting layer selections between page visits.
- Editing or filtering infraspecific data; this view is read-only.

## UI

### Layer control

Replace today's basemap radio (`DistributionsMap.js:222-245`) with a single
nested layer control rendered by the
[`leaflet.control.layers.tree`](https://github.com/jjimenezshaw/Leaflet.Control.Layers.Tree)
plugin (MIT, ~12 KB). The plugin supports:

- base layers (radio),
- overlays as a tree of checkboxes,
- non-leaf nodes that act as a master toggle for their descendants,
- collapse/expand arrows.

Position: top-right. Collapsed by default; expands on hover/click.

Structure:

```
Base layers (radio):
  (•) Carto    ( ) OSM    ( ) Esri

Overlays (tree of checkboxes):
  [x] This taxon
  [ ] Subspecies                                 ← master: all subspecies
      [ ] Mus musculus domesticus
          [ ] Varieties of M. m. domesticus     ← only if children exist
              [ ] Variety alpha
              [ ] Variety beta
          [ ] Forms of M. m. domesticus
              [ ] Form epsilon
      [ ] Mus musculus castaneus
  [ ] Varieties                                  ← master: ALL varieties
      [ ] Variety gamma
      [ ] Variety alpha
      [ ] Variety beta
  [ ] Forms
      [ ] Form epsilon
      [ ] Form delta
```

Toggle semantics:

- **Top-level rank group** (Subspecies / Varieties / Forms / …): toggles every
  taxon of that rank globally, regardless of where it sits in the
  classification. A variety nested under a subspecies *and* listed in the
  top-level "Varieties" group is toggled by the top-level "Varieties" master.
- **Per-taxon sub-group** (e.g. "Varieties of M. m. domesticus"): a convenience
  master that toggles only the varieties whose direct parent is that
  subspecies.
- The same individual variety can therefore be turned on from two places. Both
  paths drive the same underlying `L.featureGroup` — turning either parent on
  shows the polygons; turning both parents off hides them.

The "This taxon" overlay is enabled on startup; all infraspecific overlays
start off.

### Style

Per infraspecific taxon `L.featureGroup` polygon style:

- `fillColor` and `color`: the taxon's assigned Vivid color
- `fillOpacity`: 0.55
- `weight`: 2
- hover: `fillOpacity` 0.85, `weight` 3 (same pattern as today's focal layer
  hover at `DistributionsMap.js:54-57`)

Popup contents per polygon: scientific name (italic), rank, then the same
fields as the focal popup (`establishmentMeans`, `degreeOfEstablishment`,
`pathway`, `threatStatus`, `year`, `lifeStage`).

### Legends

- When no infraspecific overlay is on, today's establishment-means legend
  renders unchanged.
- When at least one infraspecific overlay is on, the establishment-means
  legend is **hidden** and replaced by a single "Infraspecific taxa" legend
  (bottom-left), scrollable to `max-height: 200px`. Each row: color swatch +
  italic scientific name + small grey rank label. Only taxa whose polygons
  are currently rendered appear in the list.
- Below the scroll, a collapsible footer "+K without map data" lists the
  accepted infraspecific descendants we fetched but could not place on the
  map (no distributions at all, or only text-gazetteer / unmappable
  distributions). Plain italic names, no color swatch.
- When the user toggles all infraspecific overlays off, the means legend
  comes back.

### Bounds

When the set of enabled overlays changes, refit map bounds to the union of
all currently-enabled feature groups. If only the focal layer is on, this
matches today's behavior.

## Data

### Fetching infraspecific descendants

Trigger: first time the layer control panel is expanded (not on map mount),
provided the focal taxon's rank is `species`.

1. **List descendants** in one call:
   ```
   GET dataset/{datasetKey}/nameusage/search
       ?TAXON_ID={speciesId}
       &rank=subspecies
       &rank=variety
       &rank=subvariety
       &rank=form
       &rank=subform
       &rank=infraspecific name
       &status=accepted
       &status=provisionally accepted
       &limit=1000
   ```
   The exact rank list comes from `src/enumeration/rank.json` filtered to
   ranks below species. The response carries each usage with its `parentId`,
   which is enough to rebuild the parent-child tree.

2. **Fetch distributions per descendant** in parallel. Preferred endpoint:
   `GET dataset/{datasetKey}/taxon/{id}/distribution` (if present in the
   backend); fallback `GET dataset/{datasetKey}/taxon/{id}/info` reading
   `info.distributions`. The implementation step will verify which exists
   and pick one.

   Cap concurrency at 16 in-flight requests using a small worker pool so a
   species with hundreds of varieties doesn't slam the API.

3. **Build the tree** from `parentId` relations. Each taxon node stores:
   `{ id, scientificName, rank, parentId, distributions, mappable, color }`.

4. **Cache** the resolved structure in component state keyed by focal
   `taxonId`; toggling overlays off then on does not re-fetch. The existing
   shape cache (`DistributionsMap.js:94`) is reused for area geometries.

While fetching, show a small spinner inline in the layer control header
("Loading infraspecific taxa…").

### Filtering mappable records

Reuse the `isMappable` predicate from `Distributions.js:11`:

```js
r?.area?.gazetteer !== "text" && !!r?.area?.globalId
```

A taxon is "mappable" if at least one of its distributions is mappable. Only
mappable taxa appear in the rendered overlays and the main legend; the rest
go into the legend footer's "+K without map data" list.

## Colors

Carto **Vivid** palette, 12 colors:

```
#E58606, #5D69B1, #52BCA3, #99C945, #CC61B0, #24796C,
#DAA51B, #2F8AC4, #764E9F, #ED645A, #CC3A8E, #A5AA99
```

Assignment:

1. Sort all infraspecific descendants by `(rankOrder, scientificName)` where
   `rankOrder` is the index of the rank in `src/enumeration/rank.json`. Stable
   alphabetical fallback ensures the same color appears across reloads.
2. Assign colors round-robin from the palette. With more than 12 descendants
   colors repeat; that is acceptable because duplicates are visually
   separated by geography.
3. A taxon's color is fixed; it is the same wherever the taxon appears in
   the tree.

## Architecture

### Components touched

- **`src/pages/Taxon/DistributionsMap.js`** — main refactor. Today the file
  exports one component that renders the map, basemap radio, and legend
  driven solely by the `records` prop. After the change it:
  - accepts `focalTaxon` (with `id`, `name.scientificName`, `name.rank`) and
    `datasetKey` in addition to `records`;
  - manages multiple feature groups (one for focal, one per infraspecific
    taxon);
  - mounts the `Leaflet.Control.Layers.Tree` plugin instead of the existing
    basemap radio;
  - swaps which legend is visible based on overlay state.

  To keep the file from growing unwieldy, extract three helpers into
  sibling files:
  - `DistributionsMap/infraspecificFetch.js` — pure async helper returning
    the resolved tree.
  - `DistributionsMap/colorAssignment.js` — pure color round-robin.
  - `DistributionsMap/InfraspecificLegend.js` — small presentational
    component for the legend + footer.

  This keeps the map component focused on Leaflet wiring; the helpers can
  be tested in isolation later if needed.

- **`src/pages/Taxon/Distributions.js`** — pass `focalTaxon` and
  `datasetKey` through to `DistributionsMap`, and surface the new feature
  only when `focalTaxon.name.rank === "species"`.

- **`src/pages/Taxon/index.js`** — pass the loaded `taxon` (already in state)
  down to `Distributions` so it can forward it.

- **`package.json`** — add `leaflet.control.layers.tree`.

### Data flow

```
Taxon/index.js
   │
   │ taxon, info.distributions, datasetKey
   ▼
Distributions.js
   │
   │ records=mappable, focalTaxon=taxon, datasetKey
   ▼
DistributionsMap.js
   ├─ on mount: render focal feature group + base map
   ├─ on layer-control expand (species only, once):
   │     infraspecificFetch(datasetKey, focalTaxon.id)
   │        ├─ search infraspecific descendants
   │        ├─ fetch distributions per descendant (pool=16)
   │        └─ build tree, assign colors
   ├─ on tree change: add/remove feature groups, refit bounds
   └─ render: infraspecific legend when any overlay is on
```

### Error handling

- If the descendants search fails, the layer control shows "Couldn't load
  infraspecific taxa" with a retry link, and the focal layer keeps working.
- If a single descendant's distribution fetch fails, the taxon is treated as
  "without map data" (goes into the legend footer); the others still render.
  Same predicate as today: if `failures >= mappable`, fall back to table —
  but only for the focal layer; infraspecific failures are silent on the
  main UI.

## Testing

Manual verification (no automated tests for this component today):

- Species with no infraspecific descendants → layer control has only "This
  taxon"; no fetch fires.
- Species with subspecies only → "Subspecies" group appears, master toggle
  shows/hides all.
- Species with subspecies that have varieties → nested "Varieties of X"
  sub-group appears under the subspecies; toggling the top-level "Varieties"
  group enables every variety (including those nested under subspecies).
- Genus, family, or other non-species focal rank → no layer control entries
  for infraspecific overlays.
- Species with 50+ infraspecific descendants → colors cycle from Carto Vivid
  predictably; legend scrolls; fetch pool caps at 16 in-flight.
- Descendants whose distributions are all unmappable (text gazetteer only,
  or no distributions at all) → appear in legend footer, not on the map.
- Means legend hides when an infraspecific overlay is on, returns when all
  infraspecific overlays are off.

## Open questions deferred to implementation

- Confirm whether `dataset/{key}/taxon/{id}/distribution` exists; if not,
  use `/info`.
- Confirm exact rank values the API accepts (case, hyphens) by checking
  `rank.json` and an example backend call.
- Pick the spinner widget (likely an antd `<Spin size="small" />` rendered
  into the plugin's header DOM).
