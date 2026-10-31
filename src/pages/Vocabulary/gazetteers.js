import config from "../../config";

// The published gazetteers. Labels, build metadata and overview maps come from
// here, the metadata and shape of an individual area from the API.
export const GAZETTEERS_VIEWER = "https://catalogueoflife.github.io/col-gazetteers/";
export const GAZETTEERS_README = `${GAZETTEERS_VIEWER}readme.html`;

// Above this many labels a gazetteer is not listed (WDPA has 312,799).
export const MAX_LISTED_LABELS = 100000;

export const gazetteerFile = (name, file) =>
  `${GAZETTEERS_VIEWER}${encodeURIComponent(name)}/${file}`;

const collator = new Intl.Collator("en", { numeric: true });

// Ids in natural order: 1, 2, 10, 28A, 28a, not 1, 10, 2.
export const compareIds = (a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);

// labels.tsv has no header: id, English label, then optional extra columns.
export const parseLabels = (tsv) =>
  tsv
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [id, label = ""] = line.split("\t");
      return { id, label };
    })
    .sort((a, b) => compareIds(a.id, b.id));

// Ids are case sensitive, so only the gazetteer gets normalised.
// Returns null if the key has no gazetteer or no id.
export const parseAreaKey = (key = "") => {
  const colon = key.indexOf(":");
  if (colon < 1 || colon === key.length - 1) return null;
  return {
    gazetteer: key.substring(0, colon).toLowerCase(),
    id: key.substring(colon + 1),
  };
};

export const areaPath = (gazetteer, id) =>
  `/vocabulary/area/${gazetteer}:${encodeURIComponent(id)}`;

export const areaApiUrl = (gazetteer, id) =>
  `${config.dataApi}vocab/area/${gazetteer}:${encodeURIComponent(id)}`;

// Mirrors Gazetteer.getAreaLink in the backend: FAO only has pages for its main
// divisions. Returns null for gazetteers without area pages of their own.
export const externalAreaLink = (gazetteer, id) => {
  if (!gazetteer?.areaLinkTemplate) return null;
  const areaId = gazetteer.name === "fao" ? id.split(".")[0] : id;
  return `${gazetteer.areaLinkTemplate}${areaId}`;
};

// Native fetch on purpose. Axios sends the login token with every request, which
// must not reach github.io, and its interceptor replaces the page on a 401/403.
// Resolves to null on a 404 and rejects on any other failure.
export const fetchOrNull = async (url, { as = "json", signal } = {}) => {
  const response = await fetch(url, { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return as === "text" ? response.text() : response.json();
};
