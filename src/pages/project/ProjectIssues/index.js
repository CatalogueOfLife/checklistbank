import React from "react";

import DatasetMeta from "./../../DatasetKey/datasetPageTabs/DatasetMeta";
import DatasetIssues from "../../DatasetKey/datasetPageTabs/DatasetIssues";
import Layout from "../../../components/LayoutNew";

import withContext from "../../../components/hoc/withContext";
import Exception404 from "../../../components/exception/404";

import _ from "lodash";
import Helmet from "react-helmet";

const ProjectMeta = ({ projectKey, catalogue }) =>
  !catalogue ? (
    <Exception404 />
  ) : (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["catalogue_issues"]}
      title={catalogue ? catalogue.title : ""}
    >
      {_.get(catalogue, "title") && (
        <Helmet title={`${_.get(catalogue, "title")} in COL`} />
      )}

      <DatasetIssues datasetKey={projectKey} />
    </Layout>
  );

const mapContextToProps = ({ projectKey, catalogue }) => ({
  projectKey,
  catalogue,
});
export default withContext(mapContextToProps)(ProjectMeta);
