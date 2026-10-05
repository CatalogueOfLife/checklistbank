import axios from "axios";
import qs from "query-string";
import config from "../config";

const reflect = p => p.then(v => v.data, e => null);

export const getSectorsBatch = (ids, projectKey) => {
  return Promise.all(
    ids.map(i => reflect(axios(`${config.dataApi}dataset/${projectKey}/sector/${i}`)))
  );
};

const profileUrl = (datasetKey, id) =>
  `${config.dataApi}dataset/${datasetKey}/sector/profile${id != null ? `/${id}` : ""}`;

// The profiles of a project or release in cascade order. Projects have a handful, one page holds them all.
export const getProfiles = (datasetKey) =>
  axios(`${profileUrl(datasetKey)}?limit=1000`).then((res) => res.data?.result || []);

export const getProfile = (datasetKey, id) =>
  axios(profileUrl(datasetKey, id)).then((res) => res.data);

// resolves to the id of the new profile
export const createProfile = (datasetKey, profile) =>
  axios.post(profileUrl(datasetKey), profile).then((res) => res.data);

export const updateProfile = (datasetKey, profile) =>
  axios.put(profileUrl(datasetKey, profile.id), profile);

export const deleteProfile = (datasetKey, id) => axios.delete(profileUrl(datasetKey, id));

// the number of sectors a saved profile selects right now
export const countProfileSectors = (datasetKey, id) =>
  axios(
    `${config.dataApi}dataset/${datasetKey}/sector?${qs.stringify({ datasetKey, profileKey: id, limit: 0 })}`
  ).then((res) => res.data?.total ?? 0);

// the sectors an unsaved selector would select, as a result page
export const previewProfile = (datasetKey, selector, { limit = 0, offset = 0 } = {}) =>
  axios
    .post(`${profileUrl(datasetKey)}/preview?${qs.stringify({ limit, offset })}`, selector)
    .then((res) => res.data);

// {settings, sources}: what a sync of the sector uses, and the level each value comes from
export const getEffectiveSettings = (datasetKey, sectorId) =>
  axios(`${config.dataApi}dataset/${datasetKey}/sector/${sectorId}/settings`).then((res) => res.data);
