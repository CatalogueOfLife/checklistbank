import axios from "axios";
import config from "../config";

const reflect = p => p.then(v => v.data, e => null);

export const getSectorsBatch = (ids, projectKey) => {
  return Promise.all(
    ids.map(i => reflect(axios(`${config.dataApi}dataset/${projectKey}/sector/${i}`)))
  );
};
