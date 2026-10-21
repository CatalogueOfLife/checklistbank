import React, { useState } from "react";
import { Tag, Tooltip } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import BorderedListItem from "../Taxon/BorderedListItem";
import ShowMoreToggle from "../Taxon/ShowMoreToggle";
import MergedDataBadge from "../../components/MergedDataBadge";
import ReferencePopover from "../project/ProjectReferences/ReferencePopover";
import { getTypeColor, getLinks } from "../Taxon/TypeMaterial";
import withContext from "../../components/hoc/withContext";

const TOP_N = 10;

// primary types (holo-, lecto-, neotype) first, then the ones getTypeColor groups after them
const COLOR_ORDER = ["#e2614a", "#f1eb0b", "#7edaff"];
const statusOrder = (status) => {
  const i = COLOR_ORDER.indexOf(getTypeColor(status));
  return i < 0 ? COLOR_ORDER.length : i;
};

const countryLabel = (c) => (c && typeof c === "object" ? c.name || c.title || c.iso2 : c);

// The specimen as cited, or pieced together from its structured fields
export const describeSpecimen = (s) => {
  if (s?.citation) return s.citation;
  const coordinate = s?.coordinate
    ? `${s.coordinate.lat}, ${s.coordinate.lon}`
    : [s?.latitude, s?.longitude].filter(Boolean).join(", ");
  return [
    [s?.institutionCode, s?.catalogNumber].filter(Boolean).join(" "),
    s?.locality,
    countryLabel(s?.country),
    coordinate,
    s?.altitude,
    s?.date,
    s?.collector,
    s?.sex,
    s?.host && `host ${s.host}`,
  ]
    .filter(Boolean)
    .join("; ");
};

// The type designations of one name from /name/{id}/types: status, specimen, source and reference
const TypeDesignations = ({ designations, datasetKey, dataset }) => {
  const [showAll, setShowAll] = useState(false);
  const sorted = designations
    .map((d, i) => ({ ...d, i }))
    .sort((a, b) => statusOrder(a.status) - statusOrder(b.status) || a.i - b.i);
  const visible = showAll ? sorted : sorted.slice(0, TOP_N);
  return (
    <div style={{ marginTop: "-3px" }}>
      {visible.map(({ status, nameId, typeMaterial: s }) => (
        <BorderedListItem key={`${s.id}-${nameId}`}>
          <Tag color={getTypeColor(status)}>{status}</Tag>{" "}
          {s.merged && (
            <MergedDataBadge
              createdBy={s.createdBy}
              datasetKey={s.datasetKey}
              verbatimSourceKey={s.verbatimSourceKey}
              sourceDatasetKey={s.sourceDatasetKey}
            />
          )}
          <span>{describeSpecimen(s)}</span>{" "}
          {s.remarks && (
            <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>{s.remarks} </span>
          )}
          {s.link && (
            <Tooltip title={s.link}>
              <a href={s.link} target="_blank" rel="noreferrer">
                <LinkOutlined />
              </a>
            </Tooltip>
          )}{" "}
          {getLinks(dataset, s)}{" "}
          {s.referenceId && (
            <ReferencePopover
              datasetKey={datasetKey}
              referenceId={s.referenceId}
              placement="top"
            />
          )}
        </BorderedListItem>
      ))}
      <ShowMoreToggle
        total={sorted.length}
        visible={TOP_N}
        showAll={showAll}
        onChange={setShowAll}
      />
    </div>
  );
};

const mapContextToProps = ({ dataset }) => ({ dataset });

export default withContext(mapContextToProps)(TypeDesignations);
