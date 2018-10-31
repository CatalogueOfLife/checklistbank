import React, { Component } from 'react';
import { Router, Route, Switch } from "react-router-dom";
import { NavLink } from "react-router-dom";

import history from './history';
import './App.css';
import DatasetList from './pages/datasetList/DatasetList'
import DatasetPage from './pages/datasetKey/DatasetPage'
import DatasetCreate from './pages/datasetCreate/DatasetCreate'
import TaxonPage from './pages/taxon/TaxonPage'
import NamePage from './pages/name/NamePage'

import ManagementClassification from './pages/managementClassification/ManagementClassification'

import Home from './pages/Home'



class App extends Component {
  render() {
    return (
      <Router history={history}>
        <Switch>
          <Route exact path="/" render={(props) => <Home />} />
          <Route exact key="managementClassification" path={`/assembly`} component={ManagementClassification} />
          <Route exact key="taxonKey" path={`/dataset/:key/taxon/:taxonKey`} component={TaxonPage} />
          <Route exact key="nameKey" path={`/dataset/:key/name/:nameKey`} component={NamePage} />

          <Route exact key="datasetCreate" path={`/dataset/create`} component={DatasetCreate} />
          <Route exact key="datasetKey" path={`/dataset/:key/:section?`} 
            render={({match, location}) => (<DatasetPage section={match.params.section} datasetKey={match.params.key} location={location}/>)}
             />


          <Route exact key="dataset" path="/dataset" render={(props) => <DatasetList location={props.location} />} />

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
