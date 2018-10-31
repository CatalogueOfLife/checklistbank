
const Auth = {
    isAuthenticated: false,
    authenticate(credentials, cb) {
      this.isAuthenticated = true
      setTimeout(cb, 100)
    },
    signout(cb) {
      this.isAuthenticated = false
      setTimeout(cb, 100)
    }
  }

  export default Auth;