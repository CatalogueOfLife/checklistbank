import {
  JOB_LANE,
  RELEASE_JOBS,
  EXPORT_JOBS,
  DONE_STATUS,
} from "../../api/job";

/**
 * Quick filters over the unified job history.
 *
 * Three things every preset settles:
 *
 * The SYNC lane is left out of the default. Sector syncs are roughly 6.9M of
 * the ~7.9M rows in the job table and grow by ~63k a week, so an unfiltered
 * history shows nothing but syncs. Picking "Syncs" opts in.
 *
 * Only the terminal statuses are shown. The job table holds waiting and running
 * jobs too, and those are the Queue tab's subject, not this one. The status
 * filter is a normal, visible filter, so it can be cleared or widened.
 *
 * Unchanged imports are left out wherever the import lane is in scope. Once the
 * continuous importer is on, ~93% of finished import jobs are no-ops whose
 * source MD5 had not moved; they keep no metrics row, which is what backend
 * `?unchanged=` keys off. The row itself is worth keeping - it is the evidence
 * that a source was looked at and when - so this hides them rather than
 * dropping them, and the visible filter can put them back.
 */
export const PRESETS = [
  {
    key: "all",
    label: "All",
    params: {
      lane: [JOB_LANE.DEFAULT, JOB_LANE.IMPORT],
      status: DONE_STATUS,
      unchanged: false,
    },
  },
  {
    key: "imports",
    label: "Imports",
    params: {
      lane: [JOB_LANE.IMPORT],
      status: DONE_STATUS,
      unchanged: false,
    },
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
];

export const DEFAULT_PRESET = "all";

/** The facets a preset owns outright, i.e. replaces rather than merges. */
const PRESET_FACETS = ["lane", "job", "status", "unchanged"];

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
    PRESET_FACETS.every((k) => sameSet(params[k], p.params[k]))
  )?.key ?? null;

/**
 * The query a preset selection produces. Filters the preset does not speak for
 * (dataset, user, sector, dates) are carried over; the facets a preset owns are
 * replaced wholesale.
 */
export const applyPreset = (params = {}, presetKey) => {
  const preset = PRESETS.find((p) => p.key === presetKey);
  if (!preset) return params;
  const next = { ...params };
  PRESET_FACETS.forEach((k) => delete next[k]);
  delete next.offset;
  return { ...next, ...preset.params };
};
