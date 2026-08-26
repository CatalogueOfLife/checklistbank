import React from "react";

import Layout from "../../../components/LayoutNew";
import withContext from "../../../components/hoc/withContext";


import Editors from "./Editors";


const ProjectEditors = ({
  projectKey,
  project
}) => {

  return (
    <Layout
      selectedKeys={["projectEditors"]}
      openKeys={["assembly"]}
      title={project ? project.title : ""}
    >
      <Editors datasetKey={projectKey} />
    </Layout>
  );
};

const mapContextToProps = ({
  user,
  projectKey,
  project,
  addError,
  countryAlpha2,
}) => ({
  user,
  projectKey,
  project,
  addError,
  countryAlpha2,
});

export default withContext(mapContextToProps)(ProjectEditors);
