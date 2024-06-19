import React from "react";

import DatasetMeta from "./../../DatasetKey/datasetPageTabs/DatasetMeta";
import DatasetIssues from "../../DatasetKey/datasetPageTabs/DatasetIssues";
import Layout from "../../../components/LayoutNew";

import withContext from "../../../components/hoc/withContext";
import Exception404 from "../../../components/exception/404";

import _ from "lodash";
import DatasetImportMetrics from "../../DatasetImportMetrics";

const CatalogueReleaseMetrics = ({ catalogueKey, catalogue }) =>
  !catalogue ? (
    <Exception404 />
  ) : (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["catalogue_issues"]}
      title={catalogue ? catalogue.title : ""}
    >
      <DatasetImportMetrics />
    </Layout>
  );

const mapContextToProps = ({ catalogueKey, catalogue }) => ({
  catalogueKey,
  catalogue,
});
export default withContext(mapContextToProps)(CatalogueReleaseMetrics);
