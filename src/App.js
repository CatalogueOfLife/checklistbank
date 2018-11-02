import React, { Component } from 'react';
// Configure JWT Auth:
import axios from 'axios';


import { Router, Route, Switch, Redirect } from "react-router-dom";
import PrivateRoute from './components/Auth/PrivateRoute'

import history from './history';
import './App.css';
import DatasetList from './pages/datasetList/DatasetList'
import DatasetPage from './pages/datasetKey/DatasetPage'
import DatasetCreate from './pages/datasetCreate/DatasetCreate'
import TaxonPage from './pages/taxon/TaxonPage'
import NamePage from './pages/name/NamePage'
import LoginPage from './pages/login/LoginPage'

import ManagementClassification from './pages/managementClassification/ManagementClassification'

import Home from './pages/home/Home'

/* (function() {
  const token = localStorage.getItem('col_plus_auth_token')
  if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } 
})(); */

class App extends Component {
  render() {
    return (
      <Router history={history}>
        <Switch>
          <Route exact path="/" render={(props) => <Redirect to={{
            pathname: '/imports/running'
          }} />} />
          <Route exact path="/imports/:section?" render={({match}) => <Home section={match.params.section}/>} />
          <PrivateRoute exact key="managementClassification" path={`/assembly`} component={ManagementClassification}></PrivateRoute> />
          <Route exact key="taxonKey" path={`/dataset/:key/taxon/:taxonKey`} component={TaxonPage} />
          <Route exact key="nameKey" path={`/dataset/:key/name/:nameKey`} component={NamePage} />

          <Route exact key="datasetCreate" path={`/dataset/create`} component={DatasetCreate} />
          <Route exact key="datasetKey" path={`/dataset/:key/:section?`} 
            render={({match, location}) => (<DatasetPage section={match.params.section} datasetKey={match.params.key} location={location}/>)}
             />


          <Route exact key="dataset" path="/dataset" render={(props) => <DatasetList location={props.location} />} />
          <Route exact key="login" path="/user/login" render={(props) => <LoginPage location={props.location} />} />

          <Route component={NoMatch} />
        </Switch>
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
