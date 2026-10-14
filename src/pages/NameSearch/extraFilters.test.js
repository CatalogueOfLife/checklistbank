import { describe, expect, it } from "vitest";
import { extraFilters } from "./extraFilters";

describe("extraFilters", () => {
  it("lists parameters without a form control", () => {
    expect(
      extraFilters({ q: "Abies", limit: 50, offset: 0, sectorKey: "2", rank: ["species"] })
    ).toEqual([["sectorKey", ["2"]]]);
  });

  it("keeps every value of a repeated parameter", () => {
    expect(extraFilters({ decisionMode: ["block", "update"] })).toEqual([
      ["decisionMode", ["block", "update"]],
    ]);
  });

  it("skips empty values and copes with no params", () => {
    expect(extraFilters({ sectorKey: "", publishedInId: null })).toEqual([]);
    expect(extraFilters(undefined)).toEqual([]);
  });
});
