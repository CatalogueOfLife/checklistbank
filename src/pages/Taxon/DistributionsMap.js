import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
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

const polygonStyle = {
  color: "#1677ff",
  weight: 1,
  fillColor: "#1677ff",
  fillOpacity: 0.2,
};
const polygonHoverStyle = {
  weight: 2,
  fillOpacity: 0.35,
};

const BASEMAPS = [
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
  {
    key: "nasa",
    label: "NASA",
    url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg",
    options: {
      attribution: "NASA EOSDIS &mdash; Blue Marble Next Generation",
      maxZoom: 8,
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
];
const DEFAULT_BASEMAP = "esri";

const cache = new Map();

const fetchShape = (globalId) => {
  if (cache.has(globalId)) return cache.get(globalId);
  const url = `${config.dataApi}area/${encodeURIComponent(globalId)}`;
  const p = axios(url, {
    headers: { Accept: "application/geo+json" },
  }).then(
    (r) => r.data,
    () => null
  );
  cache.set(globalId, p);
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

// Side-effect child: when the loaded shapes change, fit the map's bounds
// around them. Lives inside <MapContainer> so it can grab the map via useMap.
const FitToBounds = ({ shapes }) => {
  const map = useMap();
  useEffect(() => {
    if (!shapes.length) return;
    const group = L.featureGroup(shapes.map((s) => L.geoJSON(s.geojson)));
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [10, 10] });
    }
  }, [shapes, map]);
  return null;
};

// Clamp the current zoom when the active basemap's maxZoom is lower than
// where the user already is (Esri/NASA cap at 8, OSM/Carto go to 19).
const ClampZoom = ({ maxZoom }) => {
  const map = useMap();
  useEffect(() => {
    if (typeof maxZoom === "number" && map.getZoom() > maxZoom) {
      map.setZoom(maxZoom);
    }
  }, [maxZoom, map]);
  return null;
};

const DistributionsMap = ({ records, onUnmappable }) => {
  const [basemap, setBasemap] = useState(DEFAULT_BASEMAP);
  const [shapes, setShapes] = useState([]);

  const basemapDef = useMemo(
    () => BASEMAPS.find((b) => b.key === basemap) || BASEMAPS[0],
    [basemap]
  );

  useEffect(() => {
    if (!records?.length) {
      setShapes([]);
      return undefined;
    }
    let cancelled = false;
    Promise.allSettled(
      records.map((r) =>
        fetchShape(r.area.globalId).then((geojson) => ({ record: r, geojson }))
      )
    ).then((results) => {
      if (cancelled) return;
      const ok = [];
      let failures = 0;
      results.forEach((res) => {
        if (res.status !== "fulfilled" || !res.value.geojson) {
          failures += 1;
        } else {
          ok.push(res.value);
        }
      });
      setShapes(ok);
      if (typeof onUnmappable === "function") onUnmappable(failures);
    });
    return () => {
      cancelled = true;
    };
  }, [records, onUnmappable]);

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        worldCopyJump
        style={{ height: 360, width: "100%", background: "#f5f5f5" }}
      >
        {/* The `key` forces a fresh TileLayer when the basemap switches so
            the previous tiles aren't left half-rendered behind the new ones. */}
        <TileLayer
          key={basemapDef.key}
          url={basemapDef.url}
          {...basemapDef.options}
        />
        <ClampZoom maxZoom={basemapDef.options?.maxZoom} />
        {shapes.map(({ record, geojson }) => (
          <GeoJSON
            key={record.area.globalId}
            data={geojson}
            style={() => polygonStyle}
            onEachFeature={(_feature, lyr) => {
              lyr.bindPopup(popupHtml(record));
              lyr.on("mouseover", () => lyr.setStyle(polygonHoverStyle));
              lyr.on("mouseout", () => lyr.setStyle(polygonStyle));
            }}
          />
        ))}
        <FitToBounds shapes={shapes} />
      </MapContainer>
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
    </div>
  );
};

export default DistributionsMap;
