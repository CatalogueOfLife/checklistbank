import { describe, it, expect } from "vitest";
import {
  buildAsyncMatchParams,
  hasNameColumn,
  nameFromParts,
  uploadContentType,
} from "./NameMatch";

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

  it("sends the matching mode", () => {
    expect(buildAsyncMatchParams({ key: 2006 }, null, "strict")).toEqual({
      sourceDatasetKey: 2006,
      mode: "strict",
    });
  });
});

describe("hasNameColumn", () => {
  it("accepts a scientificName or the name parts in any case", () => {
    expect(hasNameColumn(["ID", "scientificName"])).toBe(true);
    expect(hasNameColumn(["genericName", "specificEpithet"])).toBe(true);
    expect(hasNameColumn(["genus"])).toBe(true);
    expect(hasNameColumn([" SPECIFICEPITHET "])).toBe(true);
  });

  it("refuses a header without any name column", () => {
    expect(hasNameColumn(["ID", "family", "infraspecificEpithet"])).toBe(false);
    expect(hasNameColumn([])).toBe(false);
  });
});

describe("nameFromParts", () => {
  it("joins the name parts of a lower cased record", () => {
    expect(
      nameFromParts({
        genericname: "Abies",
        specificepithet: "alba",
        infraspecificepithet: " acutifolia",
      })
    ).toBe("Abies alba acutifolia");
  });

  it("falls back to the genus column", () => {
    expect(nameFromParts({ genus: "D.", specificepithet: "plexippus" })).toBe("D. plexippus");
  });

  it("gives an empty string without parts", () => {
    expect(nameFromParts({ scientificname: "Abies alba" })).toBe("");
  });
});

describe("uploadContentType", () => {
  it("sends explicit csv and tsv types by file suffix", () => {
    expect(uploadContentType({ name: "names.CSV" })).toBe("text/csv");
    expect(uploadContentType({ name: "names.tsv" })).toBe("text/tab-separated-values");
    expect(uploadContentType({ name: "names.tab" })).toBe("text/tab-separated-values");
  });

  it("lets the server probe anything else", () => {
    expect(uploadContentType({ name: "names.txt" })).toBe("text/plain");
    expect(uploadContentType({})).toBe("text/plain");
  });
});
