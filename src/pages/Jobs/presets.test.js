import { describe, it, expect } from "vitest";
import { PRESETS, presetOf, applyPreset } from "./presets";

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
    expect(presetOf({ lane: ["import", "default"] })).toBe("all");
  });

  it("treats a single value and a one element array alike", () => {
    expect(presetOf({ lane: "sync" })).toBe("syncs");
  });

  it("returns null once filtered beyond any preset", () => {
    expect(presetOf({ lane: ["import"], status: ["failed"] })).toBe(null);
  });

  it("keeps unrelated filters but drops paging when switching preset", () => {
    const next = applyPreset(
      { lane: ["import"], datasetKey: 3, createdBy: 7, offset: 40 },
      "syncs"
    );
    expect(next).toEqual({ datasetKey: 3, createdBy: 7, lane: ["sync"] });
  });

  it("replaces the facets a preset owns rather than merging them", () => {
    const next = applyPreset({ job: ["ImportJob"], status: ["failed"] }, "exports");
    expect(next.status).toBeUndefined();
    expect(next.job).not.toContain("ImportJob");
  });
});
