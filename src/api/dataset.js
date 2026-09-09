import axios from "axios";
import config from "../config";
import duplicatePresets from "../pages/Duplicates/queryPresets";
import qs from "query-string";

const reflect = (p) =>
  p.then(
    (v) => v.data,
    (e) => null
  );

// Batch dataset lookups (used by DataLoaders across the app) only need the
// lightweight identity fields — key, title, alias — for labels. The
// /dataset/simple endpoint serves these much faster than the full dataset
// record and takes any number of `id` params, so the whole DataLoader batch
// resolves in a single request. It returns a plain array, in any order, that
// may omit unknown keys; DataLoader requires a result that lines up one-to-one
// with the requested ids, so we re-map by key and fill gaps with null.
export const getDatasetsBatch = (ids) => {
  return axios(`${config.dataApi}dataset/simple?${qs.stringify({ id: ids })}`)
    .then((res) => {
      // Accept either a plain array or a paged { result: [...] } envelope.
      const list = Array.isArray(res.data) ? res.data : res.data?.result || [];
      const byKey = new Map(list.map((d) => [String(d.key), d]));
      return ids.map((id) => byKey.get(String(id)) ?? null);
    })
    .catch(() => ids.map(() => null));
};

// A dataset key in a URL is either a plain integer or one of the aliases the
// backend's DatasetKeyRewriteFilter resolves wherever a key sits in a path:
//
//   gbif-<uuid>              a GBIF dataset UUID
//   {projectKey}LR / LRC     latest public release / private release candidate
//   {projectKey}LXR / LXRC   the extended-release variants of those
//   {projectKey}R{attempt}   one specific release attempt
//   COL2024 / COL24.1XR      an annual COL edition
const NUMERIC_KEY = /^\d+$/;

export const isDatasetAlias = (key) =>
  typeof key === "string" &&
  key.trim() !== "" &&
  !NUMERIC_KEY.test(key.trim());

// The integer key behind an alias, or null if nothing answers to it.
//
// Only the backend can do this, and only in a path: the rewrite filter
// swaps the alias for its key before routing, so any dataset sub-resource
// resolves one. The collection endpoint cannot - /dataset/simple takes
// List<Integer> and `id` is not among the query params the filter rewrites,
// so an alias there is an HTTP 400.
//
// /dataset/{key}/simple is the per-record projection, ~280 bytes, which is why
// resolving an alias never costs a full dataset record.
export const resolveDatasetAliasKey = (alias) =>
  axios(`${config.dataApi}dataset/${alias}/simple`)
    .then((res) => res.data?.key ?? null)
    .catch(() => null);

export const getSourcesBatch = (ids, projectKey) => {
  return Promise.all(
    ids.map((i) =>
      reflect(axios(`${config.dataApi}dataset/${projectKey}/source/${i}`))
    )
  );
};

export const getDuplicateOverview = ({
  datasetKey,
  projectKey,
  withDecision,
  sourceDatasetKey,
  sourceOnly,
}) => {
  let groups = [
    ...duplicatePresets.map((p) => {
      let params = { ...p.params };
      if ("boolean" === typeof withDecision) {
        params.withDecision = withDecision;
      } else {
        delete params.withDecision;
      }
      return {
        ...p,
        params,
      };
    }),
  ];

  return Promise.all(
    groups.map((g) => {
      let params = projectKey
        ? { ...g.params, projectKey }
        : { ...g.params };
      if (sourceDatasetKey) {
        params.sourceDatasetKey = sourceDatasetKey;
      }
      if (sourceOnly) {
        params.sourceOnly = sourceOnly;
      }
      return axios(
        `${config.dataApi}dataset/${datasetKey}/duplicate/count?${qs.stringify(
          params
        )}`
      )
        .then((res) => (g.count = res.data))
        .catch((err) => (g.error = err));
    })
  ).then(() => groups);
};

export const getProjects = () => {
  return axios(`${config.dataApi}dataset?origin=project`);
};

export const getDataset = (datasetKey) =>
  axios(`${config.dataApi}dataset/${datasetKey}`);
