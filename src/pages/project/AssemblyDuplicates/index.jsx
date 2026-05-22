import React from "react";
import Layout from "../../../components/LayoutNew";
import { Helmet } from "react-helmet-async";
import Duplicates from "../../Duplicates";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";

const AssemblyDuplicates = ({ location, projectKey, catalogue }) => {
  return (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["assemblyDuplicates"]}
      title={catalogue.title}
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>{catalogue.title}</title>
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

const mapContextToProps = ({ projectKey, catalogue }) => ({
  projectKey,
  catalogue,
});
export default withContext(mapContextToProps)(AssemblyDuplicates);
