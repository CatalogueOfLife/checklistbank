import {
  JOB_LANE,
  RELEASE_JOBS,
  EXPORT_JOBS,
  LIVE_STATUS,
  DONE_STATUS,
} from "../../api/job";

/**
 * Quick filters over the unified job history.
 *
 * Two things every preset but "Running" settles:
 *
 * The SYNC lane is left out of the default. Sector syncs are roughly 6.9M of
 * the ~7.9M rows in the job table and grow by ~63k a week, so an unfiltered
 * history shows nothing but syncs. Picking "Syncs" opts in.
 *
 * Only the terminal statuses are shown. The job table holds waiting and running
 * jobs too, so without this a freshly queued job appears in the history the
 * moment it is submitted - which is the Queue tab's job, not this one. The
 * status filter is a normal, visible filter, so it can be cleared or widened.
 */
export const PRESETS = [
  {
    key: "all",
    label: "All",
    params: {
      lane: [JOB_LANE.DEFAULT, JOB_LANE.IMPORT],
      status: DONE_STATUS,
    },
  },
  {
    key: "imports",
    label: "Imports",
    params: { lane: [JOB_LANE.IMPORT], status: DONE_STATUS },
  },
  {
    key: "syncs",
    label: "Syncs",
    params: { lane: [JOB_LANE.SYNC], status: DONE_STATUS },
  },
  {
    key: "releases",
    label: "Releases",
    params: { job: RELEASE_JOBS, status: DONE_STATUS },
  },
  {
    key: "exports",
    label: "Exports",
    params: { job: EXPORT_JOBS, status: DONE_STATUS },
  },
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
