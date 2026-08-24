import axios from "axios";
import qs from "query-string";
import _ from "lodash";
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

/**
 * Human labels for the job classes we know about. Anything else falls back to
 * a start cased class name, so a new backend job type still reads sensibly.
 */
export const JOB_LABELS = {
  ImportJob: "Import",
  ReimportJob: "Reimport all",
  ImportArticleJob: "Import articles",
  SectorSync: "Sector sync",
  SectorDelete: "Sector delete",
  SectorDeleteFull: "Sector delete (full)",
  HierarchySync: "Hierarchy sync",
  ProjectRelease: "Release",
  XRelease: "Extended release",
  ProjectDuplication: "Project duplication",
  ProjectValidationJob: "Project validation",
  ColdpExtendedExport: "ColDP export",
  DwcaExtendedExport: "DwC-A export",
  ColdpTreeExport: "ColDP tree export",
  DwcTreeExport: "DwC tree export",
  TextTreeExport: "Text tree export",
  NewickExport: "Newick export",
  DotExport: "DOT export",
  ColReleaseExportJob: "Release export",
  SearchExport: "Search export",
  MatchingJob: "Name matching",
  StreamingMatchingJob: "Name matching (streaming)",
  GlobalMatcherJob: "Build matcher",
  RematchJob: "Rematch",
  RematchArchiveJob: "Rematch archive",
  IndexJob: "Search index",
  GbifSyncJob: "GBIF sync",
  PublisherSyncJob: "Publisher sync",
  LogoUpdateJob: "Logo update",
  UsageCountJob: "Usage counts",
  RebuildMetricsJob: "Rebuild metrics",
  DeleteDatasetJob: "Delete dataset",
  HomotypicConsolidationJob: "Homotypic consolidation",
  TaxonomicAlignJob: "Taxonomic alignment",
};

export const KNOWN_JOB_TYPES = Object.keys(JOB_LABELS).sort();

export const jobLabel = (job) =>
  job ? JOB_LABELS[job] || _.startCase(job) : null;

export const laneOfJob = (job) => {
  if (IMPORT_LANE_JOBS.includes(job)) return JOB_LANE.IMPORT;
  if (SYNC_LANE_JOBS.includes(job)) return JOB_LANE.SYNC;
  return JOB_LANE.DEFAULT;
};

/**
 * GET /job/{key} answers with the live BackgroundJob while a job is still in
 * the executor and with the persisted JobInfo once it has left. The two shapes
 * differ - live carries userKey/user/lane/errorStackTrace and the job specific
 * subclass getters, persisted carries createdBy/params/resultMd5/resultSize.
 * Everything downstream works on this normalized shape instead.
 */
export const normalizeJob = (raw) => {
  if (!raw) return null;
  // a live BackgroundJob serializes its error as a Throwable bean, the
  // persisted JobInfo as a plain message string
  const err = raw.error;
  const errorMessage =
    typeof err === "string" ? err : err?.message || err?.localizedMessage || null;
  const live = _.isPlainObject(err) || !_.isUndefined(raw.userKey);
  const userKey = raw.userKey ?? raw.createdBy ?? raw.user?.key ?? null;
  const job = raw.job ?? null;
  // SectorRunnable serializes getSectorKey() as a DSID object, JobInfo as an int
  const sectorKey = _.isPlainObject(raw.sectorKey)
    ? raw.sectorKey.id
    : raw.sectorKey ?? null;

  return {
    key: raw.key,
    job,
    label: jobLabel(job),
    status: lower(raw.status),
    step: raw.step ?? null,
    lane: lower(raw.lane) || laneOfJob(job),
    priority: lower(raw.priority) ?? null,
    datasetKey: raw.datasetKey ?? null,
    sectorKey,
    sourceDatasetKey:
      raw.sourceDatasetKey ?? raw.params?.subjectDatasetKey ?? null,
    userKey,
    user: raw.user ?? null,
    created: raw.created ?? null,
    started: raw.started ?? null,
    finished: raw.finished ?? null,
    errorMessage,
    errorStackTrace: raw.errorStackTrace ?? null,
    params: raw.params ?? null,
    result:
      raw.resultMd5 || raw.resultSize || raw.result
        ? {
            md5: raw.resultMd5 ?? raw.result?.md5 ?? null,
            size: raw.resultSize ?? raw.result?.size ?? null,
            deleted: raw.resultDeleted ?? null,
          }
        : null,
    live,
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

export const cancelJob = (key) => axios.delete(`${config.dataApi}job/${key}`);

/** Content negotiated redirects served by JobResource. */
export const jobResultUrl = (key) => `${config.dataApi}job/${key}.zip`;
export const jobLogUrl = (key) => `${config.dataApi}job/${key}.log`;
