import qs from "query-string";

// COL's Eukaryota. Release IDs are stable across COL releases, so the same id
// roots both sides of the diff - but it means nothing in other projects, hence
// the existence probe in index.jsx before it is used.
export const DIFF_ROOT = "CS5HF";

// The ranks a release review looks at for duplicates: everything from the top
// of the rank enum down to family. The enum arrives ordered highest first.
export const ranksDownTo = (ranks, lowest = "family") => {
  if (!Array.isArray(ranks)) return [];
  const idx = ranks.indexOf(lowest);
  return idx < 0 ? [] : ranks.slice(0, idx + 1);
};

export const sourceMetricsLink = (releaseKey, prevKey) =>
  `/dataset/${releaseKey}/sourcemetrics?${qs.stringify({
    releaseKey: prevKey,
  })}`;

// The names diff of the two releases, prefilled the way a release review is
// always run: down to order, authorship and synonyms out of the way.
export const namesDiffLink = (releaseKey, prevKey, root) =>
  `/tools/dataset-comparison?${qs.stringify({
    dataset: releaseKey,
    dataset2: prevKey,
    ...(root ? { root, root2: root } : {}),
    step: "diff",
    minRank: "order",
    authorship: false,
    synonyms: false,
  })}`;

export const duplicatesLink = (releaseKey, ranks) =>
  `/dataset/${releaseKey}/duplicates?${qs.stringify({
    category: "uninomial",
    limit: 50,
    minSize: 2,
    mode: "STRICT",
    rank: ranksDownTo(ranks),
    rankDifferent: false,
    status: "accepted",
  })}`;

// A file in the report directory the backend keeps for every release attempt:
// the job log, the ID reports and the AI review. The directory is keyed by the
// project and the attempt, not by the release's own dataset key.
export const releaseReportLink = (downloadApi, release, file = "") =>
  release?.sourceKey && release?.attempt
    ? `${downloadApi}releases/${release.sourceKey}/${release.attempt}/${file}`
    : null;
