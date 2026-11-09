import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre v6 is ESM-only and can't locate its worker inside a bundle; let Vite
// emit the worker as its own chunk and hand MapLibre the URL.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import config from "../../../config";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

export { maplibregl };

// The base map, per environment, so a different provider or a keyed style URL
// can be swapped in without touching this file. The fallback is col-browser's
// bundled COL Positron style: CARTO's open Positron design on GBIF's keyless
// vector tiles, with fonts and icons served from that col-browser release on
// jsDelivr.
export const BASEMAP_STYLE =
  config.basemapStyle ||
  "https://cdn.jsdelivr.net/npm/col-browser@2.9.0/basemap/style.json";
