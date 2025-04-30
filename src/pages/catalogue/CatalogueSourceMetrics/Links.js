/*
basePath will be either /dataset/:key (release source metrics) or catalogue/:key (catalogue source metrics)
*/

export default {
  sectorCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) =>
    project
      ? {
          pathname: `${basePath}/sector`,
          search: `?limit=100&offset=0&${
            publisher ? "publisherKey" : "subjectDatasetKey"
          }=${KEY}`,
        }
      : {
          pathname: `${basePath}/names`,
          search: `?${
            publisher ? "SECTOR_PUBLISHER_KEY" : "SECTOR_DATASET_KEY"
          }=${KEY}&status=synonym&status=ambiguous%20synonym&status=misapplied`,
        },
  synonymCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: `${basePath}/names`,
    search: `?${
      publisher ? "SECTOR_PUBLISHER_KEY" : "SECTOR_DATASET_KEY"
    }=${KEY}&status=synonym&status=ambiguous%20synonym&status=misapplied`,
  }),
  taxonCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: `${basePath}/names`,
    search: `?${
      publisher ? "SECTOR_PUBLISHER_KEY" : "SECTOR_DATASET_KEY"
    }=${KEY}&status=accepted&status=provisionally%20accepted`,
  }),
  bareNameCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: `${basePath}/names`,
    search: `?${
      publisher ? "SECTOR_PUBLISHER_KEY" : "SECTOR_DATASET_KEY"
    }=${KEY}&status=bare%20name`,
  }),
  taxaByRankCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: `${basePath}/names`,
    search: `?${
      publisher ? "SECTOR_PUBLISHER_KEY" : "SECTOR_DATASET_KEY"
    }=${KEY}&status=accepted&status=provisionally%20accepted&rank=${key}`,
  }),
  synonymsByRankCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: `${basePath}/names`,
    search: `?${
      publisher ? "SECTOR_PUBLISHER_KEY" : "SECTOR_DATASET_KEY"
    }=${KEY}&status=synonym&status=ambiguous%20synonym&status=misapplied&rank=${key}`,
  }),
  usagesByStatusCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: `${basePath}/names`,
    search: `?${
      publisher ? "SECTOR_PUBLISHER_KEY" : "SECTOR_DATASET_KEY"
    }=${KEY}&status=${key}`,
  }),
  usagesCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: `${basePath}/names`,
    search: `?${
      publisher ? "SECTOR_PUBLISHER_KEY" : "SECTOR_DATASET_KEY"
    }=${KEY}`,
  }),
  nameCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: `${basePath}/names`,
    search: `?${
      publisher ? "SECTOR_PUBLISHER_KEY" : "SECTOR_DATASET_KEY"
    }=${KEY}`,
  }),
  referenceCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: publisher
      ? `${basePath}/publisher/${KEY}`
      : `/dataset/${KEY}/references`,
    search: ``,
  }),
  datasetAttempt: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false,
    record
  ) =>
    !!record?.metrics?.datasetAttempt
      ? {
          pathname: publisher
            ? `${basePath}/publisher/${KEY}`
            : `/dataset/${KEY}/imports/${
                record?.metrics?.datasetAttempt[
                  record?.metrics?.datasetAttempt.length - 1
                ]
              }`,
          search: ``,
        }
      : null,
  appliedDecisionCount: (
    key,
    value,
    KEY,
    basePath,
    project = false,
    publisher = false
  ) => ({
    pathname: `${basePath}/decisions`,
    search: `?subjectDatasetKey=${KEY}`,
  }),
};
