import { describe, it, expect } from "vitest";
import { publisherOptionLabel } from "./publisherOption";

describe("publisherOptionLabel", () => {
  it("formats name with count", () => {
    expect(publisherOptionLabel({ key: "Royal Botanic Gardens, Kew", count: 312 }))
      .toBe("Royal Botanic Gardens, Kew (312)");
  });

  it("omits the count when it is missing", () => {
    expect(publisherOptionLabel({ key: "Missouri Botanical Garden" }))
      .toBe("Missouri Botanical Garden");
  });
});
