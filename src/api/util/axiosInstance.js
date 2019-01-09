import axios from 'axios';

import config from './config';
import { JWT_STORAGE_NAME } from '../user';

// Creating axios custom instance with global base URL
const instance = axios.create({
  baseURL: config.dataApi
});

// Adding Authorization header for all requests
const jwt = sessionStorage.getItem(JWT_STORAGE_NAME);
if (jwt) {
  instance.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
}

// Add a request interceptor
instance.interceptors.response.use(
  response => response,
  error => {
    // If a Network error
    if (!error.response) {
      error.response = {
        data: 'Network Error',
        status: 523
      }
    }
    return Promise.reject(error);
  }
);

export default instance;