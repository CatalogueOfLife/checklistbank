import { describe, it, expect } from "vitest";
import { parseUsagePath, pickUsage } from "./usagePath";

describe("parseUsagePath", () => {
  it("splits dataset, project and project source urls", () => {
    expect(parseUsagePath("/dataset/2004/taxon/wfo-1")).toEqual({
      prefix: "/dataset/2004",
      section: "taxon",
    });
    expect(parseUsagePath("/dataset/2004/name/wfo-1")).toEqual({
      prefix: "/dataset/2004",
      section: "name",
    });
    expect(parseUsagePath("/project/3/nameusage/abc")).toEqual({
      prefix: "/project/3",
      section: "nameusage",
    });
    expect(parseUsagePath("/project/3/dataset/1000/name/abc")).toEqual({
      prefix: "/project/3/dataset/1000",
      section: "name",
    });
  });

  it("takes a key that reads like a section as the key", () => {
    expect(parseUsagePath("/dataset/3/taxon/name")).toEqual({
      prefix: "/dataset/3",
      section: "taxon",
    });
  });
});

describe("pickUsage", () => {
  const usages = [
    { id: "s1", status: "synonym" },
    { id: "a1", status: "accepted" },
    { id: "s2", status: "ambiguous synonym" },
  ];

  it("prefers the requested usage", () => {
    expect(pickUsage(usages, "s2").id).toBe("s2");
  });

  it("falls back to an accepted usage, then the first", () => {
    expect(pickUsage(usages, "unknown").id).toBe("a1");
    expect(pickUsage(usages.filter((u) => u.id !== "a1"), null).id).toBe("s1");
  });

  it("is null for a bare name", () => {
    expect(pickUsage([], null)).toBeNull();
  });
});
