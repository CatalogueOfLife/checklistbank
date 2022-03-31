// import axiosInstance from './util/axiosInstance';
import axios from "axios";
import config from "../config";

const { loadEnumsFromAPI } = config;

const getData = (e) =>
  loadEnumsFromAPI
    ? axios(`${config.dataApi}vocab/${e}`)
    : Promise.resolve({ data: require(`../enumeration/${e}`) });

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

export const getNameIndexRank = () => {
  return Promise.resolve(require(`../enumeration/nameIndexRank`))
}