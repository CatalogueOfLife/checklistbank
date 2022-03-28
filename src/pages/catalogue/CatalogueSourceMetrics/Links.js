/*
basePath will be either /dataset/:key (release source metrics) or catalogue/:key (catalogue source metrics)
*/

export default {
  sectorCount: (key, value, SECTOR_DATASET_KEY, basePath, project = false) => (project ? {
    pathname: `${basePath}/sector`,
    search: `?limit=100&offset=0&subjectDatasetKey=${SECTOR_DATASET_KEY}`,
  }: {
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=synonym&status=ambiguous%20synonym&status=misapplied`,
  }),
  synonymCount: (key, value, SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=synonym&status=ambiguous%20synonym&status=misapplied`,
  }),
  taxonCount: (key, value, SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=accepted&status=provisionally%20accepted`,
  }),
  bareNameCount: (key, value, SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=bare%20name`,
  }),
  taxaByRankCount: (key,value,  SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=accepted&status=provisionally%20accepted&rank=${key}`,
  }),
  synonymsByRankCount: (key, value, SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=synonym&status=ambiguous%20synonym&status=misapplied&rank=${key}`,
  }),
  usagesByStatusCount: (key,value,  SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=${key}`,
  }),
  usagesCount: (key,value,  SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}`,
  }),
  nameCount: (key,value,  SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}`,
  }),
  referenceCount: (key,value,  SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `/dataset/${SECTOR_DATASET_KEY}/references`,
    search: ``,
  }),
  datasetAttempt: (key, value, SECTOR_DATASET_KEY, basePath, project = false) => ({
    pathname: `/dataset/${SECTOR_DATASET_KEY}/imports/${value}`,
    search: ``,
  })
};
