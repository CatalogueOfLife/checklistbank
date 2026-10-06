// The tree syncs. A hierarchy sync applies none of the filters and only reads authorshipUpdate.
const TREE_SYNCS = ["attach", "union", "merge"];

// The 14 sync settings sectors and sector profiles share, with identical JSON names.
// See docs/SECTOR-SETTINGS.md in the backend repo: nearest level wins for scalars and allow-lists,
// the blocklists (union) add up over all levels. modes limits a setting to some sector modes.
export const SETTINGS = [
  { name: "ranks", label: "Ranks", kind: "enums", group: "filter", unset: "all", modes: TREE_SYNCS,
    help: "Only accepted names of these ranks are synced; synonyms below species always are" },
  { name: "nameTypes", label: "Name types", kind: "enums", group: "filter", unset: "all", modes: TREE_SYNCS,
    help: "Only names of these types are synced" },
  { name: "nameStatusExclusion", label: "Name status exclusion", kind: "enums", group: "filter", union: true, modes: TREE_SYNCS,
    help: "Names with these nomenclatural statuses are not synced" },
  { name: "extinctFilter", label: "Extinct status", kind: "bool", group: "filter", unset: "all", modes: TREE_SYNCS,
    yes: "extinct", no: "extant", help: "Sync extinct taxa only, or extant ones only" },
  { name: "nameFilter", label: "Name filter", kind: "regex", group: "filter", modes: TREE_SYNCS,
    help: "Only names whose scientific name fully matches this regular expression are synced" },
  { name: "entities", label: "Entities", kind: "enums", group: "data", unset: "all", modes: TREE_SYNCS,
    help: "Which entities are synced" },
  { name: "code", label: "Code", kind: "enum", group: "data", modes: TREE_SYNCS,
    help: "Force this nomenclatural code onto every synced name" },
  { name: "copyAccordingTo", label: "AccordingTo", kind: "bool", group: "data", modes: TREE_SYNCS,
    help: "Keep the accordingTo reference of synced usages" },
  { name: "removeOrdinals", label: "Remove ordinals", kind: "bool", group: "data", modes: TREE_SYNCS,
    help: "Remove the custom sort order of synced taxa" },
  { name: "createImplicitNames", label: "Implicit names", kind: "bool", group: "data", modes: TREE_SYNCS,
    help: "Create implicit genera and species" },
  { name: "authorshipUpdate", label: "Authorship update", kind: "enum", group: "data", modes: ["hierarchy"],
    help: "Copy the source authorship onto matched names" },
  { name: "issueExclusion", label: "Issue exclusion", kind: "enums", group: "blocklist", union: true,
    modes: TREE_SYNCS, help: "Names whose source record carries one of these issues are not synced" },
  { name: "blockedNames", label: "Blocked names", kind: "tags", group: "blocklist", union: true,
    modes: TREE_SYNCS,
    help: "Names never synced, matched with or without authorship, case insensitive. Press enter after each name" },
  { name: "blockedNamePatterns", label: "Blocked name patterns", kind: "tags", group: "blocklist", union: true,
    modes: TREE_SYNCS,
    help: "Case insensitive regular expressions searched in the name label; matching names are never synced. Press enter after each pattern" },
];

export const SETTING_GROUPS = [
  { key: "filter", title: "Filter" },
  { key: "data", title: "Data to sync" },
  { key: "blocklist", title: "Blocklists" },
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
