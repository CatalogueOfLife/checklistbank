## Projects

A **project** is a dataset that is assembled and edited inside ChecklistBank rather than imported from elsewhere.
It brings together parts of other datasets, its **sources**, keeps them up to date when the sources change
and lets editors correct, block or review what comes in.
From time to time a project publishes an immutable **release** with stable identifiers and a DOI.

The [Catalogue of Life](https://www.catalogueoflife.org) is the biggest project in ChecklistBank, with the key [3](/dataset/3).
Smaller projects are used for regional or thematic checklists, e.g. a national species list or a list of all species of a group,
that combine a few global sources with local data.

The screenshots on this page come from a small demo project with a backbone of three insect orders:
dragonflies from the Global Species Database of Odonata, stoneflies from the Plecoptera Species File,
praying mantises from the Mantodea Species File, and a regional checklist of the Odonata of Ecuador merged on top.

## Creating a project

Anyone with a ChecklistBank [account](introduction#user-accounts) can [create a project](/newdataset): pick the origin _project_ and fill in the metadata.
The creator becomes the first **editor** of the project. Editors can add other users as
- **editors**, who can change everything in the project
- **reviewers**, who can see the project and its private releases, but not change them

A new project is private. The project pages, i.e. everything under `/project/{key}`, are only accessible to its editors and reviewers.
Everyone else sees the data once the project publishes a release:
the [releases of COL](/dataset?releasedFrom=3&sortBy=created), for example, list the sectors, decisions and source metrics they were built from.

The license of a project must be compatible with the licenses of all its sources.

## Sources and sectors

A **sector** copies a part of a source dataset into the project.
It links a taxon of the source, the **subject**, to a taxon of the project, the **target**.
Every record a sector creates in the project remembers its sector, and so its source.

Sectors are created in the **workbench** (_Assembly_ in the project menu).
It shows the project tree on the left and the tree of a source dataset, picked in the box above it, on the right.
To create a sector, switch to _Add sectors_ and drag a taxon from the source onto a taxon in the project.
Taxa that already belong to a sector are tagged with the name of their sector's subject.

<figure class="md-screenshot"><img src="/images/about/project-sector-dialog.png" alt="Dragging Mantodea from the Mantodea Species File onto Insecta in the workbench asks whether to attach, union or merge it">
<figcaption>Dragging the order Mantodea from the Mantodea Species File onto Insecta in the project</figcaption></figure>

The **mode** of a sector decides what is copied and how:

| Mode | |
|---|---|
| `attach` | The subject and everything below it is attached as a child of the target. This is the default, e.g. the order Mantodea under the class Insecta. |
| `union` | The children of the subject are attached to the target, but not the subject itself. Used when subject and target are the same taxon, e.g. the families of Plecoptera from a source into the project's own Plecoptera. The workbench picks it when subject and target have the same rank. |
| `merge` | Names are merged into the existing tree. Names that already exist in the project are not duplicated, only missing details like a publication, environment or temporal range are added to them. New names are placed under their matching parent. Subject and target are optional; without a subject the entire source is merged. |
| `hierarchy` | The project hands its higher classification over to another dataset: the species and genera of the project are placed into the classification of that dataset, their status aligned with it and its synonyms added. If the other dataset is a project, its latest public release, or optionally its latest extended release, is used. A project can have only one hierarchy sector. |

When dropping a taxon the workbench also offers to **replace** the target: it deletes the target with everything below it and attaches the subject in its place.
It also warns when the subject has a higher rank than the target, when the target already has a child of that name or when the sector already exists.

<figure class="md-screenshot"><img src="/images/about/project-workbench.png" alt="The workbench with the project tree on the left and the source tree on the right">
<figcaption>The workbench: the project on the left, the Mantodea Species File on the right. The blocked family Cretomantidae is missing from the project</figcaption></figure>

The sector list (_Sectors_ in the project menu) shows all sectors with their source, mode, subject and target.
Sectors can be synced, rematched, edited and deleted there. A full delete removes all records of the sector,
a partial delete keeps the higher taxa above species rank, so that other sectors attached to them stay in place.

<figure class="md-screenshot"><img src="/images/about/project-sectors.png" alt="The list of sectors of the demo project">
<figcaption>The sectors of the demo project</figcaption></figure>

### Priority

Several merge sectors can contribute the same name. Merge sectors are therefore **prioritised**: the higher a sector in the priority list, the earlier it is merged
and the more its data wins over sectors merged later. The order is changed by drag & drop in the _Priority_ tab of the sectors.

### Settings and profiles

A sector can be limited to only parts of its source with **settings**, e.g.:

- only certain ranks, entities (vernacular names, distributions, references, …) or name types
- only extinct or only extant taxa
- names matching or not matching a pattern, or a list of names that are never synced
- names without certain nomenclatural statuses or issues
- a nomenclatural code forced onto all names
- whether the authorship of matching names is updated (hierarchy sectors)

Settings can be given on a sector, but are best managed for many sectors at once as **sector profiles** (_Profiles_ tab of the sectors).
A profile applies to all sectors it selects, e.g. all merge sectors, all sectors from datasets of a given type or of a GBIF publisher.
A sync uses the built-in defaults first, then the profiles that apply to the sector in their order, and the sector's own settings last.
Most settings take the last value given, while the exclusion lists of all levels add up.

### Publishers

A project can include all datasets of a [GBIF publisher](https://www.gbif.org/publisher/search).
Configured in the _Publishers_ tab, every extended release creates merge sectors for the datasets of that publisher that have no sector yet,
leaving out datasets with an incompatible license.

### Duplicate sectors

Two sectors with the same subject would copy the same data twice. The _Duplicates_ tab of the sectors lists such sectors, so that one of them can be removed.

## Syncing

A sector is filled with data when it is **synced**. A sync

1. deletes all data the sector created in its previous sync
2. copies the subject's tree from the source, applying the sector settings and the [decisions](#editorial-decisions) on the source
3. matches the new names to the rest of the project and the existing species estimates
4. rebuilds the search index for the sector

Taxa of the source that are the subject of another sector of the same source are skipped, so sectors do not overlap.

Sectors are synced from the sector list, one by one or all of them with _Sync all_ in the project options.
With the project option **sync scheduler**, sectors whose source has been reimported since their last sync are synced automatically.
The **block merge syncs** option keeps merge sectors out of the project: they then only take effect in [extended releases](#releases).

The _Syncs_ tab of the sectors shows the queue and history of syncs with their counts.
Each sync can be compared to the previous one of the same sector in a names diff, which shows the names added and removed.

<figure class="md-screenshot"><img src="/images/about/project-syncs.png" alt="The sync history with counts of the synced records">
<figcaption>The last sync of each sector of the demo project with the number of taxa it created</figcaption></figure>

## Editorial decisions

Sources are not edited in a project. Instead editors record **decisions** on taxa of a source, which every sync applies again:

| Mode | |
|---|---|
| `block` | The taxon and everything below it is not copied. |
| `ignore` | The taxon itself is not copied, but its children are, attached to its parent. |
| `update` | The taxon is copied with changes: a different name, authorship, rank, status, environment, extinct flag or temporal range. Fields left empty keep their original value. The original name can be kept as a synonym. |
| `reviewed` | The taxon was reviewed and is copied as it is, even if a sector setting would exclude it. |

Decisions are made in the source tree of the workbench, for a single taxon from its menu or for several taxa selected at once.
A note given with a decision is copied into the remarks of the record.
The decision list (_Decisions_ in the project menu) shows all decisions and lets editors filter, change and delete them.

<figure class="md-screenshot"><img src="/images/about/project-decisions.png" alt="The list of decisions of the demo project">
<figcaption>Decisions of the demo project: a blocked fossil family, an updated authorship and a reviewed family</figcaption></figure>

Sectors and decisions refer to taxa of a source by their identifier.
When a source is reimported, the identifiers may change. Sectors and decisions are therefore **rematched**:
a taxon with the same identifier, name and rank is kept; otherwise a single taxon with the same name is looked for.
If nothing or several taxa match, the decision is **broken** and no longer applied.
Rematching runs on every import of a source with the dataset option **rematch decisions**, or by hand with _Rematch all decisions_ and _Rematch all sectors_ in the project options.
Broken decisions are counted in the source issues and can be filtered and deleted in the decision list.

## Editing the project tree

Not everything comes from a source. In the _Modify tree_ mode of the workbench editors can

- add root taxa and children, edit and delete taxa, and move taxa by drag & drop
- upload a [TextTree](formats#texttree) below a taxon, or download its subtree as one
- group the homotypic names below a taxon
- record **species estimates** for a taxon, i.e. how many species are thought to exist, with a reference

Higher taxa that hold the sectors, like _Insecta_ and _Plecoptera_ in the demo project, are usually created this way.
Records created in the project itself belong to no sector, and are kept when sectors are synced or deleted.

## Quality control

- **Duplicates** searches the project for names that might be duplicates, with presets like the same name with different authors or the same species in different genera.
- **Tasks** counts the open duplicates and manuscript names, for the whole project or a single source.
- **Sources** lists all sources with their metrics and the issues found in their data, including the number of broken decisions.
- **Validate** in the project options rebuilds the issues of the whole project.
- A project can be searched and downloaded like any other dataset.

## Releases

A **release** is an immutable copy of a project at a point in time, a dataset of its own with the origin `release`.
Projects keep changing and their identifiers are not stable, so a release is what users cite and work with.
Releases are created with the _Release_ button of the project options.

An **extended release** builds on the latest public release and merges more sources into it:
all merge sectors are synced in their priority order, homotypic names are grouped, misspellings fixed and likely duplicates marked as provisionally accepted. The Catalogue of Life publishes the curated base release as the
[COL checklist](https://www.catalogueoflife.org/about/catalogueoflife) and an extended release with many more names on top of it.
Extended releases are created with the _Extended release_ button.

<figure class="md-screenshot"><img src="/images/about/project-options.png" alt="The project options with the release buttons">
<figcaption>The project options with the release and extended release actions</figcaption></figure>

A new release is always **private**, a release candidate that only the project's editors and reviewers can see.
Its _Review_ page compares it to the previous published release of the same kind. It is published by switching off _private_ in its metadata.
On publication

- its [DOI](identifiers#dataset-keys-and-dois) becomes public and is linked to the previous and next release
- its records get [stable identifiers](identifiers#stable-identifiers-in-releases), shared with the identifiers of earlier releases
- it can be found with the `{key}LR` or `{key}LXR` [dataset keys](API#latest-release-keys) for the latest (extended) release of the project

The metadata of a release, e.g. its title, version and citation, is generated from templates in the **release configuration** of the project,
which also decides e.g. whether the authors of the sources become authors of the release.
The extended release has a configuration of its own, e.g. for which groups are protected from being merged into or which sources are left out.

The Catalogue of Life publishes a release every month. Monthly releases are kept for at least a year,
while the annual releases, accessible as e.g. [`COL2025`](/dataset/COL2025), are kept forever.

## Further reading

The GBIF [project tutorial](https://docs.gbif.org/course-checklistbank-project/) walks through building a project step by step.
