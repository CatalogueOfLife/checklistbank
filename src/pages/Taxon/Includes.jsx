import React from "react";
import _ from "lodash";
import { NavLink } from "react-router-dom";
import withContext from "../../components/hoc/withContext";

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
const labelStyle = {
  flex: "1 1 auto",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const IncludesTable = ({ data, style, rank, datasetKey, taxon }) => {
  const filtered = data
    .filter((t) => t.value !== taxon.name.rank)
    .sort((a, b) => rank.indexOf(a.value) - rank.indexOf(b.value));
  if (filtered.length === 0) return null;
  const maxCount = filtered.reduce((m, t) => Math.max(m, t.count), 0);
  const countWidth = `${maxCount.toLocaleString("en-GB").length}ch`;
  return (
    <div style={style}>
      {filtered.map((t) => (
        <div key={t.value} style={rowStyle}>
          <span style={{ ...countStyle, width: countWidth }}>
            {t.count.toLocaleString("en-GB")}
          </span>
          <NavLink
            to={{
              pathname: `/dataset/${datasetKey}/names`,
              search: `?TAXON_ID=${encodeURIComponent(taxon.id)}&rank=${
                t.value
              }&status=accepted&status=provisionally%20accepted`,
            }}
            style={labelStyle}
          >
            {_.startCase(t.value)}
          </NavLink>
        </div>
      ))}
    </div>
  );
};

const mapContextToProps = ({ rank }) => ({ rank });

export default withContext(mapContextToProps)(IncludesTable);
