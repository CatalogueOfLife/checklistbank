import React, { useState, useEffect } from "react";

import Layout from "../../../components/LayoutNew";
import PageContent from "../../../components/PageContent";
import withContext from "../../../components/hoc/withContext";


import Editors from "./Editors";


const ProjectEditors = ({
  catalogueKey,
  catalogue
}) => {

  return (
    <Layout
      selectedKeys={["projectEditors"]}
      openKeys={["assembly", "projectDetails"]}
      title={catalogue ? catalogue.title : ""}
    >
        <Editors datasetKey={catalogueKey} />
    </Layout>
  );
};

const mapContextToProps = ({
  user,
  catalogueKey,
  catalogue,
  addError,
  countryAlpha2,
}) => ({
  user,
  catalogueKey,
  catalogue,
  addError,
  countryAlpha2,
});

export default withContext(mapContextToProps)(ProjectEditors);
