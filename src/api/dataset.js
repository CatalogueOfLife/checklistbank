import axios from "axios";
import config from "../config";
import duplicatePresets from "../pages/Duplicates/queryPresets";
import qs from "query-string";

const reflect = (p) =>
  p.then(
    (v) => v.data,
    (e) => null
  );

export const getDatasetsBatch = (ids) => {
  return Promise.all(
    ids.map((i) => reflect(axios(`${config.dataApi}dataset/${i}`)))
  );
};

export const getDuplicateOverview = (
  datasetKey,
  catalogueKey,
  withDecision,
) => {
  let groups = [
    ...duplicatePresets.map((p) => {
      let params = { ...p.params};
      if('boolean' === typeof withDecision) {
        params.withDecision = withDecision;
      } else {
        delete params.withDecision
      }
      return {
      ...p,
      params,
    }
  }),
  ];

  return Promise.all(
    groups.map((g) => {
      let params = catalogueKey ? {...g.params, catalogueKey} : {...g.params};
      return axios(
        `${config.dataApi}dataset/${datasetKey}/duplicate/count?${qs.stringify(params)}`
      )
        .then((res) => (g.count = res.data))
        .catch((err) => (g.error = err))
    }
      
    )
  ).then(() => groups);
};

export const getCatalogues = () => {
  return axios(`${config.dataApi}dataset?origin=project`);
};

export const getDataset = (datasetKey) =>
  axios(`${config.dataApi}dataset/${datasetKey}`);
