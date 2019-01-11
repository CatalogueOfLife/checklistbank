import React from 'react'
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'
import Exception403 from '../../components/exception/403'
import withContext from '../hoc/withContext';
import Layout from '../LayoutNew'
import auth from './index.js'

const PrivateRoute = ({ user, roles, component: Component, ...rest }) => (
    <Route {...rest} render={(props) => (
      auth.isAuthorised(user, roles)
        ? <Component {...props} />
        : <Layout> <Exception403></Exception403></Layout>
    )} />
  )

const mapContextToProps = ({ user }) => ({ user });

export default withContext(mapContextToProps)(PrivateRoute);
