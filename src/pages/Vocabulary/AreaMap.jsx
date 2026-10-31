import React, { useEffect, useRef, useState } from "react";
import { BASEMAP_STYLE, maplibregl } from "../Taxon/DistributionsMap/mapSetup";
import { computeWrappedBounds } from "../Taxon/DistributionsMap/geo";
import { VIVID_PALETTE } from "../Taxon/DistributionsMap/colorAssignment";
import { isWebglSupported } from "../Taxon/DistributionsMap/webgl";

const SOURCE = "col-areas";
const FILL = "col-areas-fill";
const OUTLINE = "col-areas-outline";
const LINE = "col-areas-line";
const POINT = "col-areas-point";
const SINGLE_COLOR = "#73AF48";
const WORLD_WIDTH_AT_ZOOM_0 = 512;
// A feature's color property is an index into the palette, chosen when the
// overview was built so that neighbouring areas differ.
const FEATURE_COLOR = [
  "match",
  ["get", "color"],
  ...VIVID_PALETTE.flatMap((color, index) => [index, color]),
  SINGLE_COLOR,
];

const addLayers = (map, data) => {
  map.addSource(SOURCE, { type: "geojson", data, maxzoom: 8 });
  // Above the roads and borders of the base map, which shine through the translucent
  // fill instead of cutting the shape up, and below its labels, so that places stay
  // readable. Those aren't simply the first symbol layer: in Positron that's a waterway
  // label, far below the borders.
  const layers = map.getStyle().layers;
  const firstLabel = layers[layers.findLastIndex((l) => l.type !== "symbol") + 1]?.id;
  map.addLayer(
    {
      id: FILL,
      type: "fill",
      source: SOURCE,
      filter: ["==", "$type", "Polygon"],
      paint: { "fill-color": FEATURE_COLOR, "fill-opacity": 0.7 },
    },
    firstLabel
  );
  map.addLayer(
    {
      id: OUTLINE,
      type: "line",
      source: SOURCE,
      filter: ["==", "$type", "Polygon"],
      paint: { "line-color": "#fff", "line-width": 0.75 },
    },
    firstLabel
  );
  map.addLayer({
    id: LINE,
    type: "line",
    source: SOURCE,
    filter: ["==", "$type", "LineString"],
    paint: { "line-color": FEATURE_COLOR, "line-width": 2 },
  });
  map.addLayer({
    id: POINT,
    type: "circle",
    source: SOURCE,
    filter: ["==", "$type", "Point"],
    paint: { "circle-color": FEATURE_COLOR, "circle-radius": 6 },
  });
};

// Shows a FeatureCollection fitted to its extent. Features with an id show their
// name on hover and report clicks to onAreaClick.
// fallback: rendered in place of the map where WebGL is not available.
const AreaMap = ({ data, onAreaClick, fallback = null, height = 420 }) => {
  const container = useRef(null);
  const [failed, setFailed] = useState(() => !isWebglSupported());
  // keeps the handlers registered once on the map from going stale
  const clickHandler = useRef(onAreaClick);
  clickHandler.current = onAreaClick;

  useEffect(() => {
    if (failed || !data || !container.current) return;
    let map;
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: BASEMAP_STYLE,
        center: [0, 20],
        zoom: 0.5,
        minZoom: 0,
        attributionControl: false,
        cooperativeGestures: true,
      });
    } catch (e) {
      // The probe can pass while MapLibre's own context request still fails.
      console.warn("Area map disabled:", e);
      setFailed(true);
      return;
    }
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
    const areaAt = (e) => e.features?.find((f) => f.properties?.id !== undefined)?.properties;

    map.on("load", () => {
      addLayers(map, data);
      const bounds = computeWrappedBounds(data.features);
      if (bounds) {
        map.fitBounds(bounds, { padding: 24, maxZoom: 7, animate: false });
        // Starts with the world filling the width at most, so that it doesn't repeat.
        const worldZoom = Math.log2(map.getContainer().clientWidth / WORLD_WIDTH_AT_ZOOM_0);
        map.setZoom(Math.max(map.getZoom(), worldZoom));
      }
      map
        .getContainer()
        .querySelector(".maplibregl-ctrl-attrib")
        ?.classList.remove("maplibregl-compact-show");
    });
    map.on("mousemove", FILL, (e) => {
      const area = areaAt(e);
      if (!area) return;
      map.getCanvas().style.cursor = "pointer";
      popup.setLngLat(e.lngLat).setText(area.name).addTo(map);
    });
    map.on("mouseleave", FILL, () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    });
    map.on("click", FILL, (e) => {
      const area = areaAt(e);
      if (area) clickHandler.current?.(area);
    });

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => map.resize()) : null;
    resizeObserver?.observe(container.current);

    return () => {
      resizeObserver?.disconnect();
      popup.remove();
      map.remove();
    };
  }, [data, failed]);

  if (failed) return fallback;
  return <div ref={container} style={{ width: "100%", height, borderRadius: 6 }} />;
};

export default AreaMap;
