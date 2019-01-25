import axios from "axios";

export const getTerms = () => {
  return axios(`/terms.json`).then(res => res.data)
};

