import { describe, it, expect } from "vitest";
import { datasetMatchesRoute } from "./datasetRouteMatch";

describe("datasetMatchesRoute", () => {
  it("matches a numeric dataset key against a string route param", () => {
    expect(datasetMatchesRoute({ key: 310362 }, "310362")).toBe(true);
  });

  it("rejects the mismatch that produced the wrong export", () => {
    // Context held iBOL 37384 while the URL said COL 310362.
    expect(datasetMatchesRoute({ key: 37384 }, "310362")).toBe(false);
  });

  it("matches when both sides are the same type", () => {
    expect(datasetMatchesRoute({ key: 3 }, 3)).toBe(true);
    expect(datasetMatchesRoute({ key: "3" }, "3")).toBe(true);
  });

  it("rejects a missing dataset", () => {
    expect(datasetMatchesRoute(null, "310362")).toBe(false);
    expect(datasetMatchesRoute(undefined, "310362")).toBe(false);
  });

  it("rejects a dataset without a key", () => {
    expect(datasetMatchesRoute({ title: "Catalogue of Life" }, "310362")).toBe(false);
    expect(datasetMatchesRoute({ key: null }, "310362")).toBe(false);
  });

  // Regression guard for the Number("") === 0 trap: an absent route key must
  // never match a dataset whose key is 0.
  it("rejects an empty or missing route key, even against key 0", () => {
    expect(datasetMatchesRoute({ key: 0 }, "")).toBe(false);
    expect(datasetMatchesRoute({ key: 0 }, null)).toBe(false);
    expect(datasetMatchesRoute({ key: 0 }, undefined)).toBe(false);
    expect(datasetMatchesRoute({ key: 0 }, [])).toBe(false);
  });

  it("still matches a genuine key 0", () => {
    expect(datasetMatchesRoute({ key: 0 }, "0")).toBe(true);
  });

  it("rejects a non-numeric route key", () => {
    expect(datasetMatchesRoute({ key: 310362 }, "abc")).toBe(false);
  });
});
