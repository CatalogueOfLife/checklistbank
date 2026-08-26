import { describe, it, expect } from "vitest";
import { excludedFrom, visibleFrom } from "./columnPrefs";

// The table is driven by an *exclude* list (that is what localStorage holds and what
// the Table filters on), while the settings modal is naturally checkbox-driven and
// therefore thinks in *visible* keys. These two convert between the representations.
const ALL = ["key", "alias", "title", "publisher", "license"];

describe("excludedFrom", () => {
  it("excludes every column the user did not tick", () => {
    expect(excludedFrom(ALL, ["alias", "title"]).sort()).toEqual([
      "key",
      "license",
      "publisher",
    ]);
  });

  it("excludes nothing when everything is ticked", () => {
    expect(excludedFrom(ALL, ALL)).toEqual([]);
  });

  it("excludes everything when nothing is ticked", () => {
    expect(excludedFrom(ALL, []).sort()).toEqual([...ALL].sort());
  });

  // A stale key in localStorage (a column that has since been removed) must not
  // reappear in the exclude list, or it would accumulate forever.
  it("ignores ticked keys that are no longer columns", () => {
    expect(excludedFrom(ALL, ["alias", "creator"]).sort()).toEqual([
      "key",
      "license",
      "publisher",
      "title",
    ]);
  });
});

describe("visibleFrom", () => {
  it("is every column that is not excluded", () => {
    expect(visibleFrom(ALL, ["key", "license"])).toEqual([
      "alias",
      "title",
      "publisher",
    ]);
  });

  it("keeps column order rather than the order keys were excluded in", () => {
    expect(visibleFrom(ALL, ["title"])).toEqual([
      "key",
      "alias",
      "publisher",
      "license",
    ]);
  });

  // Stale exclude entries from an older release simply do not match anything.
  it("tolerates excluded keys that are no longer columns", () => {
    expect(visibleFrom(ALL, ["creator", "confidence", "key"])).toEqual([
      "alias",
      "title",
      "publisher",
      "license",
    ]);
  });

  it("round-trips with excludedFrom", () => {
    const visible = ["alias", "license"];
    expect(visibleFrom(ALL, excludedFrom(ALL, visible))).toEqual(visible);
  });
});
