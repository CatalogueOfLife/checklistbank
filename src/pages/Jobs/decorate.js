import DataLoader from "dataloader";
import { getUsersBatch } from "../../api/user";
import { getDatasetsBatch } from "../../api/dataset";

// Batched so a page of jobs costs one user request and one dataset request,
// not one per row.
const userLoader = new DataLoader((ids) => getUsersBatch(ids));
const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids));

/**
 * Resolves the user and dataset a job refers to. The job API only carries the
 * keys - deliberately, since a job record outlives the dataset it was about.
 */
export const decorateJobs = async (jobs = []) => {
  const userKeys = [...new Set(jobs.map((j) => j.userKey).filter((k) => k || k === 0))];
  const datasetKeys = [...new Set(jobs.map((j) => j.datasetKey).filter(Boolean))];
  const [users, datasets] = await Promise.all([
    Promise.all(userKeys.map((k) => userLoader.load(k))),
    Promise.all(datasetKeys.map((k) => datasetLoader.load(k))),
  ]);
  const userByKey = Object.fromEntries(userKeys.map((k, i) => [k, users[i]]));
  const datasetByKey = Object.fromEntries(
    datasetKeys.map((k, i) => [k, datasets[i]])
  );
  return jobs.map((j) => ({
    ...j,
    user: j.user || userByKey[j.userKey] || null,
    dataset: datasetByKey[j.datasetKey] || null,
  }));
};
