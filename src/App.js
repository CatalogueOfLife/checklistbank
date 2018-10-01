import React, { Component } from 'react';
import { Router, Route, Switch } from "react-router-dom";
import { NavLink } from "react-router-dom";

import history from './history';
import './App.css';
import DatasetList from './pages/DatasetList'
import DatasetPage from './pages/DatasetPage'
import TaxonPage from './pages/TaxonPage'

import Home from './pages/Home'



class App extends Component {
  render() {
    return (
      <Router history={history}>
        <Switch>
          <Route exact path="/" render={(props) => <Home />} />
          <Route exact key="taxonKey" path={`/dataset/:key/taxon/:taxonKey`} component={TaxonPage} />
          <Route exact key="datasetKey" path={`/dataset/:key/:section?`} component={DatasetPage} />
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
