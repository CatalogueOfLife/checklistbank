import React, { useEffect } from "react";
import { Router, Route, Switch } from "react-router-dom";
import PrivateRoute from "./components/Auth/PrivateRoute";
import AdminRoute from "./components/Auth/AdminRoute";
import history from "./history";
import "./App.css";
import DatasetList from "./pages/DatasetList";
import DatasetPage from "./pages/DatasetKey";
import DatasetCreate from "./pages/DatasetCreate";

import { ThemeProvider } from "react-jss";
import DatasetProvider from "./components/hoc/DatasetProvider";
import SyncProvider from "./components/hoc/SyncProvider";
import BackgroundProvider from "./components/hoc/BackgroundProvider";

import Assembly from "./pages/catalogue/Assembly";
import AssemblyDuplicates from "./pages/catalogue/AssemblyDuplicates";
import AssemblyTasks from "./pages/catalogue/AssemblyTasks";

import SectorSync from "./pages/catalogue/SectorSync";
import SectorPriority from "./pages/catalogue/CatalogueSectors/Priority";
import CatalogueSectors from "./pages/catalogue/CatalogueSectors";
import CatalogueTaxon from "./pages/catalogue/CatalogueTaxon";
import CatalogueName from "./pages/catalogue/CatalogueName";
import CatalogueMeta from "./pages/catalogue/CatalogueMeta";
import CatalogueNameSearch from "./pages/catalogue/CatalogueNameSearch";
import CatalogueDecisions from "./pages/catalogue/CatalogueDecisions";
import CatalogueOptions from "./pages/catalogue/Options";
import CatalogueSourceDataset from "./pages/catalogue/SourceDataset";
import ProjectEditors from "./pages/catalogue/Editors";

import Admin from "./pages/Admin";
import EsAdmin from "./pages/Admin/EsAdmin";
import UserAdmin from "./pages/Admin/Users";
import AdminJobs from "./pages/Admin/Jobs";
import SectorDiff from "./pages/catalogue/SectorDiff";
import Imports from "./pages/Imports";
import ContextProvider from "./components/hoc/ContextProvider";
import Exception404 from "./components/exception/404";
import ExceptionHandler from "./components/exception/ExceptionHandler";
import Helmet from "react-helmet";
import CatalogueReferences from "./pages/catalogue/CatalogueReferences";
import HomePage from "./pages/HomePage";
import CatalogueSources from "./pages/catalogue/CatalogueSources";
import CatalogueSourceMetrics from "./pages/catalogue/CatalogueSourceMetrics";
import MetaDataGenerator from "./pages/tools/MetaDataGenerator";
import NameMatch from "./pages/tools/NameMatch3";
import GBIFTaxonomyReview from "./pages/tools/GBIFTaxonomyReview";
import DiffViewer from "./pages/tools/DiffViewer";
import TaxonComparer from "./pages/tools/TaxonComparer";
import NameUsageSearch from "./pages/NameSearch/Search";
import UserProfile from "./pages/UserProfile";
import NameIndexKey from "./pages/NameIndex/NameIndexKey";
import NameIndexSearch from "./pages/NameIndex/NameIndexSearch";
import DownloadKey from "./pages/Download/DatasetDownloadKey";
import Analytics from "./Analytics";
import config from "./config";

const theme = {
  colorPrimary: "deepskyblue",
};

const App = () => {
  return (
    <ContextProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>ChecklistBank (CLB)</title>
      </Helmet>
      <Router history={history}>
        {["dev", "prod"].includes(config.env) && <Analytics />}
        <React.Fragment>
          <ThemeProvider theme={theme}>
            <Switch>
              <Route exact key="HomePage" path="/" component={HomePage} />

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
              <AdminRoute
                exact
                key="Admin"
                path={`/admin/settings`}
                roles={["editor", "admin"]}
                component={Admin}
              />
              <AdminRoute
                exact
                key="UserJobs"
                path={`/admin/jobs`}
                roles={["admin"]}
                component={AdminJobs}
              />
              <AdminRoute
                exact
                key="UserAdmin"
                path={`/admin/users`}
                roles={["admin"]}
                component={UserAdmin}
              />
              <AdminRoute
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
                component={CatalogueReferences}
              />
              <Route
                exact
                key="imports"
                path="/imports"
                render={({ match, location }) => (
                  <Imports location={location} />
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
                key="AssemblyTasks"
                path={`/catalogue/:catalogueKey/tasks`}
                roles={["editor"]}
                component={AssemblyTasks}
              />
              <PrivateRoute
                exact
                key="catalogueMeta"
                path="/catalogue/:catalogueKey/metadata"
                component={CatalogueMeta}
              />
              <PrivateRoute
                exact
                key="projectEditors"
                path="/catalogue/:catalogueKey/editors"
                component={ProjectEditors}
              />
              <PrivateRoute
                exact
                key="catalogueNameSearch"
                path="/catalogue/:catalogueKey/names"
                component={CatalogueNameSearch}
              />
              <PrivateRoute
                exact
                key="sectorPriority"
                path="/catalogue/:catalogueKey/sector/priority"
                component={SectorPriority}
              />
              <PrivateRoute
                exact
                key="sectorSync"
                path="/catalogue/:catalogueKey/sector/sync"
                component={SectorSync}
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

              <Route
                exact
                key="datasetCreate"
                path={`/newdataset`}
                component={DatasetCreate}
              />

              <PrivateRoute
                exact
                key="CatalogueSourceDataset"
                path={`/catalogue/:catalogueKey/dataset/:sourceKey/:section(issues|tasks|workbench|duplicates|metadata|classification|references|imports|verbatim|taxon|name)/:taxonOrNameKey?`}
                component={CatalogueSourceDataset}
              />
              <PrivateRoute
                exact
                key="datasetKey"
                path={`/catalogue/:catalogueKey/dataset/:sourceKey/:section:(imports|classification|sectors|metadata|names|taxon|name|verbatim)/:taxonOrNameKey?`}
                component={DatasetPage}
              />
              <Route
                exact
                key="datasetKey2"
                path={`/dataset/:key/:section?/:taxonOrNameKey?/:subsection?`}
                component={DatasetPage}
              />
              <Route
                exact
                key="dataset"
                path="/dataset"
                render={(props) => <DatasetList location={props.location} />}
              />
              <Route
                exact
                key="nameUsageSearch"
                path={`/nameusage/search`}
                component={NameUsageSearch}
              />

              <Route
                exact
                key="metadatagenerator"
                path={`/tools/metadata-generator`}
                component={MetaDataGenerator}
              />
              <Route
                exact
                key="namematch"
                path={`/tools/name-match`}
                component={NameMatch}
              />
              <Route
                exact
                key="diffviewer"
                path={`/tools/diff-viewer`}
                component={DiffViewer}
              />
              <Route
                exact
                key="datasetComparison"
                path={`/tools/dataset-comparison`}
                component={TaxonComparer}
              />
              <Route
                exact
                key="namematch"
                path={`/tools/gbif-impact`}
                component={GBIFTaxonomyReview}
              />
              <Route
                exact
                key="userprofile"
                path={`/user-profile/:tab?`}
                component={UserProfile}
              />
              <Route
                exact
                key="download"
                path={`/download/:key`}
                component={DownloadKey}
              />
              <Route
                exact
                key="nameIndexSearch"
                path={`/namesindex`}
                component={NameIndexSearch}
              />
              <Route
                exact
                key="nameIndexKey"
                path={`/namesindex/:key/:section?`}
                component={NameIndexKey}
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
            path={`/catalogue/:catalogueKey/dataset/:sourceKey`}
            component={DatasetProvider}
          />
          <Route
            key="catalogueProvider"
            path={`/catalogue/:catalogueKey`}
            component={DatasetProvider}
          />
          <Route
            key="syncProvider"
            path={`/catalogue/:catalogueKey`}
            component={SyncProvider}
          />
          <Route
            key="exceptionHandler"
            path={`/`}
            component={ExceptionHandler}
          />
          <Route
            key="backgroundProvider"
            path={`/`}
            component={BackgroundProvider}
          />
        </React.Fragment>
      </Router>
    </ContextProvider>
  );
};

export default App;
