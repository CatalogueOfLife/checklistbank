import React from "react";
import {
    Redirect,
    withRouter
  } from 'react-router-dom'
import config from "../../config";

import axios from "axios";

import Layout from "../../components/Layout";
import Auth from '../../components/Auth/Auth'
import LoginForm from './LoginForm'
import _ from 'lodash'

class Login extends React.Component {
    state = {
      redirectToReferrer: false
    }
    login = () => {
        Auth.authenticate(() => {
        this.setState({
          redirectToReferrer: true
        })
      })
    }
    render() {
      const { from } = _.get(this.props, 'location.state') || { from: { pathname: '/' } }
      const { redirectToReferrer } = this.state
  
      if (redirectToReferrer === true) {
        return <Redirect to={from} />
      }
  
      return (
        <div>
          <p>You must log in to view the page</p>
          <button onClick={this.login}>Log in</button>
        </div>
      )
    }
  }

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
       {Auth.isAuthenticated && <AuthButton ></AuthButton>}
       {!Auth.isAuthenticated && <LoginForm {...this.props}></LoginForm>}
      </Layout>
    );
  }
}

export default LoginPage;
