// Renders a single authorship as the backend does (name-parser's NameFormatter.appendAuthorship),
// except that bacterial author lists are not cut down to "et al.": the page shows every author.
const BOTANICAL_CODES = ["botanical", "cultivars", "phyto"];

const has = (list) => Array.isArray(list) && list.length > 0;

const joinAuthors = (authors) => {
  if (authors.length < 2) {
    return authors.join(", ");
  }
  const last = authors[authors.length - 1];
  const end = /^al\.?$/.test(last) ? " et al." : ` & ${last}`;
  return authors.slice(0, -1).join(", ") + end;
};

export const anonymousAuthor = (code) =>
  BOTANICAL_CODES.includes(code) ? "anon." : "Anon.";

export const formatAuthorship = (authorship, code) => {
  if (
    !authorship ||
    !(authorship.anonymous || has(authorship.authors) || authorship.year)
  ) {
    return null;
  }
  const { authors, exAuthors, year, imprintYear, anonymous, sanctioningAuthor } =
    authorship;
  let citation = has(exAuthors) ? `${joinAuthors(exAuthors)} ex ` : "";
  if (anonymous) {
    // attributed authors of an anonymous work go in square brackets (ICZN Recommendation 51D)
    citation += has(authors) ? `[${joinAuthors(authors)}]` : anonymousAuthor(code);
  } else if (has(authors)) {
    citation += joinAuthors(authors);
  }
  if (year) {
    if (citation) {
      citation += code === "bacterial" ? " " : ", ";
    }
    citation += year;
  }
  if (imprintYear) {
    citation += ` [${imprintYear}]`;
  }
  if (sanctioningAuthor) {
    citation += ` : ${sanctioningAuthor}`;
  }
  return citation;
};
