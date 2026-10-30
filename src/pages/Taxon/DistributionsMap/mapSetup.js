import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre v6 is ESM-only and can't locate its worker inside a bundle; let Vite
// emit the worker as its own chunk and hand MapLibre the URL.
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import config from "../../../config";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

export { maplibregl };

// The base map, per environment, so a different provider or a keyed style URL
// can be swapped in without touching this file. Carto's keyless Positron is
// the fallback for an environment that does not name one.
export const BASEMAP_STYLE =
  config.basemapStyle ||
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
