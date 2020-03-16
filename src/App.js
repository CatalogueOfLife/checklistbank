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
import Assembly from "./pages/catalogue/Assembly";
import AssemblyDuplicates from "./pages/catalogue/AssemblyDuplicates";
import SectorSync from "./pages/catalogue/SectorSync"
import CatalogueSectors from "./pages/catalogue/CatalogueSectors"
import CatalogueTaxon from "./pages/catalogue/CatalogueTaxon"
import CatalogueName from "./pages/catalogue/CatalogueName"
import CatalogueMeta from "./pages/catalogue/CatalogueMeta";
import CatalogueNameSearch from "./pages/catalogue/CatalogueNameSearch"
import CatalogueDecisions from "./pages/catalogue/CatalogueDecisions"
import Admin from "./pages/Admin"
import SectorDiff from "./pages/catalogue/SectorDiff"
import Imports from "./pages/Imports";
import ContextProvider from "./components/hoc/ContextProvider";
import Exception404 from "./components/exception/404";
import Helmet from "react-helmet";
import Reference from "./pages/Reference";
import HomePage from "./pages/HomePage"
import NameIndex from "./pages/NameIndex"
import CatalogueSources from "./pages/catalogue/CatalogueSources"
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
                key="HomePage"
                path="/"
                component={HomePage}
              />
              <Route
                exact
                key="NameIndex"
                path="/names"
                render={({ match, location }) => (
                  <NameIndex section={match.params.section} location={location} />
                )}
              />
              <Route
                exact
                key="catalogueSources"
                path="/catalogue/:catalogueKey/sources"
                component={CatalogueSources}
              />
              <PrivateRoute
                exact
                key="Admin"
                path={`/admin`}
                roles={["editor", "admin"]}
                component={Admin}
              />
              <Route
                exact
                key="Reference"
                path="/catalogue/:catalogueKey/reference/:key?"
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
                path={`/catalogue/:catalogueKey/assembly`}
                roles={["editor"]}
                component={Assembly}
              />
              <PrivateRoute
                exact
                key="AssemblyDuplicates"
                path={`/catalogue/:catalogueKey/duplicates`}
                roles={["editor"]}
                component={AssemblyDuplicates}
              />
              <Route
                exact
                key="catalogueMeta"
                path="/catalogue/:catalogueKey/meta"
                component={CatalogueMeta}
                
              />
              <Route
                exact
                key="catalogueNameSearch"
                path="/catalogue/:catalogueKey/names"
                component={CatalogueNameSearch}
                
              />
              
              <Route
                exact
                key="sectorSync"
                path="/catalogue/:catalogueKey/sector/sync"
                render={({ match, location }) => (
                  <SectorSync section={match.params.section} location={location} />
                )}
                
              />
              <Route
                exact
                key="sector"
                path="/catalogue/:catalogueKey/sector"
                component={CatalogueSectors}
                
              />
              <Route
                exact
                key="decisions"
                path="/catalogue/:catalogueKey/decision"
                component={CatalogueDecisions}
                
              /> 
              
              <Route
                exact
                key="sectorDiff"
                path="/catalogue/:catalogueKey/sync/:sectorKey/diff"
                component={SectorDiff}
                
              />

              <Route
                exact
                key="catalogueTaxon"
                path="/catalogue/:catalogueKey/taxon/:taxonOrNameKey"
                component={CatalogueTaxon}
                
              />
              <Route
                exact
                key="catalogueName"
                path="/catalogue/:catalogueKey/name/:taxonOrNameKey"
                component={CatalogueName}
                
              />
              
          
              <PrivateRoute
                exact
                key="datasetCreate"
                path={`/newdataset`}
                roles={["editor", "admin"]}
                component={DatasetCreate}
              />
              
              <Route
                exact
                key="datasetKey"
                path={`/catalogue/:catalogueKey/dataset/:key/:section?/:taxonOrNameKey?`}
                component={DatasetPage}
              
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
                path={`/catalogue/:catalogueKey/dataset/:key`}
                component={DatasetProvider}
              /> 
              <Route            
                key="catalogueProvider"
                path={`/catalogue/:catalogueKey`}
                component={DatasetProvider}
              /> 
              </React.Fragment>
        </Router>
      </ContextProvider>
    );
  }
}

export default App;
