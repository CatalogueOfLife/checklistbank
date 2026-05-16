import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ConfigProvider } from "antd";
import PrivateRoute from "./components/Auth/PrivateRoute";
import AdminRoute from "./components/Auth/AdminRoute";
import { installNavigator } from "./history";
import "./App.css";
import DatasetList from "./pages/DatasetList";
import DatasetPage from "./pages/DatasetKey";
import DatasetCreate from "./pages/DatasetCreate";

import { ThemeProvider } from "react-jss";
import DatasetProvider from "./components/hoc/DatasetProvider";
import SyncProvider from "./components/hoc/SyncProvider";
import BackgroundProvider from "./components/hoc/BackgroundProvider";

import About from "./pages/About";
import Assembly from "./pages/catalogue/Assembly";
import AssemblyDuplicates from "./pages/catalogue/AssemblyDuplicates";
import AssemblyTasks from "./pages/catalogue/AssemblyTasks";

import SectorSync from "./pages/catalogue/SectorSync";
import SectorPriority from "./pages/catalogue/CatalogueSectors/Priority";
import SectorPublishers from "./pages/catalogue/SectorPublishers";
import CatalogueSectors from "./pages/catalogue/CatalogueSectors";
import CatalogueTaxon from "./pages/catalogue/CatalogueTaxon";
import CatalogueName from "./pages/catalogue/CatalogueName";
import CatalogueMeta from "./pages/catalogue/CatalogueMeta";
import CatalogueNameSearch from "./pages/catalogue/CatalogueNameSearch";
import CatalogueDecisions from "./pages/catalogue/CatalogueDecisions";
import CatalogueOptions from "./pages/catalogue/Options";
import CataloguePublishers from "./pages/catalogue/Options/Publishers";
import CataloguePublisherKey from "./pages/catalogue/CataloguePublisherKey";
import CatalogueSourceDataset from "./pages/catalogue/SourceDataset";
import CatalogueIssues from "./pages/catalogue/CatalogueIssues";
import CatalogueDownload from "./pages/catalogue/CatalogueDownload";

import ProjectEditors from "./pages/catalogue/Editors";

import Admin from "./pages/Admin";
import SystemHealth from "./pages/SystemHealth";
import DatasetAdmin from "./pages/Admin/DatasetAdmin";
import MatcherAdmin from "./pages/Admin/MatcherAdmin";
import UserAdmin from "./pages/Admin/Users";
import AdminJobs from "./pages/Admin/Jobs";
import SectorDiff from "./pages/catalogue/SectorDiff";
import Imports from "./pages/Imports";
import ContextProvider from "./components/hoc/ContextProvider";
import Exception404 from "./components/exception/404";
import ExceptionHandler from "./components/exception/ExceptionHandler";
import CatalogueReferences from "./pages/catalogue/CatalogueReferences";
import HomePage from "./pages/HomePage";
import CatalogueSources from "./pages/catalogue/CatalogueSources";
import CatalogueSourceMetrics from "./pages/catalogue/CatalogueSourceMetrics";
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

const theme = {
  colorPrimary: "deepskyblue",
};

// antd 5+ defaults to a different blue than v4. Pin colorPrimary so the
// jss-styled components (which use the same `theme` object) and antd
// components stay visually consistent.
const antdTheme = { token: { colorPrimary: theme.colorPrimary } };

// Wires `useNavigate` into the legacy `history.push()` shim once on mount.
const NavigatorInstaller = () => {
  const navigate = useNavigate();
  useEffect(() => {
    installNavigator(navigate);
  }, [navigate]);
  return null;
};

// Router 6 requires `<Route>` to live inside `<Routes>`. The Router-5 code
// rendered these provider routes as siblings of the main `<Switch>` so each
// matched independently; we give each its own `<Routes>` so the same
// "render whenever this prefix matches" semantics survive.
const ProviderRoutes = () => (
  <>
    <Routes>
      <Route path="/dataset/:key/*" element={<DatasetProvider />} />
    </Routes>
    <Routes>
      <Route
        path="/catalogue/:catalogueKey/dataset/:sourceKey/*"
        element={<DatasetProvider />}
      />
    </Routes>
    <Routes>
      <Route path="/catalogue/:catalogueKey/*" element={<DatasetProvider />} />
    </Routes>
    <Routes>
      <Route path="/catalogue/:catalogueKey/*" element={<SyncProvider />} />
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
      <ContextProvider>
        <Helmet>
          <meta charSet="utf-8" />
          <title>ChecklistBank (CLB)</title>
        </Helmet>
        <BrowserRouter>
          <NavigatorInstaller />
          <ThemeProvider theme={theme}>
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
              path="/admin/jobs"
              element={
                <AdminRoute roles={["admin"]}>
                  <AdminJobs />
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
              element={
                <AdminRoute roles={["editor", "admin"]}>
                  <MatcherAdmin />
                </AdminRoute>
              }
            />
            <Route path="/imports" element={<Imports />} />
            <Route
              path="/catalogue/:catalogueKey/references/:key?"
              element={
                <PrivateRoute>
                  <CatalogueReferences />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/sources/:issues?"
              element={
                <PrivateRoute>
                  <CatalogueSources />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/sourcemetrics"
              element={
                <PrivateRoute>
                  <CatalogueSourceMetrics />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/options"
              element={
                <PrivateRoute roles={["editor"]}>
                  <CatalogueOptions />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/publishers"
              element={
                <PrivateRoute roles={["editor"]}>
                  <CataloguePublishers />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/assembly"
              element={
                <PrivateRoute roles={["editor"]}>
                  <Assembly />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/download/:key?"
              element={
                <PrivateRoute>
                  <CatalogueDownload />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/duplicates"
              element={
                <PrivateRoute roles={["editor"]}>
                  <AssemblyDuplicates />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/tasks"
              element={
                <PrivateRoute roles={["editor"]}>
                  <AssemblyTasks />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/metadata"
              element={
                <PrivateRoute>
                  <CatalogueMeta />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/editors"
              element={
                <PrivateRoute>
                  <ProjectEditors />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/names"
              element={
                <PrivateRoute>
                  <CatalogueNameSearch />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/sector/priority"
              element={
                <PrivateRoute>
                  <SectorPriority />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/sector/sync"
              element={
                <PrivateRoute>
                  <SectorSync />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/sector/publishers"
              element={
                <PrivateRoute>
                  <SectorPublishers />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/sector"
              element={
                <PrivateRoute>
                  <CatalogueSectors />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/publisher/:key?"
              element={
                <PrivateRoute>
                  <CataloguePublisherKey />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/decision"
              element={
                <PrivateRoute>
                  <CatalogueDecisions />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/issues"
              element={
                <PrivateRoute>
                  <CatalogueIssues />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/sync/:sectorKey/diff"
              element={
                <PrivateRoute>
                  <SectorDiff />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/taxon/:taxonOrNameKey"
              element={
                <PrivateRoute>
                  <CatalogueTaxon />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/name/:taxonOrNameKey"
              element={
                <PrivateRoute>
                  <CatalogueName />
                </PrivateRoute>
              }
            />
            <Route
              path="/catalogue/:catalogueKey/dataset/:sourceKey/:section/:taxonOrNameKey?"
              element={
                <PrivateRoute>
                  <CatalogueSourceDataset />
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
            <Route path="/tools/diff-viewer" element={<DiffViewer />} />
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
            <Route path="/vocabulary/taxgrouptree" element={<TaxGroupTree />} />
            <Route path="/vocabulary/:key" element={<VocabularyKey />} />
            <Route path="/tools/index" element={<ToolIndex />} />
            <Route path="/about/:mdFile" element={<About />} />
            <Route path="/system-health" element={<SystemHealth />} />
            <Route path="*" element={<Exception404 />} />
          </Routes>
          </ThemeProvider>
          <ProviderRoutes />
        </BrowserRouter>
      </ContextProvider>
    </ConfigProvider>
  );
};

export default App;
