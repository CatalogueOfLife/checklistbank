import { describe, expect, it } from "vitest";
import { normalizeVocab, partitionFields, vocabApiPath } from "./vocabValues";

describe("vocabApiPath", () => {
  it("resolves the terms name of the vocabulary index", () => {
    expect(vocabApiPath("terms")).toBe("term");
    expect(vocabApiPath("rank")).toBe("rank");
  });
});

describe("normalizeVocab", () => {
  it("keeps a list of objects as cards", () => {
    const data = [{ name: "species" }];
    expect(normalizeVocab(data)).toEqual({ items: data });
  });

  it("turns a list of strings into rows", () => {
    expect(normalizeVocab(["dwc:Taxon"])).toEqual({
      rows: [{ id: "dwc:Taxon", label: "" }],
    });
  });

  it("turns a map into sorted rows", () => {
    expect(normalizeVocab({ eng: "English", deu: "German" })).toEqual({
      rows: [
        { id: "deu", label: "German" },
        { id: "eng", label: "English" },
      ],
    });
  });
});

describe("partitionFields", () => {
  it("shows true flags as tags and omits false and empty values", () => {
    const { flags, fields } = partitionFields({
      name: "species",
      marker: "sp.",
      concrete: true,
      legacy: false,
      plural: null,
      parents: [],
      normalizer: {},
      blank: "",
    });
    expect(flags).toEqual(["concrete"]);
    expect(fields).toEqual([["marker", "sp."]]);
  });

  it("keeps a zero", () => {
    expect(partitionFields({ order: 0 }).fields).toEqual([["order", 0]]);
  });

  it("excludes the name by default, and whatever else is asked for", () => {
    expect(partitionFields({ name: "x", a: 1 }).fields).toEqual([["a", 1]]);
    expect(partitionFields({ name: "x", a: 1 }, ["a"]).fields).toEqual([["name", "x"]]);
  });
});
