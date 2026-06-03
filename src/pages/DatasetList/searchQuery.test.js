import { describe, it, expect } from "vitest";
import { buildSearchQuery } from "./searchQuery";

describe("buildSearchQuery", () => {
  // Regression: paging while sorting by a hidden column (e.g. the default-hidden `issued`
  // column the "COL Releases" shortcut sorts by). antd reports `sorter.order === undefined`
  // for the hidden/inactive sort column; the sort must NOT be dropped on a pagination click.
  it("preserves the active sort on a pagination action even when antd reports no sorter", () => {
    const current = {
      full: "false",
      limit: "25",
      offset: "25",
      releasedFrom: "3",
      sortBy: "issued",
      reverse: "true",
    };
    const sorter = { order: undefined, field: undefined, columnKey: undefined };

    const next = buildSearchQuery(current, {}, sorter, "paginate");

    expect(next.sortBy).toBe("issued");
    expect(next.reverse).toBe("true");
  });

  it("preserves the active sort on a filter action", () => {
    const current = { releasedFrom: "3", sortBy: "issued", reverse: "true" };
    const sorter = { order: undefined, field: undefined, columnKey: undefined };

    const next = buildSearchQuery(current, { type: ["nomenclatural"] }, sorter, "filter");

    expect(next.sortBy).toBe("issued");
    expect(next.reverse).toBe("true");
    expect(next.type).toEqual(["nomenclatural"]);
  });

  it("applies a descending column-header sort", () => {
    const next = buildSearchQuery(
      { releasedFrom: "3" },
      {},
      { order: "descend", columnKey: "issued", field: "issued" },
      "sort"
    );

    expect(next.sortBy).toBe("issued");
    expect(next.reverse).toBe(true);
  });

  it("applies an ascending column-header sort", () => {
    const next = buildSearchQuery(
      { releasedFrom: "3" },
      {},
      { order: "ascend", columnKey: "issued", field: "issued" },
      "sort"
    );

    expect(next.sortBy).toBe("issued");
    expect(next.reverse).toBe(false);
  });

  it("prefers columnKey over field (nested-dataIndex columns like Publisher)", () => {
    const next = buildSearchQuery(
      {},
      {},
      { order: "ascend", columnKey: "publisher", field: ["publisher", "name"] },
      "sort"
    );

    expect(next.sortBy).toBe("publisher");
  });

  it("clears the sort when the header sort is toggled off", () => {
    const next = buildSearchQuery(
      { sortBy: "issued", reverse: "true" },
      {},
      { order: undefined, columnKey: undefined, field: undefined },
      "sort"
    );

    expect(next.sortBy).toBeUndefined();
    expect(next.reverse).toBeUndefined();
  });

  it("sets a filter value and removes a cleared one", () => {
    const next = buildSearchQuery(
      { origin: ["external"] },
      { type: ["nomenclatural"], origin: null },
      {},
      "filter"
    );

    expect(next.type).toEqual(["nomenclatural"]);
    expect(next.origin).toBeUndefined();
  });
});
