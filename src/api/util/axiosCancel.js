import axios from 'axios';
import axiosInstance from './axiosInstance';

let CancelToken = axios.CancelToken;

function get(url, options) {
  let cancel;
  options = options || {};
  options.cancelToken = new CancelToken(function executor(c) {
    cancel = c;
  });
  let p = axiosInstance.get(url, options);
  p.cancel = cancel;
  return p;
}

export default {
  get
};