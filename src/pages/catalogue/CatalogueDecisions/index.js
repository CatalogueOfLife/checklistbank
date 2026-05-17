import React from "react";

import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withRouter from "../../../withRouter";

import Decisions from "./Decisions";

const CatalogueDecisions = ({
  match: {
    params: { projectKey },
  },
}) => {
  return (
    <Layout
      selectedKeys={["catalogueDecisions"]}
      openKeys={["assembly"]}
      title="Decisions"
    >
      <PageContent>
        <Decisions datasetKey={projectKey} type="project" />
      </PageContent>
    </Layout>
  );
};

export default withRouter(CatalogueDecisions);
