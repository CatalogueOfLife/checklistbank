import React, { useEffect } from "react";
import { Router, Route, Switch, Redirect } from "react-router-dom";
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

import About from "./pages/About";
import Assembly from "./pages/project/Assembly";
import AssemblyDuplicates from "./pages/project/AssemblyDuplicates";
import AssemblyTasks from "./pages/project/AssemblyTasks";

import SectorSync from "./pages/project/SectorSync";
import SectorPriority from "./pages/project/ProjectSectors/Priority";
import SectorPublishers from "./pages/project/SectorPublishers";
import ProjectSectors from "./pages/project/ProjectSectors";
import ProjectTaxon from "./pages/project/ProjectTaxon";
import ProjectName from "./pages/project/ProjectName";
import ProjectMeta from "./pages/project/ProjectMeta";
import ProjectNameSearch from "./pages/project/ProjectNameSearch";
import ProjectDecisions from "./pages/project/ProjectDecisions";
import ProjectOptions from "./pages/project/Options";
import ProjectPublishers from "./pages/project/Options/Publishers";
import ProjectPublisherKey from "./pages/project/ProjectPublisherKey";
import ProjectSourceDataset from "./pages/project/SourceDataset";
import ProjectIssues from "./pages/project/ProjectIssues";
import ProjectDownload from "./pages/project/ProjectDownload";

import ProjectEditors from "./pages/project/Editors";

import Admin from "./pages/Admin";
import SystemHealth from "./pages/SystemHealth";
import DatasetAdmin from "./pages/Admin/DatasetAdmin";
import MatcherAdmin from "./pages/Admin/MatcherAdmin";
import UserAdmin from "./pages/Admin/Users";
import AdminJobs from "./pages/Admin/Jobs";
import SectorDiff from "./pages/project/SectorDiff";
import Imports from "./pages/Imports";
import ContextProvider from "./components/hoc/ContextProvider";
import Exception404 from "./components/exception/404";
import ExceptionHandler from "./components/exception/ExceptionHandler";
import Helmet from "react-helmet";
import ProjectReferences from "./pages/project/ProjectReferences";
import HomePage from "./pages/HomePage";
import ProjectSources from "./pages/project/ProjectSources";
import ProjectSourceMetrics from "./pages/project/ProjectSourceMetrics";
import MetaDataGenerator from "./pages/tools/MetaDataGenerator";
import ArchiveValidator from "./pages/tools/ArchiveValidator";
import NameMatch from "./pages/tools/NameMatch";
import NameMatchJob from "./pages/tools/NameMatchJob";

import GBIFTaxonomyReview from "./pages/tools/GBIFTaxonomyReview";
import DiffViewer from "./pages/tools/DiffViewer";
import TaxAlign from "./pages/tools/TaxAlign";

import ToolIndex from "./pages/tools/ToolIndex";
import TaxonComparer from "./pages/tools/TaxonComparer";
import NameUsageSearch from "./pages/NameSearch/Search";
import GlobalRedirect from "./pages/GlobalRedirect";
import UserProfile from "./pages/UserProfile";
import NameIndexKey from "./pages/NameIndex/NameIndexKey";
import NameIndexSearch from "./pages/NameIndex/NameIndexSearch";
import VocabularyKey from "./pages/Vocabulary/VocabularyKey";
import VocabularyIndex from "./pages/Vocabulary/VocabularyIndex";
import TaxGroupTree from "./pages/Vocabulary/TaxGroupTree";
import DownloadKey from "./pages/Download/DatasetDownloadKey";
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
        <React.Fragment>
          <ThemeProvider theme={theme}>
            <Switch>
              <Route exact key="HomePage" path="/" component={HomePage} />
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
                key="DatasetAdmin"
                path={`/admin/datasets`}
                roles={["editor", "admin"]}
                component={DatasetAdmin}
              />
              <AdminRoute
                exact
                key="MatcherAdmin"
                path={`/admin/matcher`}
                roles={["editor", "admin"]}
                component={MatcherAdmin}
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
                key="References"
                path="/project/:projectKey/references/:key?"
                component={ProjectReferences}
              />
              <PrivateRoute
                exact
                key="catalogueSources"
                path="/project/:projectKey/sources/:issues?"
                component={ProjectSources}
              />
              <PrivateRoute
                exact
                key="catalogueSourceMetrics"
                path="/project/:projectKey/sourcemetrics"
                component={ProjectSourceMetrics}
              />
              <PrivateRoute
                exact
                key="ProjectOptions"
                path={`/project/:projectKey/options`}
                roles={["editor"]}
                component={ProjectOptions}
              />
              <PrivateRoute
                exact
                key="ProjectPublishers"
                path={`/project/:projectKey/publishers`}
                roles={["editor"]}
                component={ProjectPublishers}
              />
              <PrivateRoute
                exact
                key="Assembly"
                path={`/project/:projectKey/assembly`}
                roles={["editor"]}
                component={Assembly}
              />
              <PrivateRoute
                exact
                key="catalogueDownload"
                path="/project/:projectKey/download/:key?"
                component={ProjectDownload}
              />
              <PrivateRoute
                exact
                key="AssemblyDuplicates"
                path={`/project/:projectKey/duplicates`}
                roles={["editor"]}
                component={AssemblyDuplicates}
              />
              <PrivateRoute
                exact
                key="AssemblyTasks"
                path={`/project/:projectKey/tasks`}
                roles={["editor"]}
                component={AssemblyTasks}
              />
              <PrivateRoute
                exact
                key="catalogueMeta"
                path="/project/:projectKey/metadata"
                component={ProjectMeta}
              />
              <PrivateRoute
                exact
                key="projectEditors"
                path="/project/:projectKey/editors"
                component={ProjectEditors}
              />
              <PrivateRoute
                exact
                key="catalogueNameSearch"
                path="/project/:projectKey/names"
                component={ProjectNameSearch}
              />
              <PrivateRoute
                exact
                key="sectorPriority"
                path="/project/:projectKey/sector/priority"
                component={SectorPriority}
              />
              <PrivateRoute
                exact
                key="sectorSync"
                path="/project/:projectKey/sector/sync"
                component={SectorSync}
              />
              <PrivateRoute
                exact
                key="sectorPublishers"
                path="/project/:projectKey/sector/publishers"
                component={SectorPublishers}
              />
              <PrivateRoute
                exact
                key="sector"
                path="/project/:projectKey/sector"
                component={ProjectSectors}
              />
              <PrivateRoute
                exact
                key="cataloguePublisherKey"
                path="/project/:projectKey/publisher/:key?"
                component={ProjectPublisherKey}
              />
              <PrivateRoute
                exact
                key="decisions"
                path="/project/:projectKey/decision"
                component={ProjectDecisions}
              />
              <PrivateRoute
                exact
                key="decisions"
                path="/project/:projectKey/issues"
                component={ProjectIssues}
              />

              <PrivateRoute
                exact
                key="sectorDiff"
                path="/project/:projectKey/sync/:sectorKey/diff"
                component={SectorDiff}
              />

              <PrivateRoute
                exact
                key="catalogueTaxon"
                path="/project/:projectKey/taxon/:taxonOrNameKey"
                component={ProjectTaxon}
              />
              <PrivateRoute
                exact
                key="catalogueName"
                path="/project/:projectKey/name/:taxonOrNameKey"
                component={ProjectName}
              />
              <PrivateRoute
                exact
                key="ProjectSourceDataset"
                path={`/project/:projectKey/dataset/:sourceKey/:section(issues|tasks|workbench|duplicates|metadata|classification|references|imports|verbatim|taxon|name)/:taxonOrNameKey?`}
                component={ProjectSourceDataset}
              />
              <PrivateRoute
                exact
                key="datasetKey"
                path={`/project/:projectKey/dataset/:sourceKey/:section:(imports|classification|sectors|metadata|names|taxon|name|verbatim)/:taxonOrNameKey?`}
                component={DatasetPage}
              />

              <Route
                exact
                key="datasetCreate"
                path={`/newdataset`}
                component={DatasetCreate}
              />
              <Route
                exact
                key="dataset"
                path="/dataset"
                render={(props) => <DatasetList location={props.location} />}
              />
              <Route
                exact
                key="datasetKey2"
                path={`/dataset/:key/:section?/:taxonOrNameKey?/:subsection?`}
                component={DatasetPage}
              />
              <Route
                exact
                key="nameUsageSearch"
                path={`/nameusage/search`}
                component={NameUsageSearch}
              />
              <Route
                exact
                key="nameUsageID"
                path="/nameusage/:id"
                component={GlobalRedirect}
              />

              <Route
                exact
                key="metadatagenerator"
                path={`/tools/metadata-generator`}
                component={MetaDataGenerator}
              />
              <Route
                exact
                key="validator"
                path={`/tools/validator`}
                component={ArchiveValidator}
              />
              <Route
                exact
                key="namematch"
                path={`/tools/name-match`}
                component={NameMatch}
              />

              <Route
                exact
                key="namematchjob"
                path={`/tools/name-match/job/:key`}
                component={NameMatchJob}
              />
              <Route
                exact
                key="diffviewer"
                path={`/tools/diff-viewer`}
                component={DiffViewer}
              />
              <Route
                exact
                key="taxalign"
                path={`/tools/taxonomic-alignment`}
                component={TaxAlign}
              />
              <Route
                exact
                key="datasetComparison"
                path={`/tools/dataset-comparison`}
                component={TaxonComparer}
              />
              <Route
                exact
                key="gbifimpact"
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
              <Route
                exact
                key="vocabIndex"
                path={`/vocabulary`}
                component={VocabularyIndex}
              />
              <Route
                exact
                key="vocabIndexKey"
                path={`/vocabulary/taxgrouptree`}
                component={TaxGroupTree}
              />
              <Route
                exact
                key="vocabIndexKey"
                path={`/vocabulary/:key`}
                component={VocabularyKey}
              />
              <Route
                exact
                key="toolsIndex"
                path={`/tools/index`}
                component={ToolIndex}
              />
              <Route
                exact
                key="about"
                path={`/about/:mdFile`}
                component={About}
              />
              <Route
                exact
                key="systemHealth"
                path={`/system-health`}
                component={SystemHealth}
              />
              {/* Back-compat: the route prefix was renamed from /catalogue/
                  to /project/. Preserve the path tail and query string. */}
              <Route
                key="catalogueRedirect"
                path="/catalogue/:rest*"
                render={({ location }) => (
                  <Redirect
                    to={{
                      pathname: location.pathname.replace(
                        /^\/catalogue\//,
                        "/project/"
                      ),
                      search: location.search,
                      hash: location.hash,
                    }}
                  />
                )}
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
            path={`/project/:projectKey/dataset/:sourceKey`}
            component={DatasetProvider}
          />
          <Route
            key="catalogueProvider"
            path={`/project/:projectKey`}
            component={DatasetProvider}
          />
          <Route
            key="syncProvider"
            path={`/project/:projectKey`}
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
