/*
basePath will be either /dataset/:key (release source metrics) or catalogue/:key (catalogue source metrics)
*/

export default {
  sectorCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/about`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=synonym&status=ambiguous%20synonym&status=misapplied`,
  }),
  synonymCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=synonym&status=ambiguous%20synonym&status=misapplied`,
  }),
  taxonCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=accepted&status=provisionally%20accepted`,
  }),
  bareNameCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=bare%20name`,
  }),
  taxaByRankCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=accepted&status=provisionally%20accepted&rank=${key}`,
  }),
  synonymsByRankCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=synonym&status=ambiguous%20synonym&status=misapplied&rank=${key}`,
  }),
  usagesByStatusCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&status=${key}`,
  }),
  usagesCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}`,
  }),
  nameCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}`,
  }),
  referenceCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `/dataset/${SECTOR_DATASET_KEY}/references`,
    search: ``,
  }),
};
