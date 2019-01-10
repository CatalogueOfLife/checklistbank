import React, { Component } from 'react';
// Configure JWT Auth:
import axios from 'axios';


import { Router, Route, Switch, Redirect } from "react-router-dom";
import PrivateRoute from './components/Auth/PrivateRoute'

import history from './history';
import './App.css';
import DatasetList from './pages/DatasetList'
import DatasetPage from './pages/DatasetKey'
import DatasetCreate from './pages/DatasetCreate'
import Taxon from './pages/Taxon'
import Name from './pages/Name'
import { ThemeProvider } from 'react-jss'

import Assembly from './pages/Assembly'

import Imports from './pages/Imports'
import ContextProvider from './components/hoc/ContextProvider';
import Exception404 from './components/exception/404'

const theme = {
  colorPrimary: 'deepskyblue'
}

class App extends Component {
  render() {
    return (
      <ContextProvider>

      <Router history={history}>
        <ThemeProvider theme={theme}>
        <Switch>
          <Route exact path="/" render={(props) => <Redirect to={{
            pathname: '/imports/running'
          }} />} />
          <Route exact path="/imports/:section?" render={({match}) => <Imports section={match.params.section}/>} />
          <PrivateRoute exact key="Assembly" path={`/assembly`} roles={['editor']} component={Assembly}></PrivateRoute> />
          <Route exact key="taxonKey" path={`/dataset/:key/taxon/:taxonKey`} component={Taxon} />
          <Route exact key="nameKey" path={`/dataset/:key/name/:nameKey`} component={Name} />

          <PrivateRoute exact key="datasetCreate" path={`/dataset/create`}  roles={['editor', 'admin']} component={DatasetCreate}></PrivateRoute> />

          <Route exact key="datasetKey" path={`/dataset/:key/:section?`} 
            render={({match, location}) => (<DatasetPage section={match.params.section} datasetKey={match.params.key} location={location}/>)}
             />


          <Route exact key="dataset" path="/dataset" render={(props) => <DatasetList location={props.location} />} />

          <Route component={Exception404}/>
        </Switch>
        </ThemeProvider>
      </Router>
      </ContextProvider>

    );
  }
}


export default App;
