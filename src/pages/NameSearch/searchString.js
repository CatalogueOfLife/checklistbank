import qs from "query-string";

// The query string of a search as the page requests it and writes it to the
// URL: facets are never kept, an empty term is dropped and the offset follows
// the page. The page compares it with the URL to tell its own URL updates
// from navigation by the user.
export const searchStringOf = (params, pagination) => {
  const { pageSize: limit, current } = pagination;
  const p = { ...params, limit, offset: (current - 1) * limit };
  delete p.facet;
  if (!p.q) delete p.q;
  return qs.stringify(p);
};
