import qs from "query-string";

/**
 * The search request a download is submitted with: the current search params
 * minus paging and facets. A download is always the complete result, and facets
 * cost Elasticsearch work that nothing would read.
 */
export const downloadParamsOf = (params) => {
  const p = { ...params };
  delete p.facet;
  delete p.limit;
  delete p.offset;
  if (!p.q) {
    delete p.q;
  }
  return p;
};

// Request fields of a NameUsageSearchRequest that are not filters. The export
// endpoint only reads filters from the query string (addFilters), so these must
// travel in the JSON body - sent as query params they are silently dropped.
const REQUEST_FIELDS = ["q", "content", "type", "sortBy", "reverse", "minRank", "maxRank"];

/**
 * Splits a download request into the filters, sent as query params exactly
 * like the search does, and the JSON body carrying the other request fields.
 */
export const downloadRequestOf = (params) => {
  const query = {};
  const body = {};
  Object.entries(downloadParamsOf(params)).forEach(([k, v]) => {
    if (!REQUEST_FIELDS.includes(k)) {
      query[k] = v;
    } else if (v !== undefined && v !== null && v !== "") {
      if (k === "content") body.content = [].concat(v);
      else if (k === "reverse") body.reverse = v === true || v === "true";
      else body[k] = v;
    }
  });
  return { query, body };
};

/** Stable identity of a download request, to tell whether a job belongs to the search on screen. */
export const downloadParamsKey = (params) =>
  qs.stringify(downloadParamsOf(params));

const DEFAULT_CONTENT = ["scientific name", "authorship"];

const sameValues = (a, b) => {
  const x = [].concat(a ?? []).map((v) => String(v).toLowerCase().replace(/_/g, " ")).sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
};

/**
 * Turns the NameUsageSearchRequest stored as a SearchExport job's params back
 * into the flat query params the name search page reads from its URL. The
 * datasetKey filter is dropped as it is the path of the search page already.
 */
export const searchParamsOfRequest = (req) => {
  if (!req) return {};
  const p = {};
  if (req.q) p.q = req.q;
  Object.entries(req.filters || req.filter || {}).forEach(([k, v]) => {
    if (k !== "datasetKey") p[k] = v;
  });
  ["type", "minRank", "maxRank", "sortBy", "content"].forEach((k) => {
    if (req[k] !== undefined && req[k] !== null) p[k] = req[k];
  });
  // The stored request carries the backend defaults, which the search page
  // leaves out of its URL - and its content radio does not know them spelled
  // "scientific name". Omit them so the link reads like the original search.
  if (p.sortBy === "relevance") delete p.sortBy;
  if (sameValues(p.content, DEFAULT_CONTENT)) {
    delete p.content;
  } else if (p.content) {
    // the page radio speaks SCIENTIFIC_NAME, AUTHORSHIP, VERNACULAR_NAME
    const content = [].concat(p.content).map((c) => String(c).toUpperCase().replace(/ /g, "_"));
    p.content = content.length === 1 ? content[0] : content;
  }
  if (req.reverse) p.reverse = true;
  return p;
};

/** Link to rerun the search a SearchExport job was created for. */
export const searchUrlOfJob = (datasetKey, req) => {
  const query = qs.stringify(searchParamsOfRequest(req));
  return `/dataset/${datasetKey}/names${query ? `?${query}` : ""}`;
};
