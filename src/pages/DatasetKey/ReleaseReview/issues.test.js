import { describe, it, expect } from "vitest";
import { compareIssues } from "./issues";

describe("compareIssues", () => {
  it("diffs counts and sorts by the size of the change", () => {
    const rows = compareIssues(
      { "synonym rank differs": 1054, "no species included": 2329 },
      { "synonym rank differs": 1000, "no species included": 2400 }
    );
    expect(rows.map((r) => r.issue)).toEqual([
      "no species included",
      "synonym rank differs",
    ]);
    expect(rows[0]).toMatchObject({ count: 2329, previousCount: 2400, delta: -71 });
    expect(rows[1].change).toBeCloseTo(0.054);
  });

  it("treats an issue missing on one side as zero", () => {
    const rows = compareIssues({ gone: 0, appeared: 5 }, { gone: 3 });
    const byIssue = Object.fromEntries(rows.map((r) => [r.issue, r]));
    expect(byIssue.appeared).toMatchObject({
      previousCount: 0,
      delta: 5,
      change: null,
    });
    expect(byIssue.gone).toMatchObject({ count: 0, delta: -3, change: -1 });
  });

  it("copes with missing metrics", () => {
    expect(compareIssues(null, null)).toEqual([]);
    expect(compareIssues({ a: 2 }, null)).toHaveLength(1);
  });
});
