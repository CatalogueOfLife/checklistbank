import React from "react";
import {
    Redirect,
    withRouter
  } from 'react-router-dom'
import config from "../../config";

import axios from "axios";

import Layout from "../../components/LayoutNew";
import Auth from '../../components/Auth/Auth'
import LoginForm from './LoginForm'
import _ from 'lodash'
import PageContent from '../../components/PageContent'


const AuthButton = withRouter(({ history }) => (
    (
      <p>
        Welcome! <button onClick={() => {
          Auth.signout(() => history.push('/'))
        }}>Sign out</button>
      </p>
    ) 
  ))

class LoginPage extends React.Component {
  constructor(props) {
    super(props);


  }

  componentWillMount() {
  }



  render() {
    return (
      <Layout     
      >
      <PageContent>
       {Auth.isAuthenticated && <AuthButton ></AuthButton>}
       {!Auth.isAuthenticated && <LoginForm {...this.props}></LoginForm>}
       </PageContent>
      </Layout>
      
    );
  }
}

export default LoginPage;
