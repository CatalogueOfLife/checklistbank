import { describe, it, expect } from "vitest";
import { formatAuthorship } from "./authorship";

describe("formatAuthorship", () => {
  it("joins authors with commas and an ampersand, then the year", () => {
    expect(formatAuthorship({ authors: ["L."] })).toBe("L.");
    expect(formatAuthorship({ authors: ["Linnaeus"], year: "1758" })).toBe(
      "Linnaeus, 1758"
    );
    expect(formatAuthorship({ authors: ["Ab", "Cd", "Ef"] })).toBe(
      "Ab, Cd & Ef"
    );
    expect(formatAuthorship({ authors: ["Smith", "al."] })).toBe(
      "Smith et al."
    );
  });

  it("cites ex authors before the validating authors", () => {
    expect(
      formatAuthorship({ authors: ["DC."], exAuthors: ["Mill."] })
    ).toBe("Mill. ex DC.");
  });

  it("cites the sanctioning author after a colon", () => {
    expect(
      formatAuthorship({ authors: ["Bull."], sanctioningAuthor: "Fr." })
    ).toBe("Bull. : Fr.");
    expect(
      formatAuthorship({ authors: ["Wulfen"], sanctioningAuthor: "Fr." })
    ).toBe("Wulfen : Fr.");
  });

  it("cites an anonymous authorship without authors as Anon., anon. in botany", () => {
    expect(formatAuthorship({ anonymous: true }, "zoological")).toBe("Anon.");
    expect(formatAuthorship({ anonymous: true })).toBe("Anon.");
    expect(formatAuthorship({ anonymous: true }, "botanical")).toBe("anon.");
    expect(formatAuthorship({ anonymous: true, year: "1798" })).toBe(
      "Anon., 1798"
    );
  });

  it("puts attributed authors of an anonymous authorship in square brackets", () => {
    expect(
      formatAuthorship({
        authors: ["Denis", "Schiffermüller"],
        year: "1775",
        anonymous: true,
      })
    ).toBe("[Denis & Schiffermüller], 1775");
  });

  it("cites the imprint year after the year", () => {
    expect(
      formatAuthorship({ authors: ["Storr"], year: "1970", imprintYear: "1969" })
    ).toBe("Storr, 1970 [1969]");
  });

  it("lists all bacterial authors and leaves out the comma before the year", () => {
    expect(
      formatAuthorship({ authors: ["Ab", "Cd", "Ef"], year: "1990" }, "bacterial")
    ).toBe("Ab, Cd & Ef 1990");
  });

  it("returns nothing for an absent or empty authorship", () => {
    expect(formatAuthorship(undefined)).toBeNull();
    expect(formatAuthorship({})).toBeNull();
    expect(formatAuthorship({ authors: [] })).toBeNull();
    expect(formatAuthorship({ year: "1798" })).toBe("1798");
  });
});
