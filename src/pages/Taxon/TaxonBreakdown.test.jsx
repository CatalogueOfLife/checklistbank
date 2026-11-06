import React from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect, vi, beforeEach } from "vitest";

// The breakdown endpoint answers one object that decides the chart: what the
// nodes count, which ranks form the rings and the total. A node without an id
// is the remainder of its parent. The chart must draw exactly that and fire no
// rank facet search of its own.

// vite.config.js defines NODE_ENV as production for every build, tests
// included, and production React has no act(): render and wait instead.

// jsdom has no matchMedia, which the antd spinner's grid asks for
window.matchMedia ||= () => ({
  matches: false,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});

const requests = [];
let response;
vi.mock("axios", () => ({
  default: (url) => {
    requests.push(url);
    return Promise.resolve({ data: response });
  },
}));

let options;
vi.mock("@highcharts/react", () => ({
  Chart: (props) => {
    options = props.options;
    return null;
  },
}));

// the dataset comes from the app context, pass it in as a prop instead
vi.mock("../../components/hoc/withContext", () => ({
  default: () => (Component) => Component,
}));

const { default: TaxonBreakdown } = await import("./TaxonBreakdown");

const arthropoda = {
  taxon: { id: "t2", name: "Arthropoda", rank: "phylum" },
  counts: { class: 1, order: 2, species: 9 },
  countRank: "species",
  ranks: ["class", "order"],
  total: 9,
  children: [
    {
      id: "t3",
      name: "Insecta",
      rank: "class",
      count: 7,
      children: [
        { id: "t4", name: "Coleoptera", rank: "order", count: 3 },
        { id: "t5", name: "Lepidoptera", rank: "order", count: 3 },
        { rank: "order", count: 1 },
      ],
    },
    { rank: "class", count: 2, children: [] },
  ],
};

const render = async () => {
  const div = document.createElement("div");
  const root = createRoot(div);
  root.render(
    <TaxonBreakdown
      taxon={{ id: "t2", name: { scientificName: "Arthropoda", rank: "phylum" } }}
      datasetKey={3}
      dataset={{ title: "COL" }}
    />
  );
  // the chart either gets its options or the spinner goes away
  await vi.waitFor(() =>
    expect(options !== null || (requests.length > 0 && !div.innerHTML)).toBe(true)
  );
  return { div, root };
};

const slices = (series) => series.data.map((d) => [d.name, d.y]);

describe("TaxonBreakdown", () => {
  beforeEach(() => {
    requests.length = 0;
    options = null;
  });

  it("draws the two rings of the object with their remainders", async () => {
    response = arthropoda;
    const { root } = await render();
    expect(requests).toEqual([
      expect.stringContaining("dataset/3/taxon/t2/breakdown?level=2"),
    ]);
    const [inner, outer] = options.series;
    expect(inner.name).toBe("Species");
    expect(slices(inner)).toEqual([
      ["Insecta", 7],
      ["Other / Unknown class", 2],
    ]);
    expect(slices(outer)).toEqual([
      ["Coleoptera", 3],
      ["Lepidoptera", 3],
      ["Other / Unknown order", 1],
      ["Other / Unknown ", 2],
    ]);
    root.unmount();
  });

  it("puts the taxon in the centre when there is one ring", async () => {
    response = {
      ...arthropoda,
      countRank: "genus",
      ranks: ["class"],
      children: [
        { id: "t3", name: "Insecta", rank: "class", count: 7 },
        { rank: "class", count: 2 },
      ],
    };
    const { root } = await render();
    const [inner, outer] = options.series;
    expect(inner.name).toBe("Genera");
    expect(slices(inner)).toEqual([["Arthropoda", 9]]);
    expect(slices(outer)).toEqual([
      ["Insecta", 7],
      ["Other / Unknown class", 2],
    ]);
    root.unmount();
  });

  it("renders nothing when there is nothing to chart", async () => {
    response = {
      taxon: arthropoda.taxon,
      counts: {},
      countRank: null,
      ranks: [],
      total: 0,
      children: [],
    };
    const { div, root } = await render();
    expect(options).toBeNull();
    expect(div.innerHTML).toBe("");
    root.unmount();
  });
});
