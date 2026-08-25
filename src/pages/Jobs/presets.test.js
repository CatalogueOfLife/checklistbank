import { describe, it, expect } from "vitest";
import { PRESETS, presetOf, applyPreset } from "./presets";
import { DONE_STATUS, LIVE_STATUS } from "../../api/job";

describe("job history presets", () => {
  it("defaults to excluding the sync lane", () => {
    const all = PRESETS.find((p) => p.key === "all");
    expect(all.params.lane).toEqual(["default", "import"]);
    expect(all.params.lane).not.toContain("sync");
  });

  it("round trips a preset through apply and detect", () => {
    PRESETS.forEach((p) => {
      expect(presetOf(applyPreset({}, p.key))).toBe(p.key);
    });
  });

  it("detects a preset regardless of value order", () => {
    expect(
      presetOf({ lane: ["import", "default"], status: [...DONE_STATUS].reverse() })
    ).toBe("all");
  });

  it("treats a single value and a one element array alike", () => {
    expect(presetOf({ lane: "sync", status: DONE_STATUS })).toBe("syncs");
    expect(presetOf({ status: "running" })).toBe(null);
  });

  it("returns null once filtered beyond any preset", () => {
    expect(presetOf({ lane: ["import"], status: ["failed"] })).toBe(null);
  });

  it("keeps unrelated filters but drops paging when switching preset", () => {
    const next = applyPreset(
      { lane: ["import"], datasetKey: 3, createdBy: 7, offset: 40 },
      "syncs"
    );
    expect(next).toEqual({
      datasetKey: 3,
      createdBy: 7,
      lane: ["sync"],
      status: DONE_STATUS,
    });
  });

  it("replaces the facets a preset owns rather than merging them", () => {
    const next = applyPreset({ job: ["ImportJob"], status: ["waiting"] }, "exports");
    expect(next.status).toEqual(DONE_STATUS);
    expect(next.job).not.toContain("ImportJob");
  });

  it("shows only terminal jobs, so the queue does not leak into the history", () => {
    // a job is written to the job table on submit, so without this a freshly
    // queued job would appear in the history straight away
    PRESETS.filter((p) => p.key !== "running").forEach((p) => {
      expect(p.params.status).toEqual(DONE_STATUS);
      expect(p.params.status).not.toContain("waiting");
      expect(p.params.status).not.toContain("running");
      expect(p.params.status).not.toContain("blocked");
    });
  });

  it("keeps Running as the way back to live jobs", () => {
    expect(applyPreset({}, "running").status).toEqual(LIVE_STATUS);
    expect(presetOf({ status: LIVE_STATUS })).toBe("running");
  });

  it("lets an explicit status override the preset", () => {
    // clearing or widening the status chips must not snap back to a preset
    expect(presetOf({ lane: ["import"], status: ["waiting"] })).toBe(null);
  });
});
