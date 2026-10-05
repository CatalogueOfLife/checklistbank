# Sector Profiles UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let curators manage sector profiles in the ChecklistBank UI and make the sector form inherit-aware, so it never overrides profiles by accident (issue #1732).

**Architecture:**
- **Backend:** one read-only preview endpoint. A selector is evaluated through the sector search, which reuses the `MATCHES` SQL already shared by profiles.
- **UI shared module:** `src/components/SectorSettings/` holds pure helpers (`settingsMeta.js`) and the 14 settings widgets. Sector and profile forms both use it.
- **UI new pages:** the Profiles page (`src/pages/project/SectorProfiles/`) is new. Existing sector pages gain effective-settings display and bulk helpers.

**Tech Stack:**
- **UI:** React 19, antd 6.4, React Router 6, Vite 8 / Vitest, axios, `react-drag-listview`.
- **Backend:** Java 21, Dropwizard/Jersey, MyBatis, Postgres 17, JUnit 4.

**Spec:** `docs/superpowers/specs/2026-10-05-sector-profiles-design.md` (read it before starting). Two deviations:
- `selectorSummary.js` is named `profileUtils.js`, because it also holds the reorder and selector helpers.
- The spec's "AddToProfileModal" gets a narrowing warning (see Review Focus).

## Global Constraints

- **File extensions:** files containing JSX use `.jsx`; pure modules (helpers, API clients, tests) use `.js`.
- **lodash:** every file that uses it imports it itself (`import _ from "lodash"` or named imports).
- **antd 6 APIs:**
  - use `items` props, never child-element APIs (`Tabs.TabPane`, `Steps.Step`, `Menu.Item`);
  - `Alert` takes `title`/`description`;
  - notifications come from `App.useApp()`, never the static `notification`;
  - a remote-search `Select` uses `showSearch={{ filterOption: false, onSearch }}`.
- **Vocabulary values** render verbatim and lowercase, exactly as the API serialises them (`"merge"`, `"article"`, `"genus"`). No label maps.
- **Never send an explicit `false` or empty value the editor did not choose.** *Inherit* is `null`; `cleanSettings` turns empty lists and blank strings into `null`.
- **Do not run `npm run build`.** It rewrites `src/enumeration/*.json` from the live prod API, which still serves the removed settings. Build check: `NODE_ENV=production npx vite build`.
- **Vitest has no renderer** (no RTL; `act` is unresolvable). Unit-test pure modules only, and check rendering in the browser.
- **Commits:** commit on `master` in both repos, never push, and add no Claude attribution to commit messages.
- **Backend tests:** DAO tests need Docker (`PgSetupRule` starts Postgres).

## Review Focus

1. **Hidden settings stay untouched.** Editing a sector whose mode hides some settings, e.g. an attach sector with stored merge blocklists, must leave those stored values alone. Pinned by the `cleanSettings` test "leaves out settings missing from the values" (Task 2).
2. **Explicit `false` is preserved.** A stored explicit `false` stays `false`, while an untouched or *Inherit* tri-state sends `null`. Pinned by the `cleanSettings` tests "keeps an explicit false" and "turns an undefined field into null" (Task 2).
3. **"Add to profile" can narrow a profile.** Run on a profile whose selector has no `sectorKeys` / `subjectDatasetKeys` yet, it limits the profile to just those keys, because selector fields are ANDed. The modal warns about this. `addToSelector` dedup is tested (Task 10).
4. **Junk sector keys.** Values typed into the selector's sector-keys tag input (`"12a"`, `" 5 "`, duplicates) are cleaned by `normalizeSelector`. Pinned by a test (Task 6).
5. **Tied positions.** Reordering profiles that share a position (migrated projects may have ties) renumbers everything so the order is unambiguous. Pinned by a `reorder` test with ties (Task 6).

---

## File map

| File | Responsibility |
|---|---|
| backend `api/.../search/SectorSearchRequest.java` | new `selector` filter property |
| backend `dao/.../mapper/SectorMapper.xml` | selector `EXISTS` filter |
| backend `webservice/.../dataset/SectorProfileResource.java` | `POST preview` |
| backend `dao/src/test/.../SectorMapperTest.java` | selector filter test |
| backend `docs/SECTOR-SETTINGS.md` | API row |
| `src/components/SectorSettings/settingsMeta.js` (+ `.test.js`) | the 14 settings and pure helpers |
| `src/components/SectorSettings/TriStateRadio.jsx` | Inherit / yes / no |
| `src/components/SectorSettings/SourceTags.jsx` | `SourceTags`, `ProfileLinks` |
| `src/components/SectorSettings/SectorSettingsFields.jsx` | the settings `Form.Item`s with inherited hints |
| `src/components/SectorSettings/EffectiveSettingsSummary.jsx` | read-only effective settings |
| `src/api/sector.js` | profile CRUD, counts, preview, effective settings |
| `src/pages/project/Assembly/SectorForm.jsx` | uses the shared fields |
| `src/enumeration/setting.json`, `src/pages/project/Options/Options.jsx` | removed settings, pointer to profiles |
| `src/enumeration/sector$mode.json`, `writeEnums.cjs`, `src/api/enumeration.js`, `src/components/hoc/ContextProvider.jsx` | `sectorMode` enum |
| `src/pages/project/SectorProfiles/profileUtils.js` (+ `.test.js`) | `EMPTY_SELECTOR`, `normalizeSelector`, `summarizeSelector`, `reorder`, `addToSelector` |
| `src/pages/project/SectorProfiles/index.jsx`, `ProfileList.jsx` | Profiles page and list |
| `src/pages/project/SectorProfiles/ProfileForm.jsx`, `PublisherSelect.jsx`, `DatasetSelect.jsx`, `PreviewDrawer.jsx` | create/edit with live preview |
| `src/pages/project/SectorProfiles/AddToProfileModal.jsx` | bulk "add to profile" |
| `src/App.jsx`, `src/pages/project/ProjectSectors/SectorTabs.jsx` | route + tab |
| `src/pages/project/Assembly/Sector.jsx` | popover shows effective settings |
| `src/pages/project/ProjectSectors/SectorPageContent.jsx`, `SectorTable.jsx` | profile filter, release rows, add-to-profile |
| `src/pages/DatasetKey/datasetPageTabs/ReleaseSectors.jsx` | release profiles, read-only |

---

### Task 1: Backend profile preview endpoint

Repo: `~/code/col/backend` (all paths in this task are relative to it).

**Files:**
- Modify: `api/src/main/java/life/catalogue/api/search/SectorSearchRequest.java`
- Modify: `dao/src/main/resources/life/catalogue/db/mapper/SectorMapper.xml` (the `WHERE` sql, right after the `req.profileKey` block, ~line 187)
- Modify: `webservice/src/main/java/life/catalogue/resources/dataset/SectorProfileResource.java`
- Modify: `docs/SECTOR-SETTINGS.md` (API table)
- Test: `dao/src/test/java/life/catalogue/db/mapper/SectorMapperTest.java`

**Interfaces:**
- Produces: `POST /dataset/{key}/sector/profile/preview?limit&offset`.
  - Body: `SectorSelector` JSON, i.e. `{modes, datasetTypes, publisherKeys, anySectorPublisher, subjectDatasetKeys, sectorKeys}`.
  - Response: `ResultPage<Sector>` (`{offset, limit, total, result}`).
  - Needs no role.

- [ ] **Step 1: Write the failing test**

Add `import life.catalogue.api.model.SectorSelector;` to `SectorMapperTest` and this test after `searchByProfile()`:

```java
  @Test
  public void searchBySelector() {
    add2Sectors();
    var req = SectorSearchRequest.byProject(targetDatasetKey);

    // an empty selector selects every sector of the project
    var sel = new SectorSelector();
    req.setSelector(sel);
    assertEquals(2, mapper().countSearch(req));

    sel.setSectorKeys(Set.of(s2.getId()));
    assertEquals(List.of(s2.getId()), keys(mapper().search(req, new Page())));
    assertEquals(1, mapper().countSearch(req));

    // both test sectors are ATTACH
    sel = new SectorSelector();
    sel.setModes(Set.of(Sector.Mode.MERGE));
    req.setSelector(sel);
    assertEquals(0, mapper().countSearch(req));
    sel.setModes(Set.of(Sector.Mode.ATTACH, Sector.Mode.MERGE));
    assertEquals(2, mapper().countSearch(req));

    // exercises the enum, integer and uuid array casts
    sel = new SectorSelector();
    sel.setDatasetTypes(EnumSet.allOf(DatasetType.class));
    sel.setSubjectDatasetKeys(Set.of(subjectDatasetKey));
    req.setSelector(sel);
    assertEquals(2, mapper().countSearch(req));
    sel.setPublisherKeys(Set.of(UUID.randomUUID()));
    assertEquals(0, mapper().countSearch(req));

    // the project has no sector publishers
    sel = new SectorSelector();
    sel.setAnySectorPublisher(true);
    req.setSelector(sel);
    assertEquals(0, mapper().countSearch(req));
  }
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ~/code/col/backend && mvn -q -pl dao -am test -Dtest=SectorMapperTest#searchBySelector -Dsurefire.failIfNoSpecifiedTests=false`
Expected: compilation failure, `cannot find symbol: method setSelector`.

- [ ] **Step 3: Add the request property**

In `SectorSearchRequest`, add the import `life.catalogue.api.model.SectorSelector` next to the `Sector` import. Add this field after `profileKey`:

```java
  /**
   * Only sectors a profile with this selector would select. No query parameter, the profile preview sets it.
   */
  private SectorSelector selector;
```

Getter and setter after `setProfileKey`:

```java
  public SectorSelector getSelector() {
    return selector;
  }

  public void setSelector(SectorSelector selector) {
    this.selector = selector;
  }
```

In `equals`, append `&& Objects.equals(selector, that.selector)` to the return expression. In `hashCode`, append `selector` as the last argument of `Objects.hash(...)`.

- [ ] **Step 4: Add the SQL filter**

In `SectorMapper.xml`, inside `<sql id="WHERE">`, directly after the closing `</if>` of the `req.profileKey != null` block:

```xml
        <if test="req.selector != null">
          AND EXISTS (
            SELECT TRUE FROM (SELECT
                #{req.selector.modes, typeHandler=life.catalogue.db.type2.SectorModeSetTypeHandler}::SECTOR_MODE[] AS modes,
                #{req.selector.datasetTypes, typeHandler=life.catalogue.db.type2.DatasetTypeSetTypeHandler}::DATASETTYPE[] AS dataset_types,
                #{req.selector.publisherKeys, typeHandler=life.catalogue.db.type2.UuidSetTypeHandler}::UUID[] AS publisher_keys,
                #{req.selector.anySectorPublisher}::BOOLEAN AS any_sector_publisher,
                #{req.selector.subjectDatasetKeys, typeHandler=life.catalogue.db.type2.IntegerSetTypeHandler}::INTEGER[] AS subject_dataset_keys,
                #{req.selector.sectorKeys, typeHandler=life.catalogue.db.type2.IntegerSetTypeHandler}::INTEGER[] AS sector_keys
              ) p LEFT JOIN dataset d ON d.key = s.subject_dataset_key
            WHERE <include refid="life.catalogue.db.mapper.SectorProfileMapper.MATCHES"/>
          )
        </if>
```

The column aliases must match the `sector_profile` columns `MATCHES` reads (`p.modes`, `p.dataset_types`, …).

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd ~/code/col/backend && mvn -q -pl dao -am test -Dtest=SectorMapperTest -Dsurefire.failIfNoSpecifiedTests=false`
Expected: all `SectorMapperTest` tests pass, including `searchBySelector` and `searchByProfile`.

- [ ] **Step 6: Add the endpoint**

In `SectorProfileResource`, after `sectors(...)`:

```java
  /**
   * The sectors a profile with the given selector would select right now, to preview a selector before saving it.
   */
  @POST
  @Path("preview")
  public ResultPage<Sector> preview(@PathParam("key") int datasetKey, SectorSelector selector, @Valid @BeanParam Page page) {
    var req = SectorSearchRequest.byProject(datasetKey);
    req.setSelector(selector == null ? new SectorSelector() : selector);
    return sdao.search(req, page);
  }
```

(`life.catalogue.api.model.*` already covers `SectorSelector`, `ResultPage` and `Page`.)

- [ ] **Step 7: Document it**

In `docs/SECTOR-SETTINGS.md`, add this row to the API table after the `GET /dataset/{key}/sector?profileKey={id}` row:

```markdown
| `POST /dataset/{key}/sector/profile/preview` | The sectors a profile with the posted selector would select right now, to preview a selector before saving it |
```

- [ ] **Step 8: Compile the webservice**

Run: `cd ~/code/col/backend && mvn -q -pl webservice -am compile -DskipTests`
Expected: BUILD SUCCESS (no output with `-q`).

- [ ] **Step 9: Commit**

```bash
cd ~/code/col/backend
git add api/src/main/java/life/catalogue/api/search/SectorSearchRequest.java \
  dao/src/main/resources/life/catalogue/db/mapper/SectorMapper.xml \
  dao/src/test/java/life/catalogue/db/mapper/SectorMapperTest.java \
  webservice/src/main/java/life/catalogue/resources/dataset/SectorProfileResource.java \
  docs/SECTOR-SETTINGS.md
git commit -m "Preview the sectors an unsaved profile selector selects"
```

---

### Task 2: Settings metadata and pure helpers

**Files:**
- Create: `src/components/SectorSettings/settingsMeta.js`
- Test: `src/components/SectorSettings/settingsMeta.test.js`

**Interfaces:**
- Produces, all exported from `settingsMeta.js`:
  - `SETTINGS`: `Array<{name, label, help, kind: "enums"|"enum"|"tags"|"regex"|"bool", group: "filter"|"data"|"blocklist", union?: true, modes?: string[], unset?: string, yes?: string, no?: string}>`
  - `SETTING_GROUPS`: `Array<{key, title}>`
  - `settingByName`: `{[name]: setting}`
  - `appliesTo(setting, modes?: string[]) → boolean`
  - `isSet(value) → boolean`
  - `cleanSettings(values) → object`: only the setting keys present in `values`, unset → `null`
  - `compactSettings(settings) → object`: only the set settings
  - `setSettingNames(settings) → string[]`
  - `parseSources(source?: string) → Array<{type: "default"|"sector"|"profile", id?: number}>`
  - `inheritedPart(effective?: any[], own?: any[]) → any[]`
  - `formatValue(setting, value, allValues?: string[]) → string`

- [ ] **Step 1: Write the failing test**

`src/components/SectorSettings/settingsMeta.test.js`:

```js
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
  it("shows merge-only settings for merge and when no mode is given", () => {
    const s = settingByName.blockedNames;
    expect(appliesTo(s, ["merge"])).toBe(true);
    expect(appliesTo(s, ["attach", "merge"])).toBe(true);
    expect(appliesTo(s, [])).toBe(true);
    expect(appliesTo(s, undefined)).toBe(true);
    expect(appliesTo(s, ["attach"])).toBe(false);
  });

  it("limits authorshipUpdate to hierarchy", () => {
    expect(appliesTo(settingByName.authorshipUpdate, ["hierarchy"])).toBe(true);
    expect(appliesTo(settingByName.authorshipUpdate, ["merge"])).toBe(false);
  });

  it("shows settings without modes for every mode", () => {
    expect(appliesTo(settingByName.ranks, ["union"])).toBe(true);
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

  it("drops blank entries of tag lists", () => {
    expect(cleanSettings({ blockedNames: ["Abies", " "] })).toEqual({ blockedNames: ["Abies"] });
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/SectorSettings/settingsMeta.test.js`
Expected: FAIL, `Failed to resolve import "./settingsMeta"`.

- [ ] **Step 3: Implement**

`src/components/SectorSettings/settingsMeta.js`:

```js
// The 14 sync settings sectors and sector profiles share, with identical JSON names.
// See docs/SECTOR-SETTINGS.md in the backend repo: nearest level wins for scalars and allow-lists,
// the blocklists (union) add up over all levels. modes limits a setting to some sector modes.
export const SETTINGS = [
  { name: "ranks", label: "Ranks", kind: "enums", group: "filter", unset: "all",
    help: "Only accepted names of these ranks are synced; synonyms below species always are" },
  { name: "nameTypes", label: "Name types", kind: "enums", group: "filter", unset: "all",
    help: "Only names of these types are synced" },
  { name: "nameStatusExclusion", label: "Name status exclusion", kind: "enums", group: "filter", union: true,
    help: "Names with these nomenclatural statuses are not synced" },
  { name: "extinctFilter", label: "Extinct status", kind: "bool", group: "filter", unset: "all",
    yes: "extinct", no: "extant", help: "Sync extinct taxa only, or extant ones only" },
  { name: "nameFilter", label: "Name filter", kind: "regex", group: "filter",
    help: "Only names whose scientific name fully matches this regular expression are synced" },
  { name: "entities", label: "Entities", kind: "enums", group: "data", unset: "all",
    help: "Which entities are synced" },
  { name: "code", label: "Code", kind: "enum", group: "data",
    help: "Force this nomenclatural code onto every synced name" },
  { name: "copyAccordingTo", label: "AccordingTo", kind: "bool", group: "data",
    help: "Keep the accordingTo reference of synced usages" },
  { name: "removeOrdinals", label: "Remove ordinals", kind: "bool", group: "data",
    help: "Remove the custom sort order of synced taxa" },
  { name: "createImplicitNames", label: "Implicit names", kind: "bool", group: "data",
    help: "Create implicit genera and species" },
  { name: "authorshipUpdate", label: "Authorship update", kind: "enum", group: "data", modes: ["hierarchy"],
    help: "Copy the source authorship onto matched names" },
  { name: "issueExclusion", label: "Issue exclusion", kind: "enums", group: "blocklist", union: true,
    modes: ["merge"], help: "Names flagged with these issues are not merged" },
  { name: "blockedNames", label: "Blocked names", kind: "tags", group: "blocklist", union: true,
    modes: ["merge"],
    help: "Names never merged, with or without authorship, case insensitive. Press enter after each name" },
  { name: "blockedNamePatterns", label: "Blocked name patterns", kind: "tags", group: "blocklist", union: true,
    modes: ["merge"],
    help: "Case insensitive regular expressions searched in the name label; matching names are never merged. Press enter after each pattern" },
];

export const SETTING_GROUPS = [
  { key: "filter", title: "Filter" },
  { key: "data", title: "Data to sync" },
  { key: "blocklist", title: "Merge blocklists" },
];

export const settingByName = Object.fromEntries(SETTINGS.map((s) => [s.name, s]));

// No modes given means no restriction, e.g. a profile that selects sectors of any mode
export const appliesTo = (setting, modes) =>
  !setting.modes || !modes?.length || modes.some((m) => setting.modes.includes(m));

// null, an empty list and a blank string mean "not set here, inherit"
export const isSet = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  return true;
};

const cleanValue = (value) => {
  if (Array.isArray(value)) {
    const list = value.filter(isSet);
    return list.length ? list : null;
  }
  return isSet(value) ? value : null;
};

// The settings among some form values, every "not set" one as null. Settings missing from the values,
// e.g. hidden for the current mode, are left out so callers keep what is stored.
export const cleanSettings = (values) =>
  Object.fromEntries(
    SETTINGS.filter((s) => Object.prototype.hasOwnProperty.call(values ?? {}, s.name)).map((s) => [
      s.name,
      cleanValue(values[s.name]),
    ])
  );

// Only the settings that are set, e.g. for the settings object of a profile
export const compactSettings = (settings) =>
  Object.fromEntries(Object.entries(cleanSettings(settings)).filter(([, v]) => v !== null));

export const setSettingNames = (settings) =>
  SETTINGS.filter((s) => isSet(settings?.[s.name])).map((s) => s.name);

// "profile:1,sector" -> [{type: "profile", id: 1}, {type: "sector"}]
export const parseSources = (source) =>
  (source || "default").split(",").map((part) => {
    const s = part.trim();
    const m = /^profile:(\d+)$/.exec(s);
    return m ? { type: "profile", id: Number(m[1]) } : { type: s };
  });

// The part of an effective blocklist that other levels than the sector itself contribute
export const inheritedPart = (effective, own) => {
  const mine = new Set(own || []);
  return (effective || []).filter((v) => !mine.has(v));
};

// A setting value for display. allValues, when given, lets a complete list read as "all".
export const formatValue = (setting, value, allValues) => {
  if (!isSet(value)) return setting.unset || "none";
  if (setting.kind === "bool") return value ? setting.yes || "yes" : setting.no || "no";
  if (Array.isArray(value)) {
    if (allValues?.length && value.length >= allValues.length) return "all";
    return value.join(", ");
  }
  return String(value);
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/SectorSettings/settingsMeta.test.js`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/SectorSettings/settingsMeta.js src/components/SectorSettings/settingsMeta.test.js
git commit -m "Sector settings metadata and inherit-aware helpers (#1732)"
```

---

### Task 3: Inherit-aware sector form

Covers spec item 2.

**Files:**
- Modify: `src/api/sector.js` (append the profile client)
- Create: `src/components/SectorSettings/TriStateRadio.jsx`
- Create: `src/components/SectorSettings/SourceTags.jsx`
- Create: `src/components/SectorSettings/SectorSettingsFields.jsx`
- Modify: `src/pages/project/Assembly/SectorForm.jsx`

**Interfaces:**
- Consumes: everything from Task 2.
- Produces:
  - `src/api/sector.js`:
    - `getProfiles(datasetKey) → Promise<Profile[]>`
    - `getProfile(datasetKey, id) → Promise<Profile>`
    - `createProfile(datasetKey, profile) → Promise<number>` (the new id)
    - `updateProfile(datasetKey, profile) → Promise`
    - `deleteProfile(datasetKey, id) → Promise`
    - `countProfileSectors(datasetKey, id) → Promise<number>`
    - `previewProfile(datasetKey, selector, {limit = 0, offset = 0}) → Promise<ResultPage>`
    - `getEffectiveSettings(datasetKey, sectorId) → Promise<{settings, sources}>`
  - `<TriStateRadio value onChange yes no inherited disabled />`
  - `SourceTags.jsx`: default `<SourceTags source profiles={{[id]: profile}} profilesPath />`, named `<ProfileLinks ids profiles profilesPath />`
  - `<SectorSettingsFields modes namePrefix rankOptions effective own profiles profilesPath formItemLayout />`, which renders `Form.Item`s inside the host `Form`.

- [ ] **Step 1: Add the API client**

Append to `src/api/sector.js`, and add `import qs from "query-string";` under the existing imports:

```js
const profileUrl = (datasetKey, id) =>
  `${config.dataApi}dataset/${datasetKey}/sector/profile${id != null ? `/${id}` : ""}`;

// The profiles of a project or release in cascade order. Projects have a handful, one page holds them all.
export const getProfiles = (datasetKey) =>
  axios(`${profileUrl(datasetKey)}?limit=1000`).then((res) => res.data?.result || []);

export const getProfile = (datasetKey, id) =>
  axios(profileUrl(datasetKey, id)).then((res) => res.data);

// resolves to the id of the new profile
export const createProfile = (datasetKey, profile) =>
  axios.post(profileUrl(datasetKey), profile).then((res) => res.data);

export const updateProfile = (datasetKey, profile) =>
  axios.put(profileUrl(datasetKey, profile.id), profile);

export const deleteProfile = (datasetKey, id) => axios.delete(profileUrl(datasetKey, id));

// the number of sectors a saved profile selects right now
export const countProfileSectors = (datasetKey, id) =>
  axios(
    `${config.dataApi}dataset/${datasetKey}/sector?${qs.stringify({ datasetKey, profileKey: id, limit: 0 })}`
  ).then((res) => res.data?.total ?? 0);

// the sectors an unsaved selector would select, as a result page
export const previewProfile = (datasetKey, selector, { limit = 0, offset = 0 } = {}) =>
  axios
    .post(`${profileUrl(datasetKey)}/preview?${qs.stringify({ limit, offset })}`, selector)
    .then((res) => res.data);

// {settings, sources}: what a sync of the sector uses, and the level each value comes from
export const getEffectiveSettings = (datasetKey, sectorId) =>
  axios(`${config.dataApi}dataset/${datasetKey}/sector/${sectorId}/settings`).then((res) => res.data);
```

- [ ] **Step 2: Create the tri-state radio**

`src/components/SectorSettings/TriStateRadio.jsx`:

```jsx
import React from "react";
import { Radio } from "antd";

// Inherit (null) / yes / no for a nullable boolean setting. A plain checkbox would send an
// explicit false once touched, and an explicit value overrides every sector profile.
const TriStateRadio = ({ value, onChange, yes = "yes", no = "no", inherited, disabled }) => (
  <Radio.Group
    value={value ?? null}
    onChange={(e) => onChange?.(e.target.value)}
    optionType="button"
    buttonStyle="solid"
    disabled={disabled}
  >
    <Radio value={null}>{inherited ? `Inherit (${inherited})` : "Inherit"}</Radio>
    <Radio value={true}>{yes}</Radio>
    <Radio value={false}>{no}</Radio>
  </Radio.Group>
);

export default TriStateRadio;
```

- [ ] **Step 3: Create the source tags**

`src/components/SectorSettings/SourceTags.jsx`:

```jsx
import React from "react";
import { Tag, Tooltip } from "antd";
import { NavLink } from "react-router-dom";
import { parseSources } from "./settingsMeta";

const titleOf = (profiles, id) => profiles[id]?.title || `profile ${id}`;

// "Publisher sectors, Project defaults", each linking to where the profiles are listed
export const ProfileLinks = ({ ids, profiles = {}, profilesPath }) =>
  ids.map((id, i) => (
    <React.Fragment key={id}>
      {i > 0 && ", "}
      {profilesPath ? <NavLink to={profilesPath}>{titleOf(profiles, id)}</NavLink> : titleOf(profiles, id)}
    </React.Fragment>
  ));

// Marks an inherited value: a "profile" tag naming its profiles, or a "default" tag.
// A value the sector sets itself gets none.
const SourceTags = ({ source, profiles = {}, profilesPath }) => {
  const sources = parseSources(source);
  const ids = sources.filter((s) => s.type === "profile").map((s) => s.id);
  if (ids.length) {
    return (
      <Tooltip title={<>From <ProfileLinks ids={ids} profiles={profiles} /></>}>
        <Tag color="blue">{profilesPath ? <NavLink to={profilesPath}>profile</NavLink> : "profile"}</Tag>
      </Tooltip>
    );
  }
  return sources.every((s) => s.type === "default") ? <Tag>default</Tag> : null;
};

export default SourceTags;
```

- [ ] **Step 4: Create the shared settings fields**

`src/components/SectorSettings/SectorSettingsFields.jsx`:

```jsx
import React from "react";
import { Form, Select, Input, Divider, Tooltip, Tag } from "antd";
import withContext from "../hoc/withContext";
import TriStateRadio from "./TriStateRadio";
import { ProfileLinks } from "./SourceTags";
import {
  SETTINGS,
  SETTING_GROUPS,
  appliesTo,
  parseSources,
  inheritedPart,
  formatValue,
} from "./settingsMeta";

// enums arrive as plain strings (rank, nametype) or as {name} objects (nomstatus, issue, ...)
const names = (list) => (list || []).map((e) => (typeof e === "string" ? e : e.name));
const toOptions = (values) => values.map((v) => ({ value: v, label: v }));

// Under a field: what the sector inherits for it and from where. Null when the sector sets it itself.
const inheritedHint = ({ setting, effective, own, profiles, profilesPath, allValues }) => {
  if (!effective) return null;
  const value = effective.settings?.[setting.name];
  const sources = parseSources(effective.sources?.[setting.name]);
  const profileIds = sources.filter((s) => s.type === "profile").map((s) => s.id);
  if (setting.union) {
    // blocklists add up: show what other levels add, the field holds the sector's own entries
    const inherited = inheritedPart(value, own);
    if (!inherited.length) return null;
    return (
      <span>
        plus inherited{" "}
        {inherited.map((v) => (
          <Tag key={v}>{v}</Tag>
        ))}
        from <ProfileLinks ids={profileIds} profiles={profiles} profilesPath={profilesPath} />
      </span>
    );
  }
  if (sources.some((s) => s.type === "sector")) return null;
  const shown = formatValue(setting, value, allValues);
  if (!profileIds.length) return <span>default: {shown}</span>;
  return (
    <span>
      inherits {shown} from <ProfileLinks ids={profileIds} profiles={profiles} profilesPath={profilesPath} />
    </span>
  );
};

// The sync settings shared by sectors and sector profiles, rendered into the surrounding Form.
// Every field can stay unset, which means inherit.
const SectorSettingsFields = ({
  modes = [],
  namePrefix = [],
  rankOptions,
  effective,
  own = {},
  profiles = [],
  profilesPath,
  formItemLayout = {},
  rank,
  nametype,
  nomstatus,
  entitytype,
  nomCode,
  issue,
  sectorAuthorshipUpdate,
}) => {
  const all = {
    ranks: names(rank),
    nameTypes: names(nametype),
    nameStatusExclusion: names(nomstatus),
    entities: names(entitytype),
    code: names(nomCode),
    authorshipUpdate: names(sectorAuthorshipUpdate),
    issueExclusion: names(issue),
  };
  // the sector form offers the ranks of its source dataset, a profile all ranks
  const choices = { ...all, ranks: rankOptions?.length ? rankOptions : all.ranks };
  const profileById = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const inheritedBool = (s) => {
    if (!effective) return null;
    if (parseSources(effective.sources?.[s.name]).some((src) => src.type === "sector")) return null;
    return formatValue(s, effective.settings?.[s.name]);
  };

  const widget = (s) => {
    switch (s.kind) {
      case "enums":
        return (
          <Select mode="multiple" style={{ width: "100%" }} allowClear placeholder="inherit"
            options={toOptions(choices[s.name])} />
        );
      case "enum":
        return (
          <Select style={{ width: "100%" }} showSearch allowClear placeholder="inherit"
            options={toOptions(choices[s.name])} />
        );
      case "tags":
        // no token separators: commas are valid inside names and regular expressions
        return <Select mode="tags" style={{ width: "100%" }} open={false} allowClear placeholder="type and press enter" />;
      case "regex":
        return <Input allowClear placeholder="inherit" />;
      case "bool":
        return <TriStateRadio yes={s.yes} no={s.no} inherited={inheritedBool(s)} />;
      default:
        return null;
    }
  };

  return SETTING_GROUPS.map((g) => {
    const settings = SETTINGS.filter((s) => s.group === g.key && appliesTo(s, modes));
    if (!settings.length) return null;
    return (
      <React.Fragment key={g.key}>
        <Divider plain>{g.title}</Divider>
        {settings.map((s) => (
          <Form.Item
            {...formItemLayout}
            key={s.name}
            name={[...namePrefix, s.name]}
            label={<Tooltip color="green" title={s.help}>{s.label}</Tooltip>}
            extra={inheritedHint({
              setting: s,
              effective,
              own: own[s.name],
              profiles: profileById,
              profilesPath,
              allValues: all[s.name],
            })}
          >
            {widget(s)}
          </Form.Item>
        ))}
      </React.Fragment>
    );
  });
};

const mapContextToProps = ({ rank, nametype, nomstatus, entitytype, nomCode, issue, sectorAuthorshipUpdate }) => ({
  rank,
  nametype,
  nomstatus,
  entitytype,
  nomCode,
  issue,
  sectorAuthorshipUpdate,
});

export default withContext(mapContextToProps)(SectorSettingsFields);
```

- [ ] **Step 5: Rewire `SectorForm.jsx`**

Apply these edits to `src/pages/project/Assembly/SectorForm.jsx`:

1. **Imports.**
   - Replace the antd import line with:
     ```jsx
     import { App, Select, Checkbox, Input, Alert, Button, InputNumber, Form, Divider, Tooltip, Typography } from "antd";
     ```
     `Radio` is dropped, because the extinct filter moves into the shared fields. `Divider` stays for *Editorial notes*.
   - Add:
     ```jsx
     import SectorSettingsFields from "../../../components/SectorSettings/SectorSettingsFields";
     import { cleanSettings } from "../../../components/SectorSettings/settingsMeta";
     import { getEffectiveSettings, getProfiles } from "../../../api/sector";
     ```
2. **Props.** Reduce the component signature to `({ sector, rank, onError, projectKey, onSubmit })` and `mapContextToProps` to `({ rank, projectKey }) => ({ rank, projectKey })`. The other enums now live in `SectorSettingsFields`.
3. **Delete** the debug effect `useEffect(() => { console.log(sector?.nameTypes); }, [...])`.
4. **Add effective settings and profiles** after the `sectorDatasetRanks` state:
   ```jsx
   const [effective, setEffective] = useState(null);
   const [profiles, setProfiles] = useState([]);

   const loadEffective = () => {
     if (!sector?.id) return;
     getEffectiveSettings(sector.datasetKey, sector.id)
       .then(setEffective)
       // without them the form still works, just without the inherited hints
       .catch(() => setEffective(null));
   };

   useEffect(() => {
     loadEffective();
     const key = sector?.datasetKey || projectKey;
     if (key) {
       getProfiles(key).then(setProfiles).catch(() => setProfiles([]));
     }
   }, [sector?.id, sector?.datasetKey, projectKey]);
   ```
5. **`submitData`.**
   - Start the function with:
     ```jsx
     // Inherit, empty lists and blank strings go out as null so the profiles apply
     const body = { ...values, ...cleanSettings(values) };
     ```
   - Then use `{ ...sector, ...body }` in the PUT and `body` in the POST.
   - Pass `body` instead of `values` to `onSubmit`.
   - In the PUT `.then`, call `loadEffective();` after the notification.
6. **Render.** Delete everything from `<Divider plain>Filter</Divider>` through the closing `)}` of the `sectorAuthorshipUpdate?.length > 0 && (...)` block. That span also contains the old Placeholder Rank and Use X Release items, and the snippet below re-adds both. Insert the snippet where the deleted span was, i.e. after the Target `FormItem` block and before `<Divider plain>Editorial notes</Divider>`:
   ```jsx
   <FormItem
     {...formItemLayout}
     label={<Tooltip color='green' title="Optionally ignore immediate children of the source subject which are above the selected rank.">Placeholder Rank</Tooltip>}
     key="placeholderRank"
     name="placeholderRank"
   >
     <Select
       style={{ width: "100%" }}
       showSearch
       allowClear
       options={rank.map((r) => ({ value: r, label: r }))}
     />
   </FormItem>

   <SectorSettingsFields
     modes={mode ? [mode] : []}
     rankOptions={sectorDatasetRanks}
     effective={effective}
     own={sector || {}}
     profiles={profiles}
     profilesPath={`/project/${sector?.datasetKey || projectKey}/sector/profiles`}
     formItemLayout={formItemLayout}
   />

   {mode === "hierarchy" && (
     <FormItem
       {...formItemLayout}
       label={<Tooltip color="green" title="Use the latest extended (not base) release of the subject project as the hierarchy source. Only relevant when subjectDatasetKey is a project.">Use X Release</Tooltip>}
       key="useXRelease"
       name="useXRelease"
       valuePropName="checked"
     >
       <Checkbox />
     </FormItem>
   )}
   ```
7. **Defaults.** Keep `initialValues` as is (`ranks: []`, `entities: []`, `nameTypes: []`, `nameStatusExclusion: []`, `useXRelease: true`, `...sector`). No setting gets a boolean default.

- [ ] **Step 6: Run the unit tests and the build**

Run: `npm test && NODE_ENV=production npx vite build`
Expected: all Vitest tests pass, and Vite finishes with `✓ built in …` and no errors.

- [ ] **Step 7: Check the form in the browser**

Start `npx vite`. For live data, wait for Task 11's backend; until then, check against prod.
1. Open a project's sectors, expand a merge sector row, and confirm the following:
   - **Groups:** *Filter*, *Data to sync* and *Merge blocklists* dividers are present, and the blocklist fields appear for merge only.
   - **Tri-states:** AccordingTo, Remove ordinals, Implicit names and Extinct status are radios, and *Inherit* is selected for unset values.
   - **No regressions:** saving the form unchanged gives no console errors.
2. Switch Mode to `attach`: the blocklists disappear. Switch to `hierarchy`: Authorship update and Use X Release appear.
3. Against a backend without profiles, `…/settings` 404s and the hints are just absent. That's expected.

- [ ] **Step 8: Commit**

```bash
git add src/api/sector.js src/components/SectorSettings/TriStateRadio.jsx src/components/SectorSettings/SourceTags.jsx \
  src/components/SectorSettings/SectorSettingsFields.jsx src/pages/project/Assembly/SectorForm.jsx
git commit -m "Sector form inherits unset settings from sector profiles (#1732)"
```

---

### Task 4: Drop the removed project settings

Covers spec item 5.

**Files:**
- Modify: `src/enumeration/setting.json`
- Modify: `src/pages/project/Options/Options.jsx`

- [ ] **Step 1: Remove the seven settings**

Run:

```bash
node -e '
const fs = require("fs");
const f = "src/enumeration/setting.json";
const gone = ["sector entities", "sector ranks", "sector name types", "sector name status exclusion",
  "sector copy according to", "sector remove ordinals", "sector create implicit names"];
const all = JSON.parse(fs.readFileSync(f, "utf8"));
const kept = all.filter((s) => !gone.includes(s.name));
if (all.length - kept.length !== 7) throw new Error("expected to drop 7, dropped " + (all.length - kept.length));
fs.writeFileSync(f, JSON.stringify(kept, null, 2));
'
grep -c '"sector ' src/enumeration/setting.json
```

Expected: the grep prints `0`.

- [ ] **Step 2: Point editors to the profiles**

In `src/pages/project/Options/Options.jsx`:
- Add `Alert` to the antd import if missing.
- Add `import { NavLink } from "react-router-dom";`.
- Directly after the `<Row>` holding the `<h3>Settings</h3>` header (before the `<Row>` with `DatasetSettingsForm`), insert:

```jsx
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: "10px" }}
        title={
          <>
            Sector sync settings such as ranks, entities or name types are managed as{" "}
            <NavLink to={{ pathname: `/project/${projectKey}/sector/profiles` }}>sector profiles</NavLink>.
          </>
        }
      />
```

- [ ] **Step 3: Build**

Run: `NODE_ENV=production npx vite build`
Expected: `✓ built`.

- [ ] **Step 4: Commit**

```bash
git add src/enumeration/setting.json src/pages/project/Options/Options.jsx
git commit -m "Drop the sector project settings now held by sector profiles (#1732)"
```

---

### Task 5: Sector mode enum

**Files:**
- Create: `src/enumeration/sector$mode.json`
- Modify: `writeEnums.cjs`, `src/api/enumeration.js`, `src/components/hoc/ContextProvider.jsx`

**Interfaces:**
- Produces: the context value `sectorMode: string[]`, e.g. `["attach","union","merge","hierarchy"]`.

- [ ] **Step 1: Add the enum file and fetch list**

```bash
curl -s 'https://api.checklistbank.org/vocab/sector$mode' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>require("fs").writeFileSync("src/enumeration/sector$mode.json", JSON.stringify(JSON.parse(s), null, 2)))'
cat 'src/enumeration/sector$mode.json'
```

Expected: four `{"name": …}` entries: attach, union, merge, hierarchy.

In `writeEnums.cjs`, add `"sector$mode",` to the `enums` array after `"identifier-scope"` (add a comma after `"identifier-scope"`).

- [ ] **Step 2: Add the getter**

In `src/api/enumeration.js`, after `getSectorAuthorshipUpdate`:

```js
// Sector modes as plain names. Resolves to an empty list when missing so the shared enum Promise.all cannot reject.
export const getSectorMode = () => {
  return getData(`sector$mode`)
    .then((res) => (res.data ?? []).map((e) => e.name))
    .catch(() => []);
};
```

- [ ] **Step 3: Load it into the context**

In `src/components/hoc/ContextProvider.jsx`:
1. Add `getSectorMode,` to the import from `../../api/enumeration` next to `getSectorAuthorshipUpdate`.
2. Add `const [sectorMode, setSectorMode] = useState([]);` next to the `sectorAuthorshipUpdate` state.
3. In the `Promise.all([...])`, add `getSectorMode(),` after `getJobLane(),`. It becomes `responses[34]`.
4. After `setJobLane(responses[33]);`, add `setSectorMode(responses[34]);`.
5. In the context value object, add `sectorMode,` after `sectorAuthorshipUpdate,`.

- [ ] **Step 4: Test and build**

Run: `npm test && NODE_ENV=production npx vite build`
Expected: tests pass, and the build reports `✓ built`.

- [ ] **Step 5: Commit**

```bash
git add 'src/enumeration/sector$mode.json' writeEnums.cjs src/api/enumeration.js src/components/hoc/ContextProvider.jsx
git commit -m "Load the sector mode vocabulary (#1732)"
```

---

### Task 6: Profile selector and ordering helpers

**Files:**
- Create: `src/pages/project/SectorProfiles/profileUtils.js`
- Test: `src/pages/project/SectorProfiles/profileUtils.test.js`

**Interfaces:**
- Produces, all exported from `profileUtils.js`:
  - `EMPTY_SELECTOR`
  - `normalizeSelector(selector?) → {modes, datasetTypes, publisherKeys, anySectorPublisher, subjectDatasetKeys: number[], sectorKeys: number[]}`
  - `summarizeSelector(selector?) → string`
  - `reorder(profiles, fromIndex, toIndex) → {ordered: Profile[], changed: Profile[]}`
  - `addToSelector(selector, sectors, what: "sectors"|"datasets") → {selector, added: number}`

- [ ] **Step 1: Write the failing test**

`src/pages/project/SectorProfiles/profileUtils.test.js`:

```js
import { describe, it, expect } from "vitest";
import { EMPTY_SELECTOR, normalizeSelector, summarizeSelector, reorder, addToSelector } from "./profileUtils";

describe("normalizeSelector", () => {
  it("fills every field", () => {
    expect(normalizeSelector(undefined)).toEqual(EMPTY_SELECTOR);
    expect(normalizeSelector({ modes: ["merge"] })).toEqual({ ...EMPTY_SELECTOR, modes: ["merge"] });
  });

  it("turns typed keys into unique integers and drops junk", () => {
    expect(normalizeSelector({ sectorKeys: ["12", " 5 ", "12a", "", "1.5", 7, "7"] }).sectorKeys).toEqual([12, 5, 7]);
    expect(normalizeSelector({ subjectDatasetKeys: [1010, "1010"] }).subjectDatasetKeys).toEqual([1010]);
  });

  it("coerces the publisher switch to a boolean", () => {
    expect(normalizeSelector({ anySectorPublisher: undefined }).anySectorPublisher).toBe(false);
  });
});

describe("summarizeSelector", () => {
  it("calls an empty selector all sectors", () => {
    expect(summarizeSelector(EMPTY_SELECTOR)).toBe("all sectors");
  });

  it("joins the restricting fields", () => {
    expect(summarizeSelector({ modes: ["merge"], anySectorPublisher: true })).toBe("merge · any sector publisher");
    expect(summarizeSelector({ subjectDatasetKeys: [1, 2, 3] })).toBe("3 source datasets");
    expect(summarizeSelector({ sectorKeys: [9] })).toBe("1 sector");
    expect(
      summarizeSelector({ modes: ["attach", "union"], datasetTypes: ["article"], publisherKeys: ["a", "b"] })
    ).toBe("attach or union · type article · 2 publishers");
  });
});

describe("reorder", () => {
  const p = (id, position) => ({ id, position, title: `p${id}` });

  it("moves a profile and renumbers from zero", () => {
    const { ordered, changed } = reorder([p(1, 0), p(2, 1), p(3, 2)], 2, 0);
    expect(ordered.map((x) => [x.id, x.position])).toEqual([[3, 0], [1, 1], [2, 2]]);
    expect(changed.map((x) => x.id).sort()).toEqual([1, 2, 3]);
  });

  it("resolves tied positions and only reports changed ones", () => {
    const { ordered, changed } = reorder([p(1, 0), p(2, 0), p(3, 5)], 2, 1);
    expect(ordered.map((x) => [x.id, x.position])).toEqual([[1, 0], [3, 1], [2, 2]]);
    expect(changed.map((x) => x.id).sort()).toEqual([2, 3]);
  });

  it("changes nothing when dropped in place on a consecutive list", () => {
    expect(reorder([p(1, 0), p(2, 1)], 1, 1).changed).toEqual([]);
  });
});

describe("addToSelector", () => {
  const sectors = [
    { id: 10, subjectDatasetKey: 1000 },
    { id: 11, subjectDatasetKey: 1000 },
  ];

  it("appends sector keys without duplicates", () => {
    const { selector, added } = addToSelector({ sectorKeys: [10] }, sectors, "sectors");
    expect(selector.sectorKeys).toEqual([10, 11]);
    expect(added).toBe(1);
  });

  it("appends the source datasets of the sectors", () => {
    const { selector, added } = addToSelector({ modes: ["merge"] }, sectors, "datasets");
    expect(selector.subjectDatasetKeys).toEqual([1000]);
    expect(selector.modes).toEqual(["merge"]);
    expect(added).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/pages/project/SectorProfiles/profileUtils.test.js`
Expected: FAIL, `Failed to resolve import "./profileUtils"`.

- [ ] **Step 3: Implement**

`src/pages/project/SectorProfiles/profileUtils.js`:

```js
export const EMPTY_SELECTOR = {
  modes: [],
  datasetTypes: [],
  publisherKeys: [],
  anySectorPublisher: false,
  subjectDatasetKeys: [],
  sectorKeys: [],
};

const unique = (list) => [...new Set(list || [])];

// keys typed into a tag input arrive as strings, possibly with junk
const integers = (list) =>
  unique(
    (list || [])
      .map((v) => (typeof v === "string" ? v.trim() : v))
      .filter((v) => v !== "" && v !== null && v !== undefined)
      .map(Number)
      .filter(Number.isInteger)
  );

// The selector as the API takes it: every field present, integer keys, no duplicates
export const normalizeSelector = (selector) => ({
  modes: unique(selector?.modes),
  datasetTypes: unique(selector?.datasetTypes),
  publisherKeys: unique(selector?.publisherKeys),
  anySectorPublisher: !!selector?.anySectorPublisher,
  subjectDatasetKeys: integers(selector?.subjectDatasetKeys),
  sectorKeys: integers(selector?.sectorKeys),
});

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// One line on what a selector matches, e.g. "merge · any sector publisher"
export const summarizeSelector = (selector) => {
  const s = normalizeSelector(selector);
  const parts = [];
  if (s.modes.length) parts.push(s.modes.join(" or "));
  if (s.datasetTypes.length) parts.push(`type ${s.datasetTypes.join(" or ")}`);
  if (s.anySectorPublisher) parts.push("any sector publisher");
  if (s.publisherKeys.length) parts.push(plural(s.publisherKeys.length, "publisher"));
  if (s.subjectDatasetKeys.length) parts.push(plural(s.subjectDatasetKeys.length, "source dataset"));
  if (s.sectorKeys.length) parts.push(plural(s.sectorKeys.length, "sector"));
  return parts.length ? parts.join(" · ") : "all sectors";
};

// Moves a profile within the cascade and renumbers all positions from 0, which also resolves ties.
// changed holds the profiles whose position differs, the only ones to save.
export const reorder = (profiles, fromIndex, toIndex) => {
  const moved = [...profiles];
  const [profile] = moved.splice(fromIndex, 1);
  moved.splice(toIndex, 0, profile);
  const ordered = moved.map((p, i) => ({ ...p, position: i }));
  const changed = ordered.filter((p, i) => p.position !== moved[i].position);
  return { ordered, changed };
};

// Appends the keys of some sectors, or of their source datasets, to a selector
export const addToSelector = (selector, sectors, what) => {
  const field = what === "datasets" ? "subjectDatasetKeys" : "sectorKeys";
  const before = normalizeSelector(selector);
  const keys = (sectors || []).map((s) => (what === "datasets" ? s.subjectDatasetKey : s.id));
  const after = normalizeSelector({ ...before, [field]: [...before[field], ...keys] });
  return { selector: after, added: after[field].length - before[field].length };
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/pages/project/SectorProfiles/profileUtils.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/project/SectorProfiles/profileUtils.js src/pages/project/SectorProfiles/profileUtils.test.js
git commit -m "Sector profile selector and ordering helpers (#1732)"
```

---

### Task 7: Profiles page with list, order and delete

Covers spec item 1, part 1.

**Files:**
- Create: `src/pages/project/SectorProfiles/index.jsx`
- Create: `src/pages/project/SectorProfiles/ProfileList.jsx`
- Modify: `src/App.jsx` (import + route)
- Modify: `src/pages/project/ProjectSectors/SectorTabs.jsx` (tab)

**Interfaces:**
- Consumes:
  - `getProfiles`, `countProfileSectors`, `deleteProfile`, `updateProfile` (Task 3);
  - `setSettingNames` (Task 2);
  - `summarizeSelector`, `reorder` (Task 6).
- Produces: `<ProfileList datasetKey readOnly sectorsPath />`. `sectorsPath` defaults to `/project/${datasetKey}/sector`.

- [ ] **Step 1: Create the list**

`src/pages/project/SectorProfiles/ProfileList.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, Tag, Typography, Space, Row, Col, App } from "antd";
import { MenuOutlined, DeleteOutlined } from "@ant-design/icons";
import { NavLink } from "react-router-dom";
import ReactDragListView from "react-drag-listview";
import withContext from "../../../components/hoc/withContext";
import { getProfiles, countProfileSectors, deleteProfile, updateProfile } from "../../../api/sector";
import { setSettingNames } from "../../../components/SectorSettings/settingsMeta";
import { summarizeSelector, reorder } from "./profileUtils";

const { Text } = Typography;

// The sector profiles of a project or release in cascade order: later ones override earlier ones.
const ProfileList = ({ datasetKey, readOnly, sectorsPath, addError }) => {
  const { notification } = App.useApp();
  const [profiles, setProfiles] = useState([]);
  // profile id -> number of sectors it selects; undefined while loading, null if it failed
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const membersPath = sectorsPath || `/project/${datasetKey}/sector`;

  const load = async () => {
    setLoading(true);
    try {
      const list = await getProfiles(datasetKey);
      setProfiles(list);
      setLoading(false);
      const entries = await Promise.all(
        list.map((p) =>
          countProfileSectors(datasetKey, p.id)
            .then((n) => [p.id, n])
            .catch(() => [p.id, null])
        )
      );
      setCounts(Object.fromEntries(entries));
    } catch (err) {
      addError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [datasetKey]);

  const onDragEnd = async (fromIndex, toIndex) => {
    const { ordered, changed } = reorder(profiles, fromIndex, toIndex);
    setProfiles(ordered);
    try {
      for (const p of changed) {
        await updateProfile(datasetKey, p);
      }
    } catch (err) {
      addError(err);
    }
    load();
  };

  const onDelete = async (profile) => {
    try {
      await deleteProfile(datasetKey, profile.id);
      notification.open({ title: `Profile ${profile.title} deleted` });
    } catch (err) {
      addError(err);
    }
    load();
  };

  const countOf = (p) => {
    const n = counts[p.id];
    if (n === undefined) return "…";
    if (n === null) return "?";
    return (
      <NavLink to={{ pathname: membersPath, search: `?profileKey=${p.id}` }}>
        {n.toLocaleString("en-GB")}
      </NavLink>
    );
  };

  const columns = [
    ...(readOnly
      ? []
      : [
          {
            key: "drag",
            width: 30,
            render: () => (
              <MenuOutlined className="profile-drag-handle" style={{ cursor: "grab", color: "#999" }} />
            ),
          },
        ]),
    { title: "Position", dataIndex: "position", key: "position", width: 80 },
    {
      title: "Profile",
      key: "title",
      render: (text, p) => (
        <>
          <Text strong>{p.title}</Text>
          {p.description && (
            <div>
              <Text type="secondary">{p.description}</Text>
            </div>
          )}
        </>
      ),
    },
    { title: "Selects", key: "selector", render: (text, p) => summarizeSelector(p.selector) },
    {
      title: "Settings",
      key: "settings",
      render: (text, p) => setSettingNames(p.settings).map((n) => <Tag key={n}>{n}</Tag>),
    },
    { title: "Sectors", key: "sectors", width: 100, render: (text, p) => countOf(p) },
    ...(readOnly
      ? []
      : [
          {
            title: "Action",
            key: "action",
            width: 110,
            render: (text, p) => (
              <Space>
                <Popconfirm
                  title={`Delete profile ${p.title}?`}
                  description={`It applies to ${
                    typeof counts[p.id] === "number" ? counts[p.id].toLocaleString("en-GB") : "an unknown number of"
                  } sectors, which fall back to their other profiles and the defaults on their next sync.`}
                  onConfirm={() => onDelete(p)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]),
  ];

  const table = (
    <Table size="small" rowKey="id" columns={columns} dataSource={profiles} loading={loading} pagination={false} />
  );

  return (
    <>
      {!readOnly && (
        <Row style={{ marginBottom: "8px" }}>
          <Col flex="auto">
            <Text type="secondary">
              Profiles apply in ascending position; a later profile overrides an earlier one. Drag rows by their
              handle to reorder.
            </Text>
          </Col>
        </Row>
      )}
      {readOnly ? (
        table
      ) : (
        <ReactDragListView
          onDragEnd={onDragEnd}
          handleSelector=".profile-drag-handle"
          nodeSelector="tr.ant-table-row"
        >
          {table}
        </ReactDragListView>
      )}
    </>
  );
};

const mapContextToProps = ({ addError }) => ({ addError });

export default withContext(mapContextToProps)(ProfileList);
```

- [ ] **Step 2: Create the page**

`src/pages/project/SectorProfiles/index.jsx`:

```jsx
import React from "react";
import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import SectorTabs from "../ProjectSectors/SectorTabs";
import withContext from "../../../components/hoc/withContext";
import Auth from "../../../components/Auth";
import ProfileList from "./ProfileList";

const SectorProfiles = ({ project, projectKey, user }) => (
  <Layout selectedKeys={["projectSectors"]} openKeys={["assembly"]} title={project ? project.title : ""}>
    <PageContent>
      <SectorTabs />
      {projectKey && (
        <ProfileList datasetKey={projectKey} readOnly={!Auth.canEditDataset({ key: projectKey }, user)} />
      )}
    </PageContent>
  </Layout>
);

const mapContextToProps = ({ project, projectKey, user }) => ({ project, projectKey, user });

export default withContext(mapContextToProps)(SectorProfiles);
```

- [ ] **Step 3: Route and tab**

In `src/App.jsx`:
- Add `import SectorProfiles from "./pages/project/SectorProfiles";` after the `SectorPublishers` import.
- Add this route after the `/project/:projectKey/sector/publishers` route:

```jsx
            <Route
              path="/project/:projectKey/sector/profiles"
              element={
                <PrivateRoute>
                  <SectorProfiles />
                </PrivateRoute>
              }
            />
```

In `src/pages/project/ProjectSectors/SectorTabs.jsx`:
- Add `ControlOutlined` to the `@ant-design/icons` import.
- Append this item after the Publishers item:

```jsx
    {
      label: (
        <NavLink to={{ pathname: `/project/${projectKey}/sector/profiles` }}>
          Profiles
        </NavLink>
      ),
      key: `/project/${projectKey}/sector/profiles`,
      icon: <ControlOutlined />,
    },
```

- [ ] **Step 4: Build**

Run: `NODE_ENV=production npx vite build`
Expected: `✓ built`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/project/SectorProfiles/index.jsx src/pages/project/SectorProfiles/ProfileList.jsx src/App.jsx \
  src/pages/project/ProjectSectors/SectorTabs.jsx
git commit -m "Profiles tab listing, ordering and deleting sector profiles (#1732)"
```

---

### Task 8: Create and edit profiles with live preview

Covers spec item 1, part 2.

**Files:**
- Create: `src/pages/project/SectorProfiles/PublisherSelect.jsx`
- Create: `src/pages/project/SectorProfiles/DatasetSelect.jsx`
- Create: `src/pages/project/SectorProfiles/PreviewDrawer.jsx`
- Create: `src/pages/project/SectorProfiles/ProfileForm.jsx`
- Modify: `src/pages/project/SectorProfiles/ProfileList.jsx` (new/edit buttons)

**Interfaces:**
- Consumes:
  - `SectorSettingsFields` (Task 3);
  - `cleanSettings`, `compactSettings` (Task 2);
  - `createProfile`, `updateProfile`, `previewProfile` (Task 3);
  - `EMPTY_SELECTOR`, `normalizeSelector` (Task 6);
  - context `sectorMode` (Task 5) and `datasetType`.
- Produces: `<ProfileForm datasetKey profile nextPosition onSaved onCancel />`, where `profile` is `{}` for a new one.

- [ ] **Step 1: Publisher select**

`src/pages/project/SectorProfiles/PublisherSelect.jsx`:

```jsx
import React, { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import axios from "axios";
import { debounce } from "lodash";
import config from "../../../config";

const axiosNoAuth = axios.create({ headers: { Authorization: null } });

// Multiple GBIF publishers: suggests the project's sector publishers, searches GBIF while typing
const PublisherSelect = ({ value = [], onChange, datasetKey }) => {
  const [sectorPublishers, setSectorPublishers] = useState([]);
  const [found, setFound] = useState([]);
  const [q, setQ] = useState("");
  // labels of selected publishers that are no sector publishers
  const [labels, setLabels] = useState({});

  useEffect(() => {
    axios(`${config.dataApi}dataset/${datasetKey}/sector/publisher?limit=1000`)
      .then((res) =>
        setSectorPublishers((res.data?.result || []).map((p) => ({ value: p.id, label: p.alias || p.title })))
      )
      .catch(() => setSectorPublishers([]));
  }, [datasetKey]);

  useEffect(() => {
    const known = new Set([...sectorPublishers.map((o) => o.value), ...Object.keys(labels)]);
    (value || [])
      .filter((k) => !known.has(k))
      .forEach((k) =>
        axiosNoAuth(`${config.gbifApi}organization/${k}`)
          .then((res) => setLabels((prev) => ({ ...prev, [k]: res.data.title })))
          .catch(() => setLabels((prev) => ({ ...prev, [k]: k })))
      );
  }, [value, sectorPublishers]);

  const search = useMemo(
    () =>
      debounce((query) => {
        if (!query) {
          setFound([]);
          return;
        }
        axiosNoAuth(`${config.gbifApi}organization?q=${encodeURIComponent(query)}&limit=20`)
          .then((res) => setFound((res.data?.results || []).map((o) => ({ value: o.key, label: o.title }))))
          .catch(() => setFound([]));
      }, 400),
    []
  );
  useEffect(() => () => search.cancel(), [search]);

  const query = q.toLowerCase();
  const suggested = query
    ? sectorPublishers.filter((o) => (o.label || "").toLowerCase().includes(query))
    : sectorPublishers;
  const byValue = new Map(
    [
      ...Object.entries(labels).map(([k, label]) => ({ value: k, label })),
      ...suggested,
      ...(query ? found : []),
    ].map((o) => [o.value, o])
  );

  return (
    <Select
      mode="multiple"
      style={{ width: "100%" }}
      allowClear
      placeholder="any publisher"
      value={value}
      onChange={onChange}
      showSearch={{
        filterOption: false,
        onSearch: (v) => {
          setQ(v);
          search(v);
        },
      }}
      options={[...byValue.values()]}
    />
  );
};

export default PublisherSelect;
```

- [ ] **Step 2: Dataset select**

`src/pages/project/SectorProfiles/DatasetSelect.jsx`:

```jsx
import React, { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import axios from "axios";
import { debounce } from "lodash";
import config from "../../../config";
import { getDatasetsBatch } from "../../../api/dataset";

const labelOf = (d, key) => (d ? `${d.alias || d.title} [${d.key}]` : String(key));

// Multiple source datasets: searches the sources of the project, merged ones included
const DatasetSelect = ({ value = [], onChange, datasetKey }) => {
  const [labels, setLabels] = useState({});
  const [found, setFound] = useState([]);

  useEffect(() => {
    const missing = (value || []).filter((k) => !(k in labels));
    if (missing.length) {
      getDatasetsBatch(missing).then((list) =>
        setLabels((prev) => ({
          ...prev,
          ...Object.fromEntries(missing.map((k, i) => [k, labelOf(list[i], k)])),
        }))
      );
    }
  }, [value]);

  const search = useMemo(
    () =>
      debounce((q) => {
        if (!q) {
          setFound([]);
          return;
        }
        axios(`${config.dataApi}dataset/${datasetKey}/source/suggest?merge=true&q=${encodeURIComponent(q)}`)
          .then((res) => {
            const list = Array.isArray(res.data) ? res.data : res.data?.result || [];
            setFound(list.map((d) => ({ value: d.key, label: labelOf(d, d.key) })));
          })
          .catch(() => setFound([]));
      }, 400),
    [datasetKey]
  );
  useEffect(() => () => search.cancel(), [search]);

  const byValue = new Map(
    [...Object.entries(labels).map(([k, label]) => ({ value: Number(k), label })), ...found].map((o) => [o.value, o])
  );

  return (
    <Select
      mode="multiple"
      style={{ width: "100%" }}
      allowClear
      placeholder="any source dataset"
      value={value}
      onChange={onChange}
      showSearch={{ filterOption: false, onSearch: search }}
      options={[...byValue.values()]}
    />
  );
};

export default DatasetSelect;
```

- [ ] **Step 3: Preview drawer**

`src/pages/project/SectorProfiles/PreviewDrawer.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { Drawer, Table } from "antd";
import DataLoader from "dataloader";
import getColumns from "../ProjectSectors/columns";
import { getDatasetsBatch } from "../../../api/dataset";
import { previewProfile } from "../../../api/sector";

const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids), { maxBatchSize: 100 });
const PAGE_SIZE = 50;
const COLUMNS = ["alias", "mode", "subject", "target"];

// The sectors an unsaved selector would select
const PreviewDrawer = ({ open, onClose, datasetKey, selector }) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ result: [], total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [selector]);

  useEffect(() => {
    if (!open || !selector) return;
    setLoading(true);
    previewProfile(datasetKey, selector, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
      .then(async (res) => {
        const result = res.result || [];
        await Promise.all(
          result.map((s) => datasetLoader.load(s.subjectDatasetKey).then((d) => (s.dataset = d)))
        );
        setData({ result, total: res.total || 0 });
      })
      .catch(() => setData({ result: [], total: 0 }))
      .finally(() => setLoading(false));
  }, [open, page, selector, datasetKey]);

  return (
    <Drawer title="Sectors the selector selects" size="large" open={open} onClose={onClose}>
      <Table
        size="small"
        rowKey="id"
        loading={loading}
        dataSource={data.result}
        columns={getColumns(datasetKey, "").filter((c) => COLUMNS.includes(c.key))}
        pagination={{ current: page, pageSize: PAGE_SIZE, total: data.total, showSizeChanger: false, onChange: setPage }}
      />
    </Drawer>
  );
};

export default PreviewDrawer;
```

- [ ] **Step 4: Profile form**

`src/pages/project/SectorProfiles/ProfileForm.jsx`:

```jsx
import React, { useEffect, useRef, useState } from "react";
import { Modal, Form, Input, InputNumber, Select, Switch, Alert, Typography, Divider, Tooltip } from "antd";
import withContext from "../../../components/hoc/withContext";
import ErrorMsg from "../../../components/ErrorMsg";
import SectorSettingsFields from "../../../components/SectorSettings/SectorSettingsFields";
import { cleanSettings, compactSettings } from "../../../components/SectorSettings/settingsMeta";
import { createProfile, updateProfile, previewProfile } from "../../../api/sector";
import { EMPTY_SELECTOR, normalizeSelector } from "./profileUtils";
import PublisherSelect from "./PublisherSelect";
import DatasetSelect from "./DatasetSelect";
import PreviewDrawer from "./PreviewDrawer";

const { Text } = Typography;
const formItemLayout = { labelCol: { span: 7 }, wrapperCol: { span: 16 } };
const toOptions = (values) => (values || []).map((v) => ({ value: v, label: v }));

const ProfileForm = ({ datasetKey, profile, nextPosition = 0, onSaved, onCancel, sectorMode, datasetType }) => {
  const [form] = Form.useForm();
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ selector: null, total: null, failed: false });
  const [showPreview, setShowPreview] = useState(false);
  const watchedSelector = Form.useWatch("selector", form);
  const modes = Form.useWatch(["selector", "modes"], form) || [];
  const latestRequest = useRef(0);
  const isNew = !profile?.id;

  // live preview, debounced; only the newest answer is shown
  const selectorJson = JSON.stringify(normalizeSelector(watchedSelector));
  useEffect(() => {
    const request = ++latestRequest.current;
    const selector = JSON.parse(selectorJson);
    const timer = setTimeout(() => {
      previewProfile(datasetKey, selector)
        .then((res) => {
          if (request === latestRequest.current) setPreview({ selector, total: res.total ?? 0, failed: false });
        })
        .catch(() => {
          if (request === latestRequest.current) setPreview({ selector, total: null, failed: true });
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [selectorJson, datasetKey]);

  const initialValues = isNew
    ? { position: nextPosition, selector: { ...EMPTY_SELECTOR }, settings: {} }
    : {
        ...profile,
        // the sector key tag input works on strings
        selector: { ...EMPTY_SELECTOR, ...profile.selector, sectorKeys: (profile.selector?.sectorKeys || []).map(String) },
      };

  const onFinish = async (values) => {
    setSaving(true);
    setError(null);
    const body = {
      ...(isNew ? {} : profile),
      title: values.title.trim(),
      description: values.description?.trim() || null,
      position: values.position ?? 0,
      selector: normalizeSelector(values.selector),
      // settings hidden for the selected modes keep what is stored
      settings: compactSettings({ ...profile?.settings, ...cleanSettings(values.settings) }),
    };
    try {
      if (isNew) {
        await createProfile(datasetKey, body);
      } else {
        await updateProfile(datasetKey, body);
      }
      setSaving(false);
      onSaved();
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  const previewText = preview.failed ? (
    <Text type="warning">preview unavailable</Text>
  ) : preview.total === null ? (
    <Text type="secondary">…</Text>
  ) : (
    <>
      Selects <Text strong>{preview.total.toLocaleString("en-GB")}</Text> sectors{" "}
      {preview.total > 0 && <a onClick={() => setShowPreview(true)}>show</a>}
    </>
  );

  return (
    <Modal
      open
      title={isNew ? "New sector profile" : `Edit profile ${profile.title}`}
      width={800}
      okText="Save"
      onOk={() => form.submit()}
      confirmLoading={saving}
      onCancel={onCancel}
      mask={{ closable: false }}
    >
      {error && (
        <Alert
          type="error"
          style={{ marginBottom: "10px" }}
          closable={{ onClose: () => setError(null) }}
          description={<ErrorMsg error={error} />}
        />
      )}
      <Form form={form} initialValues={initialValues} onFinish={onFinish}>
        <Divider plain>Profile</Divider>
        <Form.Item {...formItemLayout} label="Title" name="title"
          rules={[{ required: true, whitespace: true, message: "A title is required" }]}>
          <Input />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Description" name="description">
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />
        </Form.Item>
        <Form.Item {...formItemLayout} name="position"
          label={<Tooltip color="green" title="Profiles apply in ascending position, a later one overrides an earlier one">Position</Tooltip>}>
          <InputNumber />
        </Form.Item>

        <Divider plain>Selects</Divider>
        <Form.Item {...formItemLayout} label=" " colon={false}>
          <Text type="secondary">
            Every field narrows the selection, the values within one field are alternatives. An empty selector
            selects every sector of the project.
          </Text>
        </Form.Item>
        <Form.Item {...formItemLayout} label="Modes" name={["selector", "modes"]}>
          <Select mode="multiple" allowClear placeholder="any mode" options={toOptions(sectorMode)} />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Dataset types" name={["selector", "datasetTypes"]}>
          <Select mode="multiple" allowClear placeholder="any dataset type" options={toOptions(datasetType)} />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Publishers" name={["selector", "publisherKeys"]}>
          <PublisherSelect datasetKey={datasetKey} />
        </Form.Item>
        <Form.Item {...formItemLayout} name={["selector", "anySectorPublisher"]} valuePropName="checked"
          label={<Tooltip color="green" title="Any of the project's sector publishers, including ones added later">Any sector publisher</Tooltip>}>
          <Switch />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Source datasets" name={["selector", "subjectDatasetKeys"]}>
          <DatasetSelect datasetKey={datasetKey} />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Sectors" name={["selector", "sectorKeys"]}
          extra="Sector keys. You can also add sectors from the sector table.">
          <Select mode="tags" open={false} tokenSeparators={[",", " "]} placeholder="sector keys" />
        </Form.Item>
        <Form.Item {...formItemLayout} label="Preview">
          {previewText}
        </Form.Item>

        <Divider plain>Settings</Divider>
        <Form.Item {...formItemLayout} label=" " colon={false}>
          <Text type="secondary">All optional. A setting left empty is inherited from earlier profiles or the defaults.</Text>
        </Form.Item>
        <SectorSettingsFields modes={modes} namePrefix={["settings"]} formItemLayout={formItemLayout} />
      </Form>
      <PreviewDrawer
        open={showPreview}
        onClose={() => setShowPreview(false)}
        datasetKey={datasetKey}
        selector={preview.selector}
      />
    </Modal>
  );
};

const mapContextToProps = ({ sectorMode, datasetType }) => ({ sectorMode, datasetType });

export default withContext(mapContextToProps)(ProfileForm);
```

- [ ] **Step 5: Wire new and edit into the list**

In `src/pages/project/SectorProfiles/ProfileList.jsx`:
1. **Imports.**
   - Add `EditOutlined, PlusOutlined` to the icons import.
   - Add `import ProfileForm from "./ProfileForm";`.
2. **State.** Add `const [editing, setEditing] = useState(null); // {} for a new profile`.
3. **Edit button.** In the Action column's `<Space>`, before the `Popconfirm`, add:
   `<Button size="small" icon={<EditOutlined />} onClick={() => setEditing(p)} />`
4. **New button.** In the `!readOnly` header `Row`, after the text `Col`, add:
   ```jsx
   <Col>
     <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>
       New profile
     </Button>
   </Col>
   ```
5. **Modal.** Before the closing `</>` of the returned fragment, add:
   ```jsx
   {editing && (
     <ProfileForm
       datasetKey={datasetKey}
       profile={editing}
       nextPosition={profiles.length ? Math.max(...profiles.map((p) => p.position)) + 1 : 0}
       onCancel={() => setEditing(null)}
       onSaved={() => {
         setEditing(null);
         load();
       }}
     />
   )}
   ```

- [ ] **Step 6: Test and build**

Run: `npm test && NODE_ENV=production npx vite build`
Expected: tests pass, and the build reports `✓ built`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/project/SectorProfiles/
git commit -m "Create and edit sector profiles with a live preview of the selected sectors (#1732)"
```

---

### Task 9: Effective settings display and release profiles

Covers spec item 3.

**Files:**
- Create: `src/components/SectorSettings/EffectiveSettingsSummary.jsx`
- Modify: `src/pages/project/Assembly/Sector.jsx` (popover, ~lines 300-316)
- Modify: `src/pages/project/ProjectSectors/SectorPageContent.jsx` (`expandable`)
- Modify: `src/pages/DatasetKey/datasetPageTabs/ReleaseSectors.jsx`

**Interfaces:**
- Consumes:
  - `getEffectiveSettings`, `getProfiles` (Task 3);
  - `SourceTags` (Task 3);
  - `SETTINGS`, `parseSources`, `formatValue` (Task 2);
  - `ProfileList` (Task 7).
- Produces: `<EffectiveSettingsSummary datasetKey sectorId profilesPath />`.

- [ ] **Step 1: Summary component**

`src/components/SectorSettings/EffectiveSettingsSummary.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { Spin, Typography } from "antd";
import PresentationItem from "../PresentationItem";
import withContext from "../hoc/withContext";
import SourceTags from "./SourceTags";
import { getEffectiveSettings, getProfiles } from "../../api/sector";
import { SETTINGS, parseSources, formatValue } from "./settingsMeta";

const names = (list) => (list || []).map((e) => (typeof e === "string" ? e : e.name));

// The settings a sync of the sector uses. Lists every setting a profile or the sector sets, and the ranks always,
// so a publisher sector with no ranks of its own does not read as syncing all ranks.
const EffectiveSettingsSummary = ({ datasetKey, sectorId, profilesPath, rank, entitytype, nametype }) => {
  const [effective, setEffective] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setEffective(null);
    getEffectiveSettings(datasetKey, sectorId).then(setEffective).catch(() => setFailed(true));
    getProfiles(datasetKey).then(setProfiles).catch(() => setProfiles([]));
  }, [datasetKey, sectorId]);

  if (failed) return <Typography.Text type="secondary">Sync settings unavailable</Typography.Text>;
  if (!effective) return <Spin size="small" />;

  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const allValues = { ranks: names(rank), entities: names(entitytype), nameTypes: names(nametype) };
  const shown = SETTINGS.filter(
    (s) =>
      s.name === "ranks" ||
      parseSources(effective.sources?.[s.name]).some((src) => src.type !== "default")
  );
  return shown.map((s) => (
    <PresentationItem key={s.name} label={s.label}>
      {formatValue(s, effective.settings?.[s.name], allValues[s.name])}{" "}
      <SourceTags source={effective.sources?.[s.name]} profiles={byId} profilesPath={profilesPath} />
    </PresentationItem>
  ));
};

const mapContextToProps = ({ rank, entitytype, nametype }) => ({ rank, entitytype, nametype });

export default withContext(mapContextToProps)(EffectiveSettingsSummary);
```

- [ ] **Step 2: Sector popover**

In `src/pages/project/Assembly/Sector.jsx`:
- Add `import EffectiveSettingsSummary from "../../../components/SectorSettings/EffectiveSettingsSummary";`.
- Inside `{isRootSector && !showEditForm && (<>…</>)}`, replace the three blocks for `sector.code`, `ranks[0]` and `entities[0]` with:

```jsx
                <EffectiveSettingsSummary
                  datasetKey={sector.datasetKey}
                  sectorId={sector.id}
                  profilesPath={`/project/${projectKey}/sector/profiles`}
                />
```

Keep the `note` block after it.

- [ ] **Step 3: Release sector rows**

In `src/pages/project/ProjectSectors/SectorPageContent.jsx`:
- Add `import EffectiveSettingsSummary from "../../../components/SectorSettings/EffectiveSettingsSummary";`.
- In the `expandable` prop of `SectorTable`, turn `expandedRowRender` into:

```jsx
            expandedRowRender: (record) =>
              isRelease ? (
                <div style={{ maxWidth: "700px" }}>
                  <EffectiveSettingsSummary
                    datasetKey={record.datasetKey}
                    sectorId={record.id}
                    profilesPath={`/dataset/${record.datasetKey}/sector`}
                  />
                </div>
              ) : (
                <>
                  {/* the existing project row content, unchanged: SectorKeyLink, "Created by", SectorForm */}
                </>
              ),
            rowExpandable: () => true,
```

Move the existing JSX of `expandedRowRender` verbatim into the `: ( <> … </> )` branch. The comment line above is only a marker for that and is not part of the code.

- [ ] **Step 4: Release profiles**

Replace `src/pages/DatasetKey/datasetPageTabs/ReleaseSectors.jsx` with:

```jsx
import React from "react";
import { Collapse } from "antd";

import PageContent from "../../../components/PageContent";
import SectorPageContent from "../../project/ProjectSectors/SectorPageContent";
import ProfileList from "../../project/SectorProfiles/ProfileList";

const ReleaseSectors = ({ datasetKey }) => {
  return (
    <PageContent>
      <Collapse
        style={{ marginBottom: "10px" }}
        items={[
          {
            key: "profiles",
            label: "Sector profiles of this release",
            children: (
              <ProfileList datasetKey={datasetKey} readOnly sectorsPath={`/dataset/${datasetKey}/sector`} />
            ),
          },
        ]}
      />
      <SectorPageContent datasetKey={datasetKey} />
    </PageContent>
  );
};

export default ReleaseSectors;
```

- [ ] **Step 5: Build**

Run: `NODE_ENV=production npx vite build`
Expected: `✓ built`.

- [ ] **Step 6: Commit**

```bash
git add src/components/SectorSettings/EffectiveSettingsSummary.jsx src/pages/project/Assembly/Sector.jsx \
  src/pages/project/ProjectSectors/SectorPageContent.jsx src/pages/DatasetKey/datasetPageTabs/ReleaseSectors.jsx
git commit -m "Show effective sector settings and release profiles (#1732)"
```

---

### Task 10: Sector table profile filter and "add to profile"

Covers spec item 4.

**Files:**
- Create: `src/pages/project/SectorProfiles/AddToProfileModal.jsx`
- Modify: `src/pages/project/ProjectSectors/SectorPageContent.jsx` (filter)
- Modify: `src/pages/project/ProjectSectors/SectorTable.jsx` (selection action)

**Interfaces:**
- Consumes:
  - `getProfiles`, `getProfile`, `updateProfile` (Task 3);
  - `addToSelector`, `normalizeSelector` (Task 6).

- [ ] **Step 1: Profile filter**

In `SectorPageContent.jsx`:
- Add `import { getProfiles } from "../../../api/sector";`.
- Add the state `const [profiles, setProfiles] = useState([]);`.
- In the mount `useEffect` (the one calling `getPublishers()`), add:

```jsx
    getProfiles(projectKey || datasetKey)
      .then(setProfiles)
      .catch(() => setProfiles([]));
```

After the Publisher `FormItem` block, add:

```jsx
        {profiles?.length > 0 && (
          <FormItem style={{ marginBottom: "8px", marginRight: "8px" }}>
            <Select
              placeholder="Profile"
              style={{ width: 200 }}
              value={locationParams.profileKey}
              showSearch={{ optionFilterProp: "label" }}
              allowClear
              onChange={(value) => updateSearch({ profileKey: value })}
              options={profiles.map((p) => ({ value: String(p.id), label: p.title }))}
            />
          </FormItem>
        )}
```

- [ ] **Step 2: Add-to-profile modal**

`src/pages/project/SectorProfiles/AddToProfileModal.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { Modal, Select, Radio, Alert, App } from "antd";
import ErrorMsg from "../../../components/ErrorMsg";
import { getProfiles, getProfile, updateProfile } from "../../../api/sector";
import { addToSelector, normalizeSelector } from "./profileUtils";

// Appends the selected sectors, or their source datasets, to the selector of a profile
const AddToProfileModal = ({ open, onClose, datasetKey, sectors = [] }) => {
  const { notification } = App.useApp();
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const [what, setWhat] = useState("sectors");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setError(null);
      getProfiles(datasetKey).then(setProfiles).catch(setError);
    }
  }, [open, datasetKey]);

  const field = what === "datasets" ? "subjectDatasetKeys" : "sectorKeys";
  const selected = profiles.find((p) => p.id === profileId);
  // selector fields are ANDed: adding the first keys narrows the profile to just these
  const narrows = selected && normalizeSelector(selected.selector)[field].length === 0;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const profile = await getProfile(datasetKey, profileId);
      const { selector, added } = addToSelector(profile.selector, sectors, what);
      await updateProfile(datasetKey, { ...profile, selector });
      notification.success({
        title: `Added ${added} ${what === "datasets" ? "source dataset" : "sector"} key${added === 1 ? "" : "s"} to ${profile.title}`,
      });
      setSaving(false);
      onClose(true);
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Add ${sectors.length} sectors to a profile`}
      okText="Add"
      okButtonProps={{ disabled: !profileId }}
      confirmLoading={saving}
      onOk={save}
      onCancel={() => onClose(false)}
      destroyOnHidden
    >
      {error && <Alert type="error" style={{ marginBottom: "10px" }} description={<ErrorMsg error={error} />} />}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Select
          style={{ width: "100%" }}
          placeholder="Profile"
          value={profileId}
          onChange={setProfileId}
          options={profiles.map((p) => ({ value: p.id, label: p.title }))}
        />
        <Radio.Group value={what} onChange={(e) => setWhat(e.target.value)}>
          <Radio value="sectors">these sectors</Radio>
          <Radio value="datasets">their source datasets</Radio>
        </Radio.Group>
        {narrows && (
          <Alert
            type="warning"
            showIcon
            title={`${selected.title} selects no ${
              what === "datasets" ? "source datasets" : "sectors"
            } by key yet. Adding these limits it to them alone.`}
          />
        )}
      </div>
    </Modal>
  );
};

export default AddToProfileModal;
```

- [ ] **Step 3: Selection action**

In `SectorTable.jsx`:
- Add `import AddToProfileModal from "../SectorProfiles/AddToProfileModal";`.
- Add the state `const [addToProfileOpen, setAddToProfileOpen] = useState(false);`.
- Append to the `selections` array:

```jsx
                  {
                    key: "profile",
                    text: (
                      <Button style={{ width: "100%" }} onClick={() => setAddToProfileOpen(true)} type="primary">
                        Add {selectedRowKeys.length} sectors to profile…
                      </Button>
                    ),
                  },
```

Then, after the `<Table … />` inside the returned fragment, add:

```jsx
      {!isRelease && (
        <AddToProfileModal
          open={addToProfileOpen}
          datasetKey={projectKey}
          sectors={selectedRows}
          onClose={(done) => {
            setAddToProfileOpen(false);
            if (done) {
              setSelectedRows([]);
              setSelectedRowKeys([]);
            }
          }}
        />
      )}
```

- [ ] **Step 4: Test and build**

Run: `npm test && NODE_ENV=production npx vite build`
Expected: tests pass, and the build reports `✓ built`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/project/SectorProfiles/AddToProfileModal.jsx src/pages/project/ProjectSectors/SectorPageContent.jsx \
  src/pages/project/ProjectSectors/SectorTable.jsx
git commit -m "Filter sectors by profile and add selected sectors to a profile (#1732)"
```

---

### Task 11: Live verification

**Files:** none, unless verification finds bugs.

- [ ] **Step 1: Get a backend with profiles**

The new backend runs on no server yet (dev serves `c988b17`). Ask the user to push backend master, including Task 1, and redeploy dev, or to point at another backend running it. Then confirm both:

Run: `curl -s -o /dev/null -w "%{http_code}\n" "https://api.dev.checklistbank.org/dataset/3/sector/profile"`
Expected: `200`.

Run: `curl -s -X POST -H 'Content-Type: application/json' -d '{}' "https://api.dev.checklistbank.org/dataset/3/sector/profile/preview?limit=0" | head -c 200`
Expected: a JSON page with `"total"`.

- [ ] **Step 2: Run the UI against dev**

Run in the background: `npx vite`, then open `http://127.0.0.1:3000`. The `127.0.0.1` hostname routes to the dev env. Log in with the `claude.doering` editor account from the memory file and work on project 265156.

- [ ] **Step 3: Walk the acceptance criteria in the browser**

1. **Profiles tab:**
   - Create a profile with modes `merge` and ranks `genus, species`; the preview count updates within about a second of each selector change, and *show* lists those sectors.
   - Edit it, reorder it by drag and drop, and check positions persist after a reload.
   - The member count links to the sector table filtered by `profileKey`.
   - Delete it after its confirmation names the sector count.
2. **Sector form:**
   - On a merge sector the hints read "inherits genus, species from <profile>".
   - Network tab: saving without touching the tri-states sends `copyAccordingTo: null`, `removeOrdinals: null` and `createImplicitNames: null`, never `false`.
   - A bad `blockedNamePatterns` entry (`[`) shows the backend's 400 message.
3. **Popover:** in the assembly tree, right-click a sector: the settings list ranks with a "profile" tag whose tooltip names the profile.
4. **Bulk helpers:**
   - Select two sectors, use "Add 2 sectors to profile…", and see the warning on a profile with no sector keys.
   - The profile filter then shows exactly those two sectors.
5. **Release:** open a release of the project (`/dataset/{releaseKey}/sector`). The profiles panel is read-only (no drag handle, no buttons), rows expand to the effective settings, and nothing offers editing.
6. **Options:** the project Options page shows the profiles note, and the edit form no longer offers any `sector …` setting.

- [ ] **Step 4: Fix what fails**

For every failing check, use superpowers:systematic-debugging. Fix the bug, re-run `npm test && NODE_ENV=production npx vite build`, re-check in the browser, and commit with a message naming the fix.

- [ ] **Step 5: Final test run**

Run: `npm test`
Expected: all tests pass. Report the counts.
