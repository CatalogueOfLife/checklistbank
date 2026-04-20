## DOI support in ChecklistBank

Every dataset in ChecklistBank has a unique [DOI](https://support.datacite.org/docs/doi-basics) assigned to it which remains the same across its lifetime.
We refer to this as the ```concept DOI``` as it represents the concept of the dataset, not a specific version.

External datasets additionally have a ```version DOI``` assigned to every successful import attempt; 
the concept DOI always resolves to the latest version while each version DOI points to its specific snapshot.
Older versions are not searchable and ChecklistBank only provides a basic archive view for historic versions.

Projects and releases do not have version DOIs:
- Projects change continuously — there is no meaningful "version".
- Releases are immutable snapshots themselves — the release's concept DOI is already version-specific, so no
  separate version DOI is minted.

Only published datasets (including public releases) have a public, findable DOI. Private datasets still have
a DOI, but it is registered as a draft at [DataCite](https://datacite.org/) and cannot be resolved publicly.

## DOI identifier scheme
DOIs are minted with ```10.48580``` as the DataCIte registered ChecklistBank [prefix](https://support.datacite.org/docs/doi-basics#prefix). 
The suffix is derived from the dataset key:
- Concept DOI: `10.48580/ds{key}`
- Version DOI: `10.48580/ds{key}.v{attempt}`

## Dataset type matrix

| Origin   | Concept DOI | Version DOI | Published when                                                |
|----------|-------------|-------------|---------------------------------------------------------------|
| EXTERNAL | yes         | yes, per import attempt | Concept and each version DOI auto-publish on CREATE if the dataset is public |
| PROJECT  | yes         | no          | Projects are typically private; their concept DOI stays DRAFT |
| RELEASE  | yes         | no          | Concept DOI is explicitly published when the release is made public (private → public transition) |

## DataCite state machine
DataCite knows three [DOI states](https://support.datacite.org/docs/doi-states): `DRAFT` → `REGISTERED` → `FINDABLE`.

| Application operation | DataCite effect |
|-----------------------|-----------------|
| create (private)      | Creates a DRAFT DOI with metadata. |
| create (public)       | Creates a DRAFT, then immediately PUBLISHes it to FINDABLE. |
| publish               | PUBLISH event: DRAFT/REGISTERED → FINDABLE. |
| update                | Updates metadata and/or target URL; does not change state. |
| delete on a DRAFT     | Hard-deletes the DOI. |
| delete on a FINDABLE  | Sends a HIDE event — the DOI is moved to REGISTERED (no longer resolvable publicly); the target URL is updated so it still points to the correct resource if ever un-hidden. |

Note: making a dataset private again does **not** revert its DOI state. 
Once a DOI is FINDABLE it stays FINDABLE; this is deliberate.

## DOI metadata and chaining
The dataset metadata is used to build the [Datacite metadata](https://schema.datacite.org/). In addition some DOI relations are established:
- Version DOIs are chained to their previous and next import attempts.
- Release concept DOIs are chained to the previous and next release of the same project

