import { describe, it, expect } from "vitest";
import {
  SETTINGS,
  settingByName,
  appliesTo,
  isSet,
  cleanSettings,
  compactSettings,
  setSettingNames,
  parseSources,
  inheritedPart,
  formatValue,
} from "./settingsMeta";

describe("SETTINGS", () => {
  it("lists the 14 settings sectors and profiles share", () => {
    expect(SETTINGS.map((s) => s.name).sort()).toEqual([
      "authorshipUpdate",
      "blockedNamePatterns",
      "blockedNames",
      "code",
      "copyAccordingTo",
      "createImplicitNames",
      "entities",
      "extinctFilter",
      "issueExclusion",
      "nameFilter",
      "nameStatusExclusion",
      "nameTypes",
      "ranks",
      "removeOrdinals",
    ]);
  });

  it("marks exactly the four blocklists as union", () => {
    expect(SETTINGS.filter((s) => s.union).map((s) => s.name).sort()).toEqual([
      "blockedNamePatterns",
      "blockedNames",
      "issueExclusion",
      "nameStatusExclusion",
    ]);
  });
});

describe("appliesTo", () => {
  it("shows the blocklists for every tree sync and when no mode is given", () => {
    const s = settingByName.blockedNames;
    expect(appliesTo(s, ["attach"])).toBe(true);
    expect(appliesTo(s, ["union"])).toBe(true);
    expect(appliesTo(s, ["merge"])).toBe(true);
    expect(appliesTo(s, ["hierarchy", "merge"])).toBe(true);
    expect(appliesTo(s, [])).toBe(true);
    expect(appliesTo(s, undefined)).toBe(true);
    expect(appliesTo(s, ["hierarchy"])).toBe(false);
  });

  it("leaves hierarchy sectors authorshipUpdate only", () => {
    expect(SETTINGS.filter((s) => appliesTo(s, ["hierarchy"])).map((s) => s.name)).toEqual(["authorshipUpdate"]);
    expect(appliesTo(settingByName.authorshipUpdate, ["merge"])).toBe(false);
  });

  it("shows every other setting for every tree sync", () => {
    for (const mode of ["attach", "union", "merge"]) {
      expect(SETTINGS.filter((s) => !appliesTo(s, [mode])).map((s) => s.name)).toEqual(["authorshipUpdate"]);
    }
  });
});

describe("isSet", () => {
  it("treats null, empty lists and blank strings as not set", () => {
    expect(isSet(null)).toBe(false);
    expect(isSet(undefined)).toBe(false);
    expect(isSet([])).toBe(false);
    expect(isSet("")).toBe(false);
    expect(isSet("  ")).toBe(false);
  });

  it("treats false and values as set", () => {
    expect(isSet(false)).toBe(true);
    expect(isSet(["genus"])).toBe(true);
    expect(isSet("Abies.*")).toBe(true);
  });
});

describe("cleanSettings", () => {
  it("turns empty lists and blank strings into null", () => {
    expect(cleanSettings({ ranks: [], nameFilter: " " })).toEqual({ ranks: null, nameFilter: null });
  });

  it("keeps an explicit false", () => {
    expect(cleanSettings({ copyAccordingTo: false })).toEqual({ copyAccordingTo: false });
  });

  it("turns an undefined field into null", () => {
    expect(cleanSettings({ removeOrdinals: undefined })).toEqual({ removeOrdinals: null });
  });

  it("leaves out settings missing from the values, so stored hidden ones stay untouched", () => {
    expect(cleanSettings({ ranks: ["genus"] })).toEqual({ ranks: ["genus"] });
  });

  it("ignores fields that are no settings", () => {
    expect(cleanSettings({ mode: "merge", note: "x" })).toEqual({});
  });

  it("trims entries of lists and drops blank ones", () => {
    expect(cleanSettings({ blockedNames: ["Abies", " "] })).toEqual({ blockedNames: ["Abies"] });
    expect(cleanSettings({ blockedNames: [" Abies alba ", "", "Pinus\r"] })).toEqual({
      blockedNames: ["Abies alba", "Pinus"],
    });
    expect(cleanSettings({ blockedNames: [" "] })).toEqual({ blockedNames: null });
  });

  it("copes with no values", () => {
    expect(cleanSettings(undefined)).toEqual({});
  });
});

describe("compactSettings", () => {
  it("keeps only set values", () => {
    expect(
      compactSettings({ ranks: [], code: "zoological", removeOrdinals: null, copyAccordingTo: false })
    ).toEqual({ code: "zoological", copyAccordingTo: false });
  });
});

describe("setSettingNames", () => {
  it("names the set settings in SETTINGS order", () => {
    expect(setSettingNames({ code: "botanical", ranks: ["genus"], entities: [] })).toEqual(["ranks", "code"]);
  });

  it("copes with no settings", () => {
    expect(setSettingNames(null)).toEqual([]);
  });
});

describe("parseSources", () => {
  it("parses single levels", () => {
    expect(parseSources("default")).toEqual([{ type: "default" }]);
    expect(parseSources("sector")).toEqual([{ type: "sector" }]);
    expect(parseSources("profile:3")).toEqual([{ type: "profile", id: 3 }]);
  });

  it("parses the comma separated levels of a blocklist", () => {
    expect(parseSources("profile:1,sector")).toEqual([{ type: "profile", id: 1 }, { type: "sector" }]);
  });

  it("reads a missing source as default", () => {
    expect(parseSources(undefined)).toEqual([{ type: "default" }]);
  });
});

describe("inheritedPart", () => {
  it("removes the sector's own entries", () => {
    expect(inheritedPart(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
  });

  it("copes with missing lists", () => {
    expect(inheritedPart(["a"], null)).toEqual(["a"]);
    expect(inheritedPart(null, ["a"])).toEqual([]);
  });
});

describe("formatValue", () => {
  it("names unset values", () => {
    expect(formatValue(settingByName.nameFilter, null)).toBe("none");
    expect(formatValue(settingByName.extinctFilter, null)).toBe("all");
    expect(formatValue(settingByName.nameTypes, [])).toBe("all");
  });

  it("formats booleans", () => {
    expect(formatValue(settingByName.extinctFilter, true)).toBe("extinct");
    expect(formatValue(settingByName.extinctFilter, false)).toBe("extant");
    expect(formatValue(settingByName.copyAccordingTo, false)).toBe("no");
    expect(formatValue(settingByName.createImplicitNames, true)).toBe("yes");
  });

  it("joins lists and calls a complete one all", () => {
    expect(formatValue(settingByName.ranks, ["genus", "species"])).toBe("genus, species");
    expect(formatValue(settingByName.entities, ["name", "reference"], ["name", "reference"])).toBe("all");
  });

  it("prints scalars", () => {
    expect(formatValue(settingByName.code, "zoological")).toBe("zoological");
  });
});
