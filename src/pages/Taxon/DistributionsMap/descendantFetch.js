import axios from "axios";
import config from "../../../config";
import { getDescendantRanks } from "./descendantRanks";

const POOL_SIZE = 16;

const isMappable = (r) =>
  r?.area?.gazetteer !== "text" && !!r?.area?.globalId;

const runPool = async (items, worker, size) => {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
};

const searchDescendants = async (datasetKey, focalId, ranks) => {
  if (ranks.length === 0) return [];
  const params = new URLSearchParams();
  params.append("TAXON_ID", focalId);
  ranks.forEach((r) => params.append("rank", r));
  ["accepted", "provisionally accepted"].forEach((s) =>
    params.append("status", s)
  );
  params.append("limit", "1000");
  const url = `${config.dataApi}dataset/${datasetKey}/nameusage/search?${params}`;
  const res = await axios(url);
  const list = res?.data?.result || [];
  return list
    .filter((u) => u?.usage?.id)
    .map((u) => ({
      id: u.usage.id,
      scientificName:
        u.usage?.name?.scientificName || u.usage?.label || u.usage.id,
      rank: u.usage?.name?.rank,
      parentId: u.usage?.parentId,
    }));
};

const fetchDistributions = async (datasetKey, taxonId) => {
  const url = `${config.dataApi}dataset/${datasetKey}/taxon/${encodeURIComponent(taxonId)}/distribution`;
  try {
    const res = await axios(url);
    return Array.isArray(res?.data) ? res.data : [];
  } catch {
    return [];
  }
};

/**
 * Fetch all infraspecific descendants of `focalTaxon` and their distributions.
 * Returns { taxa, descendantsFailed } where each taxon carries `mappable` (the
 * mappable subset of its distributions) and `distributions` (the full list).
 */
export const fetchDescendants = async ({ datasetKey, focalTaxon, rankOrder }) => {
  const ranks = getDescendantRanks(focalTaxon?.name?.rank, rankOrder);
  let descendantsFailed = false;
  let list = [];
  try {
    list = await searchDescendants(datasetKey, focalTaxon.id, ranks);
  } catch {
    descendantsFailed = true;
    return { taxa: [], descendantsFailed };
  }

  const distributions = await runPool(
    list,
    (t) => fetchDistributions(datasetKey, t.id),
    POOL_SIZE
  );

  const taxa = list.map((t, i) => {
    const all = distributions[i] || [];
    return { ...t, distributions: all, mappable: all.filter(isMappable) };
  });
  return { taxa, descendantsFailed };
};
