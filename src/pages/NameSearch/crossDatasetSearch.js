// A cross dataset search without a query term and without a dataset filter
// pages through the whole index in no useful order and costs seconds, so the
// page does not send it. A dataset filter alone is cheap: without a term no
// facets are requested.
export const isCrossDatasetSearchable = (params) => {
  const q = typeof params?.q === "string" ? params.q.trim() : params?.q;
  const datasets = []
    .concat(params?.datasetKey ?? [])
    .filter((k) => k != null && String(k).trim() !== "");
  return !!q || datasets.length > 0;
};
