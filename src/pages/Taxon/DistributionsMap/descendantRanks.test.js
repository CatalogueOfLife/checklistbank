import { INFRASPECIFIC_RANKS, getDescendantRanks } from "./descendantRanks";

const RANK_ORDER = [
  "kingdom",
  "genus",
  "species",
  "subspecies",
  "variety",
  "subvariety",
  "form",
  "subform",
  "infraspecific name",
];

describe("getDescendantRanks", () => {
  it("returns all infraspecific ranks for species", () => {
    expect(getDescendantRanks("species", RANK_ORDER)).toEqual(
      INFRASPECIFIC_RANKS
    );
  });

  it("returns only ranks strictly below the focal rank", () => {
    expect(getDescendantRanks("subspecies", RANK_ORDER)).toEqual([
      "variety",
      "subvariety",
      "form",
      "subform",
      "infraspecific name",
    ]);
  });

  it("returns an empty list when focal rank has no infraspecific descendants", () => {
    expect(getDescendantRanks("infraspecific name", RANK_ORDER)).toEqual([]);
  });

  it("returns an empty list for ranks above species", () => {
    expect(getDescendantRanks("genus", RANK_ORDER)).toEqual(
      INFRASPECIFIC_RANKS
    );
  });

  it("returns an empty list when focal rank is unknown", () => {
    expect(getDescendantRanks("nonsense", RANK_ORDER)).toEqual([]);
  });
});
