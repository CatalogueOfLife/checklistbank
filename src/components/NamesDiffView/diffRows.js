// Normalize a chunk op to lowercase. The backend serializes ops lowercase but
// PR #1546 documents case-insensitive consumption, so guard against casing.
export const normOp = (op) => String(op ?? "").trim().toLowerCase();

// Build a single alphabetically-merged list from a NamesDiff object.
// removed/added rows carry the name string as `value`; changed rows carry the
// ChangedName object and sort by its `before`. Sort uses JS default string
// order (UTF-16 code units) to approximate the backend's C-collation byte order.
export const mergeSorted = (diff) => {
  if (!diff) return [];
  const rows = [];
  (diff.removed || []).forEach((name, i) =>
    rows.push({ type: "removed", key: `r${i}`, sortKey: name, value: name })
  );
  (diff.added || []).forEach((name, i) =>
    rows.push({ type: "added", key: `a${i}`, sortKey: name, value: name })
  );
  (diff.changed || []).forEach((c, i) =>
    rows.push({ type: "changed", key: `c${i}`, sortKey: c?.before ?? "", value: c })
  );
  return rows.sort((x, y) =>
    x.sortKey < y.sortKey ? -1 : x.sortKey > y.sortKey ? 1 : 0
  );
};
