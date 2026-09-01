import axios from "axios";
import qs from "query-string";
import config from "../config";

/**
 * Client for the unified background job API introduced by backend PR #1563.
 *
 * All jobs - imports, sector syncs, releases, exports, matching, admin tasks -
 * share one lifecycle and one history. Two endpoints serve them:
 *   GET /job         the live queue, straight from executor memory
 *   GET /job/search  the persisted history, including waiting and running jobs
 *
 * Note that the backend serializes every enum lower cased
 * (PermissiveEnumSerde.enumValueName), so the wire values are "running",
 * "finished", "import", "high" - never upper case.
 */

// JobStatus
export const JOB_STATUS = {
  WAITING: "waiting",
  BLOCKED: "blocked",
  RUNNING: "running",
  FINISHED: "finished",
  CANCELED: "canceled",
  FAILED: "failed",
};

// Mirrors JobStatus.isQueued() / isRunning() / isDone() on the backend.
// Derived here rather than read off the vocab so the UI behaves the same
// whether or not the deployed backend exposes the newer vocab flags.
export const QUEUED_STATUS = [JOB_STATUS.WAITING, JOB_STATUS.BLOCKED];
export const RUNNING_STATUS = [JOB_STATUS.RUNNING];
export const LIVE_STATUS = [...QUEUED_STATUS, ...RUNNING_STATUS];
export const DONE_STATUS = [
  JOB_STATUS.FINISHED,
  JOB_STATUS.CANCELED,
  JOB_STATUS.FAILED,
];

const lower = (s) => (s ? String(s).toLowerCase() : s);

export const isQueued = (status) => QUEUED_STATUS.includes(lower(status));
export const isRunning = (status) => RUNNING_STATUS.includes(lower(status));
export const isLive = (status) => LIVE_STATUS.includes(lower(status));
export const isDone = (status) => DONE_STATUS.includes(lower(status));

// JobLane. Not served by /vocab - JobLane lives in life.catalogue.concurrent,
// outside the package VocabResource scans.
export const JOB_LANE = { DEFAULT: "default", IMPORT: "import", SYNC: "sync" };
export const JOB_LANES = [JOB_LANE.DEFAULT, JOB_LANE.IMPORT, JOB_LANE.SYNC];

// Job classes whose lane is not DEFAULT, by java class simple name.
// Used to derive `lane` when a response does not carry it.
const IMPORT_LANE_JOBS = ["ImportJob"];
const SYNC_LANE_JOBS = [
  "SectorSync",
  "SectorDelete",
  "SectorDeleteFull",
  "HierarchySync",
];

export const RELEASE_JOBS = ["ProjectRelease", "XRelease", "ProjectDuplication"];
export const EXPORT_JOBS = [
  "ColdpExtendedExport",
  "DwcaExtendedExport",
  "ColdpTreeExport",
  "DwcTreeExport",
  "TextTreeExport",
  "NewickExport",
  "DotExport",
  "ColReleaseExportJob",
  "SearchExport",
];

export const laneOfJob = (job) => {
  if (IMPORT_LANE_JOBS.includes(job)) return JOB_LANE.IMPORT;
  if (SYNC_LANE_JOBS.includes(job)) return JOB_LANE.SYNC;
  return JOB_LANE.DEFAULT;
};

/**
 * Every job endpoint answers with the persisted JobInfo shape. This flattens
 * it into what the UI actually renders: `createdBy` reads as `userKey` and the
 * result metadata is grouped. `job` stays the bare java class simple name the
 * API filters, logs and Kibana all speak.
 */
export const normalizeJob = (raw) => {
  if (!raw) return null;
  const job = raw.job ?? null;
  return {
    key: raw.key,
    job,
    status: lower(raw.status),
    step: raw.step ?? null,
    // lane is served by the job API; deriving it keeps the UI readable against
    // an older deployment that predates the column
    lane: lower(raw.lane) || laneOfJob(job),
    priority: lower(raw.priority) ?? null,
    datasetKey: raw.datasetKey ?? null,
    sectorKey: raw.sectorKey ?? null,
    // the import or sync attempt this job produced, scoped by the two keys above.
    // null for jobs that leave no metrics behind, and for an unchanged import
    attempt: raw.attempt ?? null,
    // not a search filter - only what a sync's params happen to record, used
    // to show which source dataset a sync was for
    sourceDatasetKey: raw.params?.subjectDatasetKey ?? null,
    userKey: raw.createdBy ?? null,
    created: raw.created ?? null,
    started: raw.started ?? null,
    finished: raw.finished ?? null,
    errorMessage: raw.error ?? null,
    params: raw.params ?? null,
    result:
      raw.resultMd5 || raw.resultSize
        ? {
            md5: raw.resultMd5 ?? null,
            size: raw.resultSize ?? null,
            deleted: raw.resultDeleted ?? null,
          }
        : null,
    raw,
  };
};

/** The live queue. Optionally scoped to a single dataset (a project, for syncs). */
export const getJobQueue = (datasetKey) =>
  axios
    .get(
      `${config.dataApi}job${
        datasetKey ? `?datasetKey=${encodeURIComponent(datasetKey)}` : ""
      }`
    )
    .then(({ data }) => ({
      running: (data?.running || []).map(normalizeJob),
      queued: (data?.queued || []).map(normalizeJob),
      queuedCounts: data?.queuedCounts || {},
      queuedTotal: data?.queuedTotal ?? (data?.queued || []).length,
    }));

/** The persisted history. Always sorted by created DESC - there is no sortBy. */
export const searchJobs = (params) =>
  axios
    .get(`${config.dataApi}job/search?${qs.stringify(params)}`)
    .then(({ data }) => ({
      ...data,
      result: (data?.result || []).map(normalizeJob),
    }));

export const getJob = (key) =>
  axios.get(`${config.dataApi}job/${key}`).then(({ data }) => normalizeJob(data));

export const cancelJob = (key) =>
  axios.delete(`${config.dataApi}job/${key}`).then(({ data }) => normalizeJob(data));

/**
 * The job class names the backend knows about, i.e. the values the job filter
 * accepts. Deliberately not mirrored here: a hardcoded copy of the backend's
 * job classes is what silently went stale before.
 */
export const getJobTypes = () =>
  axios
    .get(`${config.dataApi}job/types`)
    .then(({ data }) => (Array.isArray(data) ? data : []))
    .catch(() => []);

/** Byte size of a job's result archive, for display. */
export const humanSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "kB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

/** Content negotiated redirects served by JobResource. */
export const jobResultUrl = (key) => `${config.dataApi}job/${key}.zip`;
export const jobLogUrl = (key) => `${config.dataApi}job/${key}.log`;
