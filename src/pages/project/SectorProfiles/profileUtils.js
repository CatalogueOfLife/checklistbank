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
