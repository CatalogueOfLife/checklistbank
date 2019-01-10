import React from 'react'
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect,
  withRouter
} from 'react-router-dom'
import Exception403 from '../../components/exception/403'
import withContext from '../hoc/withContext';
import Layout from '../LayoutNew'


const PrivateRoute = ({ component: Component, ...rest }) => (
    <Route {...rest} render={(props) => (
        props.user
        ? <Component {...props} />
        : <Redirect to={{
            pathname: '/user/login',
            state: { from: props.location }
          }} />
    )} />
  )

  
 class AuthRoute extends React.Component {
   shouldComponentUpdate(nextProps, nextState, nextContext) {
     const { user, location } = this.props;
     // If the url and the user are the same we shouldn't re-render component
     return nextProps.user !== user || nextProps.location.pathname !== location.pathname;
   }
 
   isAuthorized(user, roles, type) {
     if (!roles && user) {
       return true;
     }

     if (user && roles.some(r=> user.roles.includes(r))) {
      return true;
    }
     
     return false;
   };
 
   render() {
     const { user, roles, type, component: Component, ...rest } = this.props;
 
     return  <Route {...rest} render={(props) => (
      this.isAuthorized(user, roles)
      ? <Component {...props} />
      : <Layout> <Exception403></Exception403></Layout>
  )} />;
   }
 }

const mapContextToProps = ({ user }) => ({ user });

export default withContext(mapContextToProps)(AuthRoute);
