import React from "react";
import withRouter from "../../../withRouter";
import Layout from "../../../components/LayoutNew";

import withContext from "../../../components/hoc/withContext";
import PageContent from "../../../components/PageContent";
import { Helmet } from "react-helmet-async";
import Options from "./Options";
import Publishers from "./Publishers";

const ProjectOptions = ({ project, location }) => {
  return (
    <Layout
      selectedKeys={["projectOptions"]}
      openKeys={["assembly"]}
      title={project ? project.title : ""}
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>Options</title>
      </Helmet>
      <PageContent>
        {/*         <OptionTabs />
         */}{" "}
        {location?.pathname.endsWith("options") && <Options />}
        {location?.pathname.endsWith("publishers") && <Publishers />}
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ project, datasetSettings, user }) => ({
  project,
  datasetSettings,
  user,
});
export default withContext(mapContextToProps)(withRouter(ProjectOptions));
