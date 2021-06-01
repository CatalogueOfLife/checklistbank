/*
basePath will be either /dataset/:key (release source metrics) or catalogue/:key (catalogue source metrics)
*/

export default {
  taxaByRankCount: (key, SECTOR_DATASET_KEY, basePath) => ({
    pathname: `${basePath}/names`,
    search: `?SECTOR_DATASET_KEY=${SECTOR_DATASET_KEY}&rank=${key}`,
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
