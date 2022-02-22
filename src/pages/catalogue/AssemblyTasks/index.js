import React from "react";
import Layout from "../../../components/LayoutNew";
import Helmet from "react-helmet";
import Tasks from "../../../pages/DatasetKey/datasetPageTabs/DatasetTasks";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";

const AssemblyTasks = ({ location, catalogueKey, catalogue }) => {
  return (
    <Layout
      openKeys={["assembly", "projectDetails"]}
      selectedKeys={["assemblyTasks"]}
      title={catalogue.title}
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>{catalogue.title}</title>
        <link rel="canonical" href="https://www.checklistbank.org" />
      </Helmet>
      <PageContent>
        <Tasks datasetKey={catalogueKey} location={location} assembly={true} />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ catalogueKey, catalogue }) => ({
  catalogueKey,
  catalogue,
});
export default withContext(mapContextToProps)(AssemblyTasks);
