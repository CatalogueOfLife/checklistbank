import React, { useState, useEffect } from "react";

import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";


import Editors from "./Editors";


const ProjectEditors = ({
  projectKey,
  catalogue
}) => {

  return (
    <Layout
      selectedKeys={["projectEditors"]}
      openKeys={["assembly"]}
      title={catalogue ? catalogue.title : ""}
    >
      <Editors datasetKey={projectKey} />
    </Layout>
  );
};

const mapContextToProps = ({
  user,
  projectKey,
  catalogue,
  addError,
  countryAlpha2,
}) => ({
  user,
  projectKey,
  catalogue,
  addError,
  countryAlpha2,
});

export default withContext(mapContextToProps)(ProjectEditors);
