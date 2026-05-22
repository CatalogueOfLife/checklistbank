import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./treeControl.css";
import axios from "axios";
import config from "../../../config";
import { fetchDescendants } from "./descendantFetch";
import { getDescendantRanks, INFRASPECIFIC_RANKS } from "./descendantRanks";
import { assignColors } from "./colorAssignment";
import IncludedTaxaLegend from "./IncludedTaxaLegend";

const POPUP_FIELDS = [
  "establishmentMeans",
  "degreeOfEstablishment",
  "pathway",
  "threatStatus",
  "year",
  "lifeStage",
];

export const ESTABLISHMENT_MEANS = [
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
export const MISSING_COLOR = "#66C5CC";

const normalizeKey = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const resolveKey = (record) => {
  const raw = record?.establishmentMeans;
  if (raw == null || raw === "") return null;
  const k = normalizeKey(raw);
  return ESTABLISHMENT_COLORS[k] ? k : "uncertain";
};

const colorFor = (record) => {
  const k = resolveKey(record);
  return k == null ? MISSING_COLOR : ESTABLISHMENT_COLORS[k];
};

const POSITRON_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// Layer IDs
const FOCAL_SOURCE = "col-focal-distributions";
const FOCAL_FILL = "col-focal-fill";
const FOCAL_LINE = "col-focal-line";
const descendantSourceId = (id) => `col-descendant-${id}`;
const descendantFillId = (id) => `col-descendant-fill-${id}`;
const descendantLineId = (id) => `col-descendant-line-${id}`;

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

const descendantPopupHtml = (taxon, record) => {
  const head =
    `<div style="font-weight:600;font-style:italic;margin-bottom:4px">${escapeHtml(
      taxon.scientificName
    )}</div>` +
    `<div style="color:#888;margin-bottom:4px">${escapeHtml(taxon.rank || "")}</div>`;
  return head + popupHtml(record);
};

const RANK_LABEL_PLURAL = {
  subspecies: "subspecies",
  variety: "varieties",
  subvariety: "subvarieties",
  form: "forms",
  subform: "subforms",
  "infraspecific name": "infraspecific names",
};
const rankLabelPlural = (rank) => RANK_LABEL_PLURAL[rank] || rank;

const epithet = (scientificName) => {
  if (!scientificName) return "";
  const tokens = scientificName.trim().split(/\s+/);
  return tokens[tokens.length - 1];
};

const computeBounds = (features) => {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;
  const visit = (coords) => {
    if (typeof coords[0] === "number") {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else {
      for (let i = 0; i < coords.length; i++) visit(coords[i]);
    }
  };
  for (let i = 0; i < features.length; i++) {
    const g = features[i]?.geometry;
    if (g?.coordinates) visit(g.coordinates);
  }
  if (minLng === Infinity) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
};

const flattenFeatures = (geojson) => {
  if (!geojson) return [];
  if (geojson.type === "FeatureCollection") return geojson.features || [];
  return [geojson];
};

const supported = () => {
  if (typeof maplibregl?.supported === "function") return maplibregl.supported();
  return typeof WebGLRenderingContext !== "undefined";
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
  const popupRef = useRef(null);
  const recordMapRef = useRef(new Map());
  const descendantTaxonMapRef = useRef(new Map());
  const descendantRecordMapRef = useRef(new Map());
  const focalAttachedRef = useRef(false);
  const descendantLayersRef = useRef(new Set());

  const [styleReady, setStyleReady] = useState(false);
  const [focalReady, setFocalReady] = useState(false);
  const [descendantState, setDescendantState] = useState({
    status: "idle", // idle | loading | ready | empty | error
    taxa: [],
  });
  const [focalVisible, setFocalVisible] = useState(true);
  const [visibleTaxonIds, setVisibleTaxonIds] = useState(new Set());
  const [controlOpen, setControlOpen] = useState(false);
  const fetchTriggeredRef = useRef(false);

  const presentMeans = useMemo(() => {
    if (!records?.length) return [];
    const seen = new Set();
    records.forEach((r) => {
      const k = resolveKey(r);
      if (k != null) seen.add(k);
    });
    return ESTABLISHMENT_MEANS.filter((m) => seen.has(m.key));
  }, [records]);

  const descendantColors = useMemo(() => {
    if (descendantState.status !== "ready") return {};
    return assignColors(
      descendantState.taxa.filter((t) => t.mappable.length > 0),
      rankOrder || []
    );
  }, [descendantState, rankOrder]);

  const descendantLegend = useMemo(() => {
    if (descendantState.status !== "ready") {
      return { visibleGroups: [], unmappableGroups: [] };
    }
    const decorate = (t) => ({
      ...t,
      color: descendantColors[t.id],
      displayName: epithet(t.scientificName),
    });
    const groupByRank = (taxa) => {
      const byRank = {};
      taxa.forEach((t) => {
        (byRank[t.rank] = byRank[t.rank] || []).push(decorate(t));
      });
      return INFRASPECIFIC_RANKS.filter((r) => byRank[r]).map((r) => ({
        rank: r,
        label: rankLabelPlural(r),
        taxa: byRank[r],
      }));
    };
    const visibleGroups = groupByRank(
      descendantState.taxa.filter(
        (t) => t.mappable.length > 0 && visibleTaxonIds.has(t.id)
      )
    );
    const unmappableGroups = groupByRank(
      descendantState.taxa.filter((t) => t.mappable.length === 0)
    );
    return { visibleGroups, unmappableGroups };
  }, [descendantState, descendantColors, visibleTaxonIds]);

  const showDescendantLegend = descendantLegend.visibleGroups.length > 0;

  // Mount map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!supported()) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: POSITRON_STYLE,
      center: [0, 20],
      zoom: 1,
      minZoom: 0,
      attributionControl: false,
      renderWorldCopies: true,
    });
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-left"
    );
    mapRef.current = map;

    map.on("load", () => {
      setStyleReady(true);
      // Start the attribution control collapsed. MapLibre opens it by
      // default in compact mode; remove the `compact-show` class so the
      // text stays hidden until the user clicks the (i) button.
      const attrib = map
        .getContainer()
        .querySelector(".maplibregl-ctrl-attrib");
      if (attrib) attrib.classList.remove("maplibregl-compact-show");
    });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => map.resize())
        : null;
    if (resizeObserver) resizeObserver.observe(containerRef.current);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      map.remove();
      mapRef.current = null;
      focalAttachedRef.current = false;
      descendantLayersRef.current = new Set();
    };
  }, []);

  // Focal taxon polygons.
  useEffect(() => {
    if (!styleReady || !records?.length) return;
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    setFocalReady(false);

    Promise.allSettled(
      records.map((r) =>
        fetchShape(r.area.gazetteer, r.area.id).then((geojson) => ({
          record: r,
          geojson,
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      const features = [];
      const recordMap = new Map();
      let failures = 0;
      results.forEach((res, i) => {
        if (res.status !== "fulfilled" || !res.value.geojson) {
          failures += 1;
          return;
        }
        const { record, geojson } = res.value;
        const color = colorFor(record);
        const recordKey = `focal-${i}`;
        recordMap.set(recordKey, record);
        flattenFeatures(geojson).forEach((f) => {
          features.push({
            ...f,
            properties: {
              ...(f.properties || {}),
              _recordKey: recordKey,
              _color: color,
            },
          });
        });
      });
      recordMapRef.current = recordMap;

      const data = { type: "FeatureCollection", features };
      if (map.getSource(FOCAL_SOURCE)) {
        map.getSource(FOCAL_SOURCE).setData(data);
      } else {
        map.addSource(FOCAL_SOURCE, { type: "geojson", data });
        map.addLayer({
          id: FOCAL_FILL,
          type: "fill",
          source: FOCAL_SOURCE,
          paint: {
            "fill-color": ["coalesce", ["get", "_color"], MISSING_COLOR],
            "fill-opacity": 0.65,
          },
        });
        map.addLayer({
          id: FOCAL_LINE,
          type: "line",
          source: FOCAL_SOURCE,
          paint: {
            "line-color": ["coalesce", ["get", "_color"], MISSING_COLOR],
            "line-width": 1,
          },
        });
        map.on("click", FOCAL_FILL, onFocalClick);
        map.on("mouseenter", FOCAL_FILL, onMouseEnter);
        map.on("mouseleave", FOCAL_FILL, onMouseLeave);
        focalAttachedRef.current = true;
      }

      if (features.length > 0) {
        const bounds = computeBounds(features);
        if (bounds) map.fitBounds(bounds, { padding: 20, animate: false });
      }
      if (typeof onUnmappable === "function") onUnmappable(failures);
      setFocalReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [styleReady, records]);

  const onFocalClick = (e) => {
    const map = mapRef.current;
    if (!map) return;
    const feature = e.features?.[0];
    const key = feature?.properties?._recordKey;
    const record = key ? recordMapRef.current.get(key) : null;
    if (!record) return;
    if (popupRef.current) popupRef.current.remove();
    popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "320px" })
      .setLngLat(e.lngLat)
      .setHTML(popupHtml(record))
      .addTo(map);
  };

  const onMouseEnter = () => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = "pointer";
  };
  const onMouseLeave = () => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = "";
  };

  // Sync focal visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focalAttachedRef.current) return;
    const v = focalVisible ? "visible" : "none";
    if (map.getLayer(FOCAL_FILL)) map.setLayoutProperty(FOCAL_FILL, "visibility", v);
    if (map.getLayer(FOCAL_LINE)) map.setLayoutProperty(FOCAL_LINE, "visibility", v);
  }, [focalVisible, focalReady]);

  // Descendant layers.
  useEffect(() => {
    if (!styleReady) return;
    const map = mapRef.current;
    if (!map) return;
    descendantLayersRef.current.forEach((id) => {
      if (map.getLayer(descendantFillId(id))) map.removeLayer(descendantFillId(id));
      if (map.getLayer(descendantLineId(id))) map.removeLayer(descendantLineId(id));
      if (map.getSource(descendantSourceId(id))) map.removeSource(descendantSourceId(id));
    });
    descendantLayersRef.current = new Set();
    descendantTaxonMapRef.current = new Map();
    descendantRecordMapRef.current = new Map();

    if (descendantState.status !== "ready") return;
    const colors = descendantColors;
    descendantState.taxa.forEach((t) => {
      if (t.mappable.length === 0) return;
      descendantTaxonMapRef.current.set(t.id, t);
      Promise.allSettled(
        t.mappable.map((rec) =>
          fetchShape(rec.area.gazetteer, rec.area.id).then((geojson) => ({
            record: rec,
            geojson,
          }))
        )
      ).then((results) => {
        if (!mapRef.current) return;
        const features = [];
        results.forEach((res, i) => {
          if (res.status !== "fulfilled" || !res.value.geojson) return;
          const { record, geojson } = res.value;
          const recordKey = `desc-${t.id}-${i}`;
          descendantRecordMapRef.current.set(recordKey, { taxon: t, record });
          flattenFeatures(geojson).forEach((f) => {
            features.push({
              ...f,
              properties: {
                ...(f.properties || {}),
                _recordKey: recordKey,
              },
            });
          });
        });
        const color = colors[t.id] || MISSING_COLOR;
        const data = { type: "FeatureCollection", features };
        const srcId = descendantSourceId(t.id);
        if (mapRef.current.getSource(srcId)) {
          mapRef.current.getSource(srcId).setData(data);
        } else {
          mapRef.current.addSource(srcId, { type: "geojson", data });
          const fillId = descendantFillId(t.id);
          const lineId = descendantLineId(t.id);
          mapRef.current.addLayer({
            id: fillId,
            type: "fill",
            source: srcId,
            paint: { "fill-color": color, "fill-opacity": 0.55 },
            layout: { visibility: "none" },
          });
          mapRef.current.addLayer({
            id: lineId,
            type: "line",
            source: srcId,
            paint: { "line-color": color, "line-width": 2 },
            layout: { visibility: "none" },
          });
          mapRef.current.on("click", fillId, onDescendantClick);
          mapRef.current.on("mouseenter", fillId, onMouseEnter);
          mapRef.current.on("mouseleave", fillId, onMouseLeave);
          descendantLayersRef.current.add(t.id);
        }
      });
    });
  }, [styleReady, descendantState, descendantColors]);

  const onDescendantClick = (e) => {
    const map = mapRef.current;
    if (!map) return;
    const feature = e.features?.[0];
    const key = feature?.properties?._recordKey;
    const data = key ? descendantRecordMapRef.current.get(key) : null;
    if (!data) return;
    if (popupRef.current) popupRef.current.remove();
    popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "320px" })
      .setLngLat(e.lngLat)
      .setHTML(descendantPopupHtml(data.taxon, data.record))
      .addTo(map);
  };

  // Sync descendant visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    descendantLayersRef.current.forEach((id) => {
      const v = visibleTaxonIds.has(id) ? "visible" : "none";
      if (map.getLayer(descendantFillId(id))) {
        map.setLayoutProperty(descendantFillId(id), "visibility", v);
      }
      if (map.getLayer(descendantLineId(id))) {
        map.setLayoutProperty(descendantLineId(id), "visibility", v);
      }
    });
  }, [visibleTaxonIds, descendantState]);

  const triggerDescendantFetch = () => {
    if (fetchTriggeredRef.current) return;
    if (!datasetKey || !focalTaxon || !rankOrder) return;
    const focalRank = focalTaxon?.name?.rank;
    if (!focalRank) return;
    if (focalRank !== "species" && !INFRASPECIFIC_RANKS.includes(focalRank)) return;
    const ranks = getDescendantRanks(focalRank, rankOrder);
    if (ranks.length === 0) return;
    fetchTriggeredRef.current = true;
    setDescendantState({ status: "loading", taxa: [] });
    fetchDescendants({ datasetKey, focalTaxon, rankOrder }).then(
      ({ taxa, descendantsFailed }) => {
        if (descendantsFailed) {
          setDescendantState({ status: "error", taxa: [] });
          return;
        }
        if (taxa.length === 0) {
          setDescendantState({ status: "empty", taxa: [] });
          return;
        }
        setDescendantState({ status: "ready", taxa });
      }
    );
  };

  const openControl = () => {
    setControlOpen(true);
    triggerDescendantFetch();
  };

  const descendantsByRank = useMemo(() => {
    if (descendantState.status !== "ready") return [];
    const byRank = {};
    descendantState.taxa
      .filter((t) => t.mappable.length > 0)
      .forEach((t) => {
        (byRank[t.rank] = byRank[t.rank] || []).push(t);
      });
    return INFRASPECIFIC_RANKS.filter((r) => byRank[r]).map((r) => ({
      rank: r,
      label: rankLabelPlural(r),
      taxa: byRank[r].slice().sort((a, b) =>
        a.scientificName.localeCompare(b.scientificName)
      ),
    }));
  }, [descendantState]);

  const toggleTaxon = (id) => {
    setVisibleTaxonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRankGroup = (rankTaxa) => {
    setVisibleTaxonIds((prev) => {
      const next = new Set(prev);
      const allOn = rankTaxa.every((t) => prev.has(t.id));
      rankTaxa.forEach((t) => {
        if (allOn) next.delete(t.id);
        else next.add(t.id);
      });
      return next;
    });
  };

  if (!supported()) {
    return (
      <div
        style={{
          padding: 12,
          background: "#fafafa",
          border: "1px solid #eee",
          borderRadius: 4,
          color: "#666",
          fontSize: 12,
        }}
      >
        Maps require WebGL, which your browser doesn't support.
      </div>
    );
  }

  const focalName = focalTaxon?.name?.scientificName || "This taxon";

  return (
    <div className="col-distributions-map" style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{ height: 360, width: "100%", background: "#f5f5f5" }}
      />

      <LayerControl
        open={controlOpen}
        onOpen={openControl}
        onClose={() => setControlOpen(false)}
        focalName={focalName}
        focalReady={focalReady}
        focalVisible={focalVisible}
        onToggleFocal={() => setFocalVisible((v) => !v)}
        descendantStatus={descendantState.status}
        descendantsByRank={descendantsByRank}
        descendantColors={descendantColors}
        visibleTaxonIds={visibleTaxonIds}
        onToggleTaxon={toggleTaxon}
        onToggleRankGroup={toggleRankGroup}
        onRetry={() => {
          fetchTriggeredRef.current = false;
          setDescendantState({ status: "idle", taxa: [] });
          triggerDescendantFetch();
        }}
      />

      {!showDescendantLegend && presentMeans.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            zIndex: 1,
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
      {showDescendantLegend && (
        <IncludedTaxaLegend
          visibleGroups={descendantLegend.visibleGroups}
          unmappableGroups={descendantLegend.unmappableGroups}
        />
      )}
    </div>
  );
};

const LayerControl = ({
  open,
  onOpen,
  onClose,
  focalName,
  focalReady,
  focalVisible,
  onToggleFocal,
  descendantStatus,
  descendantsByRank,
  descendantColors,
  visibleTaxonIds,
  onToggleTaxon,
  onToggleRankGroup,
  onRetry,
}) => {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={onOpen}
        title="Layers"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          width: 30,
          height: 30,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.2)",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 18,
          lineHeight: "26px",
          padding: 0,
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        +
      </button>
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 2,
        background: "#fff",
        borderRadius: 4,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        padding: "6px 10px",
        fontSize: 12,
        lineHeight: 1.5,
        maxHeight: 320,
        overflowY: "auto",
        minWidth: 160,
      }}
      onMouseLeave={onClose}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="checkbox"
          checked={focalVisible}
          disabled={!focalReady}
          onChange={onToggleFocal}
        />
        <span style={{ fontStyle: "italic" }}>{focalName}</span>
      </div>
      {descendantStatus === "loading" && (
        <div style={{ marginTop: 6, color: "#888" }}>Loading descendants…</div>
      )}
      {descendantStatus === "error" && (
        <div style={{ marginTop: 6, color: "#888" }}>
          Couldn&apos;t load descendants.{" "}
          <a onClick={onRetry} style={{ cursor: "pointer" }}>
            Retry
          </a>
        </div>
      )}
      {descendantStatus === "ready" &&
        descendantsByRank.map((group) => {
          const allOn = group.taxa.every((t) => visibleTaxonIds.has(t.id));
          const someOn = group.taxa.some((t) => visibleTaxonIds.has(t.id));
          return (
            <div key={group.rank} style={{ marginTop: 6 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={allOn}
                  ref={(el) => {
                    if (el) el.indeterminate = !allOn && someOn;
                  }}
                  onChange={() => onToggleRankGroup(group.taxa)}
                />
                {group.label}
              </label>
              <div style={{ paddingLeft: 18 }}>
                {group.taxa.map((t) => (
                  <label
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visibleTaxonIds.has(t.id)}
                      onChange={() => onToggleTaxon(t.id)}
                    />
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        background: descendantColors[t.id],
                        border: "1px solid rgba(0,0,0,0.15)",
                        borderRadius: 2,
                      }}
                    />
                    <span style={{ fontStyle: "italic" }}>
                      {epithet(t.scientificName)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default DistributionsMap;
