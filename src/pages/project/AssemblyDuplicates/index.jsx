import React from "react";
import Layout from "../../../components/LayoutNew";
import { Helmet } from "react-helmet-async";
import Duplicates from "../../Duplicates";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";

const AssemblyDuplicates = ({ location, projectKey, project }) => {
  return (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["assemblyDuplicates"]}
      title={project.title}
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>{project.title}</title>
      </Helmet>
      <PageContent>
        <Duplicates
          datasetKey={projectKey}
          projectKey={projectKey}
          location={location}
          assembly={true}
        />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ projectKey, project }) => ({
  projectKey,
  project,
});
export default withContext(mapContextToProps)(AssemblyDuplicates);
