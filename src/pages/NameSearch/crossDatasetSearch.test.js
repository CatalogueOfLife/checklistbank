import { describe, expect, it } from "vitest";
import { isCrossDatasetSearchable } from "./crossDatasetSearch";

describe("isCrossDatasetSearchable", () => {
  it("needs a query term or a dataset", () => {
    expect(isCrossDatasetSearchable({ q: "Abies" })).toBe(true);
    expect(isCrossDatasetSearchable({ datasetKey: "316321" })).toBe(true);
    expect(isCrossDatasetSearchable({ datasetKey: ["316321", "316441"] })).toBe(true);
  });

  it("rejects an empty search, also with other filters or paging", () => {
    expect(isCrossDatasetSearchable({})).toBe(false);
    expect(isCrossDatasetSearchable(undefined)).toBe(false);
    expect(
      isCrossDatasetSearchable({ content: "SCIENTIFIC_NAME", limit: 50, offset: 0, rank: ["species"] })
    ).toBe(false);
  });

  it("treats a blank term or a removed dataset filter as empty", () => {
    expect(isCrossDatasetSearchable({ q: "  " })).toBe(false);
    expect(isCrossDatasetSearchable({ q: "", datasetKey: [] })).toBe(false);
    expect(isCrossDatasetSearchable({ datasetKey: [""] })).toBe(false);
  });
});
