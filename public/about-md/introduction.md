## Introduction to ChecklistBank

ChecklistBank (CLB) is a repository for taxonomic datasets of various kinds that allows users to [publish](contribute), discover, use and manage such lists in a variety of [formats](formats).

ChecklistBank is hosted by [GBIF](https://www.gbif.org) and developed jointly by GBIF and the [Catalogue of Life](https://www.catalogueoflife.org).
The source code for the [backend (Java)](https://github.com/CatalogueOfLife/backend) and [frontend (JS React)](https://github.com/CatalogueOfLife/checklistbank) is managed on GitHub and we welcome software contributions.
The software is an evolution of the one that drives the [GBIF species API](https://www.gbif.org/species/search?advanced=1), which internally was also called [checklist bank](https://github.com/gbif/checklistbank).

You can learn more about ChecklistBank in our [user tutorial](https://docs.gbif.org/course-checklistbank-tutorial/)
and [project tutorial](https://docs.gbif.org/course-checklistbank-project/).

## Datasets

The main entry point to ChecklistBank is the [dataset search](/dataset), where all registered datasets can be found. We differ between 4 kinds of datasets based on their `origin`:

- `external`: datasets which are managed outside of CLB and which are imported. The vast majority of datasets in CLB are external.
- `project`: a dataset which is managed within CLB, e.g. the Catalogue of Life, with tools to sync data from other datasets. See [projects](projects).
- `release`: an immutable snapshot of a project
- `xrelease`: an extended release on top of an existing base release which merges additional data from other sources

The actual data for external datasets can either be uploaded by a user or pulled automatically by the system from a configured URL. When a new dataset import happens it will overwrite any previously existing data, only keeping the most recent version searchable. An [import history](/dataset/1199/imports?showHistory=true) is available for all datasets which not only shows the history, but also tracks metrics over time and gives access to the archives of all past versions which we store on our servers.

Every dataset has a [DOI](identifiers#dataset-keys-and-dois), and external datasets get a new version DOI with every import.

GBIF also covers [checklist datasets]({{GBIF_URL}}dataset/search?type=CHECKLIST) in the Darwin Core Archive format.
ChecklistBank therefore syncs with the GBIF registry every hour and inserts missing datasets when an appropriate license (CC0, CC-BY, CC-BY-NC) is given. Other parties like [Plazi's TreatmentBank](https://plazi.org/treatmentbank/) use our [API](API) to directly create new datasets.

## Imports

Regardless of the original data format, ChecklistBank generates a standardised interpretation similar to the COL Data Package ([ColDP](formats#catalogue-of-life-data-package-coldp)) format, the preferred data format to share rich data. Both the original and the interpreted versions are accessible. This allows us to offer a consistent API and UI across all datasets and is important for data integration in projects like the Catalogue of Life.
How scientific names in particular are interpreted is explained in [names](names).

In addition to the interpreted data the entire original, verbatim data is stored as it existed in the source.
With most formats being CSV file based, a verbatim record usually represents a single row in a CSV file with labelled columns. They can be searched and also browsed by linking verbatim records through well known foreign key columns in the supported formats.

## Downloads

All data in ChecklistBank can be [downloaded](/dataset/1199/download).
The entire dataset is available in the original archive format,
but can also be downloaded in any of the other [formats](formats), optionally filtering the data in various ways -
for example by selecting only a subtree or specific ranks.

Downloads require a user login and users are notified by email when their requested download is available.
We currently store all downloads so they can be accessed for a long time, but this might change in the future and we recommend users to store their downloads locally if they need to archive them.

## Tools

ChecklistBank offers a number of [tools](/tools/index) that work with the data of any dataset, e.g.

- a [name matcher](/tools/name-match) for lists of names
- a [name parser](/tools/name-parser)
- an [archive validator](/tools/validator) to check a dataset before publishing it
- a [dataset comparison](/tools/dataset-comparison) to compare the names and classifications of two datasets

The same services can also be used through the [API](API) and from [OpenRefine](reconciliation).

## User accounts

ChecklistBank relies on [GBIF user accounts]({{GBIF_URL}}user/profile). Once you have a registered GBIF account you can also use it to log into ChecklistBank. If you want to become an editor and manage datasets your GBIF profile must include an ORCID.
