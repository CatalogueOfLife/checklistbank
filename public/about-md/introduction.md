## Introduction to ChecklistBank

ChecklistBank (CLB) is a repository for taxonomic datasets of various kinds that allows users to [publish](contribute), discover, use and manage such lists in a variety of [formats](formats).

ChecklistBank is hosted by [GBIF](https://www.gbif.org) and developed jointly by GBIF and the [Catalogue of Life](https://https://www.catalogueoflife.org).
The source code for the [backend (Java)](https://github.com/CatalogueOfLife/backend) and [frontend (JS React)](https://github.com/CatalogueOfLife/checklistbank) are managed in Github and we welcome software contributions.
The software is an evolution of the one that currently drives the [GBIF species API](https://www.gbif.org/species/search?advanced=1), which internally was also called [checklist bank](http://github.com/gbif/checklistbank).

## Datasets

The main entry point to ChecklistBank is the [dataset search](https://www.checklistbank.org/dataset), where all registered datasets can be found. We differ between 4 main kind of datasets based on their `origin`:

- `external`: datasets which are managed outside of CLB and which are imported. The vast majority of datasets in CLB are external.
- `project`: a dataset which is managed within CLB, e.g. the Catalogue of Life, with tools to sync data from other datasets.
- `release`: an immutable snapshot of a project
- `xrelease`: an extended release on top of an existing base release which merges/integrates additional data from other sources.

The actual data for external datasets can either be uploaded by a user or pulled automatically by the system from a configured URL. When a new dataset import happens it will overwrite any previously existing data, only keeping the most recent version searchable. An [import history](https://www.checklistbank.org/dataset/1199/imports) is available for all datasets which not only shows the history, but also tracks metrics over time and gives access to the binary archive of all past versions which we store on our servers.

GBIF also covers [checklist datasets](https://www.gbif.org/dataset/search?type=CHECKLIST) in the Darwin Core Archive format.
ChecklistBank therefore syncs with the GBIF registry ever hour and inserts missing datasets when an appropriate license (CC0, CC-BY, CC-BY-NC) is given. Other parties like [Plazi's TreatmentBank](http://plazi.org/treatmentbank/) use our [API](API) to directly create new datasets.

## Imports

Regardless of the original data format, ChecklistBank generates a standardised interpretation similar to the COL Data Package ([ColDP](https://github.com/CatalogueOfLife/coldp/blob/master/README.md)) format, the preferred data format to share rich data. Both the original and the interpreted versions are accessible. This allows us to offer a consistent API and UI across all datasets and is important for data integration in projects like the Catalogue of Life.

In addition to the interpreted data the entire original, verbatim data is stored as it existed in the source.
With most formats being CSV file based, a verbatim record usually represents a single row in a CSV file with labelled columns. They can be searched and also browsed by linking verbatim records through well known foreign key columns in the supported formats.

## Downloads

All data in ChecklistBank can be [downloaded](https://www.checklistbank.org/dataset/1199/download).
The entire dataset is available in the original archive format,
but can also be downloaded in any of the other [formats](#formats), optionally filtering the data in various ways -
for example by selecting only a subtree or specific ranks.

Downloads require a user login and users are reminded via email when their requested download is available.
We currently do store all downloads so they can be accessed for a long time, but the current behavior might change in the future and we recommend users to store their downloads lcoally if they need to archive them.

## User accounts

ChecklistBank relies on [GBIF user accounts](https://www.gbif.org/user/profile). Once you have a registered GBIF account you can also use it to log into ChecklistBank. If you want to become an editor and manage datasets your GBIF profile must include an ORCID.
