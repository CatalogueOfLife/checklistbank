import { describe, it, expect } from "vitest";
import {
  normalizeJob,
  isQueued,
  isRunning,
  isLive,
  isDone,
  jobLabel,
  laneOfJob,
} from "./job";

// A live BackgroundJob as GET /job serves it while the job is in the executor:
// userKey + user, a lane, a serialized Throwable, and subclass getters.
const LIVE = {
  key: "2f0b1c50-0e2f-4b1a-9c5e-0000000000aa",
  job: "SectorSync",
  status: "running",
  step: "indexing",
  lane: "sync",
  priority: "medium",
  userKey: 100,
  user: { key: 100, username: "markus" },
  datasetKey: 3,
  sectorKey: { datasetKey: 3, id: 17 },
  created: "2026-08-24T09:00:00",
  started: "2026-08-24T09:00:04",
};

// The persisted JobInfo as GET /job/search and GET /job/{key} serve it once the
// job has left the executor: createdBy, params, resultMd5/resultSize, error as
// a plain message.
const PERSISTED = {
  key: "c3b96bb4-0601-4e84-a6e9-a31035cbb9f9",
  job: "ColdpExtendedExport",
  status: "failed",
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
  it("flattens the live shape", () => {
    const j = normalizeJob(LIVE);
    expect(j.userKey).toBe(100);
    expect(j.lane).toBe("sync");
    expect(j.live).toBe(true);
    expect(j.label).toBe("Sector sync");
    expect(j.errorMessage).toBe(null);
  });

  it("unwraps the DSID sector key the live shape uses", () => {
    expect(normalizeJob(LIVE).sectorKey).toBe(17);
    expect(normalizeJob({ ...PERSISTED, sectorKey: 17 }).sectorKey).toBe(17);
  });

  it("flattens the persisted shape onto the same fields", () => {
    const j = normalizeJob(PERSISTED);
    expect(j.userKey).toBe(100);
    expect(j.errorMessage).toBe("Export failed: disk full");
    expect(j.params).toEqual({ datasetKey: 3, format: "coldp" });
    expect(j.result).toEqual({
      md5: "ec3b96bb40601e84e6e9a31035cbb9f9",
      size: 42,
      deleted: null,
    });
    expect(j.live).toBe(false);
  });

  it("derives the lane when the response does not carry one", () => {
    expect(normalizeJob(PERSISTED).lane).toBe("default");
    expect(normalizeJob({ job: "ImportJob" }).lane).toBe("import");
    expect(normalizeJob({ job: "SectorDeleteFull" }).lane).toBe("sync");
  });

  it("reads a sync's source dataset out of the persisted params", () => {
    const j = normalizeJob({
      job: "SectorSync",
      params: { datasetKey: 3, sectorKey: 17, subjectDatasetKey: 1010 },
    });
    expect(j.sourceDatasetKey).toBe(1010);
  });

  it("carries no result when the job produced no file", () => {
    expect(normalizeJob({ job: "IndexJob", status: "finished" }).result).toBe(
      null
    );
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

describe("job labels", () => {
  it("labels known job classes", () => {
    expect(jobLabel("XRelease")).toBe("Extended release");
  });
  it("falls back to a readable class name for unknown jobs", () => {
    expect(jobLabel("SomeBrandNewJob")).toBe("Some Brand New Job");
    expect(laneOfJob("SomeBrandNewJob")).toBe("default");
  });
});
