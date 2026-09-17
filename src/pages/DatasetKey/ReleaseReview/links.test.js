import { describe, it, expect } from "vitest";
import qs from "query-string";
import {
  ranksDownTo,
  sourceMetricsLink,
  namesDiffLink,
  duplicatesLink,
} from "./links";

const RANKS = ["domain", "kingdom", "phylum", "class", "order", "family", "genus", "species"];

describe("ranksDownTo", () => {
  it("keeps everything down to and including family", () => {
    expect(ranksDownTo(RANKS)).toEqual([
      "domain",
      "kingdom",
      "phylum",
      "class",
      "order",
      "family",
    ]);
  });

  it("is empty when the enum has not loaded or lacks the rank", () => {
    expect(ranksDownTo(null)).toEqual([]);
    expect(ranksDownTo(["genus", "species"])).toEqual([]);
  });
});

describe("sourceMetricsLink", () => {
  it("compares against the previous release", () => {
    expect(sourceMetricsLink(316321, 316000)).toBe(
      "/dataset/316321/sourcemetrics?releaseKey=316000"
    );
  });
});

describe("namesDiffLink", () => {
  it("opens the diff step with the review options prefilled", () => {
    const params = qs.parse(namesDiffLink(316321, 316000).split("?")[1]);
    expect(params).toMatchObject({
      dataset: "316321",
      dataset2: "316000",
      step: "diff",
      minRank: "order",
      authorship: "false",
      synonyms: "false",
    });
    expect(params.root).toBeUndefined();
    expect(params.root2).toBeUndefined();
  });

  it("roots both sides when a root taxon is given", () => {
    const params = qs.parse(
      namesDiffLink(316321, 316000, "CS5HF").split("?")[1]
    );
    expect(params.root).toBe("CS5HF");
    expect(params.root2).toBe("CS5HF");
  });
});

describe("duplicatesLink", () => {
  it("asks for accepted uninomials of family and above", () => {
    const params = qs.parse(duplicatesLink(316321, RANKS).split("?")[1]);
    expect(params).toMatchObject({
      category: "uninomial",
      limit: "50",
      minSize: "2",
      mode: "STRICT",
      rankDifferent: "false",
      status: "accepted",
    });
    expect(params.rank).toEqual([
      "domain",
      "kingdom",
      "phylum",
      "class",
      "order",
      "family",
    ]);
  });
});
