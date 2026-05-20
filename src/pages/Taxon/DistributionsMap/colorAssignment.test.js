import { VIVID_PALETTE, assignColors } from "./colorAssignment";

const RANK_ORDER = ["species", "subspecies", "variety", "form"];

describe("assignColors", () => {
  it("returns an empty map for no taxa", () => {
    expect(assignColors([], RANK_ORDER)).toEqual({});
  });

  it("assigns the first palette color to a single taxon", () => {
    const taxa = [{ id: "a", scientificName: "A", rank: "subspecies" }];
    expect(assignColors(taxa, RANK_ORDER)).toEqual({ a: VIVID_PALETTE[0] });
  });

  it("sorts by rank index first, then scientific name", () => {
    const taxa = [
      { id: "v", scientificName: "Var two", rank: "variety" },
      { id: "s", scientificName: "Sub two", rank: "subspecies" },
      { id: "s1", scientificName: "Sub one", rank: "subspecies" },
    ];
    const result = assignColors(taxa, RANK_ORDER);
    expect(result.s1).toBe(VIVID_PALETTE[0]);
    expect(result.s).toBe(VIVID_PALETTE[1]);
    expect(result.v).toBe(VIVID_PALETTE[2]);
  });

  it("cycles the palette when there are more taxa than colors", () => {
    const taxa = Array.from({ length: VIVID_PALETTE.length + 2 }, (_, i) => ({
      id: `t${i}`,
      scientificName: `T${String(i).padStart(3, "0")}`,
      rank: "subspecies",
    }));
    const result = assignColors(taxa, RANK_ORDER);
    expect(result.t0).toBe(VIVID_PALETTE[0]);
    expect(result[`t${VIVID_PALETTE.length}`]).toBe(VIVID_PALETTE[0]);
    expect(result[`t${VIVID_PALETTE.length + 1}`]).toBe(VIVID_PALETTE[1]);
  });

  it("falls back to the end of the rank list for unknown ranks", () => {
    const taxa = [
      { id: "known", scientificName: "A", rank: "subspecies" },
      { id: "unknown", scientificName: "A", rank: "weird-rank" },
    ];
    const result = assignColors(taxa, RANK_ORDER);
    expect(result.known).toBe(VIVID_PALETTE[0]);
    expect(result.unknown).toBe(VIVID_PALETTE[1]);
  });

  it("exposes a 12-color Carto Vivid palette", () => {
    expect(VIVID_PALETTE).toHaveLength(12);
    expect(VIVID_PALETTE[0]).toBe("#E58606");
  });
});
