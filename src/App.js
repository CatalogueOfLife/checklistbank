import React, { Component } from 'react';
import { Router, Route, Switch } from "react-router-dom";
import { NavLink } from "react-router-dom";

import history from './history';
import './App.css';
import DatasetList from './pages/DatasetList'
import DatasetPage from './pages/DatasetPage'
import DatasetCreate from './pages/DatasetCreate'
import TaxonPage from './pages/TaxonPage'
import ManagementClassification from './pages/ManagementClassification'

import Home from './pages/Home'



class App extends Component {
  render() {
    return (
      <Router history={history}>
        <Switch>
          <Route exact path="/" render={(props) => <Home />} />
          <Route exact key="managementClassification" path={`/managementclassification`} component={ManagementClassification} />
          <Route exact key="taxonKey" path={`/dataset/:key/taxon/:taxonKey`} component={TaxonPage} />
          <Route exact key="datasetCreate" path={`/dataset/create`} component={DatasetCreate} />
          <Route exact key="datasetKey" path={`/dataset/:key/:section?`} 
            render={({match, location}) => (<DatasetPage section={match.params.section} datasetKey={match.params.key} location={location}/>)}
             />


          <Route exact key="dataset" path="/dataset" render={(props) => <DatasetList />} />

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
