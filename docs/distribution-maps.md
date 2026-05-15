# Distribution maps

Taxon detail pages render a [Leaflet](https://leafletjs.com) map of all
distributions whose `area.globalId` resolves to a shape. There is **no
OGC server** — shapes are served by the ChecklistBank API itself as a
plain GeoJSON document per area, with content negotiation.

This document is the frontend's contract with the backend.

## Endpoint

The frontend (`src/pages/Taxon/DistributionsMap.js`) fetches:

```
GET ${config.dataApi}area/{globalId}
Accept: application/geo+json
```

- `{globalId}` is the URL-encoded value of the `area.globalId` field
  (e.g. `iso:DE`, `tdwg:NMA-OO`, `fao:21`).
- Frontend sends `Accept: application/geo+json` so the same path can
  also serve other representations of an area without breaking the map.
  ⚠️ Leaflet does not make HTTP requests itself; this header is set
  explicitly via `axios`.
- Response body: a GeoJSON `Feature` or `FeatureCollection`. The
  renderer accepts either.
- `200` ⇒ rendered as a polygon on the map. Click opens a popup with
  the distribution's attributes.
- `404` ⇒ row is silently moved into the "+N not on map" badge that
  switches the user to the table view. Anything other than `200` is
  treated the same way (no toast, no console error spam).

## Caching

Areas are immutable for the lifetime of a release. The resolver should
set a long-lived `Cache-Control` (e.g. `public, max-age=31536000,
immutable`) so the browser and any HTTP cache between us and the
backend serve subsequent requests for free.

The frontend additionally keeps an in-memory `Map<globalId,
Promise<GeoJSON|null>>` for the lifetime of the page, so toggling
Map↔Table or moving between sibling taxa within the same browser tab
makes no extra requests.

## Filtering: what the frontend asks about

The frontend treats a distribution as mappable when:

```js
record.area.gazetteer !== "text" && !!record.area.globalId
```

That filter is purely an optimisation to avoid pointless 404s on
free-text rows. The backend remains the source of truth: any
shape-supported gazetteer it adds in the future works without UI
changes — just start returning a body for that `globalId` and the map
picks it up.

## Out of scope (frontend)

- Generating / importing the shapefiles into the backend. That lives in
  the backend repo and is documented there.
- Per-area styling by establishment means or threat status — renderer
  uses one uniform polygon style; easy to enrich later via the `style`
  callback in `L.geoJSON`.
- Higher-zoom basemap. The map uses Esri *World Physical Map* raster
  tiles, which look great for biogeographic distributions but cap at
  zoom 8.
- Replacing the basemap before its **March 2028 retirement**. Esri is
  sunsetting all legacy raster basemaps (announcement:
  https://www.esri.com/arcgis-blog/products/arcgis-living-atlas/announcements/sunsetting-legacy-basemaps).
  Surveyed alternatives that match the muted physical aesthetic:
  OpenTopoMap (too colourful), NASA GIBS Blue Marble (too dark, poor
  for marine data), Stadia/Stamen Terrain (has country and other
  labels we don't want). Long-term plan: self-host shaded relief
  generated from Natural Earth + a global DEM (e.g. SRTM/GMTED) via
  `gdaldem hillshade` and serve as static PNG tiles from
  `download.checklistbank.org`. Not done yet — the current
  `L.tileLayer` URL in `src/pages/Taxon/DistributionsMap.js` is the
  only line that needs to change when we cut over.
- Persisting the user's Map↔Table preference.
