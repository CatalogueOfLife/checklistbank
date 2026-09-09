import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Row, Spin } from "antd";
import { isDatasetAlias, resolveDatasetAliasKey } from "../api/dataset";

// The dataset key in /dataset/:key/* and /project/:projectKey/* - the only
// place an alias can appear in one of our URLs.
export const DATASET_KEY_PATH = /^\/(dataset|project)\/([^/]+)/;

/**
 * Swaps an aliased dataset key in the URL for the integer it resolves to.
 *
 * The backend accepts gbif-<uuid>, COL2024, 3LR and friends wherever a dataset
 * key sits in a path (DatasetKeyRewriteFilter), so links built from them reach
 * the right dataset. The UI, though, keys dozens of requests off the raw route
 * param, and /dataset/simple - where DatasetProvider gets a dataset's identity -
 * takes integers only, so an alias there is an HTTP 400 that surfaces as
 * "Dataset gbif-... does not exist".
 *
 * Resolving once here and replacing the URL is the cheap fix: the address bar
 * ends up naming the dataset you actually got, and everything below this point
 * only ever sees a plain integer. Children are held back until the swap, so
 * nothing fires a request against the alias and then repeats it against the
 * resolved key.
 *
 * An alias nothing answers to falls through to the children, where the ordinary
 * not-found handling reports it.
 */
const DatasetKeyAliasGate = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [unresolvable, setUnresolvable] = useState(null);

  const match = DATASET_KEY_PATH.exec(location.pathname);
  const alias = match && isDatasetAlias(match[2]) ? match[2] : null;

  // location is deliberately absent from the deps: this must run when the key
  // changes, not on every query-string edit under the same key.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!alias) return;
    let cancelled = false;

    resolveDatasetAliasKey(alias).then((key) => {
      if (cancelled) return;
      if (key === null || key === undefined) {
        setUnresolvable(alias);
        return;
      }
      // Rewrite only the key segment, and keep the path tail, query and hash -
      // /dataset/COL2024/download?format=coldp has to survive intact.
      const path = location.pathname.replace(
        DATASET_KEY_PATH,
        (_, section) => `/${section}/${key}`
      );
      navigate(`${path}${location.search}${location.hash}`, { replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [alias]);

  if (alias && alias !== unresolvable) {
    return (
      <Row justify="center" style={{ marginTop: "24px" }}>
        <Spin size="large" />
      </Row>
    );
  }
  return children;
};

export default DatasetKeyAliasGate;
