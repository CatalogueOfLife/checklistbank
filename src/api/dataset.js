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

export const getDuplicateOverview = datasetKey => {

    let groups = [...duplicatePresets];

   return Promise.all(
        groups.map(
            g => axios(`${config.dataApi}dataset/${datasetKey}/duplicate?${qs.stringify({
            ...g.params,
            limit: 51
          })}`).then(res => g.count = res.data.length)
    )
    ).then(() => groups)

}

