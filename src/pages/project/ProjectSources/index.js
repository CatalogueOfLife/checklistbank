import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Tooltip } from "antd";
import config from "../../../config";
import Layout from "../../../components/LayoutNew";
import SourceTabs from "./SourceTabs";
import SourceMetrics from "../ProjectSourceMetrics/SourceMetrics";
import SourceIssues from "./Issues";
import withContext from "../../../components/hoc/withContext";
import { withRouter } from "react-router-dom";

const _ = require("lodash");

const getIssuesAbbrev = (issue) =>
  issue.split(" ").map((s) => s.charAt(0).toUpperCase());

const ProjectSources = ({
  match: {
    params: { issues },
  },
  projectKey,
  catalogue,
}) => {
  return (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["catalogueSources"]}
      title={catalogue ? catalogue.title : ""}
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          minHeight: 280,
          margin: "16px 0",
        }}
      >
        <SourceTabs />
        {!issues && (
          <SourceMetrics
            isProject={true}
            projectKey={projectKey}
            datasetKey={projectKey}
            basePath={`/project/${projectKey}`}
          />
        )}
        {!!issues && <SourceIssues />}
      </div>
    </Layout>
  );
};

const mapContextToProps = ({
  user,
  issue,
  issueMap,
  catalogue,
  projectKey,
}) => ({
  user,
  issue,
  issueMap,
  catalogue,
  projectKey,
});

export default withContext(mapContextToProps)(withRouter(ProjectSources));
