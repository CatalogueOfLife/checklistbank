import React, { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConfigProvider, App as AntdApp } from "antd";
import PrivateRoute from "./components/Auth/PrivateRoute";
import AdminRoute from "./components/Auth/AdminRoute";
import { installNavigator } from "./history";
import "./App.css";
import DatasetList from "./pages/DatasetList";
import DatasetPage from "./pages/DatasetKey";
import DatasetCreate from "./pages/DatasetCreate";

import DatasetKeyAliasGate from "./components/DatasetKeyAliasGate";
import DatasetProvider from "./components/hoc/DatasetProvider";
import ProjectJobProvider from "./components/hoc/ProjectJobProvider";
import BackgroundProvider from "./components/hoc/BackgroundProvider";

import About from "./pages/About";
import AboutIdentifiers from "./pages/About/Identifiers";
import Assembly from "./pages/project/Assembly";
import AssemblyDuplicates from "./pages/project/AssemblyDuplicates";
import AssemblyTasks from "./pages/project/AssemblyTasks";

import SectorSync from "./pages/project/SectorSync";
import SectorPriority from "./pages/project/ProjectSectors/Priority";
import SectorPublishers from "./pages/project/SectorPublishers";
import SectorProfiles from "./pages/project/SectorProfiles";
import SectorDuplicates from "./pages/project/SectorDuplicates";
import ProjectSectors from "./pages/project/ProjectSectors";
import ProjectTaxon from "./pages/project/ProjectTaxon";
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
import UserAdmin from "./pages/Admin/Users";
import SectorDiff from "./pages/project/SectorDiff";
import Jobs from "./pages/Jobs";
import ContextProvider from "./components/hoc/ContextProvider";
import Exception404 from "./components/exception/404";
import ExceptionHandler from "./components/exception/ExceptionHandler";
import ErrorBoundary from "./components/exception/ErrorBoundary";
import ProjectReferences from "./pages/project/ProjectReferences";
import HomePage from "./pages/HomePage";
import ProjectSources from "./pages/project/ProjectSources";
import ProjectSourceMetrics from "./pages/project/ProjectSourceMetrics";
import MetaDataGenerator from "./pages/tools/MetaDataGenerator";
import ArchiveValidator from "./pages/tools/ArchiveValidator";
import NameMatch from "./pages/tools/NameMatch";
import NameMatchJob from "./pages/tools/NameMatchJob";
import NameParser from "./pages/tools/NameParser";
import TaxGroupParser from "./pages/tools/TaxGroupParser";

import GBIFTaxonomyReview from "./pages/tools/GBIFTaxonomyReview";
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
import TaxGroup from "./pages/Vocabulary/TaxGroup";
import Gazetteer from "./pages/Vocabulary/Gazetteer";
import GazetteerKey from "./pages/Vocabulary/GazetteerKey";
import AreaKey from "./pages/Vocabulary/AreaKey";
import GeoTime from "./pages/Vocabulary/GeoTime";
import DownloadKey from "./pages/Download/DatasetDownloadKey";

// antd 5+ defaults to a different blue than v4. Pin colorPrimary so the brand
// blue (deepskyblue) survives the antd version bump. 
const antdTheme = { token: { colorPrimary: "#1890ff", borderRadius: 2 } };

// Wires `useNavigate` into the legacy `history.push()` shim once on mount.
const NavigatorInstaller = () => {
  const navigate = useNavigate();
  useEffect(() => {
    installNavigator(navigate);
  }, [navigate]);
  return null;
};

// Wraps the routed page content in an error boundary so a render-time throw in
// any page shows a recoverable error card instead of blanking the whole app
// (issue #1667). Keyed on the pathname so navigating elsewhere clears the error.
const RoutedErrorBoundary = ({ children }) => {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
};

// Back-compat: the route prefix was renamed from `/catalogue/` to `/project/`.
// Preserve the path tail and query string so existing bookmarks and external
// links don't break.
const CatalogueRedirect = () => {
  const location = useLocation();
  const newPath = location.pathname.replace(/^\/catalogue\//, "/project/");
  return <Navigate to={`${newPath}${location.search}${location.hash}`} replace />;
};

// Back-compat: the diff viewer became the second step of the dataset
// comparison, which reads the same dataset / root / dataset2 / root2 params.
const DiffViewerRedirect = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set("step", "diff");
  return <Navigate to={`/tools/dataset-comparison?${params}`} replace />;
};

// Back-compat: the taxgroup tree became a tab of the taxgroup vocabulary page.
// Keep the anchor, which names the selected group.
const TaxGroupTreeRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/vocabulary/taxgroup${location.hash}`} replace />;
};

// Router 6 requires `<Route>` to live inside `<Routes>`. The Router-5 code
// rendered these provider routes as siblings of the main `<Switch>` so each
// matched independently; we give each its own `<Routes>` so the same
// "render whenever this prefix matches" semantics survive. Each block also
// needs a catch-all `<Route path="*" element={null} />` so non-matching URLs
// don't trigger R6's "No routes matched location" console warning.
const ProviderRoutes = () => (
  <>
    <Routes>
      <Route path="/dataset/:key/*" element={<DatasetProvider />} />
      <Route path="*" element={null} />
    </Routes>
    <Routes>
      <Route path="/project/:projectKey/*" element={<DatasetProvider />} />
      <Route path="*" element={null} />
    </Routes>
    <Routes>
      <Route path="/project/:projectKey/*" element={<ProjectJobProvider />} />
      <Route path="*" element={null} />
    </Routes>
    <Routes>
      <Route path="/*" element={<ExceptionHandler />} />
    </Routes>
    <Routes>
      <Route path="/*" element={<BackgroundProvider />} />
    </Routes>
  </>
);

const App = () => {
  return (
    <ConfigProvider theme={antdTheme}>
      <AntdApp>
      <ContextProvider>
        <Helmet>
          <meta charSet="utf-8" />
          <title>ChecklistBank (CLB)</title>
        </Helmet>
        <BrowserRouter>
          <NavigatorInstaller />
          <RoutedErrorBoundary>
          {/* Resolves an aliased dataset key (gbif-<uuid>, COL2024, 3LR) to its
              integer and replaces the URL before anything below can request
              against the alias. */}
          <DatasetKeyAliasGate>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/admin/settings"
              element={
                <AdminRoute roles={["editor", "admin"]}>
                  <Admin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute roles={["admin"]}>
                  <UserAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/datasets"
              element={
                <AdminRoute roles={["editor", "admin"]}>
                  <DatasetAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/matcher"
              element={<Navigate to="/admin/datasets?tab=matcher" replace />}
            />
            <Route path="/jobs" element={<Jobs />} />
            {/* The unified job page absorbed these three views. Each old route
                redirects to the filter that view used to be. */}
            <Route
              path="/imports"
              element={<Navigate to="/jobs?lane=import" replace />}
            />
            <Route
              path="/admin/jobs"
              element={<Navigate to="/jobs?tab=queue" replace />}
            />
            <Route
              path="/project/:projectKey/references/:key?"
              element={
                <PrivateRoute>
                  <ProjectReferences />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/sources/:issues?"
              element={
                <PrivateRoute>
                  <ProjectSources />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/sourcemetrics"
              element={
                <PrivateRoute>
                  <ProjectSourceMetrics />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/options"
              element={
                <PrivateRoute roles={["editor"]}>
                  <ProjectOptions />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/publishers"
              element={
                <PrivateRoute roles={["editor"]}>
                  <ProjectPublishers />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/assembly"
              element={
                <PrivateRoute roles={["editor"]}>
                  <Assembly />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/download/:key?"
              element={
                <PrivateRoute>
                  <ProjectDownload />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/duplicates"
              element={
                <PrivateRoute roles={["editor"]}>
                  <AssemblyDuplicates />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/tasks"
              element={
                <PrivateRoute roles={["editor"]}>
                  <AssemblyTasks />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/metadata"
              element={
                <PrivateRoute>
                  <ProjectMeta />
                </PrivateRoute>
              }
            />
            {/* a bare project link opens its metadata, like datasets do */}
            <Route
              path="/project/:projectKey"
              element={<Navigate to="metadata" replace />}
            />
            <Route
              path="/project/:projectKey/editors"
              element={
                <PrivateRoute>
                  <ProjectEditors />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/names"
              element={
                <PrivateRoute>
                  <ProjectNameSearch />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/sector/priority"
              element={
                <PrivateRoute>
                  <SectorPriority />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/sector/sync"
              element={
                <PrivateRoute>
                  <SectorSync />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/sector/duplicate"
              element={
                <PrivateRoute>
                  <SectorDuplicates />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/sector/publishers"
              element={
                <PrivateRoute>
                  <SectorPublishers />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/sector/profiles"
              element={
                <PrivateRoute>
                  <SectorProfiles />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/sector"
              element={
                <PrivateRoute>
                  <ProjectSectors />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/publisher/:key?"
              element={
                <PrivateRoute>
                  <ProjectPublisherKey />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/decision"
              element={
                <PrivateRoute>
                  <ProjectDecisions />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/issues"
              element={
                <PrivateRoute>
                  <ProjectIssues />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/sync/:sectorKey/diff"
              element={
                <PrivateRoute>
                  <SectorDiff />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/taxon/:taxonOrNameKey"
              element={
                <PrivateRoute>
                  <ProjectTaxon />
                </PrivateRoute>
              }
            />
            {/* nameusage is an alias of taxon (as on dataset pages), so synonym
                links pointing at /nameusage/ resolve instead of 404ing. */}
            <Route
              path="/project/:projectKey/nameusage/:taxonOrNameKey"
              element={
                <PrivateRoute>
                  <ProjectTaxon />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/name/:taxonOrNameKey"
              element={
                <PrivateRoute>
                  <ProjectTaxon />
                </PrivateRoute>
              }
            />
            <Route
              path="/project/:projectKey/dataset/:sourceKey/:section/:taxonOrNameKey?"
              element={
                <PrivateRoute>
                  <ProjectSourceDataset />
                </PrivateRoute>
              }
            />
            <Route path="/newdataset" element={<DatasetCreate />} />
            <Route path="/dataset" element={<DatasetList />} />
            <Route
              path="/dataset/:key/:section?/:taxonOrNameKey?/:subsection?"
              element={<DatasetPage />}
            />
            <Route path="/nameusage/search" element={<NameUsageSearch />} />
            <Route path="/nameusage/:id" element={<GlobalRedirect />} />
            <Route
              path="/tools/metadata-generator"
              element={<MetaDataGenerator />}
            />
            <Route path="/tools/validator" element={<ArchiveValidator />} />
            <Route path="/tools/name-match" element={<NameMatch />} />
            <Route
              path="/tools/name-match/job/:key"
              element={<NameMatchJob />}
            />
            <Route path="/tools/name-parser" element={<NameParser />} />
            <Route path="/tools/taxgroup-parser" element={<TaxGroupParser />} />
            <Route path="/tools/diff-viewer" element={<DiffViewerRedirect />} />
            <Route path="/tools/taxonomic-alignment" element={<TaxAlign />} />
            <Route
              path="/tools/dataset-comparison"
              element={<TaxonComparer />}
            />
            <Route
              path="/tools/gbif-impact"
              element={<GBIFTaxonomyReview />}
            />
            <Route path="/user-profile/:tab?" element={<UserProfile />} />
            <Route path="/download/:key" element={<DownloadKey />} />
            <Route path="/namesindex" element={<NameIndexSearch />} />
            <Route
              path="/namesindex/:key/:section?"
              element={<NameIndexKey />}
            />
            <Route path="/vocabulary" element={<VocabularyIndex />} />
            <Route path="/vocabulary/taxgroup" element={<TaxGroup />} />
            <Route
              path="/vocabulary/taxgrouptree"
              element={<TaxGroupTreeRedirect />}
            />
            <Route path="/vocabulary/gazetteer" element={<Gazetteer />} />
            <Route
              path="/vocabulary/gazetteer/:name"
              element={<GazetteerKey />}
            />
            <Route
              path="/vocabulary/area"
              element={<Navigate to="/vocabulary/gazetteer" replace />}
            />
            <Route path="/vocabulary/area/:id" element={<AreaKey />} />
            <Route path="/vocabulary/geotime" element={<GeoTime />} />
            <Route path="/vocabulary/:key" element={<VocabularyKey />} />
            <Route path="/tools/index" element={<ToolIndex />} />
            <Route
              path="/about"
              element={<Navigate to="/about/introduction" replace />}
            />
            <Route path="/about/identifiers" element={<AboutIdentifiers />} />
            {/* the DOI page was merged into the identifiers page */}
            <Route
              path="/about/DOI"
              element={
                <Navigate
                  to={{
                    pathname: "/about/identifiers",
                    hash: "#dataset-keys-and-dois",
                  }}
                  replace
                />
              }
            />
            <Route path="/about/:mdFile" element={<About />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route
              path="/jobqueue"
              element={<Navigate to="/jobs?tab=queue&mine=true" replace />}
            />
            <Route path="/catalogue/*" element={<CatalogueRedirect />} />
            <Route path="*" element={<Exception404 />} />
          </Routes>
          <ProviderRoutes />
          </DatasetKeyAliasGate>
          </RoutedErrorBoundary>
        </BrowserRouter>
      </ContextProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
