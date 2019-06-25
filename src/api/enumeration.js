// import axiosInstance from './util/axiosInstance';
import axios from "axios";
import config from "../config";

export const getFrequency = () => {
  return axios(`${config.dataApi}vocab/frequency`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getDatasetType = () => {
  return axios(`${config.dataApi}vocab/datasettype`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getDataFormatType = () => {
  return axios(`${config.dataApi}vocab/dataformat`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getDatasetOrigin = () => {
  return axios(`${config.dataApi}vocab/datasetorigin`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getRank = () => {
  return axios(`${config.dataApi}vocab/rank`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getTaxonomicStatus = () => {
  return axios(`${config.dataApi}vocab/taxonomicstatus`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getIssue = () => {
  return axios(`${config.dataApi}vocab/issue`).then(res =>
    res.data
  );
};

export const getNameType = () => {
  return axios(`${config.dataApi}vocab/nametype`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getNameField = () => {
  return axios(`${config.dataApi}vocab/namefield`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getNomStatus = () => {
  return axios(`${config.dataApi}vocab/nomstatus`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getLicense = () => {
  return axios(`${config.dataApi}vocab/license`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getNomCode = () => {
  return axios(`${config.dataApi}vocab/nomcode`).then(res =>
    res.data
  );
};

export const getImportState = () => {
  return axios(`${config.dataApi}vocab/importstate`).then(res =>
    res.data
  );
};

export const getLifezones = () => {
  return axios(`${config.dataApi}vocab/lifezone`).then(res =>
    res.data
  );
};

export const getSectorImportState = () => {
  return axios(`${config.dataApi}vocab/sectorimport$state`).then(res =>
    res.data.map(e => e.name)
  );
};

export const getCountries = () => {
  return axios(`${config.dataApi}vocab/country`).then(res =>
    res.data
  );
};




