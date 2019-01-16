import base64 from 'base-64';

import axios from 'axios'
import config from "../config";
export const JWT_STORAGE_NAME = 'col_plus_auth_token';


export const authenticate = async (username, password) => {
  return  axios(`${config.dataApi}user/login`, {
    headers: {
      'Authorization': `Basic ${base64.encode(username + ":" + password)}`
    }
  })
      .then((res) => {
      //  localStorage.setItem('col_plus_auth_token', res.data)
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data}`;
        return axios.all([axios(`${config.dataApi}user/me`), res.data])
      })
      .then(axios.spread((res, token) => {
        const user = {...res.data, token}
        return user;

      }))
      
  }


export const whoAmI = async () => {
  // return axiosInstance.post(`/user/whoami`, {});
  return axios(`${config.dataApi}user/me`)
};

export const logout = () => {
  localStorage.removeItem(JWT_STORAGE_NAME);
  sessionStorage.removeItem(JWT_STORAGE_NAME);
  // Unset Authorization header after logout
  axios.defaults.headers.common['Authorization'] = '';
};

export const getTokenUser = () => {
  const jwt = sessionStorage.getItem(JWT_STORAGE_NAME);
  if (jwt) {
    const user = JSON.parse(base64.decode(jwt.split('.')[1]));
    // is the token still valid - if not then delete it. This of course is only to ensure the client knows that the token has expired. any authenticated requests would fail anyhow
    if (new Date(user.exp * 1000).toISOString() < new Date().toISOString()) {
      logout();
    }
    return user;
  }

  return null;
};

// use sessionstorage for the session, but save in local storage if user choose to be remembered
const jwt = localStorage.getItem(JWT_STORAGE_NAME);
console.log("st name "+JWT_STORAGE_NAME)
if (jwt) {
  console.log("User "+jwt)

  sessionStorage.setItem(JWT_STORAGE_NAME, jwt);
  //const jwt = sessionStorage.getItem(JWT_STORAGE_NAME);

  axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;

  getTokenUser();// will log the user out if the token has expired
}