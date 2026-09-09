import { describe, it, expect } from "vitest";
import { buildAsyncMatchParams } from "./NameMatch";

describe("buildAsyncMatchParams", () => {
  it("sends the source dataset key", () => {
    expect(buildAsyncMatchParams({ key: 2006 })).toEqual({
      sourceDatasetKey: 2006,
    });
  });

  it("adds the taxonID when a source taxon is selected", () => {
    expect(buildAsyncMatchParams({ key: 2006 }, { key: "abc123" })).toEqual({
      sourceDatasetKey: 2006,
      taxonID: "abc123",
    });
  });

  it("omits taxonID for a taxon without a key", () => {
    const params = buildAsyncMatchParams({ key: 2006 }, { name: "Aves" });
    expect(params).toEqual({ sourceDatasetKey: 2006 });
    expect("taxonID" in params).toBe(false);
  });
});
