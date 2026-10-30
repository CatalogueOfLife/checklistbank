import { describe, expect, it } from "vitest";
import { computeBounds, computeWrappedBounds, flattenFeatures } from "./geo";

const polygon = (west, south, east, north) => ({
  type: "Polygon",
  coordinates: [
    [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ],
  ],
});
const feature = (geometry) => ({ type: "Feature", geometry });

describe("flattenFeatures", () => {
  it("handles collections, single features and nothing", () => {
    const f = feature(polygon(0, 0, 1, 1));
    expect(flattenFeatures({ type: "FeatureCollection", features: [f] })).toEqual([f]);
    expect(flattenFeatures(f)).toEqual([f]);
    expect(flattenFeatures(null)).toEqual([]);
  });
});

describe("computeBounds", () => {
  it("spans all vertices", () => {
    expect(computeBounds([feature(polygon(1, 2, 3, 4))])).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});

describe("computeWrappedBounds", () => {
  it("is null without any geometry", () => {
    expect(computeWrappedBounds([])).toBeNull();
    expect(computeWrappedBounds([{ type: "Feature", geometry: null }])).toBeNull();
  });

  it("matches the plain bounds for a shape away from the antimeridian", () => {
    const f = feature(polygon(5, 47, 15, 55));
    expect(computeWrappedBounds([f])).toEqual(computeBounds([f]));
  });

  it("does not jump the gap of a wide single part", () => {
    expect(computeWrappedBounds([feature(polygon(-150, 0, 150, 10))])).toEqual([
      [-150, 0],
      [150, 10],
    ]);
  });

  it("fits a shape split at the antimeridian to its real extent", () => {
    const fiji = {
      type: "MultiPolygon",
      coordinates: [polygon(177, -19, 180, -16).coordinates, polygon(-180, -19, -178, -16).coordinates],
    };
    expect(computeWrappedBounds([feature(fiji)])).toEqual([
      [177, -19],
      [182, -16],
    ]);
  });

  it("copes with a point and with a line", () => {
    expect(computeWrappedBounds([feature({ type: "Point", coordinates: [10, 20] })])).toEqual([
      [10, 20],
      [10, 20],
    ]);
    const line = {
      type: "LineString",
      coordinates: [
        [1, 2],
        [3, 4],
      ],
    };
    expect(computeWrappedBounds([feature(line)])).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});
