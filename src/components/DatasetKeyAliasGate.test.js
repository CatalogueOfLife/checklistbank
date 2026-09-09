import { describe, it, expect } from "vitest";
import { DATASET_KEY_PATH } from "./DatasetKeyAliasGate";
import { isDatasetAlias } from "../api/dataset";

// The gate itself needs a renderer we don't have, so this covers the two pure
// pieces it is built from: which URLs carry a dataset key, and which of those
// keys are aliases the backend has to resolve.
const aliasIn = (pathname) => {
  const m = DATASET_KEY_PATH.exec(pathname);
  return m && isDatasetAlias(m[2]) ? m[2] : null;
};

const rewrite = (pathname, key) =>
  pathname.replace(DATASET_KEY_PATH, (_, section) => `/${section}/${key}`);

describe("isDatasetAlias", () => {
  it("accepts every alias form the backend resolves", () => {
    expect(isDatasetAlias("gbif-ac5f72cf-172d-4eb4-ad8c-db66ea1c78e5")).toBe(true);
    expect(isDatasetAlias("COL2024")).toBe(true);
    expect(isDatasetAlias("COL24.1XR")).toBe(true);
    expect(isDatasetAlias("3LR")).toBe(true);
    expect(isDatasetAlias("3LXRC")).toBe(true);
    expect(isDatasetAlias("3R267")).toBe(true);
  });

  it("leaves plain integer keys alone", () => {
    expect(isDatasetAlias("310362")).toBe(false);
    expect(isDatasetAlias("0")).toBe(false);
    expect(isDatasetAlias(" 310362 ")).toBe(false);
    expect(isDatasetAlias(310362)).toBe(false);
    expect(isDatasetAlias("")).toBe(false);
    expect(isDatasetAlias(null)).toBe(false);
    expect(isDatasetAlias(undefined)).toBe(false);
  });
});

describe("the dataset key in a URL", () => {
  it("is found on dataset and project routes", () => {
    expect(aliasIn("/dataset/COL2024/metadata")).toBe("COL2024");
    expect(aliasIn("/dataset/gbif-ac5f72cf-172d-4eb4-ad8c-db66ea1c78e5/download")).toBe(
      "gbif-ac5f72cf-172d-4eb4-ad8c-db66ea1c78e5"
    );
    expect(aliasIn("/dataset/3LR")).toBe("3LR");
    expect(aliasIn("/project/3LR/sources")).toBe("3LR");
  });

  it("is absent from numeric and unrelated routes", () => {
    expect(aliasIn("/dataset/310362/download")).toBe(null);
    expect(aliasIn("/dataset")).toBe(null);
    expect(aliasIn("/tools/name-match")).toBe(null);
    expect(aliasIn("/")).toBe(null);
    // An export uuid is not a dataset key - this route must never be gated.
    expect(aliasIn("/download/55029407-8cce-4fe9-8743-f1897624e06b")).toBe(null);
  });
});

describe("rewriting the key segment", () => {
  it("keeps the path tail", () => {
    expect(rewrite("/dataset/COL2024/metadata", 299029)).toBe("/dataset/299029/metadata");
    expect(rewrite("/dataset/3LR", 316115)).toBe("/dataset/316115");
    expect(rewrite("/project/3LR/sector/sync", 316115)).toBe("/project/316115/sector/sync");
  });

  it("replaces the key segment only, not a later one that repeats it", () => {
    expect(rewrite("/project/3LR/dataset/3LR/names", 316115)).toBe(
      "/project/316115/dataset/3LR/names"
    );
  });
});
