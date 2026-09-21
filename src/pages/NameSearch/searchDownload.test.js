import { describe, it, expect } from "vitest";
import {
  downloadParamsOf,
  downloadParamsKey,
  downloadRequestOf,
  searchParamsOfRequest,
  searchUrlOfJob,
} from "./searchDownload";

describe("downloadParamsOf", () => {
  it("drops paging, facets and an empty q", () => {
    expect(
      downloadParamsOf({
        q: "",
        facet: ["rank"],
        limit: 50,
        offset: 100,
        rank: "species",
      })
    ).toEqual({ rank: "species" });
  });

  it("gives the same key regardless of paging", () => {
    expect(downloadParamsKey({ rank: "species", offset: 0 })).toBe(
      downloadParamsKey({ rank: "species", offset: 500, facet: ["status"] })
    );
  });
});

describe("downloadRequestOf", () => {
  it("sends filters as query params and the rest as the body", () => {
    expect(
      downloadRequestOf({
        q: "Abies",
        rank: "species",
        status: ["accepted", "synonym"],
        content: "SCIENTIFIC_NAME",
        type: "fuzzy",
        reverse: "true",
        sortBy: "taxonomic",
        limit: 50,
        facet: ["rank"],
      })
    ).toEqual({
      query: { rank: "species", status: ["accepted", "synonym"] },
      body: {
        q: "Abies",
        content: ["SCIENTIFIC_NAME"],
        type: "fuzzy",
        reverse: true,
        sortBy: "taxonomic",
      },
    });
  });
});

describe("searchParamsOfRequest", () => {
  // shape as served by /job/search for a SearchExport
  const req = {
    q: "Abies",
    sortBy: "taxonomic",
    content: ["scientific name", "authorship"],
    filters: {
      rank: ["species"],
      extinct: [false, "_NULL"],
      datasetKey: [316165],
      sectorDatasetKey: [55434],
    },
    reverse: false,
  };

  it("flattens the filters and drops the datasetKey and default content", () => {
    expect(searchParamsOfRequest(req)).toEqual({
      q: "Abies",
      rank: ["species"],
      extinct: [false, "_NULL"],
      sectorDatasetKey: [55434],
      sortBy: "taxonomic",
    });
  });

  it("drops the default sort but keeps a narrowed content", () => {
    expect(
      searchParamsOfRequest({ q: "x", sortBy: "relevance", content: ["authorship"] })
    ).toEqual({ q: "x", content: "AUTHORSHIP" });
  });

  it("links to the dataset name search", () => {
    const url = searchUrlOfJob(316165, { filters: { rank: ["species"] }, reverse: true });
    expect(url).toBe("/dataset/316165/names?rank=species&reverse=true");
  });

  it("survives a missing request", () => {
    expect(searchUrlOfJob(3, null)).toBe("/dataset/3/names");
  });
});
