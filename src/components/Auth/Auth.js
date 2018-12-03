
import config from '../../config';
import axios from 'axios';
import history from '../../history'
import EventEmitter from 'events';
import base64 from 'base-64'

class Auth extends EventEmitter {

  isAuthenticated = false
  user =  null
  init() {
    const token = localStorage.getItem('col_plus_auth_token')
  if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } 
   return (!token) ? Promise.resolve() : axios(`${config.dataApi}user/me`)
      .then((res) => {
        this.user = res.data
        this.isAuthenticated = true
        this.emit('login')
      })
      .catch((err) => {
        this.user = null
        this.isAuthenticated = false
        this.emit('logout')

      })
  }
  authenticate(auth) {
  return  axios(`${config.dataApi}user/login`, {
    headers: {
      'Authorization': `Basic ${base64.encode(auth.username + ":" + auth.password)}`
    }
  })
      .then((res) => {
        localStorage.setItem('col_plus_auth_token', res.data)
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data}`;
        return axios(`${config.dataApi}user/me`)
      })
      .then((res) => {
        this.user = res.data
        this.isAuthenticated = true
        this.emit('login')

      })
      .catch((err) => {
        this.user = null
        this.isAuthenticated = false
        this.emit('logout')

      })
      

  }
  signout() {
    localStorage.removeItem('col_plus_auth_token')
    delete axios.defaults.headers.common['Authorization']
    this.isAuthenticated = false
    this.user = null
    this.emit('logout')
    return Promise.resolve();
  }
  getUser() {
    return this.user;
  }
  hasRole(role) {
    return this.user !== null && this.user.roles && this.user.roles.length > 0 && this.user.roles.indexOf(role.toLowerCase() > -1);
  }
 
}

const auth = new Auth;


export default auth;