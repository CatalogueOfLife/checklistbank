// Search parameters the name search form has a control for, plus paging,
// sorting and facets. Every other parameter in the URL is still passed on to
// the API - e.g. sectorKey from a link in a release's sector table - so the
// search shows those as removable tags to never filter silently.
const FORM_PARAMS = new Set([
  "q",
  "content",
  "type",
  "TAXON_ID",
  "datasetKey",
  "sectorDatasetKey",
  "secondarySource",
  "secondarySourceGroup",
  "sectorMode",
  "rank",
  "status",
  "issue",
  "group",
  "nomStatus",
  "nomCode",
  "nameType",
  "field",
  "authorship",
  "authorshipYear",
  "extinct",
  "environment",
  "origin",
  "limit",
  "offset",
  "sortBy",
  "reverse",
  "facet",
]);

// [[param, [values]]] for each parameter without a form control, in URL order.
export const extraFilters = (params) =>
  Object.entries(params || {})
    .filter(([key, value]) => !FORM_PARAMS.has(key) && value != null && value !== "")
    .map(([key, value]) => [key, [].concat(value).map(String)]);
