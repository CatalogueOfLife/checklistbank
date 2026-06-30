import React from "react";
import { NavLink } from "react-router-dom";

import styles from "./CurieIdentifier.module.css";

const CLB_DATASET_RE = /^clb(\d+)$/;

/**
 * Compact two-part chip: a muted scope segment and the identifier value.
 * The whole chip becomes a link when the identifier resolves to an external
 * system (resolver template) or to another ChecklistBank dataset (clb<key>).
 */
const Chip = ({ scope, value, title, href, to }) => {
  const inner = (
    <>
      {scope && <span className={styles.scope}>{scope}</span>}
      <span className={styles.value}>{value}</span>
    </>
  );

  if (to) {
    return (
      <NavLink className={styles.chip} to={to} title={title}>
        {inner}
      </NavLink>
    );
  }
  if (href) {
    return (
      <a
        className={styles.chip}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
      >
        {inner}
      </a>
    );
  }
  return (
    <span className={styles.chip} title={title}>
      {inner}
    </span>
  );
};

const CurieIdentifier = ({ identifier, identifierScope }) => {
  const colonIdx = identifier.indexOf(":");
  if (colonIdx < 1) {
    return <Chip value={identifier} />;
  }
  const scope = identifier.slice(0, colonIdx);
  const id = identifier.slice(colonIdx + 1);

  const clbMatch = scope.match(CLB_DATASET_RE);
  if (clbMatch) {
    const datasetKey = clbMatch[1];
    return (
      <Chip
        scope="clb"
        value={id}
        title={`ChecklistBank dataset ${datasetKey}`}
        to={`/dataset/${datasetKey}/nameusage/${encodeURIComponent(id)}`}
      />
    );
  }

  const entry = identifierScope?.[scope];
  const title = entry?.title || scope;
  if (entry?.resolver) {
    const url = entry.resolver.replace("{id}", encodeURIComponent(id));
    return <Chip scope={scope} value={id} title={title} href={url} />;
  }
  return <Chip scope={scope} value={id} title={title} />;
};

/**
 * Renders a list of identifiers as compact chips flowing in a wrapping row.
 * Centralizes the layout so the taxon and name pages stay consistent.
 */
export const IdentifierList = ({ identifiers, identifierScope }) => (
  <div className={styles.list}>
    {identifiers.map((id) => (
      <CurieIdentifier
        key={id}
        identifier={id}
        identifierScope={identifierScope}
      />
    ))}
  </div>
);

export default CurieIdentifier;
