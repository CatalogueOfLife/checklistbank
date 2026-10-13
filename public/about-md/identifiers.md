## Identifiers in ChecklistBank

ChecklistBank deals with identifiers on several levels:

- every **dataset** has an integer key and a [DOI](#dataset-keys-and-dois)
- every **record** of a dataset, a name, taxon, synonym or reference, has an [identifier](#record-identifiers) that is unique within its dataset
- **releases** of a project carry [stable identifiers](#stable-identifiers-in-releases) that stay the same from one release to the next
- references to records in **other systems** are shared as [scoped identifiers](#scoped-identifiers)

## Dataset keys and DOIs

Every dataset has an integer key, e.g. `2144` for ITIS, which is used in all URLs of the [user interface](/dataset/2144) and the [API](API#datasets).
Every dataset also has a [DOI](https://support.datacite.org/docs/doi-basics) which remains the same across its lifetime.
We refer to this as the **concept DOI** as it represents the concept of the dataset, not a specific version.

External datasets additionally get a **version DOI** for every successful import.
The concept DOI always resolves to the latest version while each version DOI points to its specific snapshot.
Older versions are not searchable and ChecklistBank only provides a basic archive view for them.

Projects and releases do not have version DOIs:

- Projects change continuously, there is no meaningful version.
- Releases are immutable snapshots themselves, so their concept DOI is already version specific.

DOIs are minted with the ChecklistBank DataCite [prefix](https://support.datacite.org/docs/doi-basics#prefix) `10.48580`.
The suffix is derived from the dataset key, written in the same alphabet as the [stable identifiers](#stable-identifiers-in-releases) of releases:

- concept DOI: `10.48580/d{key}`, e.g. [`10.48580/d4ky`](https://doi.org/10.48580/d4ky) for ITIS with the key 2144
- version DOI: `10.48580/d{key}.v{attempt}`, with the number of the import attempt

### When a DOI becomes public

DataCite knows three [DOI states](https://support.datacite.org/docs/doi-states): `DRAFT`, `REGISTERED` and `FINDABLE`.
Only a findable DOI resolves publicly.
Private datasets have a draft DOI, which nobody but DataCite can see.

| Origin | Concept DOI | Version DOI | Findable when |
|---|---|---|---|
| `external` | yes | yes, per import | the dataset is public; each new version DOI is published right away |
| `project` | yes | no | the project is made public; most projects stay private, so their DOI stays a draft |
| `release` | yes | no | the release is published, i.e. switched from private to public |

Once a DOI is findable it stays findable, even if the dataset is made private again.
Deleting a dataset hides its DOI: it can no longer be found, but it still points to the right place.

The DOI metadata at DataCite is built from the dataset metadata and kept up to date with it.
In addition the DOIs are linked to each other:

- version DOIs to the previous and next import of the same dataset
- release DOIs to the previous and next release of the same project

## Record identifiers

ChecklistBank keeps the identifiers of names, taxa, synonyms and references exactly as the source gives them.
As the same identifier can occur in many datasets, a record identifier is only unique within its dataset
and records are addressed by the dataset key together with the identifier, e.g. ITIS's _Abies alba_ Mill. is [`/dataset/2144/taxon/506607`](/dataset/2144/taxon/506607),
or [`{{API}}/dataset/2144/taxon/506607`]({{API}}/dataset/2144/taxon/506607) in the API.

Records that ChecklistBank creates itself, e.g. in a [project](projects), get generated identifiers.
Projects change all the time and their identifiers are not stable. Never cite or store a project identifier.

### Stable identifiers in releases

A release of a project is an immutable snapshot, and its identifiers are stable:
the same name keeps the same identifier from one release to the next.
The Catalogue of Life identifiers, e.g. `8K9Y` for _Abies alba_ Mill., are such release identifiers.

- An identifier has at most 7 characters, written in an alphabet of 29 characters, `23456789BCDFGHJKLMNPQRSTVWXYZ`.
  It has no `0`, `O`, `1` or `I`, which are easily confused, and no vowels, so that an identifier never spells a word.
- Identifiers are issued in ascending order, so a shorter identifier is always an older one.
- A base release and the [extended release](projects#releases) built on it draw on one pool of identifiers.
- Names that already have a globally recognised identifier keep it: UNITE species hypotheses as they are, e.g. `SH19186714.17FU`,
  and BOLD BINs with a dot instead of the colon, e.g. `BOLD.AAA3374`.

## Scoped identifiers

Identifiers are everywhere in taxonomic data — every name, taxon, synonym and reference
carries one or more. To be useful when shared between systems an identifier has to be
**globally unique** and ideally **actionable** (resolvable to a record). The problem is that
most identifiers are only locally unique: the integer `2704179` means a bird in the GBIF
backbone, a publication in some library and nothing at all somewhere else.

ChecklistBank and the [COL Data Package](https://catalogueoflife.github.io/coldp/#identifiers)
(ColDP) solve this the same way the wider web does — with **scoped identifiers** written as
[CURIEs](https://www.w3.org/TR/curie/) (Compact URIs). A scoped identifier prefixes the local
id with a short, registered scope and a colon:

```
scope:id
```

The scope is a lowercase abbreviation drawn from the registry below; the id is the identifier
exactly as the source system issues it. Together they form a compact, globally unique,
resolvable token.

## Why not just use URLs?

A resolver URL embeds the identifier inside a service endpoint that can change over time:

```
https://www.gbif.org/species/2704179
```

The *true* identifier here is `2704179` — the rest is plumbing. If GBIF restructures its URLs,
every copied link breaks, yet the underlying id is still perfectly valid. CURIEs let you share
the durable part and reconstruct the URL on demand:

```
gbif:2704179      →  https://www.gbif.org/species/2704179
```

Each scope in the registry carries a **resolver template** with an `{id}` placeholder, so
ChecklistBank (and any consumer) can turn a CURIE back into a live link.

## Examples

```
col:6W3C4                     Catalogue of Life usage
gbif:2704179                  GBIF backbone taxon
wfo:wfo-0000891536            World Flora Online name
worms:212808                  World Register of Marine Species
ipni:320035-2                 International Plant Names Index
if:550000                     Index Fungorum
tsn:41107                     ITIS Taxonomic Serial Number
ncbi:93036                    NCBI Taxonomy
orcid:0000-0001-6492-4016     a person (Open Researcher and Contributor ID)
wikidata:Q157571              a Wikidata item
doi:10.5281/zenodo.6407053    a Digital Object Identifier
```

The id is taken verbatim — it may contain hyphens, dots, slashes or its own prefix
(`wfo:wfo-0000891536` is correct). Only the first colon separates scope from id.

## Globally unique identifiers without a scope

Some identifiers are already globally unique and need no scope. ColDP accepts a bare
`URI`, `URN` or `URL` in any field that takes an identifier, alongside the `scope:id` form:

```
https://www.biodiversitylibrary.org/page/45607882
urn:lsid:ipni.org:names:320035-2
https://doi.org/10.5281/zenodo.6407053
```

ChecklistBank recognises these special cases automatically and classifies them under the
built-in `url`, `urn`, `lsid` or `doi` scopes. Anything that is neither a recognised URI nor a
`scope:id` pair is kept as a `local` identifier with no public scope.

## Using scoped identifiers in ColDP

In a COL Data Package, scoped identifiers are used wherever a record points at an external
record or agent. The most common field is **`alternativeID`** on the Name, Taxon and Reference
entities — a comma-concatenated list where *every* entry must be a URI/URN/URL or a `scope:id`:

```csv
ID,alternativeID,scientificName
1,"col:6W3C4,gbif:2704179,wikidata:Q157571",Vanellus vanellus
```

Author and people references use the same convention, typically with `orcid:` or `wikidata:`:

- `authorID` (Reference)
- `basionymAuthorshipID`, `combinationAuthorshipID` (Name)

```csv
authorID
"orcid:0000-0001-6492-4016,wikidata:Q12345"
```

Sharing identifiers this way — rather than as portal links — keeps your data terse and
re-linkable even as the referenced services evolve.

## Area identifiers (gazetteers)

Geographic areas follow the same pattern. A **`Distribution`** record says where a taxon occurs
by pointing at an area in a published gazetteer, and that reference is written as a `gazetteer:id`
CURIE — the scope is the gazetteer, the id is the area code within it:

```
iso:DE          Germany (ISO 3166-1)
tdwg:GER        Germany (WGSRPD level 3)
fao:27          FAO Major Fishing Area 27, Atlantic Northeast
```

The gazetteer is drawn from a fixed set of geographic standards rather than the scope registry
above. ChecklistBank resolves each `gazetteer:id` to its area name and, where geometry is
available, draws it on the distribution map. The supported gazetteers — FAO, IHO, ISO 3166,
Longhurst, MRGID, Realm, TDWG, TEOW and WDPA — and every area code within them are documented in
the [COL gazetteers reference](https://catalogueoflife.github.io/col-gazetteers/).

## How ChecklistBank stores identifiers

Internally ChecklistBank represents every identifier as a small `{scope, id}` pair and attaches
it to **names, taxa and synonyms**. When data is imported, a raw identifier string is parsed
into this structure:

- a leading `http(s)://` or `ftp(s)://` → `url`
- `urn:lsid:…` → `lsid`, any other `urn:…` → `urn`
- a recognised DOI (in `doi:`, `https://doi.org/…` or `urn:` form) → `doi`
- a `scope:id` pair whose scope is in the registry → that scope
- anything else → `local`

Stored identifiers round-trip back to their `scope:id` string form on export and are shown on
taxon and name pages as resolvable links, using the resolver templates from the registry.

## The identifier scope registry

The list of scopes ChecklistBank knows about is served from the API and can be browsed below.
Each scope can also be fetched on its own:

- All scopes — [`/vocab/identifier-scope`]({{API}}/vocab/identifier-scope)
- A single scope — `/vocab/identifier-scope/{scope}`, e.g.
  [`/vocab/identifier-scope/gbif`]({{API}}/vocab/identifier-scope/gbif)

Expand a row to see its resolver template, homepage, id pattern, linked Wikidata property and —
for scopes backed by a dataset in ChecklistBank — the dataset key.

## Requesting a new scope

Missing a scope, or spotted something to correct? The registry is maintained in the
ChecklistBank backend. Please [open an identifier-scope issue](https://github.com/CatalogueOfLife/backend/issues/new?template=identifier-scope.yml)
— the form asks for the prefix, title and the other fields shown above (only the scope and title
are required) so we can add or amend the entry. You can also browse
[existing requests](https://github.com/CatalogueOfLife/backend/issues?q=is%3Aissue+label%3Aidentifier-scope).
