import { describe, it, expect } from "vitest";
import { formatRequestValue } from "./requestValue";

// The `root` filter of an export request is a SimpleName. The API stopped
// serving its `label` (backend ab3ed107f made getLabel() @JsonIgnore), so
// anything reading `root.label` now falls through to the bare object.
const ROOT = {
  id: "x8N",
  name: "Malvaceae",
  rank: "family",
  labelHtml: "Malvaceae",
};

describe("formatRequestValue", () => {
  it("renders a scalar as text", () => {
    expect(formatRequestValue("coldp")).toEqual({ text: "coldp" });
    expect(formatRequestValue(26226)).toEqual({ text: "26226" });
    expect(formatRequestValue(true)).toEqual({ text: "true" });
    expect(formatRequestValue(false)).toEqual({ text: "false" });
  });

  it("renders a root taxon by its labelHtml", () => {
    expect(formatRequestValue(ROOT)).toEqual({ html: "Malvaceae" });
  });

  it("keeps the markup of a name below genus", () => {
    expect(
      formatRequestValue({ name: "Abies alba", labelHtml: "<i>Abies alba</i> Mill." })
    ).toEqual({ html: "<i>Abies alba</i> Mill." });
  });

  it("falls back to the plain name when labelHtml is absent", () => {
    expect(formatRequestValue({ id: "x8N", name: "Malvaceae" })).toEqual({
      text: "Malvaceae",
    });
  });

  it("never stringifies an object as [object Object]", () => {
    for (const value of [ROOT, { id: "x8N" }, {}, [1, 2]]) {
      const { text, html } = formatRequestValue(value);
      expect(`${text ?? ""}${html ?? ""}`).not.toContain("[object Object]");
    }
  });

  it("renders an empty string for a missing value", () => {
    expect(formatRequestValue(null)).toEqual({ text: "" });
    expect(formatRequestValue(undefined)).toEqual({ text: "" });
  });
});
