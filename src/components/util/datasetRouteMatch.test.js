import { describe, it, expect } from "vitest";
import {
  datasetMatchesRoute,
  isDatasetAlias,
  tagDatasetRouteKey,
} from "./datasetRouteMatch";

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

describe("dataset key aliases", () => {
  // The backend resolves these in the dataset path; the frontend has to
  // recognise them or every /dataset/<alias>/* page reports "does not exist".
  const GBIF = "gbif-ac5f72cf-172d-4eb4-ad8c-db66ea1c78e5";

  it("flags alias route keys and only those", () => {
    expect(isDatasetAlias(GBIF)).toBe(true);
    expect(isDatasetAlias("COL2024")).toBe(true);
    expect(isDatasetAlias("3LR")).toBe(true);
    expect(isDatasetAlias("3LXRC")).toBe(true);
    expect(isDatasetAlias("3R267")).toBe(true);

    expect(isDatasetAlias("310362")).toBe(false);
    expect(isDatasetAlias(310362)).toBe(false);
    expect(isDatasetAlias("")).toBe(false);
    expect(isDatasetAlias(null)).toBe(false);
    expect(isDatasetAlias(undefined)).toBe(false);
  });

  it("matches a gbif- route key against the record's gbifKey, untagged", () => {
    // DatasetMeta guards its own fetch, whose record carries no tag.
    const wikidata = { key: 314569, gbifKey: "ac5f72cf-172d-4eb4-ad8c-db66ea1c78e5" };
    expect(datasetMatchesRoute(wikidata, GBIF)).toBe(true);
    expect(datasetMatchesRoute(wikidata, GBIF.toUpperCase())).toBe(true);
    expect(datasetMatchesRoute({ key: 37384 }, GBIF)).toBe(false);
    expect(
      datasetMatchesRoute({ key: 37384, gbifKey: "00000000-0000-0000-0000-000000000000" }, GBIF)
    ).toBe(false);
  });

  it("matches an alias the record cannot answer for once it is tagged", () => {
    // "latest release" is not a property of any record - only the fetch knows.
    const col2024 = tagDatasetRouteKey({ key: 299029 }, "COL2024");
    expect(datasetMatchesRoute(col2024, "COL2024")).toBe(true);
    expect(datasetMatchesRoute(col2024, "col2024")).toBe(true);
    expect(datasetMatchesRoute({ key: 299029 }, "COL2024")).toBe(false);
    expect(datasetMatchesRoute(col2024, "COL2025")).toBe(false);
    expect(datasetMatchesRoute(col2024, "3LR")).toBe(false);
  });

  it("keeps the numeric key answering for the tagged record", () => {
    const col2024 = tagDatasetRouteKey({ key: 299029 }, "COL2024");
    expect(datasetMatchesRoute(col2024, "299029")).toBe(true);
    expect(datasetMatchesRoute(col2024, "310362")).toBe(false);
  });

  it("survives the localStorage round trip that seeds the context dataset", () => {
    const seeded = JSON.parse(JSON.stringify(tagDatasetRouteKey({ key: 3 }, "3LR")));
    expect(datasetMatchesRoute(seeded, "3LR")).toBe(true);
  });

  it("leaves a numeric route key and a missing dataset untagged", () => {
    const plain = { key: 310362 };
    expect(tagDatasetRouteKey(plain, "310362")).toBe(plain);
    expect(tagDatasetRouteKey(null, "COL2024")).toBe(null);
  });
});
