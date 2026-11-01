import { describe, expect, it } from "vitest";
import { buildScale, lighten } from "./geotimeLayout";

const span = (name, type, start, end, parent) => ({ name, type, start, end, parent });

const ITEMS = [
  span("Precambrian", "supereon", 4567, 541),
  span("Hadean", "eon", 4567, 4000, "Precambrian"),
  span("Phanerozoic", "eon", 541, 0),
  span("Paleozoic", "era", 541, 252, "Phanerozoic"),
  span("Carboniferous", "period", 358.9, 298.9, "Paleozoic"),
  span("Pennsylvanian", "subperiod", 323.2, 298.9, "Carboniferous"),
  span("LowerPennsylvanian", "epoch", 323.2, 315.2, "Pennsylvanian"),
  span("Bashkirian", "age", 323.2, 315.2, "LowerPennsylvanian"),
  span("Silurian", "period", 443.8, 419.2, "Paleozoic"),
  span("Ludlow", "epoch", 427.4, 423, "Silurian"),
  span("Gorstian", "age", 427.4, 425.6, "Ludlow"),
  span("Ludfordian", "age", 425.6, 423, "Ludlow"),
  // an age directly below a period, as served by the API
  span("Pridoli", "age", 423, 419.2, "Silurian"),
];

const cell = (cells, name) => cells.find((c) => c.item.name === name);
const columns = (c) => [c.colStart, c.colEnd];
const rows = (c) => [c.rowStart, c.rowEnd];

describe("buildScale", () => {
  const { cells, leaves } = buildScale(ITEMS);

  it("gives every span without children one row, youngest on top", () => {
    expect(leaves.map((l) => l.name)).toEqual([
      "Bashkirian",
      "Pridoli",
      "Ludfordian",
      "Gorstian",
      "Hadean",
    ]);
  });

  it("lets a parent span the rows of its children", () => {
    expect(rows(cell(cells, "Phanerozoic"))).toEqual([0, 4]);
    expect(rows(cell(cells, "Silurian"))).toEqual([1, 4]);
    expect(rows(cell(cells, "Ludlow"))).toEqual([2, 4]);
    expect(rows(cell(cells, "Hadean"))).toEqual([4, 5]);
  });

  it("fills a rank that is not used", () => {
    // no supereon above it
    expect(columns(cell(cells, "Phanerozoic"))).toEqual([0, 2]);
    expect(columns(cell(cells, "Precambrian"))).toEqual([0, 1]);
    // no subperiod below it
    expect(columns(cell(cells, "Silurian"))).toEqual([3, 5]);
    expect(columns(cell(cells, "Carboniferous"))).toEqual([3, 4]);
  });

  it("runs a span without children to the last column", () => {
    expect(columns(cell(cells, "Hadean"))).toEqual([1, 7]);
    expect(columns(cell(cells, "Pridoli"))).toEqual([5, 7]);
    expect(columns(cell(cells, "Bashkirian"))).toEqual([6, 7]);
  });

  it("inherits the colour of the parent for a span without one", () => {
    const { cells: unknown } = buildScale([
      { ...span("Silurian", "period", 443.8, 419.2), color: "#B3E1B6" },
      span("Unheardofian", "epoch", 443.8, 419.2, "Silurian"),
    ]);
    expect(cell(unknown, "Unheardofian").color).toEqual("#B3E1B6");
  });

  it("keeps a span whose parent is unknown or whose type is new", () => {
    const { cells: odd } = buildScale([
      span("Orphan", "epoch", 10, 5, "Unknown"),
      span("Child", "newrank", 10, 5, "Orphan"),
    ]);
    expect(columns(cell(odd, "Orphan"))).toEqual([0, 1]);
    expect(columns(cell(odd, "Child"))).toEqual([1, 7]);
  });
});

describe("lighten", () => {
  it("mixes a colour with white", () => {
    expect(lighten("#000000", 0.5)).toEqual("#808080");
    expect(lighten("#FFFFFF")).toEqual("#ffffff");
    expect(lighten("#FF0000", 0)).toEqual("#ff0000");
  });

  // relative luminance of WCAG 2
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  it("leaves enough contrast for black text on the darkest colours of the chart", () => {
    ["#812B92", "#009270", "#AE027E", "#DA037F", "#678F66"].forEach((hex) => {
      expect((luminance(lighten(hex)) + 0.05) / 0.05).toBeGreaterThan(7);
    });
  });
});
