import { describe, expect, it } from "vitest";
import qs from "query-string";
import { searchStringOf } from "./searchString";

describe("searchStringOf", () => {
  it("drops facets and an empty term and pages by offset", () => {
    expect(
      searchStringOf(
        { q: "", facet: ["rank"], datasetKey: "316441" },
        { pageSize: 50, current: 3 }
      )
    ).toBe("datasetKey=316441&limit=50&offset=100");
  });

  it("gives the same string for params read back from the URL it wrote", () => {
    const params = { q: "Abies", rank: ["genus", "species"], datasetKey: ["3", "316441"] };
    const written = searchStringOf(params, { pageSize: 50, current: 2 });
    const read = qs.parse(written);
    expect(
      searchStringOf(read, {
        pageSize: read.limit,
        current: Number(read.offset) / Number(read.limit) + 1,
      })
    ).toBe(written);
  });
});
