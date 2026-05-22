import React from "react";
import { NavLink } from "react-router-dom";

const CLB_DATASET_RE = /^clb(\d+)$/;

const CurieIdentifier = ({ identifier, identifierScope }) => {
  const colonIdx = identifier.indexOf(":");
  if (colonIdx < 1) {
    return <span>{identifier}</span>;
  }
  const scope = identifier.slice(0, colonIdx);
  const id = identifier.slice(colonIdx + 1);

  const clbMatch = scope.match(CLB_DATASET_RE);
  if (clbMatch) {
    const datasetKey = clbMatch[1];
    return (
      <NavLink to={`/dataset/${datasetKey}/nameusage/${encodeURIComponent(id)}`}>
        {identifier}
      </NavLink>
    );
  }

  const entry = identifierScope?.[scope];
  if (entry?.resolver) {
    const url = entry.resolver.replace("{id}", encodeURIComponent(id));
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" title={entry.title || scope}>
        {identifier}
      </a>
    );
  }
  return <span title={entry?.title || scope}>{identifier}</span>;
};

export default CurieIdentifier;
