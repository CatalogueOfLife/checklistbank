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
 */
const asKey = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const datasetMatchesRoute = (dataset, routeKey) => {
  if (!dataset) return false;
  const a = asKey(dataset.key);
  const b = asKey(routeKey);
  return a !== null && b !== null && a === b;
};
