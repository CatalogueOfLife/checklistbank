import { describe, it, expect } from "vitest";
import {
  normalizeJob,
  isQueued,
  isRunning,
  isLive,
  isDone,
  laneOfJob,
  humanSize,
} from "./job";

// Every job endpoint - GET /job, /job/search and /job/{key} - answers with the
// persisted JobInfo shape: createdBy rather than userKey, params as a blob,
// resultMd5/resultSize, and error as a plain message.
const RUNNING_SYNC = {
  key: "2f0b1c50-0e2f-4b1a-9c5e-0000000000aa",
  job: "SectorSync",
  status: "running",
  step: "indexing",
  lane: "sync",
  priority: "medium",
  datasetKey: 3,
  sectorKey: 17,
  createdBy: 100,
  created: "2026-08-24T09:00:00",
  started: "2026-08-24T09:00:04",
  params: { datasetKey: 3, sectorKey: 17, subjectDatasetKey: 1010 },
};

const FAILED_EXPORT = {
  key: "c3b96bb4-0601-4e84-a6e9-a31035cbb9f9",
  job: "ColdpExtendedExport",
  status: "failed",
  lane: "default",
  priority: "low",
  datasetKey: 3,
  createdBy: 100,
  created: "2026-08-20T10:00:00",
  started: "2026-08-20T10:00:02",
  finished: "2026-08-20T10:04:00",
  error: "Export failed: disk full",
  params: { datasetKey: 3, format: "coldp" },
  resultMd5: "ec3b96bb40601e84e6e9a31035cbb9f9",
  resultSize: 42,
};

describe("normalizeJob", () => {
  it("reads createdBy as the user key", () => {
    expect(normalizeJob(RUNNING_SYNC).userKey).toBe(100);
  });

  it("keeps the java class simple name verbatim, as the API filter takes it", () => {
    expect(normalizeJob(RUNNING_SYNC).job).toBe("SectorSync");
  });

  it("keeps status, step, lane and the sector key", () => {
    const j = normalizeJob(RUNNING_SYNC);
    expect(j.status).toBe("running");
    expect(j.step).toBe("indexing");
    expect(j.lane).toBe("sync");
    expect(j.sectorKey).toBe(17);
  });

  it("groups the result metadata, and omits it when there is no file", () => {
    expect(normalizeJob(FAILED_EXPORT).result).toEqual({
      md5: "ec3b96bb40601e84e6e9a31035cbb9f9",
      size: 42,
      deleted: null,
    });
    expect(normalizeJob(RUNNING_SYNC).result).toBe(null);
  });

  it("surfaces the error message", () => {
    expect(normalizeJob(FAILED_EXPORT).errorMessage).toBe(
      "Export failed: disk full"
    );
    expect(normalizeJob(RUNNING_SYNC).errorMessage).toBe(null);
  });

  it("reads a sync's source dataset out of its params", () => {
    // sourceDatasetKey is not a search filter - it only exists in the params
    // a sector sync happens to record
    expect(normalizeJob(RUNNING_SYNC).sourceDatasetKey).toBe(1010);
    expect(normalizeJob(FAILED_EXPORT).sourceDatasetKey).toBe(null);
  });

  it("derives the lane when talking to a backend that does not send one", () => {
    expect(normalizeJob({ job: "ImportJob" }).lane).toBe("import");
    expect(normalizeJob({ job: "SectorDeleteFull" }).lane).toBe("sync");
    expect(normalizeJob({ job: "IndexJob" }).lane).toBe("default");
  });

  it("returns null for a missing job", () => {
    expect(normalizeJob(null)).toBe(null);
  });
});

describe("status helpers mirror JobStatus on the backend", () => {
  it("classifies every status", () => {
    expect(isQueued("waiting")).toBe(true);
    expect(isQueued("blocked")).toBe(true);
    expect(isRunning("running")).toBe(true);
    expect(isLive("blocked")).toBe(true);
    expect(isLive("finished")).toBe(false);
    ["finished", "canceled", "failed"].forEach((s) =>
      expect(isDone(s)).toBe(true)
    );
    ["waiting", "blocked", "running"].forEach((s) =>
      expect(isDone(s)).toBe(false)
    );
  });

  it("tolerates the upper cased spelling", () => {
    expect(isRunning("RUNNING")).toBe(true);
    expect(isDone("FINISHED")).toBe(true);
  });
});

describe("job lanes", () => {
  it("puts a job class it does not know in the default lane", () => {
    expect(laneOfJob("SomeBrandNewJob")).toBe("default");
  });
  it("derives the import and sync lanes from the job class", () => {
    expect(laneOfJob("ImportJob")).toBe("import");
    expect(laneOfJob("SectorSync")).toBe("sync");
  });
});

describe("humanSize", () => {
  it("scales bytes to a readable unit", () => {
    expect(humanSize(0)).toBe("0 B");
    expect(humanSize(512)).toBe("512 B");
    expect(humanSize(2048)).toBe("2.0 kB");
    expect(humanSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });
  it("renders nothing for an absent size", () => {
    expect(humanSize(null)).toBe("");
    expect(humanSize(undefined)).toBe("");
  });
});
