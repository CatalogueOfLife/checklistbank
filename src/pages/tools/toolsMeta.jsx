import React from "react";

// Single source of truth for the short, one-line description shown by
// ToolHeader at the top of each tool page. The page title itself is passed to
// Layout (which renders it in the header bar), so it is not duplicated here.
// Values may be plain strings or JSX (e.g. to embed a link).
const toolsDescriptions = {
  validator:
    "Upload a ColDP, Darwin Core Archive or TextTree file to validate and preview its data before importing — issues are flagged just as in a real import.",
  "name-match":
    "Upload a list of names (CSV) and match them against a ChecklistBank dataset like Catalogue of Life to retrieve stable identifiers and the matched taxonomy.",
  "name-match-job": "Progress and downloadable results of a name-matching job.",
  "name-parser":
    "Break scientific names into their structured parts — genus, epithets, rank, authorship and nomenclatural code. Paste names or upload a plain text or delimited file, then download the parsed result as JSON or TSV.",
  "metadata-generator": (
    <>
      Create a{" "}
      <a href="https://github.com/CatalogueOfLife/coldp/blob/master/README.md#metadata">
        ColDP metadata.yaml
      </a>{" "}
      for a dataset from a web form, optionally pre-filled by uploading existing
      metadata.
    </>
  ),
  "diff-viewer":
    "View a unified text diff between two datasets, releases or subtrees to spot added, removed or changed names.",
  "taxonomic-alignment":
    "Compare the taxonomic concepts of two datasets (or parts of them), aligning taxa and generating RCC-5 relationships from their synonymy.",
  "dataset-comparison":
    "Compare a taxonomic group across two datasets — visualise metrics, then diff the names to find gaps and spelling variations.",
  "dataset":
    "Search every dataset published in ChecklistBank — free text search with filters by type, taxonomic scope, license and more.",
  "namesindex":
    "Look up a scientific name in the ChecklistBank names index, the central registry of all distinct names shared across every dataset. The query matches names starting with your text; append $ to force an exact match (e.g. Abies alba$).",
  "nameusage-search":
    "Search names across all datasets in ChecklistBank at once. Sort results by name and rank using the column headers.",
  "gbif-impact": (
    <>
      Compare how{" "}
      <a href="https://www.gbif.org/occurrence/search">
        GBIF occurrence records
      </a>{" "}
      are classified between the old GBIF backbone and the Catalogue of Life.
    </>
  ),
};

export default toolsDescriptions;
