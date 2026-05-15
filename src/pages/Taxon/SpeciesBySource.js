import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import DataLoader from "dataloader";
import axios from "axios";
import config from "../../config";

const TOP_N = 10;
const MAX_EXPANDED = 100;

const datasetLoader = new DataLoader((ids) =>
  Promise.all(
    ids.map((id) =>
      axios(`${config.dataApi}dataset/${id}`).then(
        (r) => r.data,
        () => null
      )
    )
  )
);

const rowStyle = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
};
const countStyle = {
  flex: "0 0 auto",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};
const titleStyle = {
  flex: "1 1 auto",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const SpeciesBySource = ({ counts, datasetKey, taxonId }) => {
  const [showAll, setShowAll] = useState(false);
  const [titles, setTitles] = useState({});

  const sorted = useMemo(
    () =>
      Object.entries(counts || {})
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count),
    [counts]
  );

  const countWidth = sorted[0]
    ? `${sorted[0].count.toLocaleString("en-GB").length}ch`
    : "1ch";
  const expandedCount = Math.min(sorted.length, MAX_EXPANDED);
  const visible = showAll
    ? sorted.slice(0, expandedCount)
    : sorted.slice(0, TOP_N);

  useEffect(() => {
    const missing = visible.map((e) => e.key).filter((k) => !(k in titles));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.map((k) => datasetLoader.load(Number(k)))).then(
      (datasets) => {
        if (cancelled) return;
        setTitles((prev) => {
          const next = { ...prev };
          missing.forEach((k, i) => {
            next[k] = datasets[i] || null;
          });
          return next;
        });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [visible, titles]);

  if (sorted.length === 0) return null;

  const hidden = sorted.length - visible.length;

  return (
    <div>
      {visible.map((e) => {
        const d = titles[e.key];
        const label = d?.title || d?.alias || `Dataset ${e.key}`;
        return (
          <div key={e.key} style={rowStyle}>
            <span style={{ ...countStyle, width: countWidth }}>
              {e.count.toLocaleString("en-GB")}
            </span>
            <NavLink
              to={{
                pathname: `/dataset/${datasetKey}/names`,
                search: `?TAXON_ID=${encodeURIComponent(
                  taxonId
                )}&sectorDatasetKey=${e.key}&rank=species&status=accepted&status=provisionally%20accepted`,
              }}
              style={titleStyle}
              title={label}
            >
              {label}
            </NavLink>
          </div>
        );
      })}
      {hidden > 0 && !showAll && (
        <a onClick={() => setShowAll(true)} style={{ cursor: "pointer" }}>
          {sorted.length > MAX_EXPANDED
            ? `Show top ${MAX_EXPANDED} of ${sorted.length}`
            : `Show all (${sorted.length})`}
        </a>
      )}
      {showAll && sorted.length > TOP_N && (
        <>
          {sorted.length > MAX_EXPANDED && (
            <div style={{ color: "#999", marginTop: 4 }}>
              {(sorted.length - MAX_EXPANDED).toLocaleString("en-GB")} more
              sources not shown.
            </div>
          )}
          <a onClick={() => setShowAll(false)} style={{ cursor: "pointer" }}>
            Show less
          </a>
        </>
      )}
    </div>
  );
};

export default SpeciesBySource;
