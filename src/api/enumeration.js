// import axiosInstance from './util/axiosInstance';
import axios from "axios";
import config from "../config";

const { loadEnumsFromAPI } = config;

// Eagerly bundle every local enumeration JSON. Vite's import.meta.glob
// replaces the CRA-era dynamic `require("../enumeration/${e}")`.
const localEnums = import.meta.glob("../enumeration/*.json", {
  eager: true,
  import: "default",
});
const localEnumFor = (e) => localEnums[`../enumeration/${e}.json`];

const getData = (e) =>
  loadEnumsFromAPI
    ? axios(`${config.dataApi}vocab/${e}`)
    : Promise.resolve({ data: localEnumFor(e) });

export const getFrequency = () => {
  return getData(`frequency`).then(
    (res) => res.data //.map(e => e.name)
  );
};

export const getDatasetType = () => {
  return getData(`datasettype`).then((res) => res.data.map((e) => e.name));
};

export const getDataFormat = () => {
  return getData(`dataformat`).then(
    (res) => res.data //.map(e => e.name)
  );
};

export const getDatasetOrigin = () => {
  return getData(`datasetorigin`).then((res) => res.data.map((e) => e.name));
};

export const getRank = () => {
  return getData(`rank`).then((res) => res.data.map((e) => e.name));
};

export const getTaxonomicStatus = () => {
  return getData(`taxonomicstatus`).then((res) => res.data.map((e) => e.name));
};

export const getIssue = () => {
  return getData(`issue`).then((res) => res.data);
};

export const getNameType = () => {
  return getData(`nametype`).then((res) => res.data.map((e) => e.name));
};

export const getNameField = () => {
  return getData(`namefield`).then((res) => res.data.map((e) => e.name));
};

export const getNomStatus = () => {
  return getData(`nomstatus`).then(
    (res) => res.data //.map(e => e.name)
  );
};

export const getLicense = () => {
  return getData(`license`).then((res) => res.data.map((e) => e.name));
};

export const getNomCode = () => {
  return getData(`nomcode`).then((res) => res.data);
};

export const getImportState = () => {
  return getData(`importstate`).then((res) => res.data);
};

export const getEnvironments = () => {
  return getData(`environment`).then((res) => res.data);
};

export const getSectorImportState = () => {
  return getData(`importstate`).then((res) => res.data.map((e) => e.name));
};

export const getCountries = () => {
  return getData(`country`).then((res) => res.data);
};

export const getLanguages = () => {
  return getData(`language`).then((res) => res.data);
};

export const getEstimateType = () => {
  return getData(`estimatetype`).then((res) => res.data.map((e) => e.name));
};

export const getDatasetSettings = () => {
  return getData(`setting`).then((res) => res.data);
};

export const getGazetteer = () => {
  return getData(`Gazetteer`).then((res) => res.data);
};

export const getEntitytype = () => {
  return getData(`entitytype`).then((res) => res.data);
};

export const getDecisionMode = () => {
  return getData(`editorialdecision$mode`).then((res) => res.data);
};

export const getSpeciesinteractiontype = () => {
  return getData(`speciesinteractiontype`).then((res) => res.data);
};

export const getUserRole = () => {
  return getData(`user$role`).then((res) => res.data.map((e) => e.name));
};

export const getDoiResolution = () => {
  return getData(`doiresolution`).then((res) => res.data.map((e) => e.name));
};

export const getInfoGroup = () => {
  return getData(`infoGroup`).then((res) => res.data.map((e) => e.name));
};

export const getTaxGroup = () => {
  return getData(`taxGroup`).then((res) => Object.fromEntries(res.data.map(e => [e.name, e])));
};

export const getNameIndexRank = () => {
  return Promise.resolve(localEnumFor("nameIndexRank"));
};

export const getIdentifierScope = () => {
  return getData(`identifier-scope`).then((res) =>
    Object.fromEntries(res.data.map((e) => [e.scope, e]))
  );
};

// SECTOR_AUTHORSHIP_UPDATE — a nested Sector enum. Not served by every backend
// yet, so resolve to an empty list when the vocab is missing so the shared enum
// Promise.all cannot reject (which would block loading of all other enumerations).
export const getSectorAuthorshipUpdate = () => {
  return getData(`sector$authorshipupdate`)
    .then((res) => res.data ?? [])
    .catch(() => []);
};