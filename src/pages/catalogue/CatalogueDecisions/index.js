import React from "react";

import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import { withRouter } from "react-router-dom";

import Decisions from "./Decisions";

const CatalogueDecisions = ({
  match: {
    params: { catalogueKey },
  },
}) => {
  return (
    <Layout
      selectedKeys={["catalogueDecisions"]}
      openKeys={["assembly"]}
      title="Decisions"
    >
      <PageContent>
        <Decisions datasetKey={catalogueKey} type="project" />
      </PageContent>
    </Layout>
  );
};

export default withRouter(CatalogueDecisions);
