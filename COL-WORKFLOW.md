# Assembling the CoL
The purpose of this document is to summarize the entire editorial workflow needed when assembling a Catalogue of Life.
It is targeted at a CoL editor and uses the frontend exclusively.

## Overview
 - optionally register a new dataset
 - import datasets into Clearinghouse
 - review data issues and reimport data if it needs to be corrected at the source
 - check duplicates and apply decisions if needed
 - check issues in workbench and assign decisions

## Importing External Datasets
Importing external ColDP. ACEF or DwC archives from a stable URL is the preferred way to get data into the Clearinghouse.
When using a stable accessUrl in the dataset metadata the imports can run automatically in the background without manual intervention.

Uploading archives for a dataset manually is another option that can be used.

### Dataset registration
 - external URL
 - alias as shortname
 - nom code if an entire dataset is covered by a single nomenclatural code

### Duplicates
tbd: duplicate modes & presets

### Workbench decisions
Block taxa or update their status, rank, name, authorship, type, etc
Change fossil/recent flags

#### Badly parsed names & wrong name type
tbd.


## Sector
### The CoL hierarchy
Comes from the existing CoL down to genera.
Use `Catalogue/Assembly/ModifyTree` to modify the tree

### Mappings
Use `Catalogue/Assembly/AttachSectors` to create/change sectors
2 modes with different behavior during a sector copy: 
 - `attach` copies the source taxon under the target
 - `merge` ignores the source taxon itself and copies all its children under the target

Note: Blocking decisions can also be applied in the assembly tree view on the right side. All other decisions need to be placed in the workbench


## Species estimates
Use `Catalogue/Assembly/ModifyTree` to modify estimates


### Assembly Sync
Either sync a single sector in the `Catalogue/Assembly/AttachSectors` view or sync all sectors of a given dataset in the `Dataset/Sectors` page
Follow the sync progress in the `Catalogue/Assembly/AttachSectors`assembly page.
If sync errors exist please see the `Secotr Sync` view and its links to Kibana logs


## Export to AC
Press button in admin page
Geoff know how to trigger the conversion then.
