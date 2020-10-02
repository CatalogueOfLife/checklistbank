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
import CatalogueOptions from "./pages/catalogue/Options"
import CatalogueSourceDataset from "./pages/catalogue/SourceDataset"
import Admin from "./pages/Admin"
import EsAdmin from "./pages/Admin/EsAdmin"
import SectorDiff from "./pages/catalogue/SectorDiff"
import Imports from "./pages/Imports";
import ContextProvider from "./components/hoc/ContextProvider";
import Exception404 from "./components/exception/404";
import Helmet from "react-helmet";
import CatalogueReferences from "./pages/catalogue/CatalogueReferences";
import HomePage from "./pages/HomePage"
import NameIndex from "./pages/NameIndex"
import CatalogueSources from "./pages/catalogue/CatalogueSources"
import CatalogueSourceMetrics from "./pages/catalogue/CatalogueSourceMetrics"

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
          <link rel="canonical" href="https://data.catalogue.life/" />
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
              <PrivateRoute
                exact
                key="catalogueSources"
                path="/catalogue/:catalogueKey/sources"
                component={CatalogueSources}
              />
               <PrivateRoute
                exact
                key="catalogueSourceMetrics"
                path="/catalogue/:catalogueKey/sourcemetrics"
                component={CatalogueSourceMetrics}
              />
              <PrivateRoute
                exact
                key="Admin"
                path={`/admin/settings`}
                roles={["editor", "admin"]}
                component={Admin}
              />
              <PrivateRoute
                exact
                key="EsAdmin"
                path={`/admin/es`}
                roles={["editor", "admin"]}
                component={EsAdmin}
              />
              <PrivateRoute
                exact
                key="References"
                path="/catalogue/:catalogueKey/references/:key?"
                render={({ match, location }) => (
                  <CatalogueReferences section={match.params.section} location={location} />
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
                key="CatalogueOptions"
                path={`/catalogue/:catalogueKey/options`}
                roles={["editor"]}
                component={CatalogueOptions}
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
              <PrivateRoute
                exact
                key="catalogueMeta"
                path="/catalogue/:catalogueKey/meta"
                component={CatalogueMeta}
                
              />
              <PrivateRoute
                exact
                key="catalogueNameSearch"
                path="/catalogue/:catalogueKey/names"
                component={CatalogueNameSearch}
                
              />
              
              <PrivateRoute
                exact
                key="sectorSync"
                path="/catalogue/:catalogueKey/sector/sync"
                render={({ match, location }) => (
                  <SectorSync section={match.params.section} match={match} location={location} />
                )}
                
              />
              <PrivateRoute
                exact
                key="sector"
                path="/catalogue/:catalogueKey/sector"
                component={CatalogueSectors}
                
              />
              <PrivateRoute
                exact
                key="decisions"
                path="/catalogue/:catalogueKey/decision"
                component={CatalogueDecisions}
                
              /> 
              
              <PrivateRoute
                exact
                key="sectorDiff"
                path="/catalogue/:catalogueKey/sync/:sectorKey/diff"
                component={SectorDiff}
                
              />

              <PrivateRoute
                exact
                key="catalogueTaxon"
                path="/catalogue/:catalogueKey/taxon/:taxonOrNameKey"
                component={CatalogueTaxon}
                
              />
              <PrivateRoute
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
              
              <PrivateRoute
                exact
                key="CatalogueSourceDataset"
                path={`/catalogue/:catalogueKey/dataset/:key/:section(issues|tasks|workbench|duplicates|meta|classification|references|imports|verbatim|taxon|name)/:taxonOrNameKey?`}
                component={CatalogueSourceDataset}
              
              />
              <PrivateRoute
                exact
                key="datasetKey"
                path={`/catalogue/:catalogueKey/dataset/:key/:section:(imports|classification|sectors|meta|names|taxon|name|verbatim)/:taxonOrNameKey?`}
                component={DatasetPage}
              
              />
              <Route
                exact
                key="datasetKey2"
                path={`/dataset/:key/:section?/:taxonOrNameKey?`}
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
                path={`/dataset/:key`}
                component={DatasetProvider}
              /> 
          <Route   
                         
                key="sourceDatasetProvider"
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
