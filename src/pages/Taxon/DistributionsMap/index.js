import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.control.layers.tree";
import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
import axios from "axios";
import config from "../../../config";

const POPUP_FIELDS = [
  "establishmentMeans",
  "degreeOfEstablishment",
  "pathway",
  "threatStatus",
  "year",
  "lifeStage",
];

const ESTABLISHMENT_MEANS = [
  { key: "nativeendemic", label: "Native endemic", color: "#0F8554" },
  { key: "native", label: "Native", color: "#87C55F" },
  { key: "nativereintroduced", label: "Native reintroduced", color: "#C9DB74" },
  { key: "introduced", label: "Introduced", color: "#FE88B1" },
  {
    key: "introducedassistedcolonisation",
    label: "Introduced assisted colonisation",
    color: "#DCB0F2",
  },
  { key: "vagrant", label: "Vagrant", color: "#F6CF71" },
  { key: "uncertain", label: "Uncertain", color: "#8BE0A4" },
];

const ESTABLISHMENT_COLORS = Object.fromEntries(
  ESTABLISHMENT_MEANS.map((m) => [m.key, m.color])
);
const NULL_KEY = "null";
const NULL_COLOR = "#66C5CC";
const DEFAULT_KEY = "uncertain";

const normalizeKey = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const resolveKey = (record) => {
  const raw = record?.establishmentMeans;
  if (raw == null || raw === "") return NULL_KEY;
  const k = normalizeKey(raw);
  return ESTABLISHMENT_COLORS[k] ? k : DEFAULT_KEY;
};

const colorFor = (record) => {
  const key = resolveKey(record);
  return key === NULL_KEY ? NULL_COLOR : ESTABLISHMENT_COLORS[key];
};

const polygonStyleFor = (color) => ({
  color,
  weight: 1,
  fillColor: color,
  fillOpacity: 0.75,
});
const polygonHoverStyle = {
  weight: 2,
  fillOpacity: 0.95,
};

const BASEMAPS = [
  {
    key: "carto",
    label: "Carto",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    options: {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: "abcd",
      noWrap: true,
    },
  },
  {
    key: "osm",
    label: "OSM",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      noWrap: true,
    },
  },
  {
    key: "esri",
    label: "Esri",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution:
        "Tiles &copy; Esri &mdash; Source: US National Park Service",
      maxZoom: 8,
      noWrap: true,
    },
  },
];

const WORLD_BOUNDS = [
  [-90, -180],
  [90, 180],
];
const DEFAULT_BASEMAP = "carto";

const cache = new Map();

const fetchShape = (gazetteer, id) => {
  const key = `${gazetteer}:${id}`;
  if (cache.has(key)) return cache.get(key);
  const url = `${config.dataApi}vocab/area/${key}`;
  const p = axios(url, {
    headers: { Accept: "application/geo+json" },
  }).then(
    (r) => r.data,
    () => null
  );
  cache.set(key, p);
  return p;
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const popupHtml = (record) => {
  const title = record?.area?.name || record?.area?.globalId || "";
  const rows = POPUP_FIELDS.map((f) => [f, record?.[f]])
    .filter(([, v]) => v != null && v !== "")
    .map(
      ([k, v]) =>
        `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`
    )
    .join("");
  return `<div style="min-width:180px"><div style="font-weight:600;margin-bottom:4px">${escapeHtml(
    title
  )}</div>${rows}</div>`;
};

const DistributionsMap = ({
  records,
  onUnmappable,
  datasetKey,
  focalTaxon,
  rankOrder,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerControlRef = useRef(null);
  const focalGroupRef = useRef(null);
  const baseLayersRef = useRef({});

  const presentMeans = useMemo(() => {
    if (!records?.length) return [];
    const seen = new Set(records.map(resolveKey));
    return ESTABLISHMENT_MEANS.filter((m) => seen.has(m.key));
  }, [records]);

  // Mount the map and the layer-tree control with base layers only.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      minZoom: 1,
      maxBounds: WORLD_BOUNDS,
      maxBoundsViscosity: 1,
    }).setView([20, 0], 2);
    mapRef.current = map;

    const baseLayers = {};
    BASEMAPS.forEach((b) => {
      const layer = L.tileLayer(b.url, b.options);
      baseLayers[b.key] = layer;
      if (b.key === DEFAULT_BASEMAP) layer.addTo(map);
    });
    baseLayersRef.current = baseLayers;

    const baseTree = BASEMAPS.map((b) => ({
      label: b.label,
      layer: baseLayers[b.key],
    }));
    const overlayTree = { label: "Overlays", children: [] };

    const control = L.control.layers
      .tree(baseTree, overlayTree, {
        collapsed: true,
        position: "topright",
      })
      .addTo(map);
    layerControlRef.current = control;

    return () => {
      map.remove();
      mapRef.current = null;
      layerControlRef.current = null;
      focalGroupRef.current = null;
      baseLayersRef.current = {};
    };
  }, []);

  // Focal taxon polygons — rebuilt whenever `records` changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !records?.length) return;
    let cancelled = false;
    const group = L.featureGroup();
    group.addTo(map);
    focalGroupRef.current = group;
    let failures = 0;

    Promise.allSettled(
      records.map((r) =>
        fetchShape(r.area.gazetteer, r.area.id).then((geojson) => ({
          record: r,
          geojson,
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      results.forEach((res) => {
        if (res.status !== "fulfilled" || !res.value.geojson) {
          failures += 1;
          return;
        }
        const { record, geojson } = res.value;
        const baseStyle = polygonStyleFor(colorFor(record));
        const layer = L.geoJSON(geojson, {
          style: () => baseStyle,
          onEachFeature: (_feature, lyr) => {
            lyr.bindPopup(popupHtml(record));
            lyr.on("mouseover", () => lyr.setStyle(polygonHoverStyle));
            lyr.on("mouseout", () => lyr.setStyle(baseStyle));
          },
        });
        layer.addTo(group);
      });
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [10, 10] });
      }
      if (typeof onUnmappable === "function") {
        onUnmappable(failures);
      }
      const control = layerControlRef.current;
      if (control) {
        const newTree = {
          label: "Overlays",
          children: [{ label: "This taxon", layer: group }],
        };
        control.setOverlayTree(newTree);
      }
    });

    return () => {
      cancelled = true;
      group.remove();
      focalGroupRef.current = null;
    };
  }, [records, onUnmappable]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{ height: 360, width: "100%", background: "#f5f5f5" }}
      />
      {presentMeans.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            zIndex: 1000,
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            padding: "6px 8px",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {presentMeans.map((m) => (
            <div
              key={m.key}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  background: m.color,
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 2,
                }}
              />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DistributionsMap;
