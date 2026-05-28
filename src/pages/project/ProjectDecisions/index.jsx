import React from "react";

import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withRouter from "../../../withRouter";

import Decisions from "./Decisions";

const ProjectDecisions = ({
  match: {
    params: { projectKey },
  },
}) => {
  return (
    <Layout
      selectedKeys={["projectDecisions"]}
      openKeys={["assembly"]}
      title="Decisions"
    >
      <PageContent>
        <Decisions datasetKey={projectKey} type="project" />
      </PageContent>
    </Layout>
  );
};

export default withRouter(ProjectDecisions);
