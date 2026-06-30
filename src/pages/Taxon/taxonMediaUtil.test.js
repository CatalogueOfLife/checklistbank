import { describe, it, expect } from "vitest";
import { cachedImage, captionText } from "./taxonMediaUtil";

describe("cachedImage", () => {
  it("wraps a url in the GBIF image cache at the given size", () => {
    expect(cachedImage("https://x.org/a.jpg", "x360")).toBe(
      "https://api.gbif.org/v1/image/unsafe/x360/https://x.org/a.jpg"
    );
    expect(cachedImage("https://x.org/a.jpg", "fit-in/1200x1200")).toBe(
      "https://api.gbif.org/v1/image/unsafe/fit-in/1200x1200/https://x.org/a.jpg"
    );
  });
});

describe("captionText", () => {
  it("joins capturedBy and captured with a middot", () => {
    expect(captionText({ capturedBy: "Jane Doe", captured: "2007-12-31" })).toBe(
      "Jane Doe · 2007-12-31"
    );
  });

  it("shows just capturedBy when there is no date", () => {
    expect(captionText({ capturedBy: "Jane Doe" })).toBe("Jane Doe");
  });

  it("shows just the date when there is no author", () => {
    expect(captionText({ captured: "2007" })).toBe("2007");
  });

  it("returns empty text (license rendered separately) when only a license is present", () => {
    expect(captionText({ license: "cc by" })).toBe("");
  });

  it("falls back to the title when no author/date/license", () => {
    expect(captionText({ title: "A tiger in the grass" })).toBe(
      "A tiger in the grass"
    );
  });

  it("truncates a long title fallback", () => {
    const long = "x".repeat(60);
    expect(captionText({ title: long })).toBe("x".repeat(47) + "...");
  });

  it("falls back to remarks when there is no title", () => {
    expect(captionText({ remarks: "some note" })).toBe("some note");
  });

  it("returns empty string for an item with no usable fields", () => {
    expect(captionText({ url: "https://x.org/a.jpg" })).toBe("");
  });

  it("prefers author/date over a present title", () => {
    expect(
      captionText({ capturedBy: "Jane", title: "ignored heading" })
    ).toBe("Jane");
  });
});
