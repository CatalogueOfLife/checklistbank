import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Radio } from "antd";
import axios from "axios";
import config from "../../config";

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
  { key: "uncertain", label: "Uncertain", color: "#66C5CC" },
];

const ESTABLISHMENT_COLORS = Object.fromEntries(
  ESTABLISHMENT_MEANS.map((m) => [m.key, m.color])
);
const DEFAULT_KEY = "uncertain";

const normalizeKey = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const resolveKey = (record) => {
  const k = normalizeKey(record?.establishmentMeans);
  return ESTABLISHMENT_COLORS[k] ? k : DEFAULT_KEY;
};

const colorFor = (record) => ESTABLISHMENT_COLORS[resolveKey(record)];

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
    },
  },
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

const DistributionsMap = ({ records, onUnmappable }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [basemap, setBasemap] = useState(DEFAULT_BASEMAP);

  const presentMeans = useMemo(() => {
    if (!records?.length) return [];
    const seen = new Set(records.map(resolveKey));
    return ESTABLISHMENT_MEANS.filter((m) => seen.has(m.key));
  }, [records]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      worldCopyJump: true,
    }).setView([20, 0], 2);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const def = BASEMAPS.find((b) => b.key === basemap) || BASEMAPS[0];
    const newLayer = L.tileLayer(def.url, def.options).addTo(map);
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = newLayer;
    const max = def.options?.maxZoom;
    if (typeof max === "number" && map.getZoom() > max) {
      map.setZoom(max);
    }
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !records?.length) return;
    let cancelled = false;
    const group = L.featureGroup().addTo(map);
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
    });

    return () => {
      cancelled = true;
      group.remove();
    };
  }, [records, onUnmappable]);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{ height: 360, width: "100%", background: "#f5f5f5" }}
      />
      <Radio.Group
        size="small"
        value={basemap}
        onChange={(e) => setBasemap(e.target.value)}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 1000,
          background: "#fff",
          borderRadius: 4,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {BASEMAPS.map((b) => (
          <Radio.Button key={b.key} value={b.key}>
            {b.label}
          </Radio.Button>
        ))}
      </Radio.Group>
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
