import axios from "axios";

export const getRegEx = () => {
  return axios(`/regex.json`).then(res => res.data)
};
