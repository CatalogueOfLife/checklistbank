// How the API shapes a vocabulary, and how its values get displayed. Values stay
// verbatim: there are deliberately no labels for fields or values in here.

// Paths the vocabulary index names differently than the API serves them.
const API_PATHS = { terms: "term" };

export const vocabApiPath = (key) => API_PATHS[key] || key;

// Most vocabularies are lists of objects, shown as cards. Language is a
// { code: title } map and term a list of strings. Both are large and have nothing
// to show but an identifier and a label, so they go into a compact list.
export const normalizeVocab = (data) => {
  if (Array.isArray(data)) {
    if (data.every((v) => typeof v === "string")) {
      return { rows: data.map((id) => ({ id, label: "" })) };
    }
    return { items: data };
  }
  return {
    rows: Object.entries(data || {})
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
};

const isEmpty = (value) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0);

// Splits a value into the flags that are true, shown as tags, and the fields worth
// showing. False flags and empty fields only add noise: a rank carries 15 flags.
export const partitionFields = (item, exclude = ["name"]) => {
  const flags = [];
  const fields = [];
  Object.keys(item).forEach((key) => {
    if (exclude.includes(key)) return;
    const value = item[key];
    if (value === true) {
      flags.push(key);
    } else if (value !== false && !isEmpty(value)) {
      fields.push([key, value]);
    }
  });
  return { flags, fields };
};
