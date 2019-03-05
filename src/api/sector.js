import axios from "axios";
import config from "../config";

const reflect = p => p.then(v => v.data, e => null);

export const getSectorsBatch = ids => {
  return Promise.all(
    ids.map(i => reflect(axios(`${config.dataApi}sector/${i}`)))
  );
};
