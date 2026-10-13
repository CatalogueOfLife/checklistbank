## ChecklistBank API guide

Everything you see in ChecklistBank is also available through its JSON API at https://api.checklistbank.org.
All API methods are documented in the generated [Swagger documentation](https://api.checklistbank.org),
which is based on an [OpenAPI description](https://api.checklistbank.org/openapi) you can load into clients like [Insomnia](https://insomnia.rest) or [Paw](https://paw.cloud).
This guide gives examples for common use cases.

A test installation for trying things out is available at https://api.test.checklistbank.org.
It holds a copy of the production data, but uses separate user accounts, see [authentication](#authentication).

We invite you to use our [mailing list](https://lists.gbif.org/postorius/lists/col-users.lists.gbif.org/) to discuss ChecklistBank and its API.
We also use this list to infrequently announce important COL and API news.

## General API features

### Datasets and records

ChecklistBank stores many datasets, often called checklists, that deal with scientific names at their core.
Datasets keep their original record identifiers, which might also occur in other datasets,
so a record [identifier](identifiers#record-identifiers) is only unique within its dataset.
Most API resources are therefore scoped by a dataset key:

- https://api.checklistbank.org/dataset/9910/name
- https://api.checklistbank.org/dataset/9910/taxon/H6
- https://api.checklistbank.org/dataset/9910/reference?q=Wetter

ChecklistBank differs between [_names_](names) and _name usages_, which can be a _taxon_ (an accepted name) or a _synonym_.
Names can exist on their own in a dataset, e.g. if they are taxonomically unplaced or part of a nomenclatural dataset.
We refer to these names as _bare names_.

### Formats

Requests without an `Accept` header get JSON.
Some resources also offer other formats, which can be requested with the `Accept` header
or, if you cannot set headers, with a suffix on the URL:

| Suffix | Accept header |
|---|---|
| `.json` | `application/json` |
| `.xml` | `application/xml` |
| `.yaml` | `text/yaml` |
| `.txt` | `text/plain` |
| `.html` | `text/html` |
| `.tsv` | `text/tsv` |
| `.csv` | `text/csv` |
| `.zip` | `application/zip` |
| `.png` | `image/png` |
| `.bib` | `application/x-bibtex` |
| `.csljs` | `application/vnd.citationstyles.csl+json` |

The metadata of a dataset, for example, is available as JSON, as [ColDP](formats#catalogue-of-life-data-package-coldp) YAML, as EML XML and as a BibTeX or CSL-JSON citation:

- https://api.checklistbank.org/dataset/9910.json
- https://api.checklistbank.org/dataset/9910.yaml
- https://api.checklistbank.org/dataset/9910.xml
- https://api.checklistbank.org/dataset/9910.bib

### Paging

Searches and lists are paged with the `limit` and `offset` parameters.
The default limit is 10 and the maximum 1000. The offset cannot go beyond 100,000;
use a [download](#downloads) to get more records.

### Vocabularies

Many fields of the API use a controlled vocabulary.
All vocabularies are listed at https://api.checklistbank.org/vocab,
and the values of each by appending its name, e.g. https://api.checklistbank.org/vocab/taxonomicstatus.
The same vocabularies can also be [browsed](/vocabulary) in the user interface.

### Authentication

Most of the API is open and can be used anonymously.
Writing data needs authentication, and so does reading `private` datasets, which are only visible to their editors and reviewers.

ChecklistBank shares user accounts with GBIF, so you need a [GBIF account]({{GBIF_URL}}user/profile) to authenticate.

The **test environment is separate**: `api.test.checklistbank.org` is linked to the GBIF test registry at [gbif-test.org](https://www.gbif-test.org), not to production GBIF.
A production GBIF account does not work against test: you need to register a separate account at [www.gbif-test.org/user/profile](https://www.gbif-test.org/user/profile)
and then log in once at [www.test.checklistbank.org](https://www.test.checklistbank.org) with those credentials.

The API accepts [BasicAuth](https://en.wikipedia.org/wiki/Basic_access_authentication) and [JWT](https://jwt.io/introduction) tokens.
BasicAuth sends your password with every request, so always use it with _https_.
A JWT is issued by `GET /user/login` with BasicAuth and can then be sent as a `Bearer` token in the `Authorization` header, or as a `token` query parameter.

A simple authentication using curl looks like this:

```bash
curl -s --user j.smith:passwd1234xyz "https://api.checklistbank.org/user/me"
```

This returns the user if the credentials are right, and a 401 otherwise.

## Datasets

The dataset search, which the [dataset list](/dataset) of the user interface also uses, finds datasets by their metadata:

https://api.checklistbank.org/dataset?q=hobern

This finds datasets with Donald Hobern as an author or contributor.
The `q` parameter is a weighted full text search on the alias, title, description, creators, editors, publisher, keywords, identifiers and other metadata fields.
Data itself, e.g. scientific names, is not searched.

Popular dataset filters:

- `origin=project`: projects only. The [introduction](introduction#datasets) explains the different origins.
- `type=legal&type=phylogenetic`: datasets of type legal or phylogenetic
- `releasedFrom=3`: releases of project 3, the Catalogue of Life (COL)
- `contributesTo=3`: the sources of project 3
- `gbifKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c`: the dataset with the [GBIF key d7dddbf4-2cf0-4f39-9b2a-bb099caae36c](https://www.gbif.org/dataset/d7dddbf4-2cf0-4f39-9b2a-bb099caae36c)
- `gbifPublisherKey=7ce8aef0-9e92-11dc-8738-b8a03c50a862`: [datasets](/dataset?gbifPublisherKey=7ce8aef0-9e92-11dc-8738-b8a03c50a862) published in GBIF by [Plazi](https://www.gbif.org/publisher/7ce8aef0-9e92-11dc-8738-b8a03c50a862)
- `publisher=Plazi`: datasets with exactly this publisher name, ignoring case. https://api.checklistbank.org/dataset/publishers?q=plazi suggests publisher names.
- `group=insects`: datasets covering a [taxonomic group](https://api.checklistbank.org/vocab/taxgroup)
- `license`, `minSize`, `created`, `modified`, `issued`: further filters on the metadata
- `sortBy`: e.g. `title`, `created`, `size` or `relevance`, with `reverse=true` for the opposite order

We synchronise ChecklistBank with the [checklist datasets in GBIF]({{GBIF_URL}}dataset/search?type=CHECKLIST), so you have access to all these GBIF datasets from ChecklistBank.

### Latest release keys

Instead of a dataset key, the API also accepts a few aliases that find releases without knowing their key.
All you need is the key `{PROJECT_KEY}` of the [project](projects):

- `{PROJECT_KEY}LR`: the latest public release of a project, e.g. the latest COL checklist: https://api.checklistbank.org/dataset/3LR
- `{PROJECT_KEY}LXR`: the latest public extended release of a project, e.g. the latest COL XR: https://api.checklistbank.org/dataset/3LXR
- `{PROJECT_KEY}LRC` and `{PROJECT_KEY}LXRC`: the latest release candidate, which is still private and needs authentication
- `{PROJECT_KEY}R{ATTEMPT}`: the release of a project with the given import attempt, e.g. https://api.checklistbank.org/dataset/3R629

The annual editions of the Catalogue of Life can also be addressed by their year:

- `COL{YEAR}`: the annual COL checklist of the given year, e.g. https://api.checklistbank.org/dataset/COL2025

Datasets registered in GBIF can be addressed by their GBIF key: `gbif-{UUID}`, e.g. https://api.checklistbank.org/dataset/gbif-d7dddbf4-2cf0-4f39-9b2a-bb099caae36c

The aliases work in the path and in query parameters that take a dataset key, e.g. `sourceDatasetKey` or `releasedFrom`.
Projects are living datasets that change at any time, might temporarily hold duplicates or bad data, and have no stable identifiers.
For regular use please work with releases.

## Name usages

### Search

To search for a name usage in the annual COL checklist of 2025:

https://api.checklistbank.org/dataset/COL2025/nameusage/search?q=Abies

The search can be filtered and changed by many parameters, e.g.:

- `rank`, `minRank`, `maxRank`: https://api.checklistbank.org/dataset/COL2025/nameusage/search?q=Abies&rank=species
- `status`, `nomStatus`, `nameType`, `issue`, `extinct`, `environment`, `group`: filters on the usage and its name
- `taxonID`: only usages below the given taxon
- `content`: what to search in, `SCIENTIFIC_NAME`, `AUTHORSHIP` or `VERNACULAR_NAME`, the first two by default: https://api.checklistbank.org/dataset/COL2025/nameusage/search?q=Hobern&content=AUTHORSHIP
- `type`: how to search
  - `STANDARD`: matches the search terms against whole words and the beginning of words in the name, the default: https://api.checklistbank.org/dataset/COL2025/nameusage/search?q=Abi%20alb
  - `EXACT`: matches the entire search phrase to the entire scientific name: https://api.checklistbank.org/dataset/COL2025/nameusage/search?q=Abies%20alba&type=EXACT
  - `FUZZY`: allows for slightly misspelled names: https://api.checklistbank.org/dataset/COL2025/nameusage/search?q=Abies%20albus&type=FUZZY
- `sortBy`: `NAME`, `TAXONOMIC` or `RELEVANCE`
- `facet`: counts of the results per value of a field, e.g. `facet=rank&facet=status`

The search across all datasets works the same way: https://api.checklistbank.org/nameusage/search?q=Abies%20alba

A faster suggest service for a search box: https://api.checklistbank.org/dataset/COL2025/nameusage/suggest?q=Abies%20al

Vernacular names can be searched in an entire dataset, too:
https://api.checklistbank.org/dataset/COL2025/nameusage/search?content=VERNACULAR_NAME&rank=species&q=Eagle

### Taxon info

All information about a taxon, its synonyms, classification, vernacular names, distributions, references, media and more, e.g. for _Abies alba_ `8K9Y`:
https://api.checklistbank.org/dataset/COL2025/taxon/8K9Y/info

Each part is also available on its own, e.g. the vernacular names:
https://api.checklistbank.org/dataset/COL2025/taxon/8K9Y/vernacular

### Tree browsing

A specialised API supports navigating a taxonomic tree and implementing a tree browser.
The root taxa of the tree - or better forest:
https://api.checklistbank.org/dataset/COL2025/tree

All direct children of a taxon:
https://api.checklistbank.org/dataset/COL2025/tree/N/children

Some taxa have children of mixed ranks.
For these the tree API can create virtual placeholder nodes that group them by rank:
https://api.checklistbank.org/dataset/COL2025/tree/RT/children?insertPlaceholder=true

To open the tree at a given taxon, this lists its parent classification:
https://api.checklistbank.org/dataset/COL2025/tree/8K9Y

Our reusable [React Tree component](https://github.com/CatalogueOfLife/portal-components/blob/master/README.md#colbrowsertree) makes use of this API.

## Name matching

The name matching API matches names against any dataset in ChecklistBank.
It uses the [names index](names#names-index-and-matching) to find candidates and then compares their authorship, rank and classification.
There are resources for matching names one by one and in bulk.

The simple matching resource takes the name as `q` or `scientificName`:
https://api.checklistbank.org/dataset/3LR/match/nameusage?q=Abies%20alba

This matches against the [latest release](#latest-release-keys) of COL.
To match against other datasets, [search](/dataset) for the one you need.

An ambiguous name, e.g. a homonym, gives the match type `ambiguous` with the best candidate.
Add `verbose=true` to see the other candidates as alternatives:
https://api.checklistbank.org/dataset/3LR/match/nameusage?q=Oenanthe&verbose=true

Adding an authorship or a higher taxon helps to disambiguate in such a case:

- https://api.checklistbank.org/dataset/3LR/match/nameusage?q=Oenanthe&kingdom=Plantae
- https://api.checklistbank.org/dataset/3LR/match/nameusage?q=Oenanthe&authorship=L.

The query parameters of the simple match are:

- `id`
- `scientificName` (or `q`)
- `authorship`
- `code`
- `rank`
- `status`
- the higher taxa `superkingdom`, `kingdom`, `subkingdom`, `superphylum`, `phylum`, `subphylum`, `superclass`, `class`, `subclass`, `superorder`, `order`, `suborder`, `superfamily`, `family`, `subfamily`, `tribe`, `subtribe`, `genus`, `subgenus`, `section` and `species`

### Bulk matching

The [bulk matching](/tools/name-match) creates an asynchronous [job](#jobs), similar to downloads.
You must be authenticated to use it and get an email once it is done.
The names to match come either from

1. an uploaded `CSV` or `TSV` file with columns named like the query parameters above. It needs a `scientificName` column.
2. a dataset in ChecklistBank, optionally filtered to a subtree or ranks

A bulk matching request with a file looks like this:

```bash
curl -s --user USERNAME:PASSWORD -H "Content-Type: text/tsv" --data-binary @match.tsv -X POST "https://api.checklistbank.org/dataset/COL2025/match/nameusage/job"
```

with a `match.tsv` input file such as this one:

```
ID	rank	scientificName	authorship	kingdom
tp	phylum	Tracheophyta		Plantae
1	species	Abies alba	Mill.	Plantae
2	species	Poa annua	L.	Plantae
```

Query parameters for bulk matches:

- `format`: `CSV` or `TSV` for the result file, TSV by default
- `sourceDatasetKey`: a dataset in ChecklistBank as the source of the names to match, instead of a file
- `taxonID`: only match the names of the subtree of this taxon of the source dataset, e.g. a family
- `lowestRank`: the lowest rank of the names to match, e.g. `species` to ignore all infraspecific names

The response is a job with a key, see below for how to follow it and get the result.

## Jobs

Bulk matching, downloads and other long running tasks run as jobs.
A job is followed by its key:

- https://api.checklistbank.org/job/{KEY} gives its state while it is queued or running, and its result afterwards
- https://api.checklistbank.org/job/{KEY}.txt is its log
- https://api.checklistbank.org/job/{KEY}.zip redirects to the result file once the job is done

Jobs are kept for 90 days. Their result files are kept longer, but this might change in the future.
`GET /job/search` lists jobs, e.g. by `datasetKey`, `createdBy` or `status`, and `DELETE /job/{KEY}` cancels a queued or running job of your own.

## Downloads

All data in ChecklistBank can be [downloaded](introduction#downloads) in all supported [formats](formats).
A download is requested with a POST of an export request:

```bash
curl -s --user USERNAME:PASSWORD -H "Content-Type: application/json" -X POST "https://api.checklistbank.org/dataset/3LR/export" \
  -d '{"format": "DWCA", "root": {"id": "C7ZVG"}, "minRank": "species", "extended": true}'
```

This requests an extended Darwin Core Archive of the pine family Pinaceae down to species. The export request supports these properties:

- `format`: `COLDP` (default), `DWCA`, `ACEF`, `TEXT_TREE`, `NEWICK` or `DOT`
- `extended`: an extended download with all data, see [data content](formats#data-content)
- `classification`: a flat download with a denormalised classification
- `root`: only the subtree of this taxon, given by its `id`
- `minRank`: the lowest rank to include
- `synonyms`, `bareNames`, `extinct`: include synonyms (default true), bare names (default false), or only extinct or only extant taxa
- `tabFormat`: `TSV` (default) or `CSV`

The response is the key of the export, which is a [job](#jobs) like any other.
Downloads are cached: if the same download was made before for the same data, it is returned straight away.
Existing downloads are listed at https://api.checklistbank.org/export,
and https://api.checklistbank.org/dataset/3LR/export.zip?format=coldp redirects to the latest download of a dataset in a format, if there is one.

## Parsers

ChecklistBank exposes its parsers as a service, e.g. the name parser:

https://api.checklistbank.org/parser/name?q=Abies%20alba%20Mill.

which also takes the `authorship`, `rank` and `code` of a name.
The [name parser tool](/tools/name-parser) uses it, and [names](names#how-names-are-interpreted) explains how names are interpreted.

The values of controlled vocabularies can be parsed the same way, e.g. a rank:

https://api.checklistbank.org/parser/rank?q=sp.

All available parsers are listed at https://api.checklistbank.org/parser.
The parsers can also be used from OpenRefine, see [below](#openrefine-reconciliation).

## Names index

The [names index](names#names-index-and-matching) (nidx) gives every distinct canonical name found in any dataset an integer id,
so that names can be linked across datasets.
Use nidx ids only to link names within ChecklistBank and don't store them for long: a rebuild of the index assigns new ids to all names.

The metadata of the index with its id, creation date and size:
https://api.checklistbank.org/nidx/metadata

A names index entry with the full names matched to it and how often each of them occurs:
https://api.checklistbank.org/nidx/24074

```json
{
  "nidx": 24074,
  "normalizedName": "abies alb",
  "scientificName": "Abies alba",
  "labels": [
    { "label": "Abies alba Mill.", "count": 116 },
    { "label": "Abies alba (Aiton) Michx.", "count": 34 },
    { "label": "Abies alba", "count": 21 },
    { "label": "Abies alba (Aiton) Jess.", "count": 16 }
  ]
}
```

All usages of an entry across ChecklistBank with their classification. Deleted and temporary datasets and projects are left out:
https://api.checklistbank.org/nidx/24074/usages

The same usages through the name usage search:
https://api.checklistbank.org/nameusage?nidx=24074

Entries whose `scientificName` matches a regular expression anchored at the start of the name.
This searches the labels, not the normalized keys, so `Acer rubrum` does not find the entry labelled `Acer rubra`:
https://api.checklistbank.org/nidx/pattern?q=Abies%20alba

To find the entry for a given name, match the name against a dataset that contains it and read the `namesIndexId` of the result:
https://api.checklistbank.org/dataset/3LR/match/nameusage?q=Acer%20rubrum

In August 2026 the index lost its second tier of entries with authorship and rank.
`namesIndexId` now always points to a canonical entry, `/nidx/{id}/group` and the ID mapping exports `/nidx/export` were removed,
and `/nidx/match` is deprecated in favour of the [name matching](#name-matching) against a dataset.

## OpenRefine reconciliation

ChecklistBank exposes its name matcher, parsers and other services as an OpenRefine [Reconciliation Service](https://reconciliation-api.github.io/specs/0.2/),
so you can match a column of scientific names against any dataset in ChecklistBank and pull in extra columns, all without writing code.
Please read the [reconciliation guide](reconciliation) for details.

## Other resources

A few more resources that are worth knowing about:

- `/dataset/{key}/import`: the metrics of the imports of a dataset, or of the releases of a project, e.g. https://api.checklistbank.org/dataset/3LR/import?limit=1
- `/dataset/{key}/source`: the source datasets of a project or release, e.g. https://api.checklistbank.org/dataset/3LR/source
- `/dataset/{key}/sector` and `/dataset/{key}/decision`: the [sectors and decisions](projects) of a project or release, e.g. https://api.checklistbank.org/dataset/3LR/sector
- `/dataset/{key}/diff/{key2}`: a diff of the names of two datasets, as used by the [dataset comparison](/tools/dataset-comparison)
- `/vocab/identifier-scope`: the registry of [identifier scopes](identifiers#the-identifier-scope-registry)
- `/dataset/{key}/legacy`: the legacy Catalogue of Life webservice, deliberately slow
