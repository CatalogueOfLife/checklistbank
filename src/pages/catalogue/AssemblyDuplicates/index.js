import React from "react";
import Layout from "../../../components/LayoutNew";
import Helmet from "react-helmet";
import Duplicates from "../../Duplicates";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";

const AssemblyDuplicates = ({ location, catalogueKey, catalogue }) => {
  return (
    <Layout
      openKeys={["assembly", "projectDetails"]}
      selectedKeys={["assemblyDuplicates"]}
      title={catalogue.title}
    >
      <Helmet>
        <meta charSet="utf-8" />
        <title>{catalogue.title}</title>
      </Helmet>
      <PageContent>
        <Duplicates
          datasetKey={catalogueKey}
          catalogueKey={catalogueKey}
          location={location}
          assembly={true}
        />
      </PageContent>
    </Layout>
  );
};

const mapContextToProps = ({ catalogueKey, catalogue }) => ({
  catalogueKey,
  catalogue,
});
export default withContext(mapContextToProps)(AssemblyDuplicates);
