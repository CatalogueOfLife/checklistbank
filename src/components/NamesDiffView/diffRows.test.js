import { describe, it, expect } from "vitest";
import { normOp, mergeSorted } from "./diffRows";

describe("normOp", () => {
  it("lowercases and trims op values (case-insensitive consumption)", () => {
    expect(normOp("INSERT")).toBe("insert");
    expect(normOp(" Delete ")).toBe("delete");
    expect(normOp("equal")).toBe("equal");
  });
  it("returns empty string for nullish", () => {
    expect(normOp(undefined)).toBe("");
    expect(normOp(null)).toBe("");
  });
});

describe("mergeSorted", () => {
  it("returns [] for a nullish diff", () => {
    expect(mergeSorted(null)).toEqual([]);
    expect(mergeSorted(undefined)).toEqual([]);
  });

  it("merges removed/added/changed into one list sorted by label", () => {
    const diff = {
      removed: ["Bus", "Zus"],
      added: ["Aus"],
      changed: [{ before: "Mus", after: "Mus L.", chunks: [] }],
    };
    const rows = mergeSorted(diff);
    expect(rows.map((r) => [r.type, r.sortKey])).toEqual([
      ["added", "Aus"],
      ["removed", "Bus"],
      ["changed", "Mus"],
      ["removed", "Zus"],
    ]);
  });

  it("uses `before` as the sort key and value object for changed rows", () => {
    const changed = { before: "Mus", after: "Mus L.", chunks: [] };
    const rows = mergeSorted({ removed: [], added: [], changed: [changed] });
    expect(rows[0].type).toBe("changed");
    expect(rows[0].sortKey).toBe("Mus");
    expect(rows[0].value).toBe(changed);
  });

  it("tolerates missing arrays", () => {
    expect(mergeSorted({})).toEqual([]);
  });
});
