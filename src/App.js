import React, { Component } from "react";
import { Router, Route, Switch, Redirect } from "react-router-dom";
import PrivateRoute from "./components/Auth/PrivateRoute";

import history from "./history";
import "./App.css";
import DatasetList from "./pages/DatasetList";
import DatasetPage from "./pages/DatasetKey";
import DatasetCreate from "./pages/DatasetCreate";
import Taxon from "./pages/Taxon";
import Name from "./pages/Name";
import VerbatimRecord from "./pages/VerbatimRecord"
import { ThemeProvider } from "react-jss";
import DatasetProvider from "./components/hoc/DatasetProvider"
import Assembly from "./pages/Assembly";
import AssemblyDuplicates from "./pages/AssemblyDuplicates";
import SectorSync from "./pages/SectorSync"
import SectorBroken from "./pages/BrokenSectors"
import DecisionBroken from "./pages/BrokenDecisions"
import Admin from "./pages/Admin"
import SectorDiff from "./pages/SectorDiff"
import Imports from "./pages/Imports";
import ContextProvider from "./components/hoc/ContextProvider";
import Exception404 from "./components/exception/404";
import Helmet from "react-helmet";
import DatasetImportMetrics from "./pages/DatasetImportMetrics";
import Reference from "./pages/Reference"

const theme = {
  colorPrimary: "deepskyblue"
};

class App extends Component {
  render() {
    return (
      <ContextProvider>
        <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+</title>
          <link rel="canonical" href="http://test.col.plus" />
        </Helmet>
        <Router history={history}>
        <React.Fragment>
          <ThemeProvider theme={theme}>
            <Switch>
              <Route
                exact
                path="/"
                render={props => (
                  <Redirect
                    to={{
                      pathname: "/imports/running"
                    }}
                  />
                )}
              />
              <PrivateRoute
                exact
                key="Admin"
                path={`/admin`}
                roles={["editor"]}
                component={Admin}
              />
              <Route
                exact
                key="reference"
                path="/reference/:key?"
                render={({ match, location }) => (
                  <Reference section={match.params.section} location={location} />
                )}
              />
              <Route
                exact
                key="imports"
                path="/imports/:section?"
                render={({ match, location }) => (
                  <Imports section={match.params.section} location={location} />
                )}
              />
              <PrivateRoute
                exact
                key="Assembly"
                path={`/assembly`}
                roles={["editor"]}
                component={Assembly}
              />
              <PrivateRoute
                exact
                key="AssemblyDuplicates"
                path={`/assembly/duplicates`}
                roles={["editor"]}
                component={AssemblyDuplicates}
              />
              <Route
                exact
                key="sectorSync"
                path="/sector/sync"
                component={SectorSync}
                
              />
              <Route
                exact
                key="sectorBroken"
                path="/sector/broken"
                component={SectorBroken}
                
              />
              <Route
                exact
                key="decisionBroken"
                path="/decision/broken"
                component={DecisionBroken}
                
              />
              
              <Route
                exact
                key="sectorDiff"
                path="/assembly/:catalogueKey/sync/:sectorKey/diff"
                component={SectorDiff}
                
              />
              <Route
                exact
                key="taxonKey"
                path={`/dataset/:key/taxon/:taxonKey`}
                component={Taxon}
              />
              <Route
                exact
                key="nameKey"
                path={`/dataset/:key/name/:nameKey`}
                component={Name}
              />
              <Route
                exact
                key="datasetImportsKey"
                path={`/dataset/:datasetKey/metrics/:attempt?`}
                component={DatasetImportMetrics}
              />
              <Route
                exact
                key="verbatimKey"
                path={`/dataset/:key/verbatim`}
                component={VerbatimRecord}
              />
              <PrivateRoute
                exact
                key="datasetCreate"
                path={`/newdataset`}
                roles={["editor", "admin"]}
                component={DatasetCreate}
              />
              />
              <Route
                exact
                key="datasetKey"
                path={`/dataset/:key/:section?`}
                render={({ match, location }) => (
                  <DatasetPage
                    section={match.params.section}
                    datasetKey={match.params.key}
                    location={location}
                  />
                )}
              />
              <Route
                exact
                key="dataset"
                path="/dataset"
                render={props => <DatasetList location={props.location} />}
              />
              <Route component={Exception404} />
            </Switch>
            
          </ThemeProvider>
          <Route            
                key="datasetProvider"
                path={`/dataset/:key`}
                component={DatasetProvider}
              />
              </React.Fragment>
        </Router>
      </ContextProvider>
    );
  }
}

export default App;
