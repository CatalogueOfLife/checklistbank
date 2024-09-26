# Introduction to ChecklistBank

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

To be continues with:

- verbatim data
- downloads
