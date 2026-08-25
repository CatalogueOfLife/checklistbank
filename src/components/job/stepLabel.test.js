import { describe, it, expect } from "vitest";
import { stepLabel } from "./JobStatusTag";

describe("stepLabel", () => {
  it("capitalises a single word step", () => {
    expect(stepLabel("inserting")).toBe("Inserting");
  });
  it("reads underscores as spaces", () => {
    expect(stepLabel("building_metrics")).toBe("Building metrics");
  });
  it("leaves prose steps intact", () => {
    // ImportArticleJob / ReimportJob report their scheduling progress this way
    expect(stepLabel("scheduled 5 of 20")).toBe("Scheduled 5 of 20");
  });
  it("renders nothing without a step", () => {
    expect(stepLabel(null)).toBe(null);
    expect(stepLabel(undefined)).toBe(null);
  });
});
