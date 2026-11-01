import config from "../../config";

// The published gazetteers, only linked to for their viewer and documentation.
// All their data comes from the API.
export const GAZETTEERS_VIEWER = "https://catalogueoflife.github.io/col-gazetteers/";
export const GAZETTEERS_README = `${GAZETTEERS_VIEWER}readme.html`;

// Above this many labels a gazetteer is not listed (WDPA has 312,799).
export const MAX_LISTED_LABELS = 100000;

// Explains the sources and processing of a published gazetteer. Others like text have none.
export const gazetteerReadme = (name) =>
  `https://github.com/CatalogueOfLife/col-gazetteers/blob/main/${encodeURIComponent(name)}/README.md`;

export const gazetteerFile = (name, file) =>
  `${config.dataApi}vocab/gazetteer/${encodeURIComponent(name)}/${file}`;

// Gazetteers with a drawn world map, realm/map.svg, on top of their overview.
export const GAZETTEERS_WITH_IMAGE = ["realm"];

const SVG_NS = "http://www.w3.org/2000/svg";
const AREA_ELEMENT = /^(realm|label|legend)-([A-Za-z0-9]+)/;

// The drawn map, ready to go inline: each area, its name and its legend entry become
// a link to the area, as their elements carry its id like realm-Afrotropic or
// legend-Afrotropic-name. Its style applies to the whole document once inline, so what
// it sets moves to the root. Null if it isn't a valid SVG.
export const linkedAreaSvg = (svg, hrefOf) => {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  if (root.nodeName !== "svg" || doc.querySelector("parsererror")) return null;
  doc.querySelectorAll("style, metadata, script").forEach((el) => el.remove());
  root.setAttribute("stroke-linejoin", "round");
  root.setAttribute("stroke-linecap", "butt");
  root.removeAttribute("width");
  root.removeAttribute("height");
  [...doc.querySelectorAll("g[id]")].forEach((el) => {
    const match = el.id.match(AREA_ELEMENT);
    if (!match) return;
    const [, kind, id] = match;
    const link = doc.createElementNS(SVG_NS, "a");
    link.setAttribute("href", hrefOf(id));
    // Only the areas themselves take a step in the tab order.
    if (kind !== "realm") link.setAttribute("tabindex", "-1");
    if (kind === "realm") {
      const title = doc.createElementNS(SVG_NS, "title");
      title.textContent = doc.getElementById(`legend-${id}-name`)?.textContent.trim() || id;
      link.appendChild(title);
    }
    el.replaceWith(link);
    link.appendChild(el);
  });
  return new XMLSerializer().serializeToString(root);
};

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

// Native fetch on purpose. Without the login token axios sends, requests stay on the
// cached read only server, and its interceptor would replace the page on a 401/403.
// Resolves to null on a 404 and rejects on any other failure.
export const fetchOrNull = async (url, { as = "json", signal } = {}) => {
  const response = await fetch(url, { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return as === "text" ? response.text() : response.json();
};
