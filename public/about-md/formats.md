## Data Formats

ChecklistBank supports a variety of formats for both uploads and downloads.

- [ColDP](#catalogue-of-life-data-package-coldp)
- [DwC-A](#darwin-core-archive-dwc-a)
- [TextTree](#texttree)
- [ACEF](#annual-checklist-exchange-format-acef)
- [Excel](#excel)
- [Newick](#newick)
- [DOT](#dot)

See also [ChecklistBank specific columns](#checklistbank-specific-columns) for the few non standard columns found in downloads.

## Data Content

For downloads most formats support 2 flavors, a `simple` and an `extended` version.
ColDP and DwC-A offer a third, `flat` flavor.
To save us space and processing, ChecklistBank defaults to the simple flavor unless another one was specifically requested.
The simple flavor includes the classification in a parent-child form and does not include a flat, denormalised classification.

The `flat` flavor is a simple download with an additional flat, denormalised classification.
It consists of a single `dataset-{key}.tsv` file with one row per name usage that keeps the parent-child columns and adds a column for each of the major higher ranks and the taxonomic group.
DwC-A flat downloads also include `dwc:higherClassification` with the names of all parents.
The parent-child hierarchy remains the more complete classification: higher taxa at ranks without their own column, e.g. superorders, infraorders or unranked clades, are only found in it.

The `simple` downloads only include very basic information: the scientific name, authorship, rank, status, code, the next higher parent and the extinct flag.

The `extended` format exports all available information including distributions, vernacular names, type material, treatment documents, references, etc.
It is rather resource intensive to create, so please only use it when needed.

## ChecklistBank specific columns

Downloads use the terms defined by the chosen format.
The header row gives every column with its namespace prefix, e.g. `col:ID` or `col:scientificName` in ColDP and `dwc:taxonID` in DwC-A.
In a few places ChecklistBank adds its own terms with the `clb:` prefix and the namespace `http://rs.checklistbank.org/terms/`:

| Column | Found in | Description |
| --- | --- | --- |
| `clb:merged` | last column of every data file in **extended** ColDP and DwC-A downloads and in name search downloads | Boolean flag for records in projects and releases. `true` if the record was added by a sector in merge mode or was created by ChecklistBank when grouping homotypic names. `false` if it came from a sector in any other mode. Empty for records that do not belong to any sector, e.g. records created by an editor. |
| `clb:taxGroup` | **flat** ColDP and DwC-A downloads | The taxonomic group of the record, based on the name, its classification, typical name endings for some ranks and the style of the authorship. Empty if the group could not be determined. |

The taxonomic group values come from the [taxGroup vocabulary](https://api.checklistbank.org/vocab/taxgroup), written in lower case.
There are no other `clb:` columns in ChecklistBank downloads.

Besides the data files, an extended download also includes:

- `metadata.yaml` (ColDP) or `eml.xml` (DwC-A) with the dataset metadata
- `logo.png` if the dataset has a logo
- metadata for each source dataset of a project or release, in the `source` folder (ColDP) or `dataset` folder (DwC-A)
- for ColDP, all references also as `reference.bib` (BibTeX), `reference.json` and `reference.jsonl` (CSL-JSON)
- for ColDP, a `treatments` folder with one file per treatment document, if the dataset has treatments

## Catalogue of Life Data Package (ColDP)

The recommended exchange format for submitting data to and downloading data from ChecklistBank
is the [Catalogue of Life Data Package](https://catalogueoflife.github.io/coldp) (ColDP),
a tabular text format with a standard set of files and columns and it is inspired by [Frictionless Data](https://frictionlessdata.io/).
The format is a single ZIP archive that bundles various delimited text files:

- [Name](https://catalogueoflife.github.io/coldp/#name)
- [Author](https://catalogueoflife.github.io/coldp/#author)
- [NameRelation](https://catalogueoflife.github.io/coldp/#namerelation)
- [Taxon](https://catalogueoflife.github.io/coldp/#taxon)
- [Synonym](https://catalogueoflife.github.io/coldp/#synonym)
- [NameUsage](https://catalogueoflife.github.io/coldp/#nameusage)
- [TaxonProperty](https://catalogueoflife.github.io/coldp/#taxonproperty)
- [TaxonConceptRelation](https://catalogueoflife.github.io/coldp/#taxonconceptrelation)
- [SpeciesInteraction](https://catalogueoflife.github.io/coldp/#speciesinteraction)
- [SpeciesEstimate](https://catalogueoflife.github.io/coldp/#speciesestimate)
- [Reference](https://catalogueoflife.github.io/coldp/#reference)
- [TypeMaterial](https://catalogueoflife.github.io/coldp/#typematerial)
- [Distribution](https://catalogueoflife.github.io/coldp/#distribution)
- [Media](https://catalogueoflife.github.io/coldp/#media)
- [VernacularName](https://catalogueoflife.github.io/coldp/#vernacularname)
- [Treatments](https://catalogueoflife.github.io/coldp/#treatment)

A [metadata.yaml](https://catalogueoflife.github.io/coldp/metadata.yaml) file should also be included to provide basic metadata about the entire dataset.
For sharing structured bibliographic references the [BibTex](https://catalogueoflife.github.io/coldp/#reference-bibtex)
and [CSL-JSON](https://catalogueoflife.github.io/coldp/#reference-json-csl) format is also supported.

The ColDP format was developed to overcome limitations in existing formats for sharing taxonomic information, particularly Darwin Core Archives and the Annual Checklist Exchange Format used previously in COL.

We recommend to read the [format specifications](https://catalogueoflife.github.io/coldp/) and the [ColDP publishing guidelines](https://catalogueoflife.github.io/coldp/docs/publishing-guide.html).

## Darwin Core Archive (DwC-A)

Darwin Core Archive (DwC-A) is a standard for biodiversity informatics data that makes use of the [Darwin Core](https://dwc.tdwg.org/list/) terms to produce a single, self-contained dataset for sharing taxonomic (checklist), species-occurrence or sampling-event data.
Similar to ColDP these archives package up column separated files, e.g. CSV or TAB delimited files, but are restricted by a _star schema_ that especially limits sharing of structured references. Only Taxon core [DwC archives known as checklists](https://github.com/gbif/ipt/wiki/BestPracticesChecklists) are supported in ChecklistBank.
The format is defined in the [Darwin Core Text Guidelines](https://dwc.tdwg.org/text/) (GBIF 2017).

Darwin Core checklist archives may include one or many data files, depending on the scope of the dataset published. As a minimum, they should include the required core dwc:Taxon data file with values for a standard set of Darwin Core terms. For checklist data, each record should include an identifier supplied as dwc:taxonID. The definitive list of core Taxon terms can be found in the [Darwin Core Taxon Extension](http://rs.gbif.org/core/dwc_taxon_2015-04-24.xml). For more information about preparation of a DwC-A, please refer to the GBIF [DwC-A How-to Guide](https://github.com/gbif/ipt/wiki/DwCAHowToGuide).

ChecklistBank currently interprets the following DwC extensions:

- [dwc:MeasurementOrFact](https://rs.gbif.org/extension/measurements_or_facts_2024-02-19.xml)
- [eol:Media](https://rs.gbif.org/extension/eol/media_extension.xml)
- [eol:Reference](https://rs.gbif.org/extension/eol/reference_extension.xml)
- [gbif:Description](https://rs.gbif.org/extension/gbif/1.0/description.xml)
- [gbif:Distribution](https://rs.gbif.org/extension/gbif/1.0/distribution.xml)
- [gbif:Identifier](https://rs.gbif.org/extension/gbif/1.0/identifier.xml)
- [gbif:Multimedia](https://rs.gbif.org/extension/gbif/1.0/multimedia.xml)
- [gbif:References](https://rs.gbif.org/extension/gbif/1.0/references.xml)
- [gbif:SpeciesProfile](https://rs.gbif.org/extension/gbif/1.0/speciesprofile.xml)
- [gbif:TypesAndSpecimen](https://rs.gbif.org/extension/gbif/1.0/typesandspecimen.xml)
- [gbif:VernacularName](https://rs.gbif.org/extension/gbif/1.0/vernacularname.xml)
- [col:NameRelation](https://rs.gbif.org/sandbox/extension/col-name-relation.xml) which mimicks the [ColDP name relation](https://github.com/CatalogueOfLife/coldp/blob/master/README.md#namerelation) entity.

Note that not all terms of the above extensions will be consumed at this stage.
Data from all other DwC extensions is available via the [verbatim browser](https://www.checklistbank.org/dataset/1010/verbatim) though (the link shows FishBase as an example).

### EML COL metadata

In addition to the GBIF EML profile COL supports a few custom properties inside the `<additionalMetadata>` block
which are defined in the ColDP [metadata.yaml](https://github.com/CatalogueOfLife/coldp/blob/master/metadata.yaml) profile and missing from regular EML files:

```
<dataset>
  ...
  <additionalMetadata>
    <metadata>
      <gbif>...</gbif>
      <col>
        <confidence>5</confidence>
        <completeness>95</completeness>
        <version>v.48 (06/2018)</version>
        <feedbackUrl>https://github.com/CatalogueOfLife/data/issues</feedbackUrl>
      </col>
    </metadata>
  </additionalMetadata>
</dataset>
```

## Annual Checklist Exchange Format (ACEF)

The previous data format used by COL, the Annual Checklist Exchange Format (ACEF), can still be used to submit data as a zipped archive, although the new ColDP format is recommended. ACEF focuses on species information and is very limited when it comes to higher taxa and nomenclature.
The [ACEF format](/docs/acef/2014_CoL_Standard_Dataset_v7_23Sep2014.pdf) includes several tables with pre-defined fields ([list of tables and fields](/docs/acef/List_of_tables_and_fields_2014.pdf), [entity relationship diagram](/docs/acef/ERD_DataSubmissionFormat_29Sep2014.pdf)). The September 2014 version is the latest release.

## TextTree

[TextTree](https://github.com/gbif/text-tree) is a simple format to represent taxonomic trees using indented, plain text. Each row in a TextTree represent a scientific name. Each name can include the authorship and should be given a rank following the name in angular brackets. Synonyms are represented as direct, nested children that are prefixed by a `=` or `≡` (homotypic) character. The format focuses on the tree, is very human readable and lightweight. ChecklistBank archives every version of imported datasets as TextTree files which then drives various diff tools.

A `simple` TextTree download only contains the names, their rank and the tree.
Synonyms are prefixed with `=`, basionyms additionally with `$`, extinct taxa with `†` and provisionally accepted ones with `?`:

```
Pinales [order]
  Pinaceae Spreng. [family]
    Abies Mill. [genus]
      Abies alba Mill. [species]
        =Pinus picea L. [species]
      Abies balsamea (L.) Mill. [species]
        =$Pinus balsamea L. [species]
```

An `extended` download adds the ID of every name and further information as key value pairs in curly brackets:
the nomenclatural code (`CODE`), the publishedIn reference (`PUB`), further references (`REF`), environments (`ENV`), the temporal range (`CHRONO`),
vernacular names (`VERN`), distributions with a standard area code (`DIST`), a link (`LINK`) and `MERGED=true` for records added by a merge sector.
Remarks follow as a `#` comment:

```
Pinales [order] {ID=623 CODE=BOTANICAL}
  Pinaceae Spreng. [family] {ID=625 CODE=BOTANICAL}
    Abies Mill. [genus] {ID=3HKC CODE=BOTANICAL}
      Abies alba Mill. [species] {ID=4QHKG CODE=BOTANICAL PUB=R12 ENV=TERRESTRIAL VERN=deu:Weißtanne,eng:European silver fir DIST=iso:de:native,iso:fr:native}
        =Pinus picea L. [species] {ID=6Y3TS CODE=BOTANICAL}
      Abies balsamea (L.) Mill. [species] {ID=4QHKH CODE=BOTANICAL ENV=TERRESTRIAL VERN=eng:balsam fir DIST=iso:ca:native,iso:us:native} # the most common fir in eastern Canada
        =$Pinus balsamea L. [species] {ID=6Y3TT CODE=BOTANICAL PUB=R7}
```

For a little more expressiveness we provide a small [publishing guide for TextTree](https://catalogueoflife.github.io/coldp/docs/publishing-guide-txtree) based datasets which defines a small set of info keys and also a way to share structured references,
turning the simple tree file into a small checklist archive.

## Excel

ChecklistBank supports the upload and download of Excel spreadsheets as a variant for the ColDP and DwC-A formats.
Worksheets with a header row are used instead of CSV files to represent a single entity like Taxon or VernacularName.

Excel restricts the maximum amount of records to just above 1 million, so spreadsheets cannot be used to download the entire COL checklist.

## Newick

The [Newick](https://en.wikipedia.org/wiki/Newick_format) format is a way of representing graph-theoretical trees with edge lengths using parentheses and commas.
It is often used with phylogenetic data.
The New Hampshire eXtended format (which COL implements) uses Newick comments to encode additional key value pairs, i.e. the id, scientificName and rank specifically:

- `:ND=` [string] node identifier - if this is being used, it has to be unique within each phylogeny
- `:S=` [string] species name of the species/phylum at this node
- `:R=` [string] rank

## DOT

[Graphviz DOT](http://www.graphviz.org/doc/info/lang.html) is a simple widely used format for representing graphs as nodes and edges.
ChecklistBank exports will include synonym and basionym relations in the final graph that can be rendered with many software tools.

## General file recommendations

For all text files we strongly recommend to use the `UTF-8` character encoding.

- If in doubt, prefer tab separated **TSV files** over CSV files
- Do not quote values e.g. by using a quotation mark which is common for CSV files
- Make sure to **replace all TAB characters** by a simple spaces
- Use a **header row**
- **NULL values** should be given as an **empty string**, not `\N` or `NULL`
- **boolean** values should be encoded either as `0`/`1` or `false`/`true`
- **decimals** should follow the international convention and use a dot as the decimal separator (not a comma) and no thousands separator at all
- **dates** should be given as ISO 8601 strings, e.g. 1978-03-21
- **multivalues** should be delimited with a simple comma if possible, e.g. `freshwater, brackish`
