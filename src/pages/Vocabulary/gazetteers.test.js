import { describe, expect, it } from "vitest";
import {
  areaApiUrl,
  areaPath,
  compareIds,
  externalAreaLink,
  parseAreaKey,
  parseLabels,
} from "./gazetteers";

describe("parseLabels", () => {
  it("reads the id and English label and ignores extra columns", () => {
    expect(parseLabels("18\tArctic Sea\tMer Arctique\tMar Ártico\n")).toEqual([
      { id: "18", label: "Arctic Sea" },
    ]);
  });

  it("sorts ids naturally", () => {
    const tsv = "10\tb\n2\tc\n1\ta\n28a\td\n28A\te\n";
    expect(parseLabels(tsv).map((r) => r.id)).toEqual(["1", "2", "10", "28a", "28A"]);
  });

  it("copes with a missing label and blank lines", () => {
    expect(parseLabels("x\n\n")).toEqual([{ id: "x", label: "" }]);
    expect(parseLabels("")).toEqual([]);
  });
});

describe("compareIds", () => {
  it("never treats ids differing only in case as equal", () => {
    expect(compareIds("28A", "28a")).not.toBe(0);
    expect(compareIds("28A", "28A")).toBe(0);
  });
});

describe("parseAreaKey", () => {
  it("splits on the first colon and keeps the case of the id", () => {
    expect(parseAreaKey("iso:DE-BE")).toEqual({ gazetteer: "iso", id: "DE-BE" });
    expect(parseAreaKey("IHO:28a")).toEqual({ gazetteer: "iho", id: "28a" });
    expect(parseAreaKey("x:a:b")).toEqual({ gazetteer: "x", id: "a:b" });
  });

  it("rejects keys without a gazetteer or an id", () => {
    expect(parseAreaKey("foo")).toBeNull();
    expect(parseAreaKey(":1")).toBeNull();
    expect(parseAreaKey("iso:")).toBeNull();
    expect(parseAreaKey(undefined)).toBeNull();
  });
});

describe("area urls", () => {
  it("encodes the id, but not the separating colon", () => {
    expect(areaPath("iso", "DE-BE")).toBe("/vocabulary/area/iso:DE-BE");
    expect(areaPath("x", "a b")).toBe("/vocabulary/area/x:a%20b");
    expect(areaApiUrl("fao", "21.0.A")).toMatch(/vocab\/area\/fao:21\.0\.A$/);
  });
});

describe("externalAreaLink", () => {
  it("uses the template", () => {
    const gazetteer = { name: "mrgid", areaLinkTemplate: "http://marineregions.org/mrgid/" };
    expect(externalAreaLink(gazetteer, "100")).toBe("http://marineregions.org/mrgid/100");
  });

  it("links fao subdivisions to their main division", () => {
    const gazetteer = { name: "fao", areaLinkTemplate: "https://www.fao.org/fishery/en/area/" };
    expect(externalAreaLink(gazetteer, "21.0.A")).toBe("https://www.fao.org/fishery/en/area/21");
  });

  it("is null without a template", () => {
    expect(externalAreaLink({ name: "tdwg" }, "1")).toBeNull();
    expect(externalAreaLink(null, "1")).toBeNull();
  });
});
