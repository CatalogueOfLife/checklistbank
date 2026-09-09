/**
 * Does this dataset belong to the dataset key in the current URL?
 *
 * The `dataset` in AppContext outlives the route: it is seeded from
 * localStorage (`col_selected_dataset`) at startup and kept across navigation
 * while DatasetProvider refetches. Anything that reads `dataset.key` in that
 * window acts on the *previously visited* dataset - which is how an export of
 * COL 310362 was submitted against iBOL 37384, with a root taxon id that only
 * exists in iBOL. Consumers use this to tell "the dataset for this page" from
 * "whatever dataset happens to be in context".
 *
 * The coercion is the point: route params are strings (`"310362"`) and
 * `dataset.key` is a number. Both sides are required to be a string or a number
 * first, because `Number("")`, `Number(null)` and `Number([])` are all 0 - a
 * bare `Number(a) === Number(b)` would report a match between an absent route
 * key and a dataset with key 0.
 *
 * Not every route key is a number, though. The backend's DatasetKeyRewriteFilter
 * accepts a set of aliases wherever a dataset key appears in a path:
 *
 *   gbif-<uuid>              a GBIF dataset UUID
 *   {projectKey}LR / LRC     latest public release / private release candidate
 *   {projectKey}LXR / LXRC   the extended-release variants of those
 *   {projectKey}R{attempt}   one specific release attempt
 *   COL2024 / COL24.1XR      an annual COL edition
 *
 * Only the backend knows what most of those resolve to - "latest release" is
 * not a property of any record. So a record fetched under an alias is tagged
 * with that alias (tagDatasetRouteKey) and matching accepts the tag. `gbif-` is
 * the one form a record can answer for on its own, through its gbifKey, which
 * both /dataset/simple and the full record carry.
 */
const asKey = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// A plain enumerable property, not a Symbol or a non-enumerable one: the tag
// has to survive the JSON round trip through the `col_selected_dataset` seed,
// or reloading an aliased URL drops the seed and flashes an empty header.
// ContextProvider's seed whitelist references this constant.
export const DATASET_ROUTE_KEY_FIELD = "__routeKey";

const GBIF_ALIAS = /^gbif-([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/;

const norm = (v) =>
  typeof v === "string" && v.trim() !== "" ? v.trim().toLowerCase() : null;

/**
 * Is this route key one only the backend can resolve? True for every alias
 * form above, false for a plain numeric key.
 */
export const isDatasetAlias = (routeKey) =>
  asKey(routeKey) === null && norm(routeKey) !== null;

/**
 * Record the alias a dataset was fetched under, so datasetMatchesRoute can
 * recognise it later. Returns the record unchanged for a numeric route key -
 * `key` already answers that case.
 */
export const tagDatasetRouteKey = (dataset, routeKey) =>
  dataset && isDatasetAlias(routeKey)
    ? { ...dataset, [DATASET_ROUTE_KEY_FIELD]: norm(routeKey) }
    : dataset;

export const datasetMatchesRoute = (dataset, routeKey) => {
  if (!dataset) return false;

  const b = asKey(routeKey);
  if (b !== null) {
    const a = asKey(dataset.key);
    return a !== null && a === b;
  }

  const alias = norm(routeKey);
  if (alias === null) return false;
  if (dataset[DATASET_ROUTE_KEY_FIELD] === alias) return true;

  const gbif = GBIF_ALIAS.exec(alias);
  return gbif !== null && norm(dataset.gbifKey) === gbif[1];
};
