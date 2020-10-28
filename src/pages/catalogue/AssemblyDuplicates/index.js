import React from "react";
import config from "../../../config";

import Layout from "../../../components/LayoutNew";

import _ from "lodash";
import Helmet from "react-helmet";
import Duplicates from "../../Duplicates";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";

const { MANAGEMENT_CLASSIFICATION } = config;

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
        <link rel="canonical" href="http://data.catalogueoflife.org" />
      </Helmet>
      <PageContent>
        <Duplicates
          datasetKey={catalogueKey}
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
