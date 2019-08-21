import axios from "axios";
import config from "../config";

export const getGitVersion = () => {
  return axios(`/gitVersion.json`).then(res => res.data)
};

export const getBackendGitVersion = () => {
    return axios(`${config.dataApi}version`).then(res => {
        const splitted = res.data.split('  ');
        return {
            short: splitted[0].trim(),
            created: splitted[1].trim()
        }
    })
  };

