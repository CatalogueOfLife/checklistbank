import React from 'react'
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  withRouter
} from 'react-router-dom'

import Auth from './Auth'

const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={(props) => (
        Auth.isAuthenticated === true
        ? <Component {...props} />
        : <Redirect to={{
            pathname: '/user/login',
            state: { from: props.location }
          }} />
    )} />
  )

 export default  PrivateRoute;