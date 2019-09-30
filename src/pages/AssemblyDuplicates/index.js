import React from "react";
import config from "../../config";

import Layout from "../../components/LayoutNew";

import _ from "lodash";
import Helmet from "react-helmet";
import Duplicates from "../Duplicates";
import PageContent from "../../components/PageContent";

const { MANAGEMENT_CLASSIFICATION } = config;

const AssemblyDuplicates = ({location}) => {
  return (
    <Layout
      openKeys={["assembly"]}
      selectedKeys={["assemblyDuplicates"]}
      title={MANAGEMENT_CLASSIFICATION.title}
    >
    <Helmet>
          <meta charSet="utf-8" />
          <title>CoL+ Assembly</title>
          <link rel="canonical" href="http://www.col.plus" />
        </Helmet>
        <PageContent>
      <Duplicates datasetKey={MANAGEMENT_CLASSIFICATION.key} location={location} assembly={true} />
      </PageContent>
    </Layout>
  );
};

export default AssemblyDuplicates;
