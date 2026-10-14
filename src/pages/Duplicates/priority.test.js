import { describe, it, expect } from "vitest";
import {
  getPriorityYear,
  selectNewest,
  selectAllExceptOldest,
} from "./priority";

const usage = (id, name) => ({ usage: { id, name } });
const group = (...usages) => ({ usages });

// Ammodiscus tenuissimus in dataset 1157 (#1243)
const gumbel = usage("a", {
  basionymAuthorship: { year: "1862" },
  publishedInYear: 2016,
});
const grzybowski = usage("b", {
  combinationAuthorship: { year: "1898" },
  publishedInYear: 1898,
});

describe("getPriorityYear", () => {
  it("prefers the basionym year over the combination's publication", () => {
    expect(getPriorityYear(gumbel.usage.name)).toBe(1862);
  });
  it("falls back to publishedInYear", () => {
    expect(getPriorityYear({ publishedInYear: 1901 })).toBe(1901);
  });
  it("reads years with a letter suffix", () => {
    expect(getPriorityYear({ combinationAuthorship: { year: "1850a" } })).toBe(
      1850
    );
  });
  it("is null without any year", () => {
    expect(getPriorityYear({ combinationAuthorship: {} })).toBe(null);
  });
});

describe("selectNewest", () => {
  it("selects the junior name, not the recently recombined senior one", () => {
    expect(selectNewest([group(gumbel, grzybowski)])).toEqual(["b"]);
  });
  it("skips groups whose names share a year", () => {
    const x = usage("x", { combinationAuthorship: { year: "1966" } });
    const y = usage("y", { combinationAuthorship: { year: "1966" } });
    expect(selectNewest([group(x, y)])).toEqual([]);
  });
  it("never selects undated names", () => {
    expect(selectNewest([group(gumbel, usage("u", {}))])).toEqual([]);
  });
});

describe("selectAllExceptOldest", () => {
  it("selects every dated name younger than the oldest", () => {
    const c = usage("c", { combinationAuthorship: { year: "1950" } });
    expect(
      selectAllExceptOldest([group(grzybowski, gumbel, c, usage("u", {}))])
    ).toEqual(["b", "c"]);
  });
  it("works when publishedInYear is missing", () => {
    const old = usage("o", { basionymAuthorship: { year: "1947" } });
    const young = usage("n", { combinationAuthorship: { year: "1961" } });
    expect(selectAllExceptOldest([group(old, young)])).toEqual(["n"]);
  });
});
