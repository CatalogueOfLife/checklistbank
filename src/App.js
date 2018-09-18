import React, { Component } from 'react';
import { Router, Route, Switch } from "react-router-dom";
import { NavLink } from "react-router-dom";

import history from './history';
import './App.css';
import DatasetList from './pages/DatasetList'
import DatasetPage from './pages/DatasetPage'
import Home from './pages/Home'

import { Layout, Menu, Breadcrumb } from 'antd';

const { Header, Content, Footer } = Layout;



class App extends Component {
  render() {
    return (
      <Router history={history}>
          <Layout className="layout">
            <Header>
              <div className="logo" />
              <Menu
                theme="dark"
                mode="horizontal"
                defaultSelectedKeys={['2']}
                style={{ lineHeight: '64px' }}
              >
                <Menu.Item key="home" >
                  <NavLink to={{ pathname: '/' }}>
                    Home
                </NavLink>
                </Menu.Item>
                <Menu.Item >
                  <NavLink to={{ pathname: '/dataset' }}>
                    Dataset
                </NavLink>
                </Menu.Item>

              </Menu>
            </Header>
            <Content style={{ padding: '0 50px' }}>
              
              <div style={{ background: '#fff', padding: 24, minHeight: 280 , margin: '16px 0'}}>
                <Switch>
                  <Route exact path="/" render={(props) => <Home />} />
                  <Route exact key="datasetKey" path={`/dataset/:key/:section?`} component={DatasetPage} />
                  <Route exact key="dataset" path="/dataset" render={(props) => <DatasetList />} />

                  <Route component={NoMatch} />
                </Switch>
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}>
              Catalogue of Life ©2018
    </Footer>
          </Layout>
      </Router>
    );
  }
}

const NoMatch = ({ location }) => (
  <div>
    <h3>
      404 - No match for <code>{location.pathname}</code>
    </h3>
  </div>
);

export default App;
