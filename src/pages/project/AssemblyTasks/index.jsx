import React from "react";
import Layout from "../../../components/LayoutNew";
import { Helmet } from "react-helmet-async";
import Tasks from "../../../pages/DatasetKey/datasetPageTabs/DatasetTasks";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";

const AssemblyTasks = ({ location, projectKey, project }) => {
  return (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["assemblyTasks"]}
      title={project.title}
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>{project.title}</title>
      </Helmet>
      <PageContent>
        <Tasks datasetKey={projectKey} location={location} assembly={true} />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ projectKey, project }) => ({
  projectKey,
  project,
});
export default withContext(mapContextToProps)(AssemblyTasks);
