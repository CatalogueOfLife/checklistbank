import { describe, it, expect } from "vitest";
import { formatRequestValue } from "./requestValue";

// The `root` filter of an export request is a SimpleName. Backend ab3ed107f
// made getLabel() @JsonIgnore, dropping `label` from the JSON; it is being
// restored, so both shapes are covered here.
const ROOT_WITH_LABEL = {
  id: "x8N",
  name: "Malvaceae",
  rank: "family",
  label: "Malvaceae",
  labelHtml: "Malvaceae",
};

const ROOT_WITHOUT_LABEL = {
  id: "x8N",
  name: "Malvaceae",
  rank: "family",
  labelHtml: "Malvaceae",
};

describe("formatRequestValue", () => {
  it("renders a scalar as text", () => {
    expect(formatRequestValue("coldp")).toBe("coldp");
    expect(formatRequestValue(26226)).toBe("26226");
    expect(formatRequestValue(true)).toBe("true");
    expect(formatRequestValue(false)).toBe("false");
  });

  it("renders a root taxon by its plain label", () => {
    expect(formatRequestValue(ROOT_WITH_LABEL)).toBe("Malvaceae");
  });

  it("prefers the plain label over the marked up one", () => {
    expect(
      formatRequestValue({
        name: "Abies alba",
        label: "Abies alba Mill.",
        labelHtml: "<i>Abies alba</i> Mill.",
      })
    ).toBe("Abies alba Mill.");
  });

  it("never returns markup", () => {
    for (const value of [ROOT_WITH_LABEL, ROOT_WITHOUT_LABEL]) {
      expect(formatRequestValue(value)).not.toContain("<");
    }
  });

  it("falls back to the plain name while label is absent", () => {
    expect(formatRequestValue(ROOT_WITHOUT_LABEL)).toBe("Malvaceae");
  });

  it("never stringifies an object as [object Object]", () => {
    for (const value of [ROOT_WITH_LABEL, ROOT_WITHOUT_LABEL, { id: "x8N" }, {}, [1, 2]]) {
      expect(formatRequestValue(value)).not.toContain("[object Object]");
    }
  });

  it("renders an empty string for a missing value", () => {
    expect(formatRequestValue(null)).toBe("");
    expect(formatRequestValue(undefined)).toBe("");
  });
});
