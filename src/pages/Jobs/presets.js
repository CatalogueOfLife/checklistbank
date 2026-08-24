import {
  JOB_LANE,
  RELEASE_JOBS,
  EXPORT_JOBS,
  LIVE_STATUS,
} from "../../api/job";

/**
 * Quick filters over the unified job history.
 *
 * The default preset deliberately leaves the SYNC lane out. Sector syncs are
 * roughly 6.9M of the ~7.9M rows in the job table and grow by ~63k a week, so
 * an unfiltered history shows nothing but syncs. Picking "Syncs" opts in.
 */
export const PRESETS = [
  { key: "all", label: "All", params: { lane: [JOB_LANE.DEFAULT, JOB_LANE.IMPORT] } },
  { key: "imports", label: "Imports", params: { lane: [JOB_LANE.IMPORT] } },
  { key: "syncs", label: "Syncs", params: { lane: [JOB_LANE.SYNC] } },
  { key: "releases", label: "Releases", params: { job: RELEASE_JOBS } },
  { key: "exports", label: "Exports", params: { job: EXPORT_JOBS } },
  { key: "running", label: "Running", params: { status: LIVE_STATUS } },
];

export const DEFAULT_PRESET = "all";

const asArray = (v) => (v === undefined || v === null ? [] : [].concat(v));

const sameSet = (a, b) => {
  const x = asArray(a).map(String).sort();
  const y = asArray(b).map(String).sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
};

/**
 * Which preset, if any, the current query corresponds to. Used to highlight the
 * segmented control after a reload or a back/forward navigation. Returns null
 * when the user has filtered beyond any preset.
 */
export const presetOf = (params = {}) =>
  PRESETS.find((p) =>
    ["lane", "job", "status"].every((k) => sameSet(params[k], p.params[k]))
  )?.key ?? null;

/**
 * The query a preset selection produces. Filters the preset does not speak for
 * (dataset, user, sector, dates) are carried over; the three facets a preset
 * owns are replaced wholesale.
 */
export const applyPreset = (params = {}, presetKey) => {
  const preset = PRESETS.find((p) => p.key === presetKey);
  if (!preset) return params;
  const next = { ...params };
  ["lane", "job", "status"].forEach((k) => delete next[k]);
  delete next.offset;
  return { ...next, ...preset.params };
};
