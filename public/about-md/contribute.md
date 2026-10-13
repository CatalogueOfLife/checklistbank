## How to contribute

ChecklistBank wants to be an open platform for sharing data that helps
to discover and (re)use resources.
We welcome all datasets about global, regional or thematic taxonomies:
national faunas and floras, red lists, monographs, legal species lists and many more.

## Share your data

In order to share your data on ChecklistBank it needs to be in one of the [supported formats](formats). The preferred format is [ColDP](formats#catalogue-of-life-data-package-coldp), which is the most expressive and the closest to our internal data model.
Before you publish, the [archive validator](/tools/validator) checks an archive without creating a dataset.

Starting with version 3 you can also use GBIF's Integrated Publishing Toolkit ([IPT](https://www.gbif.org/ipt)) to create ColDP archives from your data.

### Registering a dataset

With your [GBIF account]({{GBIF_URL}}user/profile) you can [create a dataset](/newdataset) in ChecklistBank, author its metadata and publish updates of the data yourself.
The data of a dataset is imported in one of two ways:

- **upload** an archive on the metadata page of the dataset, whenever you have a new version
- give a **data access** URL in the dataset options from which ChecklistBank downloads the archive.
  The data is then reimported regularly, following the import frequency set in the options, and can also be reimported by hand at any time.

A new dataset is private, i.e. only visible to its editors, until it is made public.
Please choose an open [license](https://creativecommons.org/licenses/) for your data, as only openly licensed data can be used in projects like the Catalogue of Life.

Checklists published through GBIF need no registration: ChecklistBank syncs with the GBIF registry and imports them automatically, see the [introduction](introduction#datasets).

### Updates from GitHub

GitHub repositories are very well suited to host source data in ColDP or DwC archives if individual files do not exceed the 100MB limit.
Any changes to the data are versioned and GitHub automatically provides the files as a zip archive.

For datasets managed on GitHub, ChecklistBank offers a webhook, so that every commit triggers an import into ChecklistBank and the data is kept up to date in near real time.
To set it up:

- in ChecklistBank:
  - register the dataset and note its DATASET_KEY
  - set its access URL to the zip archive of the repository, e.g. https://github.com/CatalogueOfLife/data-vespoidea/archive/refs/heads/master.zip
- in GitHub:
  - add a webhook in the repository settings with the payload URL `https://api.checklistbank.org/importer/{DATASET_KEY}/github` and the content type `application/json`
  - use the secret that the ChecklistBank admins hand over to you confidentially. Please request it from mdoering {at} gbif.org

### Becoming a source of a project

Datasets in ChecklistBank can be used as sources of [projects](projects), e.g. of the Catalogue of Life.
Please contact the editors of a project if you would like your dataset to become part of it.

## ColDP publishing guidelines

The rest of this guide helps in publishing ColDP data by giving concrete examples for various cases.
It should be seen as the intended way of using ColDP when there seemingly are several ways of expressing the same thing.
How ChecklistBank interprets the published names is explained on the [names](names) page.

## Information priorities

ColDP covers a range of entities and for names, references and usages also provides alternative representations, mostly parsed and unparsed, one can choose from. The information to be shared with ChecklistBank can be prioritized like the following, using only the simpler [NameUsage](https://catalogueoflife.github.io/coldp/#nameusage) entity instead of Name, Taxon & Synonym.

### Minimal information

- [NameUsage](https://catalogueoflife.github.io/coldp/#nameusage)
  - ID
  - scientificName
  - authorship
  - rank
  - status
  - parentID OR kingdom|phylum|class|order|family|genus

### Highly recommended information

- [NameUsage](https://catalogueoflife.github.io/coldp/#nameusage)
  - basionymID
  - publishedInID
  - extinct
  - environment
  - link
- [Reference](https://catalogueoflife.github.io/coldp/#reference)
  - ID
  - citation
  - DOI
  - link

### Desired information

- [NameUsage](https://catalogueoflife.github.io/coldp/#nameusage)
  - code
  - publishedInPageLink
  - gender
  - genderAgreement
- [NameRelation](https://catalogueoflife.github.io/coldp/#namerelation)
  - nameID
  - relatedNameID
  - type
- [TypeMaterial](https://catalogueoflife.github.io/coldp/#typematerial)
  - nameID
  - citation
  - status
  - link
- [VernacularName](https://catalogueoflife.github.io/coldp/#vernacularname)
  - taxonID
  - name
  - language
- [Media](https://catalogueoflife.github.io/coldp/#media)
  - taxonID
  - url
  - type
  - license
  - creator
- [Distribution](https://catalogueoflife.github.io/coldp/#distribution)
  - taxonID
  - areaID
  - area
  - gazetteer
  - establishmentMeans

### Optional information

Anything else not mentioned above including [Treatments](https://catalogueoflife.github.io/coldp/#treatment), [Author](https://catalogueoflife.github.io/coldp/#author), [SpeciesInteraction](https://catalogueoflife.github.io/coldp/#speciesinteraction) and [TaxonProperty](https://catalogueoflife.github.io/coldp/#taxonproperty) which can be used to share any other information about a taxon.

## Names

Scientific names can be provided either as a simple pair of `rank`, `scientificName` and `authorship`
or as a more structured, parsed version supplying individual name parts in dedicated fields that often depend on the rank of the name.
The simple version is always an option, but requires a consumer like ChecklistBank to parse the name into atoms.
This works in 99.99% of names, but can lead to unexpected results in rare, special cases.
The following examples therefore focus on how to provide names as proper parsed names already, so there is no need to further interpret them.

In addition to parsed names, the authorship can also be broken down into individual parts, i.e. authors
including even identifiers for individual authors. See the [parsed authorship examples](#parsed-authorships) below for more details.

### Binomials

A regular species name like `Abies alba Mill.` should be given as:

```
rank: species
genus: Abies
specificEpithet: alba
authorship: Mill.
```

### Infraspecific names

Infraspecific names like `Abies alba subsp. apennina Brullo, Scelsi & Spamp.` should be given as

```
rank: subspecies
genus: Abies
specificEpithet: alba
infraspecificEpithet: apennina
authorship: Brullo, Scelsi & Spamp.
```

There should be no rank marker given as part of the infraspecificEpithet, just the name part on its own.
Note that botanical and zoological names prefer a different rendering of subspecies, but the atomised names look just the same.
Consider the zoological subspecies `Delphinus delphis ponticus Barabash, 1935`:

```
rank: subspecies
genus: Delphinus
specificEpithet: delphis
infraspecificEpithet: ponticus
authorship: Barabash, 1935
```

For consumers like ChecklistBank to render the name correctly it is recommended to supply also a [nomenclatural code value](https://api.checklistbank.org/vocab/nomcode):

```
code: zoological
```

In many cases the code is the same for all names of an entire dataset.
In Checklistbank this can be configured as [dataset options](https://www.checklistbank.org/dataset/2371/options) as a dataset wide default value.

Different ranks like the form `Abies alba f. compacta (Parsons) Rehder` also follow the same scheme:

```
rank: forma
genus: Abies
specificEpithet: alba
infraspecificEpithet: compacta
authorship: (Parsons) Rehder
```

Some publications include infraspecific names with more than 3 name parts and various authorships, e.g. a variety that also includes the subspecies:
`Draba bruniifolia Steven subsp. heterocoma (Fenzl) Coode & Cullen var. nana (Stapf) O.E. Schulz ex Coode & Cullen`

These are not properly formed names according to the codes and only the terminal infraspecific epithet and authorship should in those cases be given:

```
rank: variety
genus: Draba
specificEpithet: bruniifolia
infraspecificEpithet: nana
authorship: (Stapf) O.E. Schulz ex Coode & Cullen
```

### Infrageneric names

Infrageneric names like a subgenus on the other hand are frequently classified into a genus and should _not_ be using the uninomial field.
Instead there is a dedicated `infragenericEpithet` that optionally can be accompanied by the genus field.
`Lasiurus (Aeorestes) (Geoffroy St.-Hilaire, 1806)`:

```
rank: subgenus
genus: Lasiurus
infragenericEpithet: Aeorestes
authorship: (Geoffroy St.-Hilaire, 1806)
code: zoological
```

Again infrageneric names are rendered differently between codes, so having an explicit code value given is recommended.
If no genus is known, an unplaced subgenus should also be given using `infragenericEpithet`:

```
rank: subgenus
infragenericEpithet: Aeorestes
authorship: (Geoffroy St.-Hilaire, 1806)
```

The species name for the bat `Lasiurus (Aeorestes) villosissimus (Geoffroy St.-Hilaire, 1806)` can also be given with an infrageneric name:

```
rank: species
genus: Lasiurus
infragenericEpithet: Aeorestes
specificEpithet: villosissimus
authorship: (Geoffroy St.-Hilaire, 1806)
code: zoological
```

Similar botanical sections such as `Lilium sect. Martagon Rchb.` are given as:

```
rank: section
genus: Lilium
infragenericEpithet: Martagon
authorship: Rchb.
code: botanical
```

### Genera

Parsed genus names should be supplied using the `uninomial` field just as suprageneric names.
The `genus` field is reserved only for classifying a species or infrageneric name, but not for standalone genera like `Puma Jardine, 1834`:

```
rank: genus
uninomial: Puma
authorship: Jardine, 1834
```

### Families and other suprageneric names

Families and higher ranked names are given as uninomials just like a genus. E.g. the family `Asteraceae Bercht. & J.Presl`

```
rank: family
uninomial: Asteraceae
authorship: Bercht. & J.Presl
```

### Cultivars

Similar to infraspecific names cultivars according to the [International Code of Nomenclature for Cultivated Plants](https://www.ishs.org/sites/default/files/static/ScriptaHorticulturae_18.pdf)
have their own field to capture the cultivar name:
`Chamaecyparis lawsoniana 'Golden Wonder'`

```
rank: cultivar
genus: Chamaecyparis
specificEpithet: lawsoniana
cultivarEpithet: Golden Wonder
code: cultivars
```

Cultivar Groups are treated the same way just with a different rank.
The rank marker "Group" is not mentioned again in the epithet field:
`Brassica oleracea Capitata Group`

```
rank: cultivar group
genus: Brassica
specificEpithet: oleracea
cultivarEpithet: Capitata
code: cultivars
```

### Hybrids

There are two kind of hybrids that are syntactically very different.
**Hybrid formulas** are combinations of several names and currently cannot be represented in a parsed way in ColDP.
Names such as `Festuca pratensis × Lolium perenne` should be given as simple names only:

```
scientificName: Festuca pratensis × Lolium perenne
```

**Named hybrids** or notho taxa on the other hand are very much structured like regular Linnean names and can be represented as parsed ColDP names.
For example the hybrid `Lolium multiflorum × Schedonorus arundina`
has been described as the nothospecies `×Schedolium krasanii H. Scholz`.
The hybrid marker should be preserved as a prefix in the respective epithet field using the true multiplication sign.
In addition the `notho` field should record which part of the name carries the hybrid marker — here the `generic` epithet:

```
rank: species
genus: ×Schedolium
specificEpithet: krasanii
notho: generic
code: botanical
```

### Molecular names (OTU)

Molecular Operational Taxonomic Units (OTUs) are clusters of sequences that stand in for a species which has no Linnean name yet. They are identified by a stable, machine-issued code rather than a scientific name, for example a [BOLD](https://www.boldsystems.org) Barcode Index Number `BOLD:AAA0001` or a [UNITE](https://unite.ut.ee) species hypothesis `SH1533409.08FU`. The name parser recognises such codes as the name type `otu` and does not attempt to break them into name parts.

Provide the identifier verbatim as the `scientificName` and leave all parsed name fields (`genus`, `specificEpithet`, …) empty. As an OTU represents a putative species it is usually given the rank `species`; no nomenclatural `code` applies.

```
scientificName: BOLD:AAA0001
rank: species
```

### Informal names

Informal names are semi parsable names, often provisional designations that are not (yet) formally published under any nomenclatural code, e.g. `Drosophila sp.`, `Aus sp. nov.`, `Bus sp. A` or `Cus aff. bus`. The parser classifies these as the name type `informal`.
They often use the `namePhrase` field to append any unstructured name part, often after an initial genus which is parsed out.

Give the entire string as the `scientificName` and do **not** atomise it — in particular never move the open-nomenclature qualifier (`sp.`, `cf.`, `aff.`, `sp. nov.`) into an epithet field. 
You may still set the `rank` and the classifying `genus` so the name sorts and groups correctly:

```
scientificName: Drosophila sp. nov. DROS-42
rank: species
genus: Drosophila
```

### Placeholders

Placeholder strings such as `Incertae sedis`, `Not assigned`, `awaiting allocation`, `unknown`, `unknown Asteraceae` or a bare `?` are not names at all. The parser flags them as the type `placeholder` (or `no name`) and ChecklistBank will not treat them as proper names.

Do not publish placeholder taxa. *Incertae sedis* is best expressed by attaching the uncertain children directly to the lowest parent that **is** certain — the missing intermediate rank already conveys the uncertainty. For example, if a genus cannot be placed in a family, link it straight to the order instead of inventing an `Incertae sedis` family node.

If your source groups unplaced taxa under such a placeholder, drop the placeholder during conversion and re-parent its children to the placeholder's own parent. This keeps the classification clean and avoids the meaningless, duplicated nodes that every dataset would otherwise contribute.

## Parsed authorships

Instead of a single authorship string there are several individual properties that can be used to break down the string:

- combinationAuthorship
- combinationAuthorshipID
- combinationExAuthorship
- combinationExAuthorshipID
- combinationAuthorshipYear
- basionymAuthorship
- basionymAuthorshipID
- basionymExAuthorship
- basionymExAuthorshipID
- basionymAuthorshipYear

Apart from the year all other fields can be a `|` concatenated list of values.
For example `Abies alba subsp. apennina Brullo, Scelsi & Spamp.` could be given as

```
rank: subspecies
genus: Abies
specificEpithet: alba
infraspecificEpithet: apennina
combinationAuthorship: Brullo|Scelsi|Spamp.
combinationAuthorshipID: 13165-1|36267-1|27048-1
```

with these entries in the Author table:

```
ID: 13165-1
given: Brullo
family: Brullo
abbreviationBotany: Brullo
sex: male
birth: 1947
country: Italy
link: https://www.ipni.org/a/13165-1

ID: 36267-1
given: Fabrizio
family: Scelsi
abbreviationBotany: Scelsi
sex: male
country: Italy
link: https://www.ipni.org/a/36267-1

ID: 27048-1
given: Giovanni
family: Spampinato
abbreviationBotany: Spamp.
sex: male
birth: 1958
link: https://www.ipni.org/a/27048-1
```

## Name relations

Relationships between two names are captured in the [NameRelation](https://catalogueoflife.github.io/coldp/#namerelation) table, linking a `nameID` to a `relatedNameID` with a `type` from the [nomRelType vocabulary](https://api.checklistbank.org/vocab/nomreltype): `spelling correction`, `basionym`, `based on`, `replacement name`, `conserved`, `later homonym`, `superfluous`, `homotypic` and `type`.

Relations are directional. For a `later homonym`, for example, the `nameID` is the junior (later) homonym and the `relatedNameID` the senior one it is blocked by.

### Basionyms or original names

The original combination (basionym) of a name is important enough to have a dedicated `basionymID` field on the [NameUsage](https://catalogueoflife.github.io/coldp/#nameusage) (or Name) pointing at the name that is the original combination:

```
ID: name-2
scientificName: Aus bus
basionymID: name-1
```

A basionym is a terminal relationship and must not be chained — the original name itself should carry no further `basionymID` (it may point to itself). The same information can alternatively be expressed as a [NameRelation](https://catalogueoflife.github.io/coldp/#namerelation) with `type=basionym`, but the field is preferred for its simplicity.

Do **not** use `basionymID` for replacement names (*nomina nova*) that were coined to replace e.g. a homonym and therefore carry a different epithet. Use a [NameRelation](https://catalogueoflife.github.io/coldp/#namerelation) with `type=replacement name` instead.

## Taxon concepts

A taxon is more than its name — it is a name *used in the sense of* a particular author. Make that concept explicit with the [Taxon/NameUsage](https://catalogueoflife.github.io/coldp/#nameusage) fields:

- `accordingToID` — a Reference for the publication that defined the concept. ChecklistBank renders the name qualified as `sensu AUTHOR, YEAR`.
- `namePhrase` — a free phrase appended to the name for this taxon only, e.g. `sensu lato`.
- `scrutinizer`, `scrutinizerID` (ideally an [ORCID](https://orcid.org)) and `scrutinizerDate` — who last reviewed the concept and when.

### accordingTo

`accordingToID` should reference the publication that establishes the taxonomic *concept* — not the nomenclatural protologue, which belongs in `publishedInID`. Misapplied names that trace to a single publication should likewise use `accordingToID` to point at the source of the misapplication.

```
ID: tax-1
scientificName: Aus bus
status: accepted
accordingToID: ref-42
```

## References

Bibliographic sources live in the [Reference](https://catalogueoflife.github.io/coldp/#reference) table, each with at least an `ID` and a `citation`, ideally also a `DOI` and `link`. Other records then refer to them by ID:

- `publishedInID` on a name → the protologue / original publication, optionally with `publishedInPage` and `publishedInPageLink`.
- `accordingToID` on a taxon → the publication defining the taxonomic concept (see above).
- `referenceID` on a taxon → a list of further references supporting the concept. The same field exists on Distribution, VernacularName, TypeMaterial and other entities. See the ColDP [best practices](https://catalogueoflife.github.io/coldp/#best-practices) for how to concatenate multiple values.

Instead of the tabular reference file you can also ship your references in the native format of your reference manager: a [`reference.bib`](https://catalogueoflife.github.io/coldp/#reference-bibtex) BibTeX file or a [`reference.json`](https://catalogueoflife.github.io/coldp/#reference-json-csl) CSL-JSON file (a `reference.jsonl` [JSON Lines](https://jsonlines.org/) variant works too for large lists). The `ID` used to link from names and taxa is the BibTeX citation key, respectively the CSL-JSON `id`. BibTeX or CSL-JSON for a known DOI can be fetched straight from CrossRef:

```
curl -sL -H "Accept: application/x-bibtex" https://doi.org/10.1080/11035890601282097
```
