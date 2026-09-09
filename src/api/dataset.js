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
const GBIF_ALIAS = /^gbif-([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/i;

export const isDatasetAlias = (key) =>
  typeof key === "string" &&
  key.trim() !== "" &&
  !NUMERIC_KEY.test(key.trim());

// The integer key behind an alias, or null if nothing answers to it.
//
// Only the backend can do this: /dataset/simple takes List<Integer>, and `id`
// is not one of the query params the rewrite filter rewrites, so an alias
// there is an HTTP 400. Aliases only resolve in a path.
export const resolveDatasetAliasKey = (alias) => {
  const gbif = GBIF_ALIAS.exec(String(alias).trim());
  if (gbif) {
    // /dataset/keys answers with nothing but the ids - 8 bytes - so the common
    // gbif-<uuid> link never pulls a dataset record at all.
    return axios(`${config.dataApi}dataset/keys?gbifKey=${gbif[1]}`)
      .then((res) => (Array.isArray(res.data) ? res.data[0] ?? null : null))
      .catch(() => null);
  }
  // No dataset search filter expresses "the latest release of 3" or "the 2024
  // annual edition" - those exist only as the rewrite filter's path lookup, and
  // the cheapest endpoint that echoes the resolved key back is the record
  // itself. That is ~110 kB for a COL release, but it is paid once, on entry to
  // an aliased URL, and never again: the redirect leaves a numeric key behind.
  return axios(`${config.dataApi}dataset/${alias}`)
    .then((res) => res.data?.key ?? null)
    .catch(() => null);
};

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
