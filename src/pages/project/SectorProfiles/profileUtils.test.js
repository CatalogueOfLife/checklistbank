import { describe, it, expect } from "vitest";
import {
  EMPTY_SELECTOR,
  normalizeSelector,
  summarizeSelector,
  reorder,
  addToSelector,
  restrictToSectors,
} from "./profileUtils";

describe("normalizeSelector", () => {
  it("fills every field", () => {
    expect(normalizeSelector(undefined)).toEqual(EMPTY_SELECTOR);
    expect(normalizeSelector({ modes: ["merge"] })).toEqual({ ...EMPTY_SELECTOR, modes: ["merge"] });
  });

  it("turns typed keys into unique integers and drops junk", () => {
    expect(normalizeSelector({ sectorKeys: ["12", " 5 ", "12a", "", "1.5", 7, "7"] }).sectorKeys).toEqual([12, 5, 7]);
    expect(normalizeSelector({ subjectDatasetKeys: [1010, "1010"] }).subjectDatasetKeys).toEqual([1010]);
  });

  it("coerces the publisher switch to a boolean", () => {
    expect(normalizeSelector({ anySectorPublisher: undefined }).anySectorPublisher).toBe(false);
  });
});

describe("summarizeSelector", () => {
  it("calls an empty selector all sectors", () => {
    expect(summarizeSelector(EMPTY_SELECTOR)).toBe("all sectors");
  });

  it("joins the restricting fields", () => {
    expect(summarizeSelector({ modes: ["merge"], anySectorPublisher: true })).toBe("merge · any sector publisher");
    expect(summarizeSelector({ subjectDatasetKeys: [1, 2, 3] })).toBe("3 source datasets");
    expect(summarizeSelector({ sectorKeys: [9] })).toBe("1 sector");
    expect(
      summarizeSelector({ modes: ["attach", "union"], datasetTypes: ["article"], publisherKeys: ["a", "b"] })
    ).toBe("attach or union · type article · 2 publishers");
  });
});

describe("reorder", () => {
  const p = (id, position) => ({ id, position, title: `p${id}` });

  it("moves a profile and renumbers from zero", () => {
    const { ordered, changed } = reorder([p(1, 0), p(2, 1), p(3, 2)], 2, 0);
    expect(ordered.map((x) => [x.id, x.position])).toEqual([[3, 0], [1, 1], [2, 2]]);
    expect(changed.map((x) => x.id).sort()).toEqual([1, 2, 3]);
  });

  it("resolves tied positions and only reports changed ones", () => {
    const { ordered, changed } = reorder([p(1, 0), p(2, 0), p(3, 5)], 2, 1);
    expect(ordered.map((x) => [x.id, x.position])).toEqual([[1, 0], [3, 1], [2, 2]]);
    expect(changed.map((x) => x.id).sort()).toEqual([2, 3]);
  });

  it("changes nothing when dropped in place on a consecutive list", () => {
    expect(reorder([p(1, 0), p(2, 1)], 1, 1).changed).toEqual([]);
  });
});

describe("addToSelector", () => {
  const sectors = [
    { id: 10, subjectDatasetKey: 1000 },
    { id: 11, subjectDatasetKey: 1000 },
  ];

  it("appends sector keys without duplicates", () => {
    const { selector, added } = addToSelector({ sectorKeys: [10] }, sectors, "sectors");
    expect(selector.sectorKeys).toEqual([10, 11]);
    expect(added).toBe(1);
  });

  it("appends the source datasets of the sectors", () => {
    const { selector, added } = addToSelector({ modes: ["merge"] }, sectors, "datasets");
    expect(selector.subjectDatasetKeys).toEqual([1000]);
    expect(selector.modes).toEqual(["merge"]);
    expect(added).toBe(1);
  });
});

describe("restrictToSectors", () => {
  it("narrows a selector without sector keys to the given sectors", () => {
    expect(restrictToSectors({ modes: ["merge"] }, [4, 6])).toEqual({ ...EMPTY_SELECTOR, modes: ["merge"], sectorKeys: [4, 6] });
  });

  it("keeps only the given sectors the selector lists itself", () => {
    expect(restrictToSectors({ sectorKeys: [4, 9] }, [4, 6]).sectorKeys).toEqual([4]);
  });

  it("returns null when none can match, as no sector keys would mean every sector", () => {
    expect(restrictToSectors({ sectorKeys: [9] }, [4, 6])).toBeNull();
    expect(restrictToSectors({}, [])).toBeNull();
  });
});
