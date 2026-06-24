## OpenRefine Reconciliation

[OpenRefine](https://openrefine.org) is a popular free tool for cleaning messy tabular data.
Its [Reconciliation](https://openrefine.org/docs/manual/reconciling) feature matches the cells of a
column against an external service that returns candidate entities with stable identifiers, and can
then pull additional columns from the matched entities ("data extension").

ChecklistBank exposes several reconciliation services that all speak the standard
[Reconciliation Service API](https://reconciliation-api.github.io/specs/0.2/) (spec 0.2), so they work
out of the box with OpenRefine and any other compatible client:

- [Name usage reconciliation](#name-usage-reconciliation) — match scientific names against the Catalogue of Life
  or any dataset/release.
- [Parser reconciliation](#parser-reconciliation) — normalise and parse columns of controlled
  vocabularies, scientific names, geological time units, taxonomic groups and area identifiers.

All services are served from the API host `https://api.checklistbank.org`. The dev environment mirrors
them at `https://api.dev.checklistbank.org`.

### Adding a service in OpenRefine

1. In OpenRefine open a column menu → **Reconcile → Start reconciling…**
2. Click **Add Standard Service** and paste one of the service URLs listed below.
3. Pick the service (and, if it offers several types, the type for this column) and **Start Reconciling**.
4. Matched cells turn into links. To pull extra columns, use the column menu →
   **Edit column → Add columns from reconciled values…** and tick the properties you want.

You only need to add a service once; OpenRefine remembers it.

## Name usage reconciliation

Matches scientific names against indexed name usages using the same matching engine as the
ChecklistBank [name matching](/tools/name-matching) tool. It returns the matched taxon (and ranked
alternatives) and can extend matched rows with taxonomic properties and the higher classification.

| Target | Service URL |
|---|---|
| Catalogue of Life | `https://api.checklistbank.org/reconcile` |
| A specific dataset or release | `https://api.checklistbank.org/dataset/{key}/reconcile` |

The bare `/reconcile` endpoint always tracks the current COL extended release. To reconcile against a
particular checklist, use its dataset key (release keys and the `{key}LXR` / `{key}LR` aliases work too).

### Property hints

To improve matching, map other columns to these query properties (in the reconcile dialog, *"Also use
relevant details from other columns"*):

- `authorship` — the name's authorship, e.g. `(Linnaeus, 1758)`
- `rank` — e.g. `species`
- `code` — nomenclatural code, e.g. `ICZN`
- any **rank name** (`kingdom`, `family`, `genus`, …) — a higher taxon for classification context

### Data extension

After reconciling, you can add columns for: `scientificName`, `authorship`, `rank`, `status`,
`nidx` (names index id) and the higher ranks `kingdom`, `phylum`, `class`, `order`, `family`, `genus`.

An entity autocomplete (suggest) is available for the match UI.

## Parser reconciliation

These services sit on top of the ChecklistBank [parsers](/about/API). They are ideal for **cleaning and
enriching** columns: reconciling normalises each cell to a canonical value, and (where offered) data
extension breaks a value into structured columns.

Each parser is its own service URL, so add only the ones you need.

### Controlled vocabularies

Reconcile free-text cells to canonical enumeration values. A clean parse
auto-matches the cell; the candidate id is the canonical constant (e.g. `SPECIES`).

```
https://api.checklistbank.org/parser/{type}/reconcile
```

Available `{type}` values include:

`rank`, `country`, `language`, `license`, `nomcode`, `nomstatus`, `nomreltype`, `sex`,
`taxonomicstatus`, `typestatus`, `distributionstatus`, `mediatype`, `referencetype`,
`treatmentformat`, `datasettype`, `gazetteer`, `lifezone`.

For these enumeration vocabularies an entity autocomplete (suggest) lists the allowed values, so you can
browse and pick a value in the match UI.

Example — reconcile a messy rank column:

```
curl "https://api.checklistbank.org/parser/rank/reconcile?queries=%7B%22q0%22:%7B%22query%22:%22sp.%22%7D%7D"
```

returns a single auto-matched candidate with id `SPECIES`.

### Name parser

Parses scientific name strings and, through data extension, returns every structured component as its
own column — the most powerful of the parser services.

```
https://api.checklistbank.org/parser/name/reconcile
```

Reconciling a name column simply confirms each cell is a parsable name and gives it a handle.
The value comes from **Add columns from reconciled values**, which can return:

`label`, `labelHtml`, `scientificName`, `authorship`, `rank`, `code`, `type`
(e.g. `SCIENTIFIC`, `VIRUS`, `HYBRID_FORMULA`), `uninomial`, `genus`, `infragenericEpithet`,
`specificEpithet`, `infraspecificEpithet`, `cultivarEpithet`, `combinationAuthorship`,
`combinationYear`, `basionymAuthorship`, `basionymYear`, `nomenclaturalNote`, `taxonomicNote`,
`extinct`, `parsed`.

#### Supplying a nomenclatural code or rank

The nomenclatural code has the biggest effect on how a name parses. You can supply `code` (and `rank`)
context in two ways:

1. **In the extension dialog** — the *Add columns from reconciled values* dialog shows **Nomenclatural
   code** and **Rank** drop-downs (rendered from the service's property settings). Pick a value and it
   is applied to the parse.
2. **In the service URL** — register the service with the context baked in, e.g.
   `https://api.checklistbank.org/parser/name/reconcile?code=ICZN&rank=species`. This becomes the default
   for every cell unless overridden by a per-column setting.

If neither is given, the parser auto-detects as best it can.

### Geological time (GeoTime)

Reconciles geochronological unit names (eons, eras, periods, epochs, ages) to the International
Chronostratigraphic Chart, with autocomplete over all known units.

```
https://api.checklistbank.org/parser/geotime/reconcile
```

Data extension returns: `name`, `type`, `start` (start age in millions of years), `end` (end age in
millions of years).

### Taxonomic group (TaxGroup)

Reconciles a column of **scientific names** to their broad taxonomic group (e.g. *Insects*, *Fungi*,
*Birds*). The cell is the name; map `rank`, `code` and higher-taxon columns as classification hints to
improve the result. Note that this service relies entirely on suprageneric names - if you only have binomials or genus names
no groups will be assigned. It is fine to point to species names as long as additional classification parameters are given.

```
https://api.checklistbank.org/parser/taxgroup/reconcile
```

Data extension returns: `parent` (the parent group), `codes` (applicable nomenclatural codes),
`description`, `icon` (a group icon URL). An autocomplete over the group vocabulary is available.

### Area

Reconciles area identifiers and labels to standardised gazetteer references. It understands CURIEs such
as `tdwg:14`, `iso:DE`, `mrgid:14123` and `wdpa:14123`, and resolves them to a canonical global id.

```
https://api.checklistbank.org/parser/area/reconcile
```

A cell that resolves to a known gazetteer area auto-matches with its CURIE (e.g. `tdwg:14`) as the id;
plain free-text place names that are not a known identifier are left unmatched. Data extension returns:
`gazetteer`, `id`, `name`, `globalId`, `link`.

## Endpoint reference

| Service | URL | Suggest | Data extension |
|---|---|---|---|
| Name usage (COL backbone) | `/reconcile` | yes | taxon properties + classification |
| Name usage (dataset) | `/dataset/{key}/reconcile` | yes | taxon properties + classification |
| Controlled vocabulary | `/parser/{type}/reconcile` | enum values | — |
| Name parser | `/parser/name/reconcile` | — | parsed name fields (+ `code`/`rank`) |
| GeoTime | `/parser/geotime/reconcile` | yes | `name, type, start, end` |
| TaxGroup | `/parser/taxgroup/reconcile` | yes | `parent, codes, description, icon` |
| Area | `/parser/area/reconcile` | — | `gazetteer, id, name, globalId, link` |

A `GET` on any service URL returns its service manifest; `POST` (or `GET ?queries=…`) runs
reconciliation. These are the same endpoints OpenRefine calls for you — you rarely need to call them by
hand.

## Notes & limitations

- Reconciliation candidates are scored 0–100. Vocabulary, geotime, name and area services auto-match a
  cell only on a clean parse (score 100); name-usage matching uses graded scores and only auto-matches
  unambiguous exact hits.
- The parser services are stateless and fast, but they are not bulk endpoints for millions of rows — for
  very large jobs prefer the [name matching](/tools/name-matching) tool or the
  [API](/about/API) directly.
- All services are read-only and require no authentication.
