## Data Formats

ChecklistBank supports a variety of formats for both uploads and downloads.

- [ColDP](#catalogue-of-life-data-package-coldp)
- [DwC-A](#darwin-core-archive-dwc-a)
- [TextTree](#texttree)
- [ACEF](#annual-checklist-exchange-format-acef)
- [Excel](#excel)
- [Newick](#newick)
- [DOT](#dot)

## Data Content

For downloads most formats support 2 flavors, a `simple` and an `extended` version.
To save us space and processing, ChecklistBank defaults to the simple flavor unless the extended was speficially requested.
The simple flavor includes the classification in a parent-child form and does not include a flat, denormalised classification.
For an additional flat classification to be included you can turn on the classification box.

The `simple` downloads only include very basic information: the scientific name, authorship, rank, status, code, the next higher parent and the extinct flag.

The `extended` format exports all available information including distributions, vernacular names, type material, treatment documents, references, etc.
It is rather resource intensive to create, so please only use it when needed.

## Catalogue of Life Data Package (ColDP)

The recommended exchange format for submitting data to and downloading data from ChecklistBank
is the [Catalogue of Life Data Package](hhttps://catalogueoflife.github.io/coldp) (ColDP),
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

Darwin Core Archive (DwC-A) is a standard for biodiversity informatics data that makes use of the [Darwin Core](https://dwc.tdwg.org/list/) terms to produce a single, self-contained dataset for sharing species-level (checklist) data, species-occurrence data or sampling-event data. Each archive contains a set of text files, in standard comma- or tab-delimited format, along with a simple descriptor file (_meta.xml_) to document how the files are organised. The format is defined in the [Darwin Core Text Guidelines](https://dwc.tdwg.org/text/) (GBIF 2017).

Darwin Core Archives may include one or many data files, depending on the scope of the dataset published. As a minimum, they should include a required core data file with values for a standard set of Darwin Core terms. For checklist data, each record should include an identifier supplied as dwc:taxonID. The definitive list of core Taxon terms can be found in the [Darwin Core Taxon Extension](http://rs.gbif.org/core/dwc_taxon_2015-04-24.xml). For more information about preparation of a DwC-A, please refer to the GBIF [DwC-A How-to Guide](https://github.com/gbif/ipt/wiki/DwCAHowToGuide).

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

Note that not all terms of the above extensions will be consumed at this stage.
Data from all other DwC extensions is available via the [verbatim browser](https://www.checklistbank.org/dataset/1010/verbatim) though.

## Annual Checklist Exchange Format (ACEF)

The previous data format used by COL, the Annual Checklist Exchange Format (ACEF), can still be used to submit data,
although the new ColDP format is recommended.
The [ACEF format](/docs/acef/2014_CoL_Standard_Dataset_v7_23Sep2014.pdf) includes several tables with pre-defined fields ([list of tables and fields](/docs/acef/List_of_tables_and_fields_2014.pdf), [entity relationship diagram](/docs/acef/ERD_DataSubmissionFormat_29Sep2014.pdf)). The September 2014 version is the latest release.

## TextTree

[TextTree](https://github.com/gbif/text-tree) is a simple format to represent taxonomic trees using indented, plain text. Each row in a TextTree represent a scientific name. Each name can include the authorship and should be given a rank following the name in angular brackets. Synonyms are represented as direct, nested children that are prefixed by a `=` or `≡` (homotypic) character. The format focuses on the tree, is very human readable and lightweight. ChecklistBank archives every version of imported datasets as TextTree files which then drives various diff tools.

For a little more expressiveness we provide a small [publishing guide for TextTree](https://catalogueoflife.github.io/coldp/docs/publishing-guide-txtree) based datasets which defines a small set of info keys and also a way to share structured references,
turning the simple tree file into a small checklist archive.

## Excel

ChecklistBank supports the upload and download of Excel spreadsheets as a variant for the ColDP and DwC-A formats.
Worksheets with a header row are used instead of CSV files to represent a single entity like Taxon or VernacularName.

Excel restricts the maximum amount of records to just above 1 million, so spreadsheets cannot be used to download the entire COL checklist.

## Newick

[Newick](https://en.wikipedia.org/wiki/Newick_format) format is a way of representing graph-theoretical trees with edge lengths using parentheses and commas.
It is often used with phylogenetic data.
The New Hampshire eXtended format (which COL implements) uses Newick comments to encode additional key value pairs, e.g. the id, scientificName ond rank.

## DOT

[Graphviz DOT](http://www.graphviz.org/doc/info/lang.html) is a simple widely used format for representing graphs as nodes and edges.
ChecklistBank exports will include synonym and basionym relations in the final graph that can be rendered with many software tools.
