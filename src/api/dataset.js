import axios from 'axios'
import config from "../config";
import duplicatePresets from "../pages/Duplicates/queryPresets"
import qs from "query-string";

const reflect = p => p.then(v => v.data,
                            e => null);

export const getDatasetsBatch = (ids) => {

    return Promise.all(
        ids.map(i => reflect(axios(`${config.dataApi}dataset/${i}`)))
    )

}

export const getDuplicateOverview = (datasetKey, catalogueKey, withDecision) => {

    let groups = [...duplicatePresets.map(p => ({...p, params: {...p.params, withDecision: withDecision}}))];

   return Promise.all(
        groups.map(
            g => axios(`${config.dataApi}dataset/${datasetKey}/duplicate?${qs.stringify({
            ...g.params, catalogueKey: catalogueKey,
            limit: 51
          })}`).then(res => g.count = res.data.length)
    )
    ).then(() => groups)

}

export const getCatalogues = () => {
   return axios(`${config.dataApi}dataset?origin=managed`);
}

export const getDataset = datasetKey => axios(`${config.dataApi}dataset/${datasetKey}`);