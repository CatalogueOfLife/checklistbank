import { describe, it, expect } from "vitest";
import { PRESETS, presetOf, applyPreset } from "./presets";
import { DONE_STATUS } from "../../api/job";

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
      presetOf({
        lane: ["import", "default"],
        status: [...DONE_STATUS].reverse(),
        unchanged: false,
      })
    ).toBe("all");
  });

  it("treats a single value and a one element array alike", () => {
    expect(presetOf({ lane: "sync", status: DONE_STATUS })).toBe("syncs");
    expect(presetOf({ status: "running" })).toBe(null);
  });

  it("has no live preset - that is the Queue tab", () => {
    expect(PRESETS.map((p) => p.key)).not.toContain("running");
    PRESETS.forEach((p) => {
      expect(p.params.status).toEqual(DONE_STATUS);
    });
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

  it("hides unchanged imports wherever the import lane is in scope", () => {
    // ~93% of finished import jobs are no-ops once the continuous importer is
    // on, so a preset that shows the import lane must opt out of them
    expect(applyPreset({}, "all").unchanged).toBe(false);
    expect(applyPreset({}, "imports").unchanged).toBe(false);
  });

  it("does not send unchanged where no import can appear", () => {
    // ?unchanged=false is a NOT over an import lane predicate, so sending it on
    // a sync or export query only costs a needless clause
    ["syncs", "releases", "exports"].forEach((key) => {
      expect(applyPreset({}, key)).not.toHaveProperty("unchanged");
    });
  });

  it("clears unchanged when switching to a preset that does not own it", () => {
    expect(applyPreset({ unchanged: false }, "syncs")).not.toHaveProperty(
      "unchanged"
    );
  });

  it("matches a preset whether unchanged arrives as a boolean or a string", () => {
    // it round trips through the URL, where qs parses it back as "false"
    expect(
      presetOf({ lane: ["import"], status: DONE_STATUS, unchanged: "false" })
    ).toBe("imports");
  });

  it("drops the preset once unchanged is widened or inverted", () => {
    expect(presetOf({ lane: ["import"], status: DONE_STATUS })).toBe(null);
    expect(
      presetOf({ lane: ["import"], status: DONE_STATUS, unchanged: true })
    ).toBe(null);
  });

  it("replaces the facets a preset owns rather than merging them", () => {
    const next = applyPreset({ job: ["ImportJob"], status: ["waiting"] }, "exports");
    expect(next.status).toEqual(DONE_STATUS);
    expect(next.job).not.toContain("ImportJob");
  });

  it("shows only terminal jobs, so the queue does not leak into the history", () => {
    // a job is written to the job table on submit, so without this a freshly
    // queued job would appear in the history straight away
    PRESETS.forEach((p) => {
      expect(p.params.status).not.toContain("waiting");
      expect(p.params.status).not.toContain("running");
      expect(p.params.status).not.toContain("blocked");
    });
  });

  it("lets an explicit status override the preset", () => {
    // clearing or widening the status chips must not snap back to a preset
    expect(presetOf({ lane: ["import"], status: ["waiting"] })).toBe(null);
  });
});
