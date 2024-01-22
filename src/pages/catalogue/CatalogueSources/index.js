import React from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Table, Alert, Row, Col, Tooltip } from "antd";
import config from "../../../config";
import Layout from "../../../components/LayoutNew";
import SourceTabs from "./SourceTabs";
import SourceMetrics from "../CatalogueSourceMetrics/SourceMetrics";
import SourceIssues from "./Issues";
import withContext from "../../../components/hoc/withContext";
import { withRouter } from "react-router-dom";

const _ = require("lodash");

const getIssuesAbbrev = (issue) =>
  issue.split(" ").map((s) => s.charAt(0).toUpperCase());

const CatalogueSources = ({
  match: {
    params: { issues },
  },
  catalogueKey,
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
            catalogueKey={catalogueKey}
            datasetKey={catalogueKey}
            basePath={`/catalogue/${catalogueKey}`}
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
  catalogueKey,
}) => ({
  user,
  issue,
  issueMap,
  catalogue,
  catalogueKey,
});

export default withContext(mapContextToProps)(withRouter(CatalogueSources));
