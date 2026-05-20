import { buildTree } from "./descendantTree";

describe("buildTree", () => {
  it("returns empty roots and empty map for no taxa", () => {
    expect(buildTree([], "focal")).toEqual({ roots: [], byParent: {} });
  });

  it("places direct children under roots", () => {
    const taxa = [
      { id: "a", parentId: "focal", scientificName: "A", rank: "subspecies" },
      { id: "b", parentId: "focal", scientificName: "B", rank: "subspecies" },
    ];
    const tree = buildTree(taxa, "focal");
    expect(tree.roots.map((t) => t.id)).toEqual(["a", "b"]);
    expect(tree.byParent).toEqual({});
  });

  it("nests grandchildren under their parents", () => {
    const taxa = [
      { id: "sub", parentId: "focal", scientificName: "Sub", rank: "subspecies" },
      { id: "var1", parentId: "sub", scientificName: "V1", rank: "variety" },
      { id: "var2", parentId: "sub", scientificName: "V2", rank: "variety" },
    ];
    const tree = buildTree(taxa, "focal");
    expect(tree.roots.map((t) => t.id)).toEqual(["sub"]);
    expect(tree.byParent.sub.map((t) => t.id)).toEqual(["var1", "var2"]);
  });

  it("treats taxa whose parent is missing from the list as roots", () => {
    const taxa = [
      { id: "orphan", parentId: "missing", scientificName: "O", rank: "variety" },
    ];
    const tree = buildTree(taxa, "focal");
    expect(tree.roots.map((t) => t.id)).toEqual(["orphan"]);
  });

  it("sorts roots and per-parent children alphabetically", () => {
    const taxa = [
      { id: "b", parentId: "focal", scientificName: "B", rank: "subspecies" },
      { id: "a", parentId: "focal", scientificName: "A", rank: "subspecies" },
      { id: "ab", parentId: "a", scientificName: "Ab", rank: "variety" },
      { id: "aa", parentId: "a", scientificName: "Aa", rank: "variety" },
    ];
    const tree = buildTree(taxa, "focal");
    expect(tree.roots.map((t) => t.id)).toEqual(["a", "b"]);
    expect(tree.byParent.a.map((t) => t.id)).toEqual(["aa", "ab"]);
  });
});
