// import axiosInstance from './util/axiosInstance';
import axios from 'axios'
import config from './util/config'

export const getFrequency = () => {

 return axios(`${config.dataApi}vocab/frequency`)
    .then((res) => res.data.map(e => e.name ))

}

export const getDatasetType = () => {

  return axios(`${config.dataApi}vocab/datasettype`)
  .then((res) => res.data.map(e => e.name ))


}

export const getDataFormatType = () => {

  return axios(`${config.dataApi}vocab/dataformat`)
  .then((res) => res.data.map(e => e.name ))


}

export const getDatasetOrigin = () => {

  return axios(`${config.dataApi}vocab/datasetorigin`)
  .then((res) => res.data.map(e => e.name ))


}