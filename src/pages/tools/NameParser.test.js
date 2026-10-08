import { describe, it, expect } from "vitest";
import { toFlatRow, nativeView } from "./NameParser";

const row = (result) => toFlatRow({ providedName: "x", result });

describe("toFlatRow", () => {
  it("has a sanctioning author and anonymous column per authorship", () => {
    const r = row({
      combinationAuthorship: { anonymous: true, year: "1798" },
      basionymAuthorship: {
        authors: ["Wulfen"],
        sanctioningAuthor: "Fr.",
      },
    });
    expect(r.combinationAnonymous).toBe(true);
    expect(r.combinationSanctioningAuthor).toBe("");
    expect(r.basionymAnonymous).toBe(false);
    expect(r.basionymSanctioningAuthor).toBe("Fr.");
  });

  it("puts each new column right after its authorship year", () => {
    const keys = Object.keys(row({}));
    const after = (k) => keys[keys.indexOf(k) + 1];
    expect(after("combinationAuthorshipYear")).toBe(
      "combinationSanctioningAuthor"
    );
    expect(after("combinationSanctioningAuthor")).toBe("combinationAnonymous");
    expect(after("basionymAuthorshipYear")).toBe("basionymSanctioningAuthor");
    expect(after("basionymSanctioningAuthor")).toBe("basionymAnonymous");
  });

  it("takes the sanctioning author of older parsers from the name for the combination", () => {
    const r = row({
      combinationAuthorship: { authors: ["Bull."] },
      sanctioningAuthor: "Fr.",
    });
    expect(r.combinationSanctioningAuthor).toBe("Fr.");
    expect(r.basionymSanctioningAuthor).toBe("");
  });
});

describe("nativeView", () => {
  it("takes type, rank, code and warnings of a parsed name", () => {
    const v = nativeView({
      result: "parsed",
      label: "Navicula ?alba",
      name: {
        genus: "Navicula",
        specificEpithet: "alba",
        rank: "species",
        code: "botanical",
        type: "informal",
        warnings: ["question marks removed"],
      },
    });
    expect(v).toEqual({
      type: "informal",
      rank: "species",
      code: "botanical",
      warnings: ["question marks removed"],
    });
  });

  it("takes the rank of an informal name", () => {
    const v = nativeView({
      result: "informal",
      label: "Rhizobium sp. RMCC TR1811",
      taxon: "Rhizobium",
      taxonRank: "genus",
      rank: "species",
      phrase: "sp. RMCC TR1811",
    });
    expect(v).toEqual({ rank: "species", warnings: [] });
  });

  it("takes the type of an unparsable name", () => {
    const v = nativeView({
      result: "unparsable",
      label: "BOLD:AAA1234",
      type: "identifier",
      name: "BOLD:AAA1234",
    });
    expect(v).toEqual({ type: "identifier", warnings: [] });
  });
});
